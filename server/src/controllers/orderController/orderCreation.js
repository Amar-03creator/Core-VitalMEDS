// server/src/controllers/orderController/orderCreation.js
const Order = require('../../models/Order');
const Inquiry = require('../../models/Inquiry');
const Client = require('../../models/Client');
const Product = require('../../models/Product');
const Batch = require('../../models/Batch');
const Notification = require('../../models/Notification');
const Admin = require('../../models/Admin');
const { getNextOrderNumber } = require('../../helpers/SequenceHelper');
const { getReservedStockMap, buildActionLog } = require('./orderUtils');


exports.createOrder = async (req, res) => {
  try {
    const { clientId, items, billPreference, clientNote, discountType, discountValue, discountReason } = req.body;

    if (!clientId) return res.status(400).json({ message: 'clientId is required.' });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required.' });
    }

    const client = await Client.findById(clientId).select('clientId establishmentName');
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const orderId = await getNextOrderNumber(client.clientId);
    const productIds = items.map(i => i.productId);

    const reservedMap = await getReservedStockMap(productIds);

    const batches = await Batch.find({
      productId: { $in: productIds },
      totalStockQuantity: { $gt: 0 },
      isActive: true
    }).select('productId expiryDate mrp offer totalStockQuantity').lean();

    const products = await Product.find({ _id: { $in: productIds } }).select('name gstRate mrp totalStock').lean();

    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() + 3);

    const gstMap = {};
    products.forEach(p => gstMap[p._id.toString()] = p.gstRate || 0);

    let orderTotal = 0;
    const mappedItems = [];
    
    for (const i of items) {
      const pidStr = String(i.productId);
      const product = products.find(p => String(p._id) === pidStr);
      const prodBatches = batches.filter(b => String(b.productId) === pidStr);
      
      const reqQty = i.requestedQty || 0;

      if (!product) throw new Error(`One of the selected products is no longer in the database.`);

      if (i.batchId) {
        const specificBatch = prodBatches.find(b => String(b._id) === String(i.batchId));
        if (!specificBatch) {
            throw new Error(`The selected offer for ${product.name} is no longer available.`);
        }
        
        const currentlyReserved = reservedMap.byBatch[String(i.batchId)] || 0;
        const trueAvailable = specificBatch.totalStockQuantity - currentlyReserved;

        if (reqQty > trueAvailable) {
            throw new Error(`Not enough stock for ${product.name}. You requested ${reqQty}, but only ${trueAvailable} are available in this offer.`);
        }
      } else {
        const standardBatches = prodBatches.filter(b => 
          !(b.offer && b.offer.isActive) && 
          new Date(b.expiryDate) > today    
        );
        
        const rawStandardStock = standardBatches.reduce((sum, b) => sum + (b.totalStockQuantity || 0), 0);
        
        const currentlyReserved = reservedMap.byProduct[pidStr] || 0;
        const trueAvailable = rawStandardStock - currentlyReserved;

        if (reqQty > trueAvailable) {
            throw new Error(`Not enough safe stock for ${product.name}. You requested ${reqQty}, but only ${trueAvailable} standard units are available.`);
        }
      }

      let finalMrp = product.mrp || 0;
      let finalExpiry = null;
      let offerDesc = i.offerDescription || ''; 
      
      let discType = i.discountType || 'percent';
      let discVal = i.discountValue || 0;

      if (prodBatches.length > 0) {
        if (i.batchId) {
          const specificBatch = prodBatches.find(b => String(b._id) === String(i.batchId));
          if (specificBatch) {
            finalMrp = Number(specificBatch.mrp) || 0;
            finalExpiry = new Date(specificBatch.expiryDate);
            if (specificBatch.offer) {
              offerDesc = specificBatch.offer.description || '';
              const schemeDiscVal = specificBatch.offer.discountValue ?? specificBatch.offer.value ?? specificBatch.offer.discountPercent;
              if (schemeDiscVal !== undefined && schemeDiscVal !== null) {
                discVal = Number(schemeDiscVal);
                discType = specificBatch.offer.discountType || specificBatch.offer.type || 'percent';
              }
            }
          }
        } else {
          const normalBatches = prodBatches.filter(b => !(b.offer && b.offer.isActive));
          const validBatches = normalBatches.length > 0 ? normalBatches : prodBatches;
          
          const validDates = validBatches.filter(b => !isNaN(new Date(b.expiryDate)));
          const safeBatches = validDates.filter(b => new Date(b.expiryDate) >= thresholdDate);

          const mrpSourceBatches = safeBatches.length > 0 ? safeBatches : validDates;
          if (mrpSourceBatches.length > 0) {
            finalMrp = Math.max(...mrpSourceBatches.map(b => Number(b.mrp) || 0));
          }

          if (safeBatches.length > 0) {
            finalExpiry = new Date(Math.min(...safeBatches.map(b => new Date(b.expiryDate))));
          } else if (validDates.length > 0) {
            finalExpiry = new Date(Math.min(...validDates.map(b => new Date(b.expiryDate))));
          }
        }
      }

      const ptr = i.estimatedPrice || 0;
      const grossAmount = ptr * reqQty;
      const discountAmount = discType === 'percent' ? (grossAmount * discVal / 100) : discVal;
      const taxableValue = grossAmount - discountAmount;
      const gstRate = gstMap[pidStr] || 0;
      const gstAmount = (taxableValue * gstRate) / 100;
      const lineTotal = taxableValue + gstAmount;

      orderTotal += lineTotal;

      mappedItems.push({
        productId: i.productId,
        requestedQty: reqQty,
        finalQty: reqQty,
        chargeableQty: reqQty,
        freeQty: 0,
        mrp: finalMrp,
        expiryDate: finalExpiry,
        offerDescription: offerDesc, 
        finalPrice: ptr,
        grossAmount,
        discountType: discType,
        discountValue: discVal,
        discountAmount,
        taxableValue,
        gstRate,
        gstAmount,
        lineTotal,
        plannedBatches: i.batchId ? [{ batchId: i.batchId, chargeableQty: reqQty, freeQty: 0 }] : [],
      });
    }

    const order = new Order({
      orderId,
      clientId,
      inquiryId: null,
      status: 'Placed',
      billPreference,
      clientNote,
      items: mappedItems,
      estimatedOrderTotal: orderTotal,
      discountType: discountType || 'percent',
      discountValue: discountValue || 0,
      discountReason: discountReason || '',
      // ✨ NEW: The very first log!
      actionLogs: [buildActionLog(req, 'Order Placed', 'Order created directly from Cart')]
    });

    await order.save();

    const admin = await Admin.findOne();
    if (admin) {
      await Notification.create({
        recipientId: admin._id,
        recipientRole: 'admin',
        type: 'order',
        title: 'New Order Placed',
        message: `${client.establishmentName} placed a direct order for ₹${order.estimatedOrderTotal.toLocaleString('en-IN')}.`,
        link: `/admin-dashboard/orders?tab=orders&search=${order.orderId}`
      });
    }

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(409).json({ message: err.message }); 
  }
};

