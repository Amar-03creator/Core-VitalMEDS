// server/src/controllers/orderController/orderWorkflow.js
const mongoose = require('mongoose');
const Order = require('../../models/Order');
const { revertExpiredEdits, voidOrderInvoice, notifyClient, httpError, buildActionLog } = require('./orderUtils');

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
    order.updatedBy = req.admin?._id; // Keeping legacy tracking for now
    
    // ✨ NEW: Add the undeniable Audit Log
    order.actionLogs.push(buildActionLog(req, 'Confirmed', 'Order confirmed and locked for invoicing.'));

    await order.save();
    res.json({ success: true, data: order });
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

      // ✨ NEW: Add the undeniable Audit Log
      order.actionLogs.push(buildActionLog(req, 'Cancelled', `Reason: ${reason}`));

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
      
      // ✨ NEW: Add the undeniable Audit Log
      order.actionLogs.push(buildActionLog(req, 'Invoice Voided', `Reason: ${req.body?.reason || 'No reason provided'}`));
      
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

    // ✨ NEW: Add the undeniable Audit Log
    order.actionLogs.push(buildActionLog(req, 'Packed', 'Order is packed and ready for dispatch.'));

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
    
    let dispatchNote = '';
    if (req.body?.dispatchDetails) {
      order.dispatchDetails = { ...order.dispatchDetails, ...req.body.dispatchDetails };
      dispatchNote = `Dispatched via ${req.body.dispatchDetails.transportMode || 'Delivery'}`;
    }
    
    order.updatedBy = req.admin?._id;

    // ✨ NEW: Add the undeniable Audit Log
    order.actionLogs.push(buildActionLog(req, 'Shipped', dispatchNote));

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
    
    // ✨ NEW: Add the undeniable Audit Log
    order.actionLogs.push(buildActionLog(req, 'Delivered'));
    
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
    
    // ✨ NEW: Add the undeniable Audit Log
    order.actionLogs.push(buildActionLog(req, 'Pricing Shared', 'Admin revealed PTR and Discounts to the client.'));

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