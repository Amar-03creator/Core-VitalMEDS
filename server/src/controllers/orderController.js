// // server/src/controllers/orderController.js

// /* 
//  * ============================================================================
//  * 📦 STOCK ALLOCATION & RESERVATION LOGIC (CRITICAL B2B RULE)
//  * ============================================================================
//  * To prevent overselling and cancelled orders, stock MUST be deducted the 
//  * exact millisecond an order is placed (Status: "Placed" or "Pending").
//  * 
//  * 1. Specific Batch Allocation:
//  *    - If the order item payload contains a `batchId` (from an Offer), the 
//  *      system must deduct the qty directly from `Batch.totalStockQuantity` 
//  *      AND from the master `Product.totalStock`.
//  * 
//  * 2. FIFO Standard Allocation:
//  *    - If NO `batchId` is provided (Normal Catalog Item), the system must 
//  *      loop through valid batches ordered by closest expiry (FIFO) and 
//  *      deduct the qty from the batches cumulatively, then deduct from 
//  *      `Product.totalStock`.
//  * 
//  * 3. Restocking on Cancellation:
//  *    - If the admin cancels/rejects the order, or reduces the qty during 
//  *      invoicing, the unused quantity MUST be added back to the exact 
//  *      `Batch` and `Product` documents so it becomes available to other 
//  *      clients immediately.
//  * ============================================================================
//  */

// const mongoose = require('mongoose');
// const Order = require('../models/Order');
// const Inquiry = require('../models/Inquiry');
// const Client = require('../models/Client');
// const Product = require('../models/Product');
// const Batch = require('../models/Batch');
// const SalesInvoice = require('../models/SalesInvoice');
// const Notification = require('../models/Notification');
// const { getNextOrderNumber } = require('../helpers/SequenceHelper');
// const { restoreFromLots } = require('../helpers/inventoryFifo');
// const { generateInvoicePdfBuffer } = require('../helpers/invoicePdfGenerator');
// const Admin = mongoose.model('Admin');

// const EDIT_WINDOW_MS = 2 * 60 * 1000;

// // ── Helpers ──────────────────────────────────────────────

// const revertExpiredEdits = async () => {
//   try {
//     const expiredOrders = await Order.find({ status: 'Editing', editWindowExpiresAt: { $lt: new Date() } });
//     for (let o of expiredOrders) {
//       o.status = o.previousStatus || 'Placed';
//       await o.save();
//     }
//   } catch (err) {
//     console.error("Failed to revert expired edits", err);
//   }
// };

// const attachClosestExpiry = async (docs) => {
//   if (!docs || docs.length === 0) return docs;
//   const productIds = new Set();

//   docs.forEach(doc => {
//     if (!doc.items) return;
//     doc.items.forEach(item => {
//       if (item.productId && item.productId._id) productIds.add(item.productId._id.toString());
//       else if (item.productId) productIds.add(item.productId.toString());
//     });
//   });

//   if (productIds.size === 0) return docs;

//   const batches = await Batch.find({
//     productId: { $in: Array.from(productIds) },
//     totalStockQuantity: { $gt: 0 },
//     isActive: true
//   }).select('productId expiryDate').lean();

//   const expiryMap = {};
//   batches.forEach(b => {
//     const pid = b.productId.toString();
//     const bDate = new Date(b.expiryDate);
//     if (!expiryMap[pid] || bDate < expiryMap[pid]) {
//       expiryMap[pid] = bDate;
//     }
//   });

//   docs.forEach(doc => {
//     if (!doc.items) return;
//     doc.items.forEach(item => {
//       const pid = item.productId && item.productId._id ? item.productId._id.toString() : item.productId?.toString();
//       if (pid && expiryMap[pid] && !item.expiryDate) {
//         item.closestExpiry = expiryMap[pid];
//       }
//     });
//   });

//   return docs;
// };

// const notifyClient = async (clientId, payload) => {
//   try {
//     await Notification.create({ recipientId: clientId, recipientRole: 'client', ...payload });
//   } catch (err) {
//     console.error('notifyClient error:', err);
//   }
// };

// const httpError = (message, status) => Object.assign(new Error(message), { status });

// const ADMIN_ORDER_POPULATE = {
//   path: 'clientId',
//   select: 'establishmentName city deliveryRoute clientId gstin billingAddress drugLicense20B drugLicense21B totalOutstanding creditBalance outstandingDate',
// };

// const PRODUCT_POPULATE = {
//   path: 'items.productId',
//   select: 'name company companyId compositions packing photoUrl gstRate',
//   populate: { path: 'companyId', select: 'shortCode companyName' },
// };

// const voidOrderInvoice = async (order, reason, session) => {
//   if (!order.invoiceDocumentId) return;

//   const invoice = await SalesInvoice.findById(order.invoiceDocumentId).session(session);
//   if (!invoice || invoice.invoiceStatus === 'CANCELLED') return;

//   for (const item of invoice.items) {
//     const qty = item.billedQty ?? (item.chargeableQty + (item.freeQty || 0));
//     if (item.lotConsumption?.length) {
//       await restoreFromLots(item.batchId, qty, item.lotConsumption, session);
//     }
//     await Product.findByIdAndUpdate(item.productId, { $inc: { totalStock: qty } }, { session });
//   }

//   const client = await Client.findById(invoice.clientObjectId).session(session);
//   if (client) {
//     client.totalOutstanding = (client.totalOutstanding || 0) - invoice.dueAmount;
//     client.creditBalance = (client.creditBalance || 0) + (invoice.creditApplied || 0);
//     await client.save({ session });
//   }

