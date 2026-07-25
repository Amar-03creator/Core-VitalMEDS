// server/src/models/Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  cognitold: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  secondaryEmail: String,                // ★ added
  name: { type: String, required: true },
  phone: String,
  businessName: { type: String, default: 'Mila Agencies' },

  // ── Legal & business info (editable via admin profile) ──
  gstinAdmin: String,
  drugLicense: String,
  aadhaarAdmin: String,                 // ★ added
  panAdmin: String,                     // ★ added
  address: String,

  // The registered proprietor's legal name – immutable once set
  proprietaryName: { type: String, immutable: true },

  // Change history + rate limit for the legal info fields
  legalInfoChanges: [{
    field: String,
    oldValue: String,
    newValue: String,
    changedAt: { type: Date, default: Date.now }
  }],
  legalInfoChangeCount: { type: Number, default: 0 },
  lastLegalInfoChangeDate: Date,
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);