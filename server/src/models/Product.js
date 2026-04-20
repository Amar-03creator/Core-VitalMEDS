const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true }, // Added required
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }, // Added required! A child MUST have a parent.
    composition: { type: String, required: true }, // Added required
    category: { type: String, required: true }, // Added required
    type: { type: String, required: true }, // Added required
    packing: { type: String, required: true }, // Added required
    hsnCode: { type: String, required: true }, // Added required
    sku: { type: String, required: true }, // Added required
    
    // Optional fields (You might want to keep photo/description optional so the form doesn't block if he doesn't have a picture yet)
    photoUrl: String, 
    description: String, 
    usageTips: String,
    
    gstRate: { type: Number, required: true },
    
    // --- SYSTEM & DEFAULTS (DO NOT MAKE REQUIRED) ---
    // Mongoose handles these automatically. The user doesn't need to type them.
    shortExpiryThreshold: { type: Number, default: 90 },
    lowStockThreshold: { type: Number, default: 50 },
    totalStock: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });
module.exports = mongoose.model('Product', productSchema);