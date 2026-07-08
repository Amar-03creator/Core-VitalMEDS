// server/src/controllers/orderController.js
const Order = require('../models/Order');
const Inquiry = require('../models/Inquiry');
const Counter = require('../models/Counter');
const Notification = require('../models/Notification');
const SalesInvoice = require('../models/SalesInvoice');

/*
 * ⚠️ PLACEHOLDER PATH — nothing shared this session actually contained a PDF
 * generation script (salesInvoiceController.js has no pdf/buffer/stream code
 * anywhere in it — I checked the whole file). This path is a guess following
 * your existing '../helpers/xyz' convention (see inventoryFifo.js). Point it
 * at your real module — expected to export a function that takes a
 * SalesInvoice document and returns either a Buffer or a readable stream.
 * downloadInvoicePdf() below handles both shapes, so once this import is
 * correct the route needs no other changes.
 */
const { generateInvoicePdfBuffer } = require('../helpers/invoicePdfGenerator');

const notifyClient = async (clientId, payload) => {
  try {
    await Notification.create({ recipientId: clientId, recipientRole: 'client', ...payload });
  } catch (err) {
    console.error('notifyClient error:', err);
  }
};

// Reuses the same Counter-doc pattern already used for clientId generation.
// Swap this for your SequenceHelper.js if you'd rather keep one source of
// truth for sequence numbers across Purchase Bills / Debit Notes / Orders.
const nextOrderId = async () => {
  const counter = await Counter.findByIdAndUpdate(
    'order_seq',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `ORD-${String(counter.seq).padStart(5, '0')}`;
};

/* ── POST /api/orders ────────────────────────────────────────────────
 * Direct order from the "Order Now" tab (client must be Approved).
 * body: { clientId, items: [{ productId, requestedQty, batchId?, estimatedPrice }],
 *         billPreference }
 *
 * Deliberately does NOT hard-block on stock here — per the doc, an
 * over-committed qty is allowed through and reconciled during invoicing
 * (FIFO deduction decides the real chargeable/free split later).
 */
exports.createOrder = async (req, res) => {
  try {
    const { clientId, items, billPreference } = req.body;

    if (!clientId) return res.status(400).json({ message: 'clientId is required.' });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required.' });
    }

    const orderId = await nextOrderId();

    const order = new Order({
      orderId,
      clientId,
      inquiryId: null,
      status: 'Placed',
      billPreference,
      items: items.map((i) => ({
        productId: i.productId,
        finalQty: i.requestedQty,
        chargeableQty: i.requestedQty,
        freeQty: 0,
        finalPrice: i.estimatedPrice,
        plannedBatches: i.batchId ? [{ batchId: i.batchId, chargeableQty: i.requestedQty, freeQty: 0 }] : [],
      })),
      estimatedOrderTotal: items.reduce((sum, i) => sum + (i.estimatedPrice || 0) * (i.requestedQty || 0), 0),
    });

    await order.save();
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/orders/convert ─────────────────────────────────────────
 * Client accepts a quote from the "Inquiry" tab. Creates a Confirmed
 * order from the quoted breakdown and closes out the inquiry.
 * body: { inquiryId }
 */
exports.convertInquiryToOrder = async (req, res) => {
  try {
    const { inquiryId } = req.body;
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

    if (!['Quoted', 'Final Quote'].includes(inquiry.status)) {
      return res.status(409).json({ message: 'This inquiry has no active quote to accept.' });
    }

    const orderId = await nextOrderId();

    const order = new Order({
      orderId,
      clientId: inquiry.clientId,
      inquiryId: inquiry._id,
      status: 'Confirmed',
      billPreference: inquiry.billPreference,
      items: inquiry.items.map((i) => {
        const chargeable = i.quoteBreakdown?.reduce((s, b) => s + (b.chargeableQty || 0), 0) ?? i.requestedQty;
        const free = i.quoteBreakdown?.reduce((s, b) => s + (b.freeQty || 0), 0) ?? 0;
        return {
          productId: i.productId,
          finalQty: chargeable + free,
          chargeableQty: chargeable,
          freeQty: free,
          finalPrice: i.estimatedLineTotal,
          plannedBatches: (i.quoteBreakdown || []).map((b) => ({
            batchId: b.batchId,
            chargeableQty: b.chargeableQty,
            freeQty: b.freeQty,
          })),
        };
      }),
      estimatedOrderTotal: inquiry.discountedTotalPrice || inquiry.totalPrice,
    });

    await order.save();

    inquiry.status = 'Accepted';
    await inquiry.save();

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error('convertInquiryToOrder error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /api/orders?clientId=&status=&dateFrom=&dateTo=&billType=
 *         &minAmount=&maxAmount=&search= ──────────────────────────────
 * "My Orders" tab — powers the Filter Engine.
 *
 *   status      — one Order.status value (Placed/Confirmed/Invoiced/
 *                 Shipped/Delivered/Cancelled). The UI's "Ordered"/
 *                 "Packed" labels map to Placed/Invoiced respectively —
 *                 pass the underlying DB value here, not the UI label.
 *   dateFrom/dateTo — ISO date strings, inclusive, matched on createdAt.
 *   billType    — 'Cash' | 'Credit' (maps to billPreference).
 *   minAmount/maxAmount — matched against whichever total is currently
 *                 "live" for that order: finalInvoiceAmount once one
 *                 exists, otherwise estimatedOrderTotal. Done in-app
 *                 (not in the Mongo query) since which field is live
 *                 depends on per-document state.
 *   search      — matches orderId or invoiceNumber, case-insensitive.
 */
exports.getOrders = async (req, res) => {
  try {
    const { clientId, status, dateFrom, dateTo, billType, minAmount, maxAmount, search } = req.query;
    const match = {};
    if (clientId) match.clientId = clientId;
    if (status) match.status = status;
    if (billType) match.billPreference = billType;

    if (dateFrom || dateTo) {
      match.createdAt = {};
      if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        // Treat dateTo as inclusive of the whole day.
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
      .populate('items.productId', 'name company compositions packing photoUrl gstRate')
      .sort({ createdAt: -1 });

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

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /api/orders/:id ───────────────────────────────────────────── */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name company compositions packing photoUrl gstRate');
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /api/orders/:id/invoice/pdf ─────────────────────────────────────
 * Streams the order's invoice as a downloadable PDF for the client-facing
 * "Download Invoice" button.
 *
 * Edge cases handled:
 *   - Order doesn't exist                → 404
 *   - Order exists but has no invoice yet → 404 (distinct message)
 *   - Order.invoiceDocumentId is stale/orphaned → 409 (data issue, not a
 *     plain "not found" — the order thinks it has one)
 *   - Generator throws                    → 500
 */
exports.downloadInvoicePdf = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (!order.invoiceDocumentId) {
      return res.status(404).json({ message: 'This order does not have an invoice generated yet.' });
    }

    const invoice = await SalesInvoice.findById(order.invoiceDocumentId);
    if (!invoice) {
      return res.status(409).json({ message: "This order's linked invoice could not be found." });
    }

    const pdfResult = await generateInvoicePdfBuffer(invoice);
    const filename = `${invoice.invoiceNumber || order.orderId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Accept either a Buffer or a readable stream from the generator.
    if (pdfResult && typeof pdfResult.pipe === 'function') {
      pdfResult.pipe(res);
    } else {
      res.setHeader('Content-Length', pdfResult.length);
      res.send(pdfResult);
    }
  } catch (err) {
    console.error('downloadInvoicePdf error:', err);
    res.status(500).json({ message: err.message || 'Failed to generate invoice PDF.' });
  }
};

/* ── PUT /api/orders/:id/cancel ────────────────────────────────────────
 * Placed, Confirmed, and Invoiced ("Packed" in the client UI) can all
 * still be cancelled — stock hasn't left the building yet. Once Shipped
 * or Delivered, cancellation is no longer allowed.
 * body: { reason, cancelledBy: 'admin' | 'client' }
 */
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const blocked = !order.isCancellable || ['Shipped', 'Delivered'].includes(order.status);
    if (blocked) {
      return res.status(409).json({ message: 'This order can no longer be cancelled.' });
    }

    order.status = 'Cancelled';
    const { reason, cancelledBy } = req.body;
    if (cancelledBy === 'client') order.clientCancelReason = reason;
    else order.adminCancelReason = reason;

    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/orders/:id/ship ─────────────────────────────────────────
 * Admin marks as shipped (post-invoice only).
 * body: { dispatchDetails?: { transportMode, vehicleNumber, lrNumber,
 *                              courierName, trackingId, trackingUrl } }
 * This is where the client-facing "Shipping Information" block on the
 * order card gets its data — stored on Order, not on SalesInvoice.
 */
exports.shipOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.status !== 'Invoiced') {
      return res.status(409).json({ message: 'Only an Invoiced order can be marked Shipped.' });
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

/* ── PUT /api/orders/:id/deliver ───────────────────────────────────────
 * Client confirms delivery.
 */
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