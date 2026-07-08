// server/src/controllers/clientController.js
const Client = require('../models/Client');
const Company = require('../models/Company');
const { getNextClientCode } = require('../helpers/SequenceHelper');
const crypto = require('crypto');
const { sendMail } = require('../utils/mailer');
const AWS = require('aws-sdk');


/* ── Format Validators ─────────────────────────────────────── */
const isValidGSTIN = (v) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{2}[0-9A-Z]{1}$/.test(v);
const isValidPAN = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
const isValidAadhaar = (v) => /^[2-9][0-9]{11}$/.test(v);
const isValidDL = (v) => /^[A-Za-z0-9\/\s\-]{5,40}$/.test(v);
const isValidEmail = (v) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
const isValidMobile = (v) => /^[6-9]\d{9}$/.test(v);
const isValidPincode = (v) => /^[1-9][0-9]{5}$/.test(v);

const strip91 = (num) => (num ? num.replace(/^\+91/, '').replace(/\D/g, '') : undefined);


/* ── Uniqueness Helpers ──────────────────────────────────── */
const findOwnerOf = async (field, value, excludeId = null) => {
  // ✨ FIX: Removed the status filter so it checks EVERY account, even suspended ones!
  const query = { [field]: { $regex: `^${value}$`, $options: 'i' } };

  // 1. Special Handling for Drug Licenses 
  if (field === 'drugLicense') {
    let clientQuery = { 'drugLicenses.number': { $regex: `^${value}$`, $options: 'i' } };
    if (excludeId) clientQuery._id = { $ne: excludeId };
    const client = await Client.findOne(clientQuery);
    return client ? `Client "${client.establishmentName}"` : null;
  }

  // 2. Special Handling for Phones
  if (field === 'phone') {
    const normalised = strip91(value);
    let clientQuery = {
      $or: [{ phone: normalised }, { whatsapp: normalised }, { 'contacts.phone': normalised }]
    };
    if (excludeId) clientQuery._id = { $ne: excludeId };
    const client = await Client.findOne(clientQuery);
    return client ? `Client "${client.establishmentName}"` : null;
  }

  // 3. Standard Fields (GSTIN, PAN, Aadhaar)
  let clientQuery = { ...query };
  if (excludeId) clientQuery._id = { $ne: excludeId };
  const client = await Client.findOne(clientQuery);
  return client ? `Client "${client.establishmentName}"` : null;
};