//   invoice.invoiceStatus = 'CANCELLED';
//   invoice.cancellationReason = reason || '';
//   invoice.cancelledAt = new Date();
//   await invoice.save({ session });

//   order.invoiceDocumentId = null;
//   order.invoiceNumber = undefined;
//   order.finalInvoiceAmount = undefined;
// };

// // ── Controllers ──────────────────────────────────────────

// exports.createOrder = async (req, res) => {
//   try {
//     const { clientId, items, billPreference, clientNote, discountType, discountValue, discountReason } = req.body;

//     if (!clientId) return res.status(400).json({ message: 'clientId is required.' });
//     if (!Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ message: 'At least one item is required.' });
//     }

//     const client = await Client.findById(clientId).select('clientId establishmentName');
//     if (!client) return res.status(404).json({ message: 'Client not found.' });

//     const orderId = await getNextOrderNumber(client.clientId);
//     const productIds = items.map(i => i.productId);

//     // ── Fetch Snapshot & Stock Data ──────────────
//     const batches = await Batch.find({
//       productId: { $in: productIds },
//       totalStockQuantity: { $gt: 0 },
//       isActive: true
//     }).select('productId expiryDate mrp offer totalStockQuantity').lean();

//     const products = await Product.find({ _id: { $in: productIds } }).select('name gstRate mrp totalStock').lean();

//     const today = new Date();
//     const thresholdDate = new Date();
//     thresholdDate.setMonth(thresholdDate.getMonth() + 3);

//     const gstMap = {};
//     products.forEach(p => gstMap[p._id.toString()] = p.gstRate || 0);

//     let orderTotal = 0;
//     const mappedItems = [];
    
//     for (const i of items) {
//       const pidStr = String(i.productId);
//       const product = products.find(p => String(p._id) === pidStr);
//       const prodBatches = batches.filter(b => String(b.productId) === pidStr);
      
//       const reqQty = i.requestedQty || 0;

//       if (!product) throw new Error(`One of the selected products is no longer in the database.`);

//       // ✨ TRUE STOCK VALIDATION ENGINE ✨
//       if (i.batchId) {
//         // 1. OFFER BATCH VALIDATION: Strictly check against the specific offer batch
//         const specificBatch = prodBatches.find(b => String(b._id) === String(i.batchId));
//         if (!specificBatch) {
//             throw new Error(`The selected offer for ${product.name} is no longer available.`);
//         }
//         if (reqQty > specificBatch.totalStockQuantity) {
//             throw new Error(`Not enough stock for ${product.name}. You requested ${reqQty}, but only ${specificBatch.totalStockQuantity} are available in this offer.`);
//         }
//       } else {
//         // 2. STANDARD ITEM VALIDATION: Sum only safe, non-offer, non-expired batches!
//         const standardBatches = prodBatches.filter(b => 
//           !(b.offer && b.offer.isActive) && // Must NOT be an active offer
//           new Date(b.expiryDate) > today    // Must NOT be expired
//         );
        
//         const availableStandardStock = standardBatches.reduce((sum, b) => sum + (b.totalStockQuantity || 0), 0);

//         if (reqQty > availableStandardStock) {
//             throw new Error(`Not enough safe stock for ${product.name}. You requested ${reqQty}, but only ${availableStandardStock} standard units are available.`);
//         }
//       }

//       // ── Determine MRP & Expiry based on Safe Logic ──
//       let finalMrp = product.mrp || 0;
//       let finalExpiry = null;
//       let offerDesc = i.offerDescription || ''; 
      
//       let discType = i.discountType || 'percent';
//       let discVal = i.discountValue || 0;

//       if (prodBatches.length > 0) {
//         if (i.batchId) {
//           const specificBatch = prodBatches.find(b => String(b._id) === String(i.batchId));
//           if (specificBatch) {
//             finalMrp = Number(specificBatch.mrp) || 0;
//             finalExpiry = new Date(specificBatch.expiryDate);
//             if (specificBatch.offer) {
//               offerDesc = specificBatch.offer.description || '';
//               const schemeDiscVal = specificBatch.offer.discountValue ?? specificBatch.offer.value ?? specificBatch.offer.discountPercent;
//               if (schemeDiscVal !== undefined && schemeDiscVal !== null) {
//                 discVal = Number(schemeDiscVal);
//                 discType = specificBatch.offer.discountType || specificBatch.offer.type || 'percent';
//               }
//             }
//           }
//         } else {
//           const normalBatches = prodBatches.filter(b => !(b.offer && b.offer.isActive));
//           const validBatches = normalBatches.length > 0 ? normalBatches : prodBatches;
          
//           const validDates = validBatches.filter(b => !isNaN(new Date(b.expiryDate)));
//           const safeBatches = validDates.filter(b => new Date(b.expiryDate) >= thresholdDate);

//           const mrpSourceBatches = safeBatches.length > 0 ? safeBatches : validDates;
//           if (mrpSourceBatches.length > 0) {
//             finalMrp = Math.max(...mrpSourceBatches.map(b => Number(b.mrp) || 0));
//           }

//           if (safeBatches.length > 0) {
//             finalExpiry = new Date(Math.min(...safeBatches.map(b => new Date(b.expiryDate))));
//           } else if (validDates.length > 0) {
//             finalExpiry = new Date(Math.min(...validDates.map(b => new Date(b.expiryDate))));
//           }
//         }
//       }

//       const ptr = i.estimatedPrice || 0;
//       const grossAmount = ptr * reqQty;
//       const discountAmount = discType === 'percent' ? (grossAmount * discVal / 100) : discVal;
//       const taxableValue = grossAmount - discountAmount;
//       const gstRate = gstMap[pidStr] || 0;
//       const gstAmount = (taxableValue * gstRate) / 100;
//       const lineTotal = taxableValue + gstAmount;

