const Company = require('../models/Company');
const Client  = require('../models/Client');

/**
 * checkDuplicate
 * Checks whether a given field value already exists in Company or Client collections.
 *
 * Supported fields: gstin, pan, aadhaar, shortCode, drugsBazaarId
 *
 * GET /api/duplicates/check?field=gstin&value=27AAPFU0939F1ZV
 */
exports.checkDuplicate = async (req, res) => {
  try {
    const { field, value } = req.query;

    if (!field || !value) {
      return res.status(400).json({ message: 'field and value are required' });
    }

    // Only allow safe, known unique-identifier fields to prevent arbitrary DB queries
    const ALLOWED_FIELDS = ['name', 'gstin', 'pan', 'aadhaar', 'shortCode', 'drugsBazaarId'];
    if (!ALLOWED_FIELDS.includes(field)) {
      return res.status(400).json({ message: `Duplicate check not supported for field: ${field}` });
    }

    const owners = [];

    // Search companies (suppliers)
    const companies = await Company.find({
      [field]: { $regex: `^${value}$`, $options: 'i' },   // exact, case-insensitive
    });
    companies.forEach(c => owners.push({ name: c.companyName, type: 'Supplier' }));

    // Search clients
    const clients = await Client.find({
      [field]: { $regex: `^${value}$`, $options: 'i' },
    });
    clients.forEach(c => owners.push({ name: c.establishmentName, type: 'Client' }));

    res.json({ exists: owners.length > 0, owners });
  } catch (error) {
    console.error('checkDuplicate error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * checkPhone
 * Checks whether a phone number already exists in Company or Client collections.
 * Searches: whatsapp, phone, and representative phone fields.
 *
 * GET /api/phones/check?phone=9876543210
 */
exports.checkPhone = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ message: 'phone is required' });
    }

    // Strip +91 prefix if present
    const normalised = phone.replace(/^\+91/, '').replace(/\D/g, '');

    if (!normalised) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    const owners = [];

    // Search companies — top-level whatsapp / phone fields + nested rep phones
    const companies = await Company.find({
      $or: [
        { whatsapp: normalised },
        { phone:    normalised },
        { 'representatives.phone': normalised },
      ],
    });
    companies.forEach(c => owners.push({ name: c.companyName, type: 'Supplier' }));

    // Search clients — adjust field names to match your Client schema
    const clients = await Client.find({
      $or: [
        { phone:    normalised },
        { whatsapp: normalised },
        { 'representatives.phone': normalised },
      ],
    });
    clients.forEach(c => owners.push({ name: c.establishmentName, type: 'Client' }));

    res.json({ exists: owners.length > 0, owners });
  } catch (error) {
    console.error('checkPhone error:', error);
    res.status(500).json({ message: error.message });
  }
};