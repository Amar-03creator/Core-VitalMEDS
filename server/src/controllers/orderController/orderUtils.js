// server/src/controllers/orderController/orderUtils.js
const Order = require('../../models/Order');
const Batch = require('../../models/Batch');
const Product = require('../../models/Product');
const Client = require('../../models/Client');
const SalesInvoice = require('../../models/SalesInvoice');
const Notification = require('../../models/Notification');
const { restoreFromLots } = require('../../helpers/inventoryFifo');

exports.EDIT_WINDOW_MS = 2 * 60 * 1000;

// ✨ FIX: Updated the populate string to use the new 'drugLicenses' array instead of 20B/21B
exports.ADMIN_ORDER_POPULATE = {
  path: 'clientId',
  select: 'establishmentName city deliveryRoute clientId gstin billingAddress drugLicenses totalOutstanding creditBalance outstandingDate',
};

exports.PRODUCT_POPULATE = {
  path: 'items.productId',
  select: 'name company companyId compositions packing photoUrl gstRate',
  populate: { path: 'companyId', select: 'shortCode companyName' },
};

exports.httpError = (message, status) => Object.assign(new Error(message), { status });

// ✨ NEW: The Master Audit Log Builder
// This function reads the identity we attached in the Auth Middleware!
exports.buildActionLog = (req, action, note = '') => {
  // If no req.user is found (rare fallback), default to System
  const byName = req?.user?.name || 'System';
  // Check if they are an Admin (Proprietor/CP) or a Client (Pharmacy Owner)
  const role = req?.user?.isAdmin ? (req?.user?.adminRole || 'Admin') : 'Client';

  return {
    action,
    byName,
    role,
    timestamp: new Date(),
    note
  };
};

exports.getReservedStockMap = async (productIds, excludeOrderId = null, session = null) => {
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

exports.revertExpiredEdits = async () => {
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

exports.attachClosestExpiry = async (docs) => {
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

exports.notifyClient = async (clientId, payload) => {
  try {
    await Notification.create({ recipientId: clientId, recipientRole: 'client', ...payload });
  } catch (err) {
    console.error('notifyClient error:', err);
  }
};

exports.voidOrderInvoice = async (order, reason, session) => {
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