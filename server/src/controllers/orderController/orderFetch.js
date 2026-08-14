// server/src/controllers/orderController/orderFetch.js
const Order = require('../../models/Order');
const { revertExpiredEdits, attachClosestExpiry, PRODUCT_POPULATE, ADMIN_ORDER_POPULATE } = require('./orderUtils');

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