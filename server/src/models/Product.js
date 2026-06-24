const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true }, // Added required and unique
    company: { type: String, required: true }, // Added required
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }, // Added required! A child MUST have a parent.
    compositions: [{ type: String, trim: true }],          // array of salt strings
    categories: [{ type: String, trim: true }],
    type: { type: String, required: true },
    packing: { type: String, required: true }, // Added required
    hsnCode: { type: String, required: true }, // Added required
    sku: { type: String},
    photoUrl: String,
    description: String,
    usageTips: String,
    gstRate: { type: Number, required: true },
    shortExpiryThreshold: { type: Number, default: 90 },
    lowStockThreshold: { type: Number, default: 50 },
    totalStock: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });
module.exports = mongoose.model('Product', productSchema);