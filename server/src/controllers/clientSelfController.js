// server/src/controllers/clientSelfController.js
//
// Client-facing "me" endpoints — distinct from clientController.js, which
// is the ADMIN's CRUD-by-:id view over any client. Everything here scopes
// to whichever client the caller's Cognito token belongs to.

const Client = require('../models/Client');
const Admin = require('../models/Admin');
const Notification = require('../models/Notification');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ region: process.env.AWS_REGION });
const { getUploadTicket, getDownloadUrl } = require('../helpers/s3Helper');
const clientHelpers = require('./clientController/clientHelpers');

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

    // Convert to plain object so we can sign the URLs
    const clientObj = client.toObject();

    // ✨ NEW: Sign URLs so the client can view their own private documents!
    if (clientObj.documentUrls) {
      for (const docType of Object.keys(clientObj.documentUrls)) {
        const rawUrlString = clientObj.documentUrls[docType];
        if (rawUrlString) {
          const rawUrls = rawUrlString.split(',');
          const signedUrls = rawUrls.map(u => getDownloadUrl(u));
          clientObj.documentUrls[docType] = signedUrls.join(',');
        }
      }
    }

    res.json({ success: true, data: clientObj });
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

    // 4. contacts
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
            Username: cognitoSync.oldEmail,
            UserAttributes: attrs,
          }).promise();
        }
      } catch (cognitoErr) {
        console.error('Cognito sync failed for primary contact change:', cognitoErr.message);
      }
    }

    res.json({ success: true, message: 'Profile updated successfully.', data: client });
  } catch (err) {
    console.error('updateMyProfile error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/clients/me/documents/request ───────────────────────── */
/* body: { documentType, message } */
exports.requestDocumentUpload = async (req, res) => {
  try {
    const { documentType, message } = req.body;
    if (!ALLOWED_DOC_TYPES.includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type.' });
    }

    const client = await findSelf(req);
    if (!client) return res.status(404).json({ message: 'Client profile not found.' });

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

    // ✨ FIX: Expects `message` now instead of `reason` based on schema requirements
    client.documentRequests.push({ documentType, message, status: 'pending', requestedAt: new Date() });
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
      const openRequest = client.documentRequests.find(
        (r) => r.documentType === documentType && (r.status === 'approved' || r.status === 'rejected')
      );
      if (!openRequest) {
        return res.status(403).json({ message: 'You need an open request before re-uploading this document.' });
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

// POST /api/clients/me/documents/confirm
exports.confirmDocumentUpload = async (req, res) => {
  try {
    // ✨ NEW: Destructure documentNumber from the body
    const { documentType, fileKey, fileUrl, documentNumber } = req.body;
    
    if (!ALLOWED_DOC_TYPES.includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type.' });
    }
    if (!fileUrl) return res.status(400).json({ message: 'fileUrl is required.' });

    const client = await findSelf(req);
    if (!client) return res.status(404).json({ message: 'Client profile not found.' });

    // ✨ NEW: Validate and save the document number BEFORE processing jailbreak logic
    if (documentNumber) {
      let isValid = true;
      if (documentType === 'panCard') isValid = clientHelpers.isValidPAN(documentNumber);
      if (documentType === 'gstCert') isValid = clientHelpers.isValidGSTIN(documentNumber);
      if (documentType === 'aadhaarCard') isValid = clientHelpers.isValidAadhaar(documentNumber);
      if (documentType === 'dlCert') isValid = clientHelpers.isValidDL(documentNumber);

      if (!isValid) return res.status(400).json({ message: `Invalid format for ${documentType} number.` });

      // Check if another client is already using this ID
      const fieldMap = {
        gstCert: 'gstin',
        panCard: 'panNumber',
        aadhaarCard: 'aadhaarNumber',
        dlCert: 'drugLicense' 
      };
      
      const fieldName = fieldMap[documentType];
      const duplicateMsg = await clientHelpers.findOwnerOf(fieldName, documentNumber, client._id);
      
      if (duplicateMsg) {
        return res.status(400).json({ message: `This ID number is already registered to ${duplicateMsg}.` });
      }

      // Save to database
      if (documentType === 'dlCert') {
        client.drugLicenses = [documentNumber]; // Overwrites with new DL number
      } else {
        // Aadhaar, PAN, GST mapping
        const mappedDbField = {
          gstCert: 'gstin',
          panCard: 'panNumber',
          aadhaarCard: 'aadhaarNumber'
        }[documentType];
        client[mappedDbField] = documentNumber;
      }
    }

    const oldUrlString = client.documentUrls?.[documentType];
    const isFirstUpload = !client.documentFirstUploaded?.[documentType];

    // The Automated Orphan Deletion System (Cleans S3 Storage!)
    if (oldUrlString && oldUrlString !== fileUrl) {
      const oldUrls = oldUrlString.split(',');
      for (const url of oldUrls) {
        try {
          const urlObj = new URL(url);
          const oldKey = decodeURIComponent(urlObj.pathname.substring(1));
          await s3.deleteObject({ 
            Bucket: process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET, 
            Key: oldKey 
          }).promise();
        } catch (e) {
          console.error("Failed to delete old S3 file. It might already be gone.", e);
        }
      }
    }

    if (!client.documentUrls) client.documentUrls = {}; 
    client.documentUrls[documentType] = fileUrl;
    
    if (!client.documentVerification) client.documentVerification = {};
    client.documentVerification[documentType] = false; // ✨ Secures the Sneak-Edit Loophole (Resets Verification)

    if (isFirstUpload) {
      if (!client.documentFirstUploaded) client.documentFirstUploaded = {};
      client.documentFirstUploaded[documentType] = true;
    } else {
      // Complete ALL open requests for this document (Approved Updates or Rejections)
      if (client.documentRequests) {
        client.documentRequests.forEach(req => {
          if (req.documentType === documentType && (req.status === 'approved' || req.status === 'rejected')) {
            req.status = 'completed';
            req.resolvedAt = new Date();
            req.newFileKey = fileKey;
            req.oldFileKey = oldUrlString;
            req.resolutionReason = 'uploaded';
          }
        });
      }
    }

    // ✨ UPGRADED JAILBREAK LOGIC ✨
    // Because we saved documentNumber above, this dynamically checks what the client just filled out!
    const needsGST = !!client.gstin;
    const needsDL = !!(client.drugLicenses && client.drugLicenses.length > 0);
    const needsPAN = !!client.panNumber;
    const needsAadhaar = !!client.aadhaarNumber;

    const hasGST = !needsGST || !!client.documentFirstUploaded?.gstCert;
    const hasDL = !needsDL || !!client.documentFirstUploaded?.dlCert;
    const hasPAN = !needsPAN || !!client.documentFirstUploaded?.panCard;
    const hasAadhaar = !needsAadhaar || !!client.documentFirstUploaded?.aadhaarCard;

    if (hasGST && hasDL && hasPAN && hasAadhaar) {
        client.documentsUploaded = true; 
    }

    client.documentsVerified = ALLOWED_DOC_TYPES.every((t) => client.documentVerification[t] || !client.documentFirstUploaded?.[t]);

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

exports.updateMyContact = async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    // 1. Find current logged-in client
    const client = await Client.findOne({ 'contacts.email': new RegExp(`^${req.user.email}$`, 'i') });
    
    if (!client) {
      return res.status(404).json({ message: 'Client profile not found.' });
    }

    // 2. ✨ DUPLICATE EMAIL CHECK across ALL clients in DB
    if (email && email.toLowerCase() !== req.user.email.toLowerCase()) {
      const existingEmail = await Client.findOne({
        'contacts.email': new RegExp(`^${email.trim()}$`, 'i'),
        _id: { $ne: client._id } // Ignore self
      });

      if (existingEmail) {
        return res.status(400).json({ message: 'This email already exists in the database.' });
      }
    }

    // 3. Update the primary contact
    const primaryIndex = client.contacts.findIndex(c => c.isPrimary);
    if (primaryIndex >= 0) {
      if (email) client.contacts[primaryIndex].email = email.trim();
      if (phone) client.contacts[primaryIndex].phone = phone.replace(/^\+91/, '').replace(/\D/g, '');
    }

    await client.save();
    res.json({ success: true, message: 'Contact details updated successfully.' });

  } catch (error) {
    console.error('[updateMyContact] error:', error);
    res.status(500).json({ message: error.message || 'Failed to sync contact updates.' });
  }
};

// ✨ NEW: Check if email is available BEFORE sending OTP
exports.precheckContact = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if another client is already using this email
    if (email && email.toLowerCase() !== req.user.email.toLowerCase()) {
      
      // ✨ FIX: Removed the duplicate 'contacts.email' key
      const existingEmail = await Client.findOne({
        'contacts.email': new RegExp(`^${email.trim()}$`, 'i')
      });

      if (existingEmail) {
        return res.status(400).json({ message: 'This email is already associated with another pharmacy.' });
      }
    }
    
    res.json({ success: true, message: 'Email is available.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error verifying email availability.' });
  }
};