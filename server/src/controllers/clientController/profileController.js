// server/src/controllers/clientController/profileController.js
const Client = require('../../models/Client');
const { getNextClientCode } = require('../../helpers/SequenceHelper');
const {
  isValidGSTIN, isValidPAN, isValidAadhaar, isValidDL,
  isValidEmail, isValidMobile, isValidPincode, strip91, findOwnerOf
} = require('./clientHelpers');
const { getDownloadUrl } = require('../../helpers/s3Helper');

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

exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).select('-__v');
    if (!client) return res.status(404).json({ message: 'Client not found' });
    
    // Convert to a plain JS object so we can modify the URLs
    const clientObj = client.toObject();

    // ✨ THE DECRYPTION: Loop through saved URLs and sign them
    if (clientObj.documentUrls) {
      for (const docType of Object.keys(clientObj.documentUrls)) {
        const rawUrlString = clientObj.documentUrls[docType];
        if (rawUrlString) {
          // We split by comma to support the multiple Drug License images we are about to add!
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

exports.createClient = async (req, res) => {
  try {
    const {
      establishmentName, businessType, status,
      gstin, pan, aadhaar, drugLicenses,
      billingAddress, shippingAddress, city, district, state, pincode, line,
      creditLimit, paymentTermsDays, defaultDiscountPercent, contacts
    } = req.body;

    const errors = [];

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

    const clientId = await getNextClientCode();

    const newClient = new Client({
      clientId, establishmentName, businessType, status,
      gstin, pan, aadhaar, drugLicenses,
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

exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Client.findById(id);
    if (!existing) return res.status(404).json({ message: 'Client not found.' });

    const {
      establishmentName, businessType, status,
      gstin, pan, aadhaar, drugLicenses,
      billingAddress, shippingAddress, city, district, state, pincode, line,
      creditLimit, paymentTermsDays, defaultDiscountPercent, contacts
    } = req.body;

    const errors = [];

    if (!establishmentName) errors.push('Establishment Name is required.');
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

    // Duplicate checks – only run if the field has a non‑empty value
    const uniqueChecks = [];
    if (gstin) uniqueChecks.push(findOwnerOf('gstin', gstin, id).then(o => o && `GSTIN already registered with ${o}.`));
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

    // Apply updates – convert empty strings to undefined for optional fields with validators
    existing.establishmentName = establishmentName;
    existing.businessType = businessType;
    if (status) existing.status = status;
    existing.gstin = gstin || undefined;
    existing.pan = pan || undefined;
    existing.aadhaar = aadhaar || undefined;
    existing.pincode = pincode || undefined;
    existing.drugLicenses = drugLicenses || [];
    existing.billingAddress = billingAddress;
    existing.shippingAddress = shippingAddress || undefined;
    existing.city = city;
    existing.district = district;
    existing.state = state;
    existing.line = line || undefined;
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

exports.checkDuplicate = async (req, res) => {
  try {
    const { field, value } = req.query;
    if (!field || !value) return res.status(400).json({ error: "Field and value required" });

    const owners = [];
    const ownerStr = await findOwnerOf(field, value);

    if (ownerStr) {
      const type = ownerStr.startsWith('Supplier') ? 'Supplier' : 'Client';
      const name = ownerStr.replace(/^(Supplier|Client) "/, '').replace(/"$/, '');
      owners.push({ type, name });
    }

    res.status(200).json({ exists: owners.length > 0, owners });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};