// server/src/controllers/orderController/orderEdit.js
const mongoose = require('mongoose');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Batch = require('../../models/Batch');
const { revertExpiredEdits, getReservedStockMap, voidOrderInvoice, httpError, EDIT_WINDOW_MS, buildActionLog } = require('./orderUtils');

exports.startEditOrder = async (req, res) => {
  try {
    await revertExpiredEdits();
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (order.editWindowExpiresAt && Date.now() > order.editWindowExpiresAt.getTime()) {
      return res.status(409).json({ message: 'Your 2-minute editing window has permanently expired.' });
    }

    if (order.editWindowExpiresAt && Date.now() < order.editWindowExpiresAt.getTime()) {
      order.status = 'Editing';
      await order.save();
      return res.json({
        success: true,
        data: { editWindowExpiresAt: order.editWindowExpiresAt, status: order.status },
      });
    }

    if (['Packed', 'Shipped', 'Delivered', 'Cancelled'].includes(order.status)) {
      return res.status(409).json({ message: `Orders that are ${order.status} cannot be edited.` });
    }

    order.previousStatus = order.status;
    order.status = 'Editing';
    order.editWindowExpiresAt = new Date(Date.now() + EDIT_WINDOW_MS);
    
    // ✨ NEW: Add the undeniable Audit Log
    order.actionLogs.push(buildActionLog(req, 'Editing Started', 'User opened the order for modifications.'));

    await order.save();

    res.json({
      success: true,
      data: { editWindowExpiresAt: order.editWindowExpiresAt, status: order.status },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelEditOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order && order.status === 'Editing') {
      order.status = order.previousStatus || 'Placed';
      
      // ✨ NEW: Add the undeniable Audit Log
      order.actionLogs.push(buildActionLog(req, 'Editing Cancelled', 'User closed the edit window without saving.'));
      
      await order.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let updatedOrder;

    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw httpError('Order not found.', 404);

      if (order.status !== 'Editing') {
        throw httpError('This order is not open for editing.', 409);
      }

      if (order.editWindowExpiresAt && Date.now() > order.editWindowExpiresAt.getTime()) {
        order.status = order.previousStatus || 'Placed';
        await order.save({ session });
        throw httpError('Editing window has expired. Changes discarded.', 409);
      }

      const { items, clientNote } = req.body;
      if (Array.isArray(items) && items.length > 0) {
        const productIds = items.map(i => i.productId);
        const reservedMap = await getReservedStockMap(productIds, order._id, session);

        const batches = await Batch.find({
          productId: { $in: productIds },
          totalStockQuantity: { $gt: 0 },
          isActive: true
        }).session(session).select('productId expiryDate mrp offer totalStockQuantity').lean();

        const products = await Product.find({ _id: { $in: productIds } }).session(session).select('name gstRate mrp totalStock').lean();
        
        const today = new Date();
        const gstMap = {};
        products.forEach(p => gstMap[p._id.toString()] = p.gstRate || 0);

        let orderTotal = 0;
        const newItems = [];
        
        for (const i of items) {
          const pidStr = String(i.productId);
          const product = products.find(p => String(p._id) === pidStr);
          const prodBatches = batches.filter(b => String(b.productId) === pidStr);
          const origItem = order.items.find(oi => oi.productId.toString() === pidStr);
          
          const qty = i.requestedQty || i.qty || 0;

          if (!product) throw httpError(`One of the selected products is no longer available.`, 409);

          if (i.batchId) {
            const specificBatch = prodBatches.find(b => String(b._id) === String(i.batchId));
            if (!specificBatch) {
                throw httpError(`The selected offer for ${product.name} is no longer available.`, 409);
            }
            const currentlyReserved = reservedMap.byBatch[String(i.batchId)] || 0;
            const trueAvailable = specificBatch.totalStockQuantity - currentlyReserved;

            if (qty > trueAvailable) {
                throw httpError(`Not enough stock for ${product.name}. You requested ${qty}, but only ${trueAvailable} are available.`, 409);
            }
          } else {
            const standardBatches = prodBatches.filter(b => 
              !(b.offer && b.offer.isActive) && new Date(b.expiryDate) > today    
            );
            const rawStandardStock = standardBatches.reduce((sum, b) => sum + (b.totalStockQuantity || 0), 0);
            
            const currentlyReserved = reservedMap.byProduct[pidStr] || 0;
            const trueAvailable = rawStandardStock - currentlyReserved;

            if (qty > trueAvailable) {
                throw httpError(`Not enough safe stock for ${product.name}. You requested ${qty}, but only ${trueAvailable} standard units are available.`, 409);
            }
          }

          const ptr = i.estimatedPrice || 0;
          const grossAmount = ptr * qty;

          const discType = i.discountType || 'percent';
          const discVal = i.discountValue || 0;
          const discountAmount = discType === 'percent' ? (grossAmount * discVal / 100) : discVal;

          const taxableValue = grossAmount - discountAmount;
          const gstRate = gstMap[pidStr] || 0;
          const gstAmount = (taxableValue * gstRate) / 100;
          const lineTotal = taxableValue + gstAmount;

          orderTotal += lineTotal;

          newItems.push({
            productId: i.productId,
            requestedQty: qty,
            finalQty: qty,
            chargeableQty: qty,
            freeQty: 0,
            finalPrice: ptr,
            grossAmount,
            discountType: discType,
            discountValue: discVal,
            discountAmount,
            taxableValue,
            gstRate,
            gstAmount,
            lineTotal,
            
            mrp: origItem ? origItem.mrp : (product.mrp || 0),
            expiryDate: origItem ? origItem.expiryDate : null,
            offerDescription: origItem ? origItem.offerDescription : '', 
            plannedBatches: i.batchId ? [{ batchId: i.batchId, chargeableQty: qty, freeQty: 0 }] : [],
          });
        }
        
        order.items = newItems;
        order.estimatedOrderTotal = orderTotal;
      }

      if (clientNote !== undefined) order.clientNote = clientNote;

      if (order.previousStatus === 'Invoiced' && order.invoiceDocumentId) {
        await voidOrderInvoice(order, 'Client edited the order quantities after invoicing.', session);
      }

      order.status = 'Placed';
      order.editWindowExpiresAt = new Date(Date.now() - 1000);

      // ✨ NEW: Add the undeniable Audit Log
      order.actionLogs.push(buildActionLog(req, 'Order Updated', 'Modified items or quantities successfully.'));

      await order.save({ session });
      updatedOrder = order;
    });

    res.json({ success: true, data: updatedOrder });
  } catch (err) {
    console.error('updateOrder error:', err);
    res.status(err.status || 500).json({ message: err.message });
  } finally {
    await session.endSession();
  }
};