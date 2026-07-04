// src/models/Client.js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    establishmentName: { type: String, required: true },
    clientId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        match: /^[0-9A-Z]{3}$/,
    },
    businessType: { type: String, enum: ['Retail', 'Hospital', 'Clinic'], required: true },
    status: {
        type: String,
        enum: ['Pending', 'Active', 'Static', 'Credit Alert', 'Suspended'],
        default: 'Pending'
    },
    suspendOtp: String,
    suspendOtpExpiry: Date,
    deliveryRoute: String,

    /*
     * line — the sales route/territory this client belongs to (e.g.
     * "Line 1", "Berhampur Town", "North Route"). Used by the Payments
     * tab filter: selecting a line narrows the City dropdown to only
     * cities that exist on that line, and narrows the Party dropdown
     * to only clients on that line (optionally further narrowed by city).
     */
    line: { type: String, trim: true },

    contacts: [{
        name: { type: String, required: true },
        cognitoId: String,
        phone: { type: String },
        email: String,
        designation: {
            type: String,
            enum: ['Owner', 'Proprietor', 'Manager', 'Partner', 'Staff'],
            required: true
        },
        isPrimary: { type: Boolean, default: false },
        prefersWhatsApp: { type: Boolean, default: true }
    }],

    billingAddress: { type: String, required: true },
    shippingAddress: String,
    city: { type: String, required: true },
    district: { type: String, required: true },
    pincode: { type: String, required: true },

    gstin: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        minlength: 15,
        maxlength: 15
    },
    panNumber: String,
    aadhaarNumber: {
        type: String,
        minlength: 12,
        maxlength: 12
    },
    drugLicense20B: String,
    drugLicense21B: String,

    documentsVerified: { type: Boolean, default: false },
    documentUrls: {
        gstCert: String,
        dlCert: String,
        aadhaarCard: String
    },
    documentsVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    documentsVerifiedAt: Date,
    documentIssues: [String],

    creditLimit: { type: Number, default: 0 },
    paymentTermsDays: { type: Number, default: 0 },
    defaultDiscountPercent: { type: Number, default: 0 },
    creditScore: Number,

    totalOutstanding: { type: Number, default: 0 },
    outstandingDays: Number,
    outstandingDate: { type: Date },
    creditBalance: { type: Number, default: 0 },
    averagePaymentTime: Number,
    riskTier: { type: String, enum: ['Green', 'Yellow', 'Red'], default: 'Green' },
    partyTier: { type: String, enum: ['Diamond', 'Platinum', 'Gold', 'Silver'], default: 'Silver' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

// Index for fast line/city filtering on the Payments tab
clientSchema.index({ line: 1, city: 1 });

module.exports = mongoose.model('Client', clientSchema);