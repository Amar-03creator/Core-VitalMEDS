// server/src/controllers/inquiryController.js
const Inquiry = require('../models/Inquiry');
const Notification = require('../models/Notification');
const Counter = require('../models/Counter');

const notifyClient = async (clientId, payload) => {
  try {
    await Notification.create({ recipientId: clientId, recipientRole: 'client', ...payload });
  } catch (err) {
    // Notification failures should never take down the main action.
    console.error('notifyClient error:', err);
  }
};

// Same Counter-doc pattern as orderController.nextOrderId, kept as its own
// sequence ('inquiry_seq') so inquiry numbers don't share a counter with orders.
const nextInquiryId = async () => {
  const counter = await Counter.findByIdAndUpdate(
    'inquiry_seq',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `INQ-${String(counter.seq).padStart(5, '0')}`;
};

// Product population shared by getInquiries/getInquiryById — nested-populates
// Company so the quote view can show the real short code (Product.company is
// the full display name; the short code lives on Company.shortCode).
const populateInquiryItems = (query) =>
  query
    .populate({
      path: 'items.productId',
      select: 'name company companyId packing photoUrl gstRate',
      populate: { path: 'companyId', select: 'shortCode companyName' },
    })
    .populate('items.quoteBreakdown.batchId', 'batchNumber expiryDate mrp')
    .populate('linkedOrder', 'orderId status');

/* ── POST /api/inquiries ────────────────────────────────────────────
 * Client submits from the "Inquiry" tab.
 * body: { clientId, items: [{ productId, requestedQty, estimatedLineTotal }],
 *         billPreference, clientRemarks }
 */
exports.createInquiry = async (req, res) => {
  try {
    const { clientId, items, billPreference, clientRemarks } = req.body;

    if (!clientId) return res.status(400).json({ message: 'clientId is required.' });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required.' });
    }

    const inquiryId = await nextInquiryId();

    const inquiry = new Inquiry({
      inquiryId,
      clientId,
      status: 'Pending',
      items: items.map((i) => ({
        productId: i.productId,
        requestedQty: i.requestedQty,
        addedByAdmin: false,
        estimatedLineTotal: i.estimatedLineTotal,
      })),
      billPreference,
      clientRemarks,
      totalPrice: items.reduce((sum, i) => sum + (i.estimatedLineTotal || 0), 0),
    });

    await inquiry.save();
    res.status(201).json({ success: true, data: inquiry });
  } catch (err) {
    console.error('createInquiry error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /api/inquiries?clientId=&status= ─────────────────────────────
 * "My Inquiries" tab — list, newest first.
 */
exports.getInquiries = async (req, res) => {
  try {
    const { clientId, status } = req.query;
    const match = {};
    if (clientId) match.clientId = clientId;
    if (status) match.status = status;

    const inquiries = await populateInquiryItems(Inquiry.find(match)).sort({ createdAt: -1 });

    res.json({ success: true, count: inquiries.length, data: inquiries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /api/inquiries/:id ─────────────────────────────────────────── */
exports.getInquiryById = async (req, res) => {
  try {
    const inquiry = await populateInquiryItems(Inquiry.findById(req.params.id));
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });
    res.json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/inquiries/:id ────────────────────────────────────────────
 * Client [Edit] — only while status is still 'Pending' (locked once Seen).
 */
exports.updateInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

    if (inquiry.isLockedForEditing || inquiry.status !== 'Pending') {
      return res.status(409).json({ message: 'Admin is reviewing this inquiry — it can no longer be edited.' });
    }

    const { items, billPreference, clientRemarks } = req.body;
    if (items) {
      inquiry.items = items.map((i) => ({
        productId: i.productId,
        requestedQty: i.requestedQty,
        addedByAdmin: false,
        estimatedLineTotal: i.estimatedLineTotal,
      }));
      inquiry.totalPrice = items.reduce((sum, i) => sum + (i.estimatedLineTotal || 0), 0);
    }
    if (billPreference) inquiry.billPreference = billPreference;
    if (clientRemarks !== undefined) inquiry.clientRemarks = clientRemarks;

    await inquiry.save();
    res.json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/inquiries/:id/cancel ─────────────────────────────────────
 * Client [Cancel] — only while status is still 'Pending'.
 * Uses the dedicated 'Cancelled' status so the client UI can badge this
 * distinctly from a quote that was actually reviewed and rejected.
 */
exports.cancelInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

    if (inquiry.status !== 'Pending') {
      return res.status(409).json({ message: 'Only a Pending inquiry can be cancelled.' });
    }

    inquiry.status = 'Cancelled';
    if (req.body?.clientRemarks) inquiry.clientRemarks = req.body.clientRemarks;
    await inquiry.save();
    res.json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/inquiries/:id/seen ───────────────────────────────────────
 * Admin opens the inquiry — locks it against further client edits.
 */
exports.markSeen = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

    if (inquiry.status === 'Pending') {
      inquiry.status = 'Seen';
      inquiry.isLockedForEditing = true;
      await inquiry.save();
    }
    res.json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/inquiries/:id/quote ──────────────────────────────────────
 * Admin sends pricing back.
 * body: { items: [{ productId, quoteBreakdown, estimatedLineTotal }],
 *         discountPercent, discountReason, adminRemarks, isFinalQuote }
 */
exports.sendQuote = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

    const { items, discountPercent, discountReason, adminRemarks, isFinalQuote } = req.body;

    if (items) {
      inquiry.items = inquiry.items.map((existing) => {
        const update = items.find((i) => String(i.productId) === String(existing.productId));
        if (!update) return existing;
        return {
          ...existing.toObject(),
          quoteBreakdown: update.quoteBreakdown,
          estimatedLineTotal: update.estimatedLineTotal,
        };
      });
    }

    if (discountPercent !== undefined) inquiry.discountPercent = discountPercent;
    if (discountReason !== undefined) inquiry.discountReason = discountReason;
    if (adminRemarks !== undefined) inquiry.adminRemarks = adminRemarks;

    inquiry.totalPrice = inquiry.items.reduce((sum, i) => sum + (i.estimatedLineTotal || 0), 0);
    inquiry.discountedTotalPrice = inquiry.totalPrice * (1 - (inquiry.discountPercent || 0) / 100);
    inquiry.isFinalQuote = !!isFinalQuote;
    inquiry.status = isFinalQuote ? 'Final Quote' : 'Quoted';
    inquiry.updatedBy = req.admin?._id;

    await inquiry.save();

    await notifyClient(inquiry.clientId, {
      type: 'inquiry',
      title: 'Quote ready',
      message: 'Your inquiry has a quote ready for review.',
      link: `/client-dashboard/orders?tab=inquiries&id=${inquiry._id}`,
    });

    res.json({ success: true, data: inquiry });
  } catch (err) {
    console.error('sendQuote error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/inquiries/:id/reject ─────────────────────────────────────
 * Client rejects the quote outright — becomes read-only.
 */
exports.rejectInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

    inquiry.status = 'Rejected';
    if (req.body?.clientRemarks) inquiry.clientRemarks = req.body.clientRemarks;
    await inquiry.save();

    res.json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/inquiries/:id/request-changes ────────────────────────────
 * Client asks for a revised quote — sends the admin back into the loop.
 */
exports.requestChanges = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

    inquiry.status = 'Changes Requested';
    inquiry.isEdited = true;
    if (req.body?.clientRemarks) inquiry.clientRemarks = req.body.clientRemarks;
    await inquiry.save();

    res.json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};