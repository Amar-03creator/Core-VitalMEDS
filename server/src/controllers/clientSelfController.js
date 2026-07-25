// server/src/controllers/clientSelfController.js
//
// Client-facing "me" endpoints — distinct from clientController.js, which
// is the ADMIN's CRUD-by-:id view over any client. Everything here scopes
// to whichever client the caller's Cognito token belongs to.

const Client = require('../models/Client');
const Admin = require('../models/Admin');
const Notification = require('../models/Notification');
const { getUploadTicket } = require('../helpers/s3Helper');
const AWS = require('aws-sdk');

const ALLOWED_DOC_TYPES = ['gstCert', 'dlCert', 'aadhaarCard', 'panCard'];
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const strip91 = (num) => (num ? num.replace(/^\+91/, '').replace(/\D/g, '') : undefined);
const isValidMobile = (v) => /^[6-9]\d{9}$/.test(v);
const isValidEmail = (v) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);

// Every /me route resolves the caller's Client doc from their verified
// Cognito email — same lookup pattern already used in authRoutes.js's
// /verify-token ("Client.findOne({ 'contacts.email': email })").
async function findSelf(req) {
  return Client.findOne({ 'contacts.email': req.user.email }).select('-suspendOtp -suspendOtpExpiry -__v');
}

async function notifyAllAdmins({ type, title, message, link }) {
  const admins = await Admin.find({}, '_id');
  if (!admins.length) return;
  await Notification.insertMany(
    admins.map((a) => ({ recipientId: a._id, recipientRole: 'admin', type, title, message, link }))
  );
}

