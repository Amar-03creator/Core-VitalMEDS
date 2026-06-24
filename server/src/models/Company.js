const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    // --- Basic Info ---
    companyName: { type: String, required: true },
    shortCode: { type: String },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    },

    // --- Representatives ---
    representatives: [
        {
            name: { type: String, required: true },
            role: { type: String },
            phone: { type: String },
            email: { type: String },
        },
    ],

    // --- Legal & Tax ---
    gstin: { type: String },
    pan: { type: String },
    drugLicenses: [{ type: String }],
    drugLicenseExpiry: { type: Date },

    // --- Contact Details ---
    email: { type: String },
    whatsapp: { type: String },
    phone: { type: String },

    // --- Address ---
    billingAddress: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },

    // --- Additional IDs ---
    aadhaar: { type: String },
    drugsBazaarId: { type: String },

    // --- Procurement Settings ---
    leadTimeDays: { type: Number },
    minimumOrderValue: { type: Number },

    // --- Financial Tracking ---
    pendingRefunds: { type: Number, default: 0 },
    advancePaid: { type: Number, default: 0 },

    // ★ NEW – Bank Details
    bankDetails: [
        {
            bankName:      { type: String, required: true },
            accountNumber: { type: String, required: true },
            ifscCode:      { type: String, required: true },
            branch:        { type: String, required: true },
        },
    ],

    // --- System Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);