// server/src/controllers/adminController.js
const Admin = require('../models/Admin');
const Client = require('../models/Client');
const Notification = require('../models/Notification');
const crypto = require('crypto');

const ALLOWED_DOC_TYPES = ['gstCert', 'dlCert', 'aadhaarCard', 'panCard'];
const MAX_LEGAL_CHANGES_PER_YEAR = 2;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const isValidGSTIN = (v) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{2}[0-9A-Z]{1}$/.test(v);
const isValidPAN = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
const isValidAadhaar = (v) => /^[2-9][0-9]{11}$/.test(v);

async function findSelfAdmin(req) {
  return Admin.findOne({ cognitold: req.user.cognitold });
}

/* ── GET /api/admin/me ─────────────────────────────────────────────── */
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await findSelfAdmin(req);
    if (!admin) return res.status(404).json({ message: 'Admin profile not found.' });
    res.json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/admin/me ─────────────────────────────────────────────── */
/* body: { name, secondaryEmail, phone, address } */
exports.updateAdminProfile = async (req, res) => {
  try {
    const admin = await findSelfAdmin(req);
    if (!admin) return res.status(404).json({ message: 'Admin profile not found.' });

    // NOTE: the primary login `email` and `proprietaryName` are
    // intentionally excluded here — email changes affect Cognito login,
    // and proprietaryName is immutable by design (see Admin.js).
    const { name, secondaryEmail, phone, address } = req.body;
    if (name !== undefined) admin.name = name;
    if (secondaryEmail !== undefined) admin.secondaryEmail = secondaryEmail;
    if (phone !== undefined) admin.phone = phone;
    if (address !== undefined) admin.address = address;

    await admin.save();
    res.json({ success: true, message: 'Profile updated.', data: admin });
  } catch (err) {
    console.error('updateAdminProfile error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/admin/me/legal ───────────────────────────────────────── */
/* body: { gstinAdmin, drugLicense, aadhaarAdmin, panAdmin } */
exports.updateLegalInfo = async (req, res) => {
  try {
    const admin = await findSelfAdmin(req);
    if (!admin) return res.status(404).json({ message: 'Admin profile not found.' });

    const { gstinAdmin, drugLicense, aadhaarAdmin, panAdmin } = req.body;
    const incoming = { gstinAdmin, drugLicense, aadhaarAdmin, panAdmin };

    const errors = [];
    if (gstinAdmin && !isValidGSTIN(gstinAdmin)) errors.push('Invalid GSTIN format.');
    if (panAdmin && !isValidPAN(panAdmin)) errors.push('Invalid PAN format.');
    if (aadhaarAdmin && !isValidAadhaar(aadhaarAdmin)) errors.push('Invalid Aadhaar format.');
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    // Reset the yearly counter if the last change was over a year ago
    if (admin.lastLegalInfoChangeDate && Date.now() - new Date(admin.lastLegalInfoChangeDate).getTime() > ONE_YEAR_MS) {
      admin.legalInfoChangeCount = 0;
    }

    const changedFields = Object.entries(incoming).filter(
      ([field, value]) => value !== undefined && value !== admin[field]
    );

    if (changedFields.length === 0) {
      return res.json({ success: true, message: 'No changes submitted.', data: admin });
    }

    if (admin.legalInfoChangeCount >= MAX_LEGAL_CHANGES_PER_YEAR) {
      const resetDate = new Date(new Date(admin.lastLegalInfoChangeDate).getTime() + ONE_YEAR_MS);
      return res.status(403).json({
        message: `You've used both legal info changes allowed this year. Next reset: ${resetDate.toDateString()}.`,
      });
    }

    for (const [field, value] of changedFields) {
      admin.legalInfoChanges.push({ field, oldValue: admin[field], newValue: value, changedAt: new Date() });
      admin[field] = value;
    }
    admin.legalInfoChangeCount += 1;
    admin.lastLegalInfoChangeDate = new Date();

    await admin.save();
    res.json({
      success: true,
      message: 'Legal info updated.',
      changesRemainingThisYear: MAX_LEGAL_CHANGES_PER_YEAR - admin.legalInfoChangeCount,
      data: admin,
    });
  } catch (err) {
    console.error('updateLegalInfo error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /api/admin/documents/requests?status=&clientId= ─────────────
   Flattens documentRequests across all clients (or one) into a single
   admin-review list, since these are embedded sub-documents rather than
   their own collection. */
exports.listDocumentRequests = async (req, res) => {
  try {
    const { status, clientId } = req.query;
    const match = clientId ? { _id: clientId } : {};

    const clients = await Client.find(match, 'establishmentName clientId documentRequests').lean();

    const requests = [];
    for (const c of clients) {
      for (const r of c.documentRequests || []) {
        if (status && r.status !== status) continue;
        requests.push({
          ...r,
          clientObjectId: c._id,
          clientCode: c.clientId,
          establishmentName: c.establishmentName,
        });
      }
    }
    requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/admin/documents/requests/:requestId ─────────────────────
   body: { status: 'approved' | 'rejected', note, clientId }
   clientId is required since documentRequests is embedded, not its own
   collection — the requestId alone isn't enough to find the parent doc. */
exports.approveRejectDocumentRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, note, clientId } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'." });
    }
    if (!clientId) return res.status(400).json({ message: 'clientId is required.' });

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const request = client.documentRequests.id(requestId);
    if (!request) return res.status(404).json({ message: 'Document request not found.' });

    const admin = await findSelfAdmin(req);

    request.status = status;
    request.approvedBy = admin?._id;
    if (status === 'approved') {
      request.approvedAt = new Date();
    } else {
      request.rejectionNote = note;
    }

    await client.save();

    await Notification.create({
      recipientId: client._id,
      recipientRole: 'client',
      type: 'document',
      title: status === 'approved' ? 'Document update approved' : 'Document update rejected',
      message:
        status === 'approved'
          ? `You can now upload your updated ${request.documentType}.`
          : `Your ${request.documentType} update request was rejected: ${note || 'no reason given'}.`,
      link: '/client-dashboard/profile',
    });

    res.json({ success: true, data: request });
  } catch (err) {
    console.error('approveRejectDocumentRequest error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/admin/clients/:clientId/documents/verify ───────────────
   body: { documentType, verified } */
exports.verifyClientDocument = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { documentType, verified } = req.body;
    if (!ALLOWED_DOC_TYPES.includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type.' });
    }

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    client.documentVerification[documentType] = !!verified;
    client.documentsVerified = ALLOWED_DOC_TYPES.every((t) => client.documentVerification[t]);

    if (client.documentsVerified) {
      const admin = await findSelfAdmin(req);
      client.documentsVerifiedBy = admin?._id;
      client.documentsVerifiedAt = new Date();
    }

    await client.save();

    await Notification.create({
      recipientId: client._id,
      recipientRole: 'client',
      type: 'document',
      title: verified ? 'Document verified' : 'Document needs changes',
      message: verified
        ? `Your ${documentType} has been verified.`
        : `Your ${documentType} needs changes. Please contact support or re-upload.`,
      link: '/client-dashboard/profile',
    });

    res.json({ success: true, data: client });
  } catch (err) {
    console.error('verifyClientDocument error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ── DELETE /api/admin/clients/:clientId/documents/history/:historyId ── */
exports.deleteDocumentHistory = async (req, res) => {
  try {
    const { clientId, historyId } = req.params;
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const request = client.documentRequests.id(historyId);
    if (!request) return res.status(404).json({ message: 'History entry not found.' });

    request.deleteOne();
    await client.save();

    res.json({ success: true, message: 'History entry deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateInviteCode = async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    // Generate a clean 10-char alphanumeric code (e.g. "A9B2C8D4EF")
    const code = crypto.randomBytes(5).toString('hex').toUpperCase();
    
    // Save to DB with 24hr expiry
    client.inviteCode = code;
    client.inviteCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); 
    await client.save();

    // Generate your exact preferred WhatsApp forward link
    const text = `Hello ${client.establishmentName}, your exclusive invite code for the VitalMEDS portal is: *${code}*.\n\nPlease visit http://192.168.1.6:5173/claim-account to claim your profile and view your past invoices. Valid for 24 hours.`;
    const waLink = `https://wa.me/?text=${encodeURIComponent(text)}`;

    res.json({ success: true, code, waLink });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};