/* ── GET /api/clients/me ──────────────────────────────────────────── */
exports.getMyProfile = async (req, res) => {
  try {
    const client = await findSelf(req);
    if (!client) return res.status(404).json({ message: 'Client profile not found.' });
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/clients/me ──────────────────────────────────────────── */
/* body: { establishmentName?, businessType?, shippingAddress?, contacts? } */
exports.updateMyProfile = async (req, res) => {
  try {
    const client = await findSelf(req);
    if (!client) return res.status(404).json({ message: 'Client profile not found.' });

    const { establishmentName, businessType, shippingAddress, contacts } = req.body;
    const errors = [];

    // 1. establishmentName — only editable before the account is approved
    if (establishmentName !== undefined && establishmentName !== client.establishmentName) {
      if (client.accountApprovedAt) {
        errors.push('Establishment name can no longer be changed once your account is approved.');
      } else if (!establishmentName.trim()) {
        errors.push('Establishment name cannot be empty.');
      } else {
        client.establishmentName = establishmentName;
      }
    }

    // 2. businessType — once every 365 days
    if (businessType !== undefined && businessType !== client.businessType) {
      const last = client.businessTypeChangedAt;
      if (last && Date.now() - new Date(last).getTime() < ONE_YEAR_MS) {
        const nextAllowed = new Date(new Date(last).getTime() + ONE_YEAR_MS);
        errors.push(`Business type can only be changed once a year. Next change allowed on ${nextAllowed.toDateString()}.`);
      } else {
        client.businessType = businessType;
        client.businessTypeChangedAt = new Date();
      }
    }

    // 3. shippingAddress — always editable
    if (shippingAddress !== undefined) client.shippingAddress = shippingAddress;

    // 4. contacts — must keep exactly one primary; a primary email/phone
    //    change is synced to Cognito after save.
    let cognitoSync = null;
    if (contacts !== undefined) {
      if (!Array.isArray(contacts) || contacts.length === 0) {
        errors.push('At least one contact is required.');
      } else {
        const primaries = contacts.filter((c) => c.isPrimary);
        if (primaries.length !== 1) {
          errors.push('Exactly one contact must be marked as primary.');
        } else {
          contacts.forEach((c, i) => {
            if (!c.name || !c.phone) errors.push(`Contact ${i + 1}: name and phone are required.`);
            if (c.phone && !isValidMobile(strip91(c.phone))) errors.push(`Contact ${i + 1}: invalid mobile number.`);
            if (c.email && !isValidEmail(c.email)) errors.push(`Contact ${i + 1}: invalid email.`);
          });

          if (errors.length === 0) {
            const oldPrimary = client.contacts.find((c) => c.isPrimary);
            const newPrimary = primaries[0];
            if (oldPrimary && (oldPrimary.email !== newPrimary.email || strip91(oldPrimary.phone) !== strip91(newPrimary.phone))) {
              cognitoSync = { oldEmail: oldPrimary.email, newEmail: newPrimary.email, newPhone: newPrimary.phone };
            }
            client.contacts = contacts.map((c) => ({ ...c, phone: strip91(c.phone) }));
          }
        }
      }
    }

    if (errors.length > 0) return res.status(400).json({ message: errors.join(' ') });

    await client.save();

    // Best-effort Cognito sync for a changed primary contact. I don't have
    // visibility into whatever existing "change email/phone with OTP" flow
    // the Settings > Security tab uses — if one already exists, prefer
    // that over this and drop this block.
    if (cognitoSync) {
      try {
        const cognito = new AWS.CognitoIdentityServiceProvider({ region: process.env.AWS_REGION || 'ap-south-1' });
        const attrs = [];
        if (cognitoSync.newEmail) attrs.push({ Name: 'email', Value: cognitoSync.newEmail }, { Name: 'email_verified', Value: 'true' });
        if (cognitoSync.newPhone) {
          const formatted = cognitoSync.newPhone.startsWith('+') ? cognitoSync.newPhone : `+91${strip91(cognitoSync.newPhone)}`;
          attrs.push({ Name: 'phone_number', Value: formatted }, { Name: 'phone_number_verified', Value: 'true' });
        }
        if (attrs.length) {
          await cognito.adminUpdateUserAttributes({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            // Username was fixed to the original email at signup (see
            // authController.js registerClient) — it does not change even
            // if the email *attribute* does.
            Username: cognitoSync.oldEmail,
            UserAttributes: attrs,
          }).promise();
        }
      } catch (cognitoErr) {
        console.error('Cognito sync failed for primary contact change:', cognitoErr.message);
        // Don't fail the request — the Mongo profile update already succeeded.
      }
    }

    res.json({ success: true, message: 'Profile updated successfully.', data: client });
  } catch (err) {
    console.error('updateMyProfile error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/clients/me/documents/request ───────────────────────── */
/* body: { documentType, reason } */
exports.requestDocumentUpload = async (req, res) => {
  try {
    const { documentType, reason } = req.body;
    if (!ALLOWED_DOC_TYPES.includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type.' });
    }

    const client = await findSelf(req);
    if (!client) return res.status(404).json({ message: 'Client profile not found.' });

    // First-ever upload of this type needs no approval — the client
    // should call the upload-ticket endpoint directly instead.
    if (!client.documentFirstUploaded[documentType]) {
      return res.json({
        success: true,
        firstUpload: true,
        message: 'This is your first upload for this document type — no approval needed, go ahead and upload.',
      });
    }

    const alreadyPending = client.documentRequests.find(
      (r) => r.documentType === documentType && r.status === 'pending'
    );
    if (alreadyPending) {
      return res.status(409).json({ message: 'You already have a pending request for this document.' });
    }

    client.documentRequests.push({ documentType, reason, status: 'pending', requestedAt: new Date() });
    await client.save();

    await notifyAllAdmins({
      type: 'document',
      title: 'Document update requested',
      message: `${client.establishmentName} requested to update their ${documentType}.`,
      link: `/admin-dashboard/customers/${client._id}`,
    });

    const created = client.documentRequests[client.documentRequests.length - 1];
    res.status(201).json({ success: true, firstUpload: false, data: created });
  } catch (err) {
    console.error('requestDocumentUpload error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /api/clients/me/documents/upload-ticket ──────────────────── */
/* query: ?documentType=&contentType= */
exports.getDocumentUploadTicket = async (req, res) => {
  try {
    const { documentType, contentType } = req.query;
    if (!ALLOWED_DOC_TYPES.includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type.' });
    }

    const client = await findSelf(req);
    if (!client) return res.status(404).json({ message: 'Client profile not found.' });

    const isFirstUpload = !client.documentFirstUploaded[documentType];

    if (!isFirstUpload) {
      const approvedRequest = client.documentRequests.find(
        (r) => r.documentType === documentType && r.status === 'approved'
      );
      if (!approvedRequest) {
        return res.status(403).json({ message: 'You need an approved request before re-uploading this document.' });
      }
    }

    const ticket = getUploadTicket({
      clientId: client.clientId,
      documentType,
      contentType: contentType || 'application/pdf',
    });

    res.json({ success: true, ...ticket, isFirstUpload });
  } catch (err) {
    console.error('getDocumentUploadTicket error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/clients/me/documents/confirm ───────────────────────── */
/* body: { documentType, fileKey, fileUrl } */
exports.confirmDocumentUpload = async (req, res) => {
  try {
    const { documentType, fileKey, fileUrl } = req.body;
    if (!ALLOWED_DOC_TYPES.includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type.' });
    }
    if (!fileUrl) return res.status(400).json({ message: 'fileUrl is required.' });

    const client = await findSelf(req);
    if (!client) return res.status(404).json({ message: 'Client profile not found.' });

    const oldFileKey = client.documentUrls?.[documentType];
    const isFirstUpload = !client.documentFirstUploaded[documentType];

    client.documentUrls[documentType] = fileUrl;
    client.documentVerification[documentType] = false; // pending re-verification

    if (isFirstUpload) {
      client.documentFirstUploaded[documentType] = true;
    } else {
      const approvedRequest = client.documentRequests
        .filter((r) => r.documentType === documentType && r.status === 'approved')
        .sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt))[0];
      if (approvedRequest) {
        approvedRequest.status = 'completed';
        approvedRequest.completedAt = new Date();
        approvedRequest.newFileKey = fileKey;
        approvedRequest.oldFileKey = oldFileKey;
      }
    }

    // Overall flag can only be true if every type is individually verified
    client.documentsVerified = ALLOWED_DOC_TYPES.every((t) => client.documentVerification[t]);

    await client.save();

    await notifyAllAdmins({
      type: 'document',
      title: 'New document uploaded',
      message: `${client.establishmentName} uploaded a new ${documentType}. It needs verification.`,
      link: `/admin-dashboard/customers/${client._id}`,
    });

    res.json({ success: true, message: 'Document uploaded successfully. Pending verification.', data: client });
  } catch (err) {
    console.error('confirmDocumentUpload error:', err);
    res.status(500).json({ message: err.message });
  }
};