//       orderTotal += lineTotal;

//       mappedItems.push({
//         productId: i.productId,
//         requestedQty: reqQty,
//         finalQty: reqQty,
//         chargeableQty: reqQty,
//         freeQty: 0,
//         mrp: finalMrp,
//         expiryDate: finalExpiry,
//         offerDescription: offerDesc, 
//         finalPrice: ptr,
//         grossAmount,
//         discountType: discType,
//         discountValue: discVal,
//         discountAmount,
//         taxableValue,
//         gstRate,
//         gstAmount,
//         lineTotal,
//         plannedBatches: i.batchId ? [{ batchId: i.batchId, chargeableQty: reqQty, freeQty: 0 }] : [],
//       });
//     }

//     const order = new Order({
//       orderId,
//       clientId,
//       inquiryId: null,
//       status: 'Placed',
//       billPreference,
//       clientNote,
//       items: mappedItems,
//       estimatedOrderTotal: orderTotal,
//       discountType: discountType || 'percent',
//       discountValue: discountValue || 0,
//       discountReason: discountReason || '',
//     });

//     await order.save();

//     const admin = await Admin.findOne();
//     if (admin) {
//       await Notification.create({
//         recipientId: admin._id,
//         recipientRole: 'admin',
//         type: 'order',
//         title: 'New Order Placed',
//         message: `${client.establishmentName} placed a direct order for ₹${order.estimatedOrderTotal.toLocaleString('en-IN')}.`,
//         link: `/admin-dashboard/orders?tab=orders&search=${order.orderId}`
//       });
//     }

//     res.status(201).json({ success: true, data: order });
//   } catch (err) {
//     console.error('createOrder error:', err);
//     res.status(409).json({ message: err.message }); 
//   }
// };

// exports.convertInquiryToOrder = async (req, res) => {
//   try {
//     const { inquiryId, clientNote } = req.body;
//     const inquiry = await Inquiry.findById(inquiryId);
//     if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

//     if (inquiry.status !== 'Quoted') {
//       return res.status(409).json({ message: 'This inquiry has no active quote to accept.' });
//     }

//     const client = await Client.findById(inquiry.clientId).select('clientId');
//     if (!client) return res.status(404).json({ message: 'Client not found.' });

//     const orderId = await getNextOrderNumber(client.clientId);

//     const productIds = inquiry.items.map(i => i.productId);
//     const products = await Product.find({ _id: { $in: productIds } }).select('gstRate');
    
//     const batches = await Batch.find({ productId: { $in: productIds } }).select('productId offer').lean();

//     const gstMap = {};
//     products.forEach(p => gstMap[p._id.toString()] = p.gstRate || 0);

//     const mappedItems = inquiry.items.map((i) => {
//       const ptr = i.adminOfferedPTR || i.estimatedLineTotal || 0;
//       const qty = i.chargeableQty || 0;
//       const grossAmount = ptr * qty;

//       const discType = i.discountType || 'percent';
//       const discVal = i.discountValue || 0;
//       const discountAmount = discType === 'percent' ? (grossAmount * discVal / 100) : discVal;

//       const taxableValue = grossAmount - discountAmount;
//       const gstRate = gstMap[i.productId.toString()] || 0;
//       const gstAmount = (taxableValue * gstRate) / 100;
//       const lineTotal = taxableValue + gstAmount;

//       let offerDesc = i.offerDescription || '';
//       if (i.offerBatchId && !offerDesc) {
//          const specificBatch = batches.find(b => String(b._id) === String(i.offerBatchId));
//          if (specificBatch && specificBatch.offer) offerDesc = specificBatch.offer.description || '';
//       }

//       return {
//         productId: i.productId,
//         requestedQty: i.requestedQty || i.chargeableQty,
//         finalQty: (i.chargeableQty || 0) + (i.freeQty || 0),
//         chargeableQty: i.chargeableQty,
//         freeQty: i.freeQty || 0,

//         // ── Carry over inquiry snapshots ──────
//         mrp: i.mrp || i.fallbackMrp,
//         expiryDate: i.expiryDate,
//         offerDescription: offerDesc, 

//         finalPrice: ptr,
//         grossAmount,
//         discountType: discType,
//         discountValue: discVal,
//         discountAmount,
//         taxableValue,
//         gstRate,
//         gstAmount,
//         lineTotal,
//         plannedBatches: i.offerBatchId
//           ? [{ batchId: i.offerBatchId, chargeableQty: i.chargeableQty, freeQty: i.freeQty || 0 }]
//           : [],
//       };
//     });

//     const order = new Order({
//       orderId,
//       clientId: inquiry.clientId,
//       inquiryId: inquiry._id,
//       status: 'Placed',
//       billPreference: inquiry.billPreference,
//       clientNote,
//       items: mappedItems,
//       estimatedOrderTotal: inquiry.discountedTotalPrice || inquiry.totalPrice,

//       discountType: inquiry.discountType || 'percent',
//       discountValue: inquiry.discountValue || 0,
//       discountReason: inquiry.discountReason || '',
//     });

//     await order.save();

//     inquiry.status = 'Accepted';
//     if (clientNote) inquiry.clientNote = clientNote;
//     inquiry.linkedOrder = order._id;
//     await inquiry.save();