exports.convertInquiryToOrder = async (req, res) => {
  try {
    const { inquiryId, clientNote } = req.body;
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

    if (inquiry.status !== 'Quoted') {
      return res.status(409).json({ message: 'This inquiry has no active quote to accept.' });
    }

    const client = await Client.findById(inquiry.clientId).select('clientId');
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const orderId = await getNextOrderNumber(client.clientId);

    const productIds = inquiry.items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).select('gstRate');
    
    const batches = await Batch.find({ productId: { $in: productIds } }).select('productId offer').lean();

    const gstMap = {};
    products.forEach(p => gstMap[p._id.toString()] = p.gstRate || 0);

    const mappedItems = inquiry.items.map((i) => {
      const ptr = i.adminOfferedPTR || i.estimatedLineTotal || 0;
      const qty = i.chargeableQty || 0;
      const grossAmount = ptr * qty;

      const discType = i.discountType || 'percent';
      const discVal = i.discountValue || 0;
      const discountAmount = discType === 'percent' ? (grossAmount * discVal / 100) : discVal;

      const taxableValue = grossAmount - discountAmount;
      const gstRate = gstMap[i.productId.toString()] || 0;
      const gstAmount = (taxableValue * gstRate) / 100;
      const lineTotal = taxableValue + gstAmount;

      let offerDesc = i.offerDescription || '';
      if (i.offerBatchId && !offerDesc) {
         const specificBatch = batches.find(b => String(b._id) === String(i.offerBatchId));
         if (specificBatch && specificBatch.offer) offerDesc = specificBatch.offer.description || '';
      }

      return {
        productId: i.productId,
        requestedQty: i.requestedQty || i.chargeableQty,
        finalQty: (i.chargeableQty || 0) + (i.freeQty || 0),
        chargeableQty: i.chargeableQty,
        freeQty: i.freeQty || 0,

        mrp: i.mrp || i.fallbackMrp,
        expiryDate: i.expiryDate,
        offerDescription: offerDesc, 

        finalPrice: ptr,
        grossAmount,
        discountType: discType,
        discountValue: discVal,
        discountAmount,
        taxableValue,
        gstRate,
        gstAmount,
        lineTotal,
        plannedBatches: i.offerBatchId
          ? [{ batchId: i.offerBatchId, chargeableQty: i.chargeableQty, freeQty: i.freeQty || 0 }]
          : [],
      };
    });

    const order = new Order({
      orderId,
      clientId: inquiry.clientId,
      inquiryId: inquiry._id,
      status: 'Placed',
      billPreference: inquiry.billPreference,
      clientNote,
      items: mappedItems,
      estimatedOrderTotal: inquiry.discountedTotalPrice || inquiry.totalPrice,

      discountType: inquiry.discountType || 'percent',
      discountValue: inquiry.discountValue || 0,
      discountReason: inquiry.discountReason || '',
      // ✨ NEW: First log for inquiry conversion!
      actionLogs: [buildActionLog(req, 'Order Generated', `Converted from Quote ${inquiry.inquiryId}`)]
    });

    await order.save();

    inquiry.status = 'Accepted';
    if (clientNote) inquiry.clientNote = clientNote;
    inquiry.linkedOrder = order._id;
    await inquiry.save();

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error('convertInquiryToOrder error:', err);
    res.status(500).json({ message: err.message });
  }
};