/* ── GET /api/clients ─────────────────────────────────────────────── */
exports.getAllClients = async (req, res) => {
  try {
    const {
      search, status, businessType,
      tier, riskTier, minScore, maxScore,
      cities, lines,
    } = req.query;

    const match = {};

    if (search) {
      const re = { $regex: search, $options: 'i' };
      match.$or = [
        { establishmentName: re },
        { city: re },
        { line: re },
        { 'contacts.name': re },
        { clientId: re },
      ];
    }

    const toIn = (val) => val ? val.split(',').map(v => v.trim()).filter(Boolean) : null;

    const statusArr = toIn(status);
    if (statusArr?.length) {
      match.status = { $in: statusArr };
    } else {
      match.status = { $ne: 'Suspended' };
    }

    const typeArr = toIn(businessType);
    if (typeArr?.length) match.businessType = { $in: typeArr };

    const tierArr = toIn(tier);
    if (tierArr?.length) match.partyTier = { $in: tierArr };

    const riskArr = toIn(riskTier);
    if (riskArr?.length) match.riskTier = { $in: riskArr };

    const cityArr = toIn(cities);
    if (cityArr?.length) match.city = { $in: cityArr };

    const lineArr = toIn(lines);
    if (lineArr?.length) match.line = { $in: lineArr };

    if (minScore || maxScore) {
      match.creditScore = {};
      if (minScore) match.creditScore.$gte = Number(minScore);
      if (maxScore) match.creditScore.$lte = Number(maxScore);
    }

    const clients = await Client.find(match)
      .sort({ createdAt: -1 })
      .select('-__v -documentUrls -documentIssues');

    res.json({ success: true, count: clients.length, data: clients });
  } catch (err) {
    console.error('getAllClients error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /api/clients/:id ─────────────────────────────────────────── */
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).select('-__v');
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/clients ────────────────────────────────────────────── */
exports.createClient = async (req, res) => {
  try {
    const {
      establishmentName, businessType, status,
      gstin, pan, aadhaar,
      drugLicenses,
      billingAddress, shippingAddress, city, district, state, pincode, line,
      creditLimit, paymentTermsDays, defaultDiscountPercent,
      contacts
    } = req.body;

    const errors = [];

    // 1. Mandatory Fields
    if (!establishmentName) errors.push('Establishment Name is required.');
    if (!gstin) errors.push('GSTIN is required.');
    if (!billingAddress || !city || !district || !pincode) errors.push('Complete billing address is required.');

    if (!contacts || contacts.length === 0) {
      errors.push('At least one contact is required.');
    } else {
      contacts.forEach((c, i) => {
        if (!c.name || !c.phone) errors.push(`Contact ${i + 1}: Name and phone are required.`);
        if (c.phone && !isValidMobile(strip91(c.phone))) errors.push(`Contact ${i + 1}: Invalid mobile number.`);
        if (c.email && !isValidEmail(c.email)) errors.push(`Contact ${i + 1}: Invalid email.`);
      });
    }

    // 2. Format Validations
    if (gstin && !isValidGSTIN(gstin)) errors.push('Invalid GSTIN format.');
    if (pan && !isValidPAN(pan)) errors.push('Invalid PAN format.');
    if (aadhaar && !isValidAadhaar(aadhaar)) errors.push('Invalid Aadhaar format.');
    if (pincode && !isValidPincode(pincode)) errors.push('Invalid Pincode format.');

    if (drugLicenses && Array.isArray(drugLicenses)) {
      drugLicenses.forEach((lic, i) => {
        if (!lic.number || !isValidDL(lic.number)) errors.push(`Drug Licence #${i + 1}: invalid format.`);
        if (!lic.validTill) errors.push(`Drug Licence #${i + 1}: Expiry date is required.`);
      });
    }

    if (errors.length > 0) return res.status(400).json({ message: errors.join(' ') });

    // 3. Uniqueness Checks
    const uniqueChecks = [];
    uniqueChecks.push(findOwnerOf('gstin', gstin).then(o => o && `GSTIN already registered with ${o}.`));
    if (pan) uniqueChecks.push(findOwnerOf('pan', pan).then(o => o && `PAN already registered with ${o}.`));
    if (aadhaar) uniqueChecks.push(findOwnerOf('aadhaar', aadhaar).then(o => o && `Aadhaar already registered with ${o}.`));

    contacts.forEach(c => {
      if (c.phone) uniqueChecks.push(findOwnerOf('phone', c.phone).then(o => o && `Phone ${c.phone} already registered with ${o}.`));
    });

    if (drugLicenses && Array.isArray(drugLicenses)) {
      drugLicenses.forEach(lic => {
        if (lic.number) uniqueChecks.push(findOwnerOf('drugLicense', lic.number).then(o => o && `Drug Licence ${lic.number} already registered with ${o}.`));
      });
    }

    const dupeMessages = (await Promise.all(uniqueChecks)).filter(Boolean);
    if (dupeMessages.length > 0) return res.status(409).json({ message: dupeMessages.join(' ') });

    // ✨ 4. ID GENERATOR (Replaced the while-loop with the Helper)
    const clientId = await getNextClientCode();

    const newClient = new Client({
      clientId,
      establishmentName, businessType, status,
      gstin, pan, aadhaar,
      drugLicenses,
      billingAddress, shippingAddress, city, district, state, pincode, line,
      creditLimit, paymentTermsDays, defaultDiscountPercent,
      contacts: contacts.map(c => ({ ...c, phone: strip91(c.phone) }))
    });

    await newClient.save();

    res.status(201).json({ success: true, data: newClient });

  } catch (err) {
    console.error('createClient error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/clients/:id ─────────────────────────────────────────── */
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Client.findById(id);
    if (!existing) return res.status(404).json({ message: 'Client not found.' });

    const {
      establishmentName, businessType, status,
      gstin, pan, aadhaar,
      drugLicenses,
      billingAddress, shippingAddress, city, district, state, pincode, line,
      creditLimit, paymentTermsDays, defaultDiscountPercent,
      contacts
    } = req.body;

    const errors = [];

    // 1. Mandatory & Format Validation
    if (!establishmentName) errors.push('Establishment Name is required.');
    if (!gstin) errors.push('GSTIN is required.');
    if (gstin && !isValidGSTIN(gstin)) errors.push('Invalid GSTIN format.');
    if (pan && !isValidPAN(pan)) errors.push('Invalid PAN format.');
    if (aadhaar && !isValidAadhaar(aadhaar)) errors.push('Invalid Aadhaar format.');
    if (pincode && !isValidPincode(pincode)) errors.push('Invalid Pincode format.');

    if (!contacts || contacts.length === 0) {
      errors.push('At least one contact is required.');
    } else {
      contacts.forEach((c, i) => {
        if (!c.name || !c.phone) errors.push(`Contact ${i + 1}: Name and phone required.`);
        if (c.phone && !isValidMobile(strip91(c.phone))) errors.push(`Contact ${i + 1}: Invalid mobile.`);
      });
    }

    if (errors.length > 0) return res.status(400).json({ message: errors.join(' ') });

    // 2. Uniqueness Checks (Excluding Self)
    const uniqueChecks = [];
    uniqueChecks.push(findOwnerOf('gstin', gstin, id).then(o => o && `GSTIN already registered with ${o}.`));
    if (pan) uniqueChecks.push(findOwnerOf('pan', pan, id).then(o => o && `PAN already registered with ${o}.`));
    if (aadhaar) uniqueChecks.push(findOwnerOf('aadhaar', aadhaar, id).then(o => o && `Aadhaar already registered with ${o}.`));

    contacts.forEach(c => {
      if (c.phone) uniqueChecks.push(findOwnerOf('phone', c.phone, id).then(o => o && `Phone ${c.phone} already registered with ${o}.`));
    });

    if (drugLicenses && Array.isArray(drugLicenses)) {
      drugLicenses.forEach(lic => {
        if (lic.number) uniqueChecks.push(findOwnerOf('drugLicense', lic.number, id).then(o => o && `Drug Licence ${lic.number} already registered with ${o}.`));
      });
    }

    const dupeMessages = (await Promise.all(uniqueChecks)).filter(Boolean);
    if (dupeMessages.length > 0) return res.status(409).json({ message: dupeMessages.join(' ') });

    // 3. Update fields
    existing.establishmentName = establishmentName;
    existing.businessType = businessType;
    if (status) existing.status = status;
    existing.gstin = gstin;
    existing.pan = pan;
    existing.aadhaar = aadhaar;
    existing.drugLicenses = drugLicenses;
    existing.billingAddress = billingAddress;
    existing.shippingAddress = shippingAddress;
    existing.city = city;
    existing.district = district;
    existing.state = state;
    existing.pincode = pincode;
    existing.line = line;
    existing.creditLimit = creditLimit;
    existing.paymentTermsDays = paymentTermsDays;
    existing.defaultDiscountPercent = defaultDiscountPercent;
    existing.contacts = contacts.map(c => ({ ...c, phone: strip91(c.phone) }));
    existing.updatedBy = req.admin?._id;

    await existing.save();
    res.status(200).json({ success: true, message: 'Client updated successfully', data: existing });

  } catch (err) {
    console.error('updateClient error:', err);
    res.status(500).json({ message: 'Server error while updating client', error: err.message });
  }
};


/* ── Duplicate Checker Endpoint for Frontend ──────────────────────── */
// Expose this in your routes as: router.get('/api/duplicates/check', clientController.checkDuplicate);
exports.checkDuplicate = async (req, res) => {
  try {
    const { field, value } = req.query;
    if (!field || !value) return res.status(400).json({ error: "Field and value required" });

    const owners = [];
    const ownerStr = await findOwnerOf(field, value);

    if (ownerStr) {
      // Parses 'Supplier "Apollo"' into { type: 'Supplier', name: 'Apollo' }
      const type = ownerStr.startsWith('Supplier') ? 'Supplier' : 'Client';
      const name = ownerStr.replace(/^(Supplier|Client) "/, '').replace(/"$/, '');
      owners.push({ type, name });
    }

    res.status(200).json({ exists: owners.length > 0, owners });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ── PRESERVED FUNCTIONS (Do not modify) ──────────────────────────── */
exports.approveClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // ✨ All AWS logic is removed because they were already created 
    // in Cognito during the Registration step! 
    
    // We only need to update MongoDB to unlock their account:
    client.status = 'Active';
    await client.save();

    console.log(`Successfully approved client: ${client.contacts[0].email}`);

    res.json({ success: true, message: 'Client approved successfully.' });

  } catch (err) {
    console.error("Approval Error:", err);
    res.status(500).json({ error: err.message || 'Failed to approve client' }); 
  }
};

exports.rejectClient = async (req, res) => {
  try {
    const { reason } = req.body;
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    client.status = 'Suspended';
    if (reason) client.documentIssues = [reason];
    client.updatedBy = req.admin?._id;
    await client.save();
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateClientStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ALLOWED = ['Pending', 'Active', 'Static', 'Credit Alert', 'Suspended'];
    if (!ALLOWED.includes(status)) return res.status(400).json({ message: `Invalid status: ${status}` });
    const client = await Client.findByIdAndUpdate(req.params.id, { status, updatedBy: req.admin?._id }, { new: true });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getClientInvoices = async (req, res) => {
  try {
    const SalesInvoice = require('../models/SalesInvoice');
    const invoices = await SalesInvoice.find({ clientObjectId: req.params.id }).sort({ invoiceDate: -1 });
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getClientPayments = async (req, res) => {
  try {
    const PaymentReceipt = require('../models/PaymentReceipt');
    const receipts = await PaymentReceipt.find({ clientObjectId: req.params.id }).sort({ paymentDate: -1 });
    res.json({ success: true, data: receipts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getClientOrders = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find({ clientId: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/clients/:id/suspend/request-otp ────────────────────── */
exports.requestSuspendOtp = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    client.suspendOtp = otp;
    client.suspendOtpExpiry = new Date(Date.now() + 10 * 60000); // 10 minutes
    await client.save();

    const adminEmail = req.admin?.email || 'admin@vitalmeds.com'; // Get from token

    const html = `
            <h2>Security Alert: Account Suspension</h2>
            <p>You requested to suspend <b>${client.establishmentName}</b>.</p>
            <p>Your authorization OTP is: <strong style="font-size:24px; color:#ef4444;">${otp}</strong></p>
            <p>Valid for 10 minutes.</p>
        `;

    try {
      await sendMail(adminEmail, `VitalMEDS - Suspend Authorization (${client.clientId})`, html);
    } catch (mailErr) {
      // ✨ If AWS fails or isn't set up, it beautifully prints the OTP in your terminal!
      console.log('\n=============================================');
      console.log(`🔒 DEV OTP GENERATED FOR ${client.establishmentName}: ${otp}`);
      console.log('=============================================\n');
    }

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/clients/:id/suspend/verify-otp ─────────────────────── */
exports.verifySuspendOtp = async (req, res) => {
  try {
    const { otp, reason } = req.body;
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // 1. Debugging: Log what we have vs what we received
    console.log('Received OTP:', otp, 'Stored OTP:', client.suspendOtp);

    // 2. Trim and ensure string comparison
    if (!client.suspendOtp || String(client.suspendOtp).trim() !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid or incorrect OTP.' });
    }

    // 3. Time check
    if (new Date() > new Date(client.suspendOtpExpiry)) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // 4. Perform suspension
    client.status = 'Suspended';
    if (reason) client.documentIssues = [reason];

    // 5. Clear OTP only AFTER success
    client.suspendOtp = undefined;
    client.suspendOtpExpiry = undefined;
    client.updatedBy = req.admin?._id;

    await client.save();
    res.json({ success: true, message: 'Account successfully suspended.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/* ── PUT /api/clients/:id/reactivate ─────────────────────── */
exports.reactivateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    if (client.status !== 'Suspended') {
      return res.status(400).json({ message: 'Only suspended accounts can be reactivated.' });
    }

    // 1. Run all uniqueness checks to ensure no duplicates were created while suspended!
    const uniqueChecks = [];
    if (client.gstin) uniqueChecks.push(findOwnerOf('gstin', client.gstin, id).then(o => o && `GSTIN is now registered with ${o}.`));
    if (client.pan) uniqueChecks.push(findOwnerOf('pan', client.pan, id).then(o => o && `PAN is now registered with ${o}.`));
    if (client.aadhaar || client.aadhaarNumber) {
      const aadharVal = client.aadhaar || client.aadhaarNumber;
      uniqueChecks.push(findOwnerOf('aadhaar', aadharVal, id).then(o => o && `Aadhaar is now registered with ${o}.`));
    }

    client.contacts.forEach(c => {
      if (c.phone) uniqueChecks.push(findPhoneOwner(c.phone, id).then(o => o && `Phone ${c.phone} is now registered with ${o}.`));
    });

    if (client.drugLicenses && Array.isArray(client.drugLicenses)) {
      client.drugLicenses.forEach(lic => {
        // Handle both object format (lic.number) and string format
        const licNum = typeof lic === 'string' ? lic : lic.number;
        if (licNum) uniqueChecks.push(findOwnerOf('drugLicense', licNum, id).then(o => o && `Drug Licence ${licNum} is now registered with ${o}.`));
      });
    }

    const dupeMessages = (await Promise.all(uniqueChecks)).filter(Boolean);
    if (dupeMessages.length > 0) {
      return res.status(409).json({ message: "Cannot reactivate: " + dupeMessages.join(' ') });
    }

    // 2. Clear to reactivate
    client.status = 'Active';
    client.updatedBy = req.admin?._id;
    await client.save();

    res.status(200).json({ success: true, message: 'Account successfully reactivated.', data: client });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};