//     res.status(201).json({ success: true, data: order });
//   } catch (err) {
//     console.error('convertInquiryToOrder error:', err);
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.updateOrder = async (req, res) => {
//   const session = await mongoose.startSession();
//   try {
//     let updatedOrder;

//     await session.withTransaction(async () => {
//       const order = await Order.findById(req.params.id).session(session);
//       if (!order) throw httpError('Order not found.', 404);

//       if (order.status !== 'Editing') {
//         throw httpError('This order is not open for editing.', 409);
//       }

//       if (order.editWindowExpiresAt && Date.now() > order.editWindowExpiresAt.getTime()) {
//         order.status = order.previousStatus || 'Placed';
//         await order.save({ session });
//         throw httpError('Editing window has expired. Changes discarded.', 409);
//       }

//       const { items, clientNote } = req.body;
//       if (Array.isArray(items) && items.length > 0) {

//         const productIds = items.map(i => i.productId);
//         const products = await Product.find({ _id: { $in: productIds } }).session(session).select('gstRate mrp');
//         const gstMap = {};
//         products.forEach(p => gstMap[p._id.toString()] = p.gstRate || 0);

//         let orderTotal = 0;
//         order.items = items.map((i) => {
//           const origItem = order.items.find(oi => oi.productId.toString() === i.productId.toString());

//           const ptr = i.estimatedPrice || 0;
//           const qty = i.requestedQty || i.qty || 0;
//           const grossAmount = ptr * qty;

//           const discType = i.discountType || 'percent';
//           const discVal = i.discountValue || 0;
//           const discountAmount = discType === 'percent' ? (grossAmount * discVal / 100) : discVal;

//           const taxableValue = grossAmount - discountAmount;
//           const gstRate = gstMap[i.productId.toString()] || 0;
//           const gstAmount = (taxableValue * gstRate) / 100;
//           const lineTotal = taxableValue + gstAmount;

//           orderTotal += lineTotal;

//           return {
//             productId: i.productId,
//             requestedQty: qty,
//             finalQty: qty,
//             chargeableQty: qty,
//             freeQty: 0,
//             finalPrice: ptr,
//             grossAmount,
//             discountType: discType,
//             discountValue: discVal,
//             discountAmount,
//             taxableValue,
//             gstRate,
//             gstAmount,
//             lineTotal,
            
//             // ── Preserve original snapshots ──────
//             mrp: origItem ? origItem.mrp : (products.find(p => p._id.toString() === i.productId.toString())?.mrp || 0),
//             expiryDate: origItem ? origItem.expiryDate : null,
//             offerDescription: origItem ? origItem.offerDescription : '', 
//             plannedBatches: i.batchId ? [{ batchId: i.batchId, chargeableQty: qty, freeQty: 0 }] : [],
//           };
//         });

//         order.estimatedOrderTotal = orderTotal;
//       }

//       if (clientNote !== undefined) order.clientNote = clientNote;

//       if (order.previousStatus === 'Invoiced' && order.invoiceDocumentId) {
//         await voidOrderInvoice(order, 'Client edited the order quantities after invoicing.', session);
//       }

//       order.status = 'Placed';
//       order.editWindowExpiresAt = new Date(Date.now() - 1000);

//       await order.save({ session });
//       updatedOrder = order;
//     });

//     res.json({ success: true, data: updatedOrder });
//   } catch (err) {
//     console.error('updateOrder error:', err);
//     res.status(err.status || 500).json({ message: err.message });
//   } finally {
//     await session.endSession();
//   }
// };

// // ── RESTORED MISSING FUNCTIONS ──────────────────────────────────────

// exports.confirmOrder = async (req, res) => {
//   try {
//     await revertExpiredEdits();
//     const order = await Order.findById(req.params.id);
//     if (!order) return res.status(404).json({ message: 'Order not found.' });

//     if (order.status === 'Editing') {
//       return res.status(409).json({ message: 'Client is currently editing this order. Please wait for their 2-minute window to close.' });
//     }

//     if (order.status !== 'Placed') {
//       return res.status(409).json({ message: 'Only a Placed order can be confirmed.' });
//     }

//     order.status = 'Confirmed';
//     order.updatedBy = req.admin?._id;
//     await order.save();
//     res.json({ success: true, data: order });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.getOrders = async (req, res) => {
//   try {
//     await revertExpiredEdits();

//     const { clientId, status, dateFrom, dateTo, billType, minAmount, maxAmount, search, sortBy } = req.query;
//     const match = {};
//     if (clientId) match.clientId = clientId;
//     if (status) match.status = status;
//     if (billType) match.billPreference = billType;

//     if (dateFrom || dateTo) {
//       match.createdAt = {};
//       if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
//       if (dateTo) {
//         const end = new Date(dateTo);
//         end.setHours(23, 59, 59, 999);
//         match.createdAt.$lte = end;
//       }
//     }

//     if (search) {
//       const re = new RegExp(search.trim(), 'i');
//       match.$or = [{ orderId: re }, { invoiceNumber: re }];
//     }

//     let orders = await Order.find(match)
//       .populate(PRODUCT_POPULATE)
//       .populate('items.plannedBatches.batchId', 'batchNumber expiryDate mrp nearExpiry')
//       .populate(ADMIN_ORDER_POPULATE)
//       .sort({ createdAt: -1 })
//       .lean();

//     const min = minAmount !== undefined ? Number(minAmount) : null;
//     const max = maxAmount !== undefined ? Number(maxAmount) : null;
//     if (min !== null || max !== null) {
//       orders = orders.filter((o) => {
//         const amount = o.finalInvoiceAmount ?? o.estimatedOrderTotal ?? 0;
//         if (min !== null && amount < min) return false;
//         if (max !== null && amount > max) return false;
//         return true;
//       });
//     }

//     const amountOf = (o) => o.finalInvoiceAmount ?? o.estimatedOrderTotal ?? 0;
//     if (sortBy === 'oldest') orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
//     else if (sortBy === 'highest') orders.sort((a, b) => amountOf(b) - amountOf(a));
//     else if (sortBy === 'lowest') orders.sort((a, b) => amountOf(a) - amountOf(b));
//     else if (sortBy === 'status') orders.sort((a, b) => a.status.localeCompare(b.status));

//     orders = await attachClosestExpiry(orders);
//     res.json({ success: true, count: orders.length, data: orders });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.getOrderById = async (req, res) => {
//   try {
//     await revertExpiredEdits();
//     const order = await Order.findById(req.params.id)
//       .populate(PRODUCT_POPULATE)
//       .populate('items.plannedBatches.batchId', 'batchNumber expiryDate mrp nearExpiry')
//       .populate(ADMIN_ORDER_POPULATE)
//       .lean();

//     if (!order) return res.status(404).json({ message: 'Order not found.' });

//     const [enrichedOrder] = await attachClosestExpiry([order]);
//     res.json({ success: true, data: enrichedOrder });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.startEditOrder = async (req, res) => {
//   try {
//     await revertExpiredEdits();
//     const order = await Order.findById(req.params.id);
//     if (!order) return res.status(404).json({ message: 'Order not found.' });

//     if (order.editWindowExpiresAt && Date.now() > order.editWindowExpiresAt.getTime()) {
//       return res.status(409).json({ message: 'Your 2-minute editing window has permanently expired.' });
//     }

//     if (order.editWindowExpiresAt && Date.now() < order.editWindowExpiresAt.getTime()) {
//       order.status = 'Editing';
//       await order.save();
//       return res.json({
//         success: true,
//         data: { editWindowExpiresAt: order.editWindowExpiresAt, status: order.status },
//       });
//     }

//     if (['Packed', 'Shipped', 'Delivered', 'Cancelled'].includes(order.status)) {
//       return res.status(409).json({ message: `Orders that are ${order.status} cannot be edited.` });
//     }

//     order.previousStatus = order.status;
//     order.status = 'Editing';
//     order.editWindowExpiresAt = new Date(Date.now() + EDIT_WINDOW_MS);
//     await order.save();

//     res.json({
//       success: true,
//       data: { editWindowExpiresAt: order.editWindowExpiresAt, status: order.status },
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ──────────────────────────────────────────────────────────────────

// exports.cancelEditOrder = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (order && order.status === 'Editing') {
//       order.status = order.previousStatus || 'Placed';
//       await order.save();
//     }
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.cancelOrder = async (req, res) => {
//   const session = await mongoose.startSession();
//   try {
//     let result;
//     await session.withTransaction(async () => {
//       const order = await Order.findById(req.params.id).session(session);
//       if (!order) throw httpError('Order not found.', 404);

//       const blocked = !order.isCancellable || ['Shipped', 'Delivered'].includes(order.status);
//       if (blocked) throw httpError('This order can no longer be cancelled.', 409);

//       const { reason, cancelledBy } = req.body;

//       if (['Invoiced', 'Packed'].includes(order.status)) {
//         await voidOrderInvoice(order, reason, session);
//       }

//       order.status = 'Cancelled';
//       if (cancelledBy === 'client') order.clientCancelReason = reason;
//       else order.adminCancelReason = reason;

//       await order.save({ session });
//       result = order;
//     });
//     res.json({ success: true, data: result });
//   } catch (err) {
//     res.status(err.status || 500).json({ message: err.message });
//   } finally {
//     await session.endSession();
//   }
// };

// exports.cancelInvoice = async (req, res) => {
//   const session = await mongoose.startSession();
//   try {
//     let result;
//     await session.withTransaction(async () => {
//       const order = await Order.findById(req.params.id).session(session);
//       if (!order) throw httpError('Order not found.', 404);

//       if (!['Invoiced', 'Packed'].includes(order.status)) {
//         throw httpError('Only an Invoiced or Packed order has an invoice to cancel.', 409);
//       }

//       await voidOrderInvoice(order, req.body?.reason, session);
//       order.status = 'Confirmed';
//       await order.save({ session });
//       result = order;
//     });

//     await notifyClient(result.clientId, {
//       type: 'order',
//       title: 'Invoice cancelled',
//       message: `The invoice for order ${result.orderId} was voided and the order reverted to Confirmed.`,
//       link: `/client-dashboard/orders?tab=orders&id=${result._id}`,
//     });

//     res.json({ success: true, data: result });
//   } catch (err) {
//     res.status(err.status || 500).json({ message: err.message });
//   } finally {
//     await session.endSession();
//   }
// };

// exports.packOrder = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (!order) return res.status(404).json({ message: 'Order not found.' });

//     if (order.status !== 'Invoiced') {
//       return res.status(409).json({ message: 'Only an Invoiced order can be marked Packed.' });
//     }

//     order.status = 'Packed';
//     order.updatedBy = req.admin?._id;
//     await order.save();

//     res.json({ success: true, data: order });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.shipOrder = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (!order) return res.status(404).json({ message: 'Order not found.' });

//     if (order.status !== 'Packed') {
//       return res.status(409).json({ message: 'Only a Packed order can be marked Shipped.' });
//     }

//     order.status = 'Shipped';
//     order.shippedAt = new Date();
//     if (req.body?.dispatchDetails) {
//       order.dispatchDetails = { ...order.dispatchDetails, ...req.body.dispatchDetails };
//     }
//     order.updatedBy = req.admin?._id;
//     await order.save();

//     await notifyClient(order.clientId, {
//       type: 'order',
//       title: 'Order shipped',
//       message: `Your order ${order.orderId} has been shipped.`,
//       link: `/client-dashboard/orders?tab=orders&id=${order._id}`,
//     });

//     res.json({ success: true, data: order });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.confirmDelivery = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (!order) return res.status(404).json({ message: 'Order not found.' });
//     if (order.status !== 'Shipped') {
//       return res.status(409).json({ message: 'Only a Shipped order can be marked Delivered.' });
//     }

//     order.status = 'Delivered';
//     order.deliveredAt = new Date();
//     await order.save();
//     res.json({ success: true, data: order });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.sharePricing = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (!order) return res.status(404).json({ message: 'Order not found.' });

//     order.pricingSharedAt = new Date();
//     await order.save();

//     await notifyClient(order.clientId, {
//       type: 'order',
//       title: 'Pricing available',
//       message: `Pricing details for order ${order.orderId} are now available to view.`,
//       link: `/client-dashboard/orders?tab=orders&id=${order._id}`,
//     });

//     res.json({ success: true, data: order });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.downloadInvoicePdf = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (!order) return res.status(404).json({ message: 'Order not found.' });

//     if (!order.invoiceDocumentId) {
//       return res.status(404).json({ message: 'This order does not have an invoice generated yet.' });
//     }

//     const invoice = await SalesInvoice.findById(order.invoiceDocumentId)
//       .populate('clientObjectId', 'city district');
//     if (!invoice) {
//       return res.status(409).json({ message: "This order's linked invoice could not be found." });
//     }

//     const pdfBuffer = await generateInvoicePdfBuffer(invoice);
//     const filename = `${invoice.invoiceNumber || order.orderId}.pdf`;

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//     res.setHeader('Content-Length', pdfBuffer.length);
//     res.send(pdfBuffer);
//   } catch (err) {
//     console.error('downloadInvoicePdf error:', err);
//     res.status(500).json({ message: err.message || 'Failed to generate invoice PDF.' });
//   }
// };




// server/src/controllers/orderController.js

/* 
 * ============================================================================
 * 📦 VIRTUAL STOCK & RESERVATION LOGIC (AVAILABLE-TO-PROMISE B2B MODEL)
 * ============================================================================
 * ⚠️ CRITICAL RULE: We DO NOT deduct physical stock from the DB when an 
 * order is placed. Physical deduction ONLY happens during Final Invoicing.
 * 
 * To prevent overselling, we use a "Virtual Stock" (Available to Promise) engine:
 * 
 * 1. Reserved Stock (The Buffer):
 *    - We dynamically calculate the sum of all quantities currently sitting in 
 *      active, un-invoiced orders (Status: 'Placed', 'Pending', 'Editing', 'Confirmed').
 *    - Reserved stock is strictly grouped by Product (for standard items) and 
 *      by Batch (for specific Offer schemes).
 * 
 * 2. True Available Stock Math:
 *    - TRUE AVAILABLE = (Raw DB Physical Stock) - (Currently Reserved Stock)
 * 
 * 3. Segregation of Standard vs. Offer Items:
 *    - OFFER ITEMS (has batchId): Checked strictly against that specific Batch's 
 *      True Available stock.
 *    - STANDARD ITEMS (no batchId): Checked against the combined True Available 
 *      stock of all SAFE batches (non-expired, non-offer batches).
 * 
 * 4. Natural Restocking (Cancellations):
 *    - If an order is Cancelled, its status changes and it drops out of the 
 *      active reservation pool. The True Available stock instantly rises back up 
 *      without requiring manual additions to the Product/Batch DB collections.
 * 
 * 5. Controller Enforcement:
 *    - `createOrder` & `updateOrder`: HARD BLOCK. Throws a 409 Conflict if 
 *      requestedQty > True Available. (Note: `updateOrder` safely excludes the 
 *      current order's own quantities from the reserved math).
 *    - `convertInquiryToOrder`: SOFT BYPASS. Allows conversion to proceed so 
 *      the frontend can render accurate out-of-stock toast warnings during review.
 * ============================================================================
 */

const mongoose = require('mongoose');
const Order = require('../models/Order');
const Inquiry = require('../models/Inquiry');
const Client = require('../models/Client');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const SalesInvoice = require('../models/SalesInvoice');
const Notification = require('../models/Notification');
const { getNextOrderNumber } = require('../helpers/SequenceHelper');
const { restoreFromLots } = require('../helpers/inventoryFifo');
const { generateInvoicePdfBuffer } = require('../helpers/invoicePdfGenerator');
const Admin = mongoose.model('Admin');

const EDIT_WINDOW_MS = 2 * 60 * 1000;

// ── Helpers ──────────────────────────────────────────────

// ✨ TRUE VIRTUAL STOCK ENGINE: Calculates all currently reserved but un-invoiced stock
const getReservedStockMap = async (productIds, excludeOrderId = null, session = null) => {
  const match = {
    status: { $in: ['Placed', 'Pending', 'Editing', 'Confirmed'] },
    'items.productId': { $in: productIds }
  };
  if (excludeOrderId) match._id = { $ne: excludeOrderId };

  const query = Order.find(match).select('items').lean();
  if (session) query.session(session);
  const activeOrders = await query;

  const reserved = { byProduct: {}, byBatch: {} };
  productIds.forEach(pid => reserved.byProduct[pid.toString()] = 0);

  activeOrders.forEach(order => {
    order.items.forEach(item => {
      if (!item.productId) return;
      const pid = item.productId.toString();
      if (reserved.byProduct[pid] === undefined) return;

      if (item.plannedBatches && item.plannedBatches.length > 0) {
        item.plannedBatches.forEach(pb => {
          if (!pb.batchId) return;
          const bid = pb.batchId.toString();
          const bQty = (pb.chargeableQty || 0) + (pb.freeQty || 0);
          reserved.byBatch[bid] = (reserved.byBatch[bid] || 0) + bQty;
        });
      } else {
        const qty = (item.chargeableQty || 0) + (item.freeQty || 0);
        reserved.byProduct[pid] += qty;
      }
    });
  });
  return reserved;
};

const revertExpiredEdits = async () => {
  try {
    const expiredOrders = await Order.find({ status: 'Editing', editWindowExpiresAt: { $lt: new Date() } });
    for (let o of expiredOrders) {
      o.status = o.previousStatus || 'Placed';
      await o.save();
    }
  } catch (err) {
    console.error("Failed to revert expired edits", err);
  }
};

const attachClosestExpiry = async (docs) => {
  if (!docs || docs.length === 0) return docs;
  const productIds = new Set();

  docs.forEach(doc => {
    if (!doc.items) return;
    doc.items.forEach(item => {
      if (item.productId && item.productId._id) productIds.add(item.productId._id.toString());
      else if (item.productId) productIds.add(item.productId.toString());
    });
  });

  if (productIds.size === 0) return docs;

  const batches = await Batch.find({
    productId: { $in: Array.from(productIds) },
    totalStockQuantity: { $gt: 0 },
    isActive: true
  }).select('productId expiryDate').lean();

  const expiryMap = {};
  batches.forEach(b => {
    const pid = b.productId.toString();
    const bDate = new Date(b.expiryDate);
    if (!expiryMap[pid] || bDate < expiryMap[pid]) {
      expiryMap[pid] = bDate;
    }
  });

  docs.forEach(doc => {
    if (!doc.items) return;
    doc.items.forEach(item => {
      const pid = item.productId && item.productId._id ? item.productId._id.toString() : item.productId?.toString();
      if (pid && expiryMap[pid] && !item.expiryDate) {
        item.closestExpiry = expiryMap[pid];
      }
    });
  });

  return docs;
};

const notifyClient = async (clientId, payload) => {
  try {
    await Notification.create({ recipientId: clientId, recipientRole: 'client', ...payload });
  } catch (err) {
    console.error('notifyClient error:', err);
  }
};

const httpError = (message, status) => Object.assign(new Error(message), { status });

const ADMIN_ORDER_POPULATE = {
  path: 'clientId',
  select: 'establishmentName city deliveryRoute clientId gstin billingAddress drugLicense20B drugLicense21B totalOutstanding creditBalance outstandingDate',
};

const PRODUCT_POPULATE = {
  path: 'items.productId',
  select: 'name company companyId compositions packing photoUrl gstRate',
  populate: { path: 'companyId', select: 'shortCode companyName' },
};

const voidOrderInvoice = async (order, reason, session) => {
  if (!order.invoiceDocumentId) return;

  const invoice = await SalesInvoice.findById(order.invoiceDocumentId).session(session);
  if (!invoice || invoice.invoiceStatus === 'CANCELLED') return;

  for (const item of invoice.items) {
    const qty = item.billedQty ?? (item.chargeableQty + (item.freeQty || 0));
    if (item.lotConsumption?.length) {
      await restoreFromLots(item.batchId, qty, item.lotConsumption, session);
    }
    await Product.findByIdAndUpdate(item.productId, { $inc: { totalStock: qty } }, { session });
  }

  const client = await Client.findById(invoice.clientObjectId).session(session);
  if (client) {
    client.totalOutstanding = (client.totalOutstanding || 0) - invoice.dueAmount;
    client.creditBalance = (client.creditBalance || 0) + (invoice.creditApplied || 0);
    await client.save({ session });
  }

  invoice.invoiceStatus = 'CANCELLED';
  invoice.cancellationReason = reason || '';
  invoice.cancelledAt = new Date();
  await invoice.save({ session });

  order.invoiceDocumentId = null;
  order.invoiceNumber = undefined;
  order.finalInvoiceAmount = undefined;
};

// ── Controllers ──────────────────────────────────────────

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

    // ✨ Fetch Real-Time Reserved Stock
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

      // ✨ TRUE VIRTUAL STOCK VALIDATION ENGINE
      if (i.batchId) {
        const specificBatch = prodBatches.find(b => String(b._id) === String(i.batchId));
        if (!specificBatch) {
            throw new Error(`The selected offer for ${product.name} is no longer available.`);
        }
        
        // Subtract reserved stock mapped to this specific batch
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
        
        // Subtract standard reserved stock mapped to this product
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

        // ── Carry over inquiry snapshots ──────
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
        
        // ✨ TRUE VIRTUAL STOCK VALIDATION: Pass the `order._id` to exclude it from reserved math!
        const reservedMap = await getReservedStockMap(productIds, order._id, session);

        // Fetch batches to allow safe batch validation during update!
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

          // ✨ VALIDATION DURING UPDATE
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
            
            // ── Preserve original snapshots ──────
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

// ── RESTORED MISSING FUNCTIONS ──────────────────────────────────────

exports.confirmOrder = async (req, res) => {
  try {
    await revertExpiredEdits();
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (order.status === 'Editing') {
      return res.status(409).json({ message: 'Client is currently editing this order. Please wait for their 2-minute window to close.' });
    }

    if (order.status !== 'Placed') {
      return res.status(409).json({ message: 'Only a Placed order can be confirmed.' });
    }

    order.status = 'Confirmed';
    order.updatedBy = req.admin?._id;
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    await revertExpiredEdits();

    const { clientId, status, dateFrom, dateTo, billType, minAmount, maxAmount, search, sortBy } = req.query;
    const match = {};
    if (clientId) match.clientId = clientId;
    if (status) match.status = status;
    if (billType) match.billPreference = billType;

    if (dateFrom || dateTo) {
      match.createdAt = {};
      if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    if (search) {
      const re = new RegExp(search.trim(), 'i');
      match.$or = [{ orderId: re }, { invoiceNumber: re }];
    }

    let orders = await Order.find(match)
      .populate(PRODUCT_POPULATE)
      .populate('items.plannedBatches.batchId', 'batchNumber expiryDate mrp nearExpiry')
      .populate(ADMIN_ORDER_POPULATE)
      .sort({ createdAt: -1 })
      .lean();

    const min = minAmount !== undefined ? Number(minAmount) : null;
    const max = maxAmount !== undefined ? Number(maxAmount) : null;
    if (min !== null || max !== null) {
      orders = orders.filter((o) => {
        const amount = o.finalInvoiceAmount ?? o.estimatedOrderTotal ?? 0;
        if (min !== null && amount < min) return false;
        if (max !== null && amount > max) return false;
        return true;
      });
    }

    const amountOf = (o) => o.finalInvoiceAmount ?? o.estimatedOrderTotal ?? 0;
    if (sortBy === 'oldest') orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sortBy === 'highest') orders.sort((a, b) => amountOf(b) - amountOf(a));
    else if (sortBy === 'lowest') orders.sort((a, b) => amountOf(a) - amountOf(b));
    else if (sortBy === 'status') orders.sort((a, b) => a.status.localeCompare(b.status));

    orders = await attachClosestExpiry(orders);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    await revertExpiredEdits();
    const order = await Order.findById(req.params.id)
      .populate(PRODUCT_POPULATE)
      .populate('items.plannedBatches.batchId', 'batchNumber expiryDate mrp nearExpiry')
      .populate(ADMIN_ORDER_POPULATE)
      .lean();

    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const [enrichedOrder] = await attachClosestExpiry([order]);
    res.json({ success: true, data: enrichedOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
    await order.save();

    res.json({
      success: true,
      data: { editWindowExpiresAt: order.editWindowExpiresAt, status: order.status },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────────────────────────

exports.cancelEditOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order && order.status === 'Editing') {
      order.status = order.previousStatus || 'Placed';
      await order.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw httpError('Order not found.', 404);

      const blocked = !order.isCancellable || ['Shipped', 'Delivered'].includes(order.status);
      if (blocked) throw httpError('This order can no longer be cancelled.', 409);

      const { reason, cancelledBy } = req.body;

      if (['Invoiced', 'Packed'].includes(order.status)) {
        await voidOrderInvoice(order, reason, session);
      }

      order.status = 'Cancelled';
      if (cancelledBy === 'client') order.clientCancelReason = reason;
      else order.adminCancelReason = reason;

      await order.save({ session });
      result = order;
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  } finally {
    await session.endSession();
  }
};

exports.cancelInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw httpError('Order not found.', 404);

      if (!['Invoiced', 'Packed'].includes(order.status)) {
        throw httpError('Only an Invoiced or Packed order has an invoice to cancel.', 409);
      }

      await voidOrderInvoice(order, req.body?.reason, session);
      order.status = 'Confirmed';
      await order.save({ session });
      result = order;
    });

    await notifyClient(result.clientId, {
      type: 'order',
      title: 'Invoice cancelled',
      message: `The invoice for order ${result.orderId} was voided and the order reverted to Confirmed.`,
      link: `/client-dashboard/orders?tab=orders&id=${result._id}`,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  } finally {
    await session.endSession();
  }
};

exports.packOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (order.status !== 'Invoiced') {
      return res.status(409).json({ message: 'Only an Invoiced order can be marked Packed.' });
    }

    order.status = 'Packed';
    order.updatedBy = req.admin?._id;
    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.shipOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (order.status !== 'Packed') {
      return res.status(409).json({ message: 'Only a Packed order can be marked Shipped.' });
    }

    order.status = 'Shipped';
    order.shippedAt = new Date();
    if (req.body?.dispatchDetails) {
      order.dispatchDetails = { ...order.dispatchDetails, ...req.body.dispatchDetails };
    }
    order.updatedBy = req.admin?._id;
    await order.save();

    await notifyClient(order.clientId, {
      type: 'order',
      title: 'Order shipped',
      message: `Your order ${order.orderId} has been shipped.`,
      link: `/client-dashboard/orders?tab=orders&id=${order._id}`,
    });

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.confirmDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.status !== 'Shipped') {
      return res.status(409).json({ message: 'Only a Shipped order can be marked Delivered.' });
    }

    order.status = 'Delivered';
    order.deliveredAt = new Date();
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sharePricing = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    order.pricingSharedAt = new Date();
    await order.save();

    await notifyClient(order.clientId, {
      type: 'order',
      title: 'Pricing available',
      message: `Pricing details for order ${order.orderId} are now available to view.`,
      link: `/client-dashboard/orders?tab=orders&id=${order._id}`,
    });

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.downloadInvoicePdf = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (!order.invoiceDocumentId) {
      return res.status(404).json({ message: 'This order does not have an invoice generated yet.' });
    }

    const invoice = await SalesInvoice.findById(order.invoiceDocumentId)
      .populate('clientObjectId', 'city district');
    if (!invoice) {
      return res.status(409).json({ message: "This order's linked invoice could not be found." });
    }

    const pdfBuffer = await generateInvoicePdfBuffer(invoice);
    const filename = `${invoice.invoiceNumber || order.orderId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('downloadInvoicePdf error:', err);
    res.status(500).json({ message: err.message || 'Failed to generate invoice PDF.' });
  }
};