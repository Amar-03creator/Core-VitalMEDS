// server/src/models/Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  cognitold: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  phone: String,
  businessName: { type: String, default: 'Mila Agencies' },
  gstinAdmin: String,
  drugLicense: String,
  address: String,
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);