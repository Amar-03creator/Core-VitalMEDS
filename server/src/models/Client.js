// src/models/Client.js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    establishmentName: { type: String, required: true },
    clientId: { type: String, required: true, unique: true }, // e.g., "CUST-1042"
    businessType: { type: String, enum: ['Retail', 'Hospital', 'Clinic'], required: true },
    status: {
        type: String,
        enum: ['Pending', 'Active', 'Static', 'Credit Alert', 'Suspended'],
        default: 'Pending'
    },
    deliveryRoute: String,

    contacts: [{
        name: { type: String, required: true },
        cognitoId: String, // Links to AWS Cognito for login later. NO PASSWORDS HERE!
        phone: { type: String, required: true },
        email: String,
        // The new designation field with specific roles
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
    district: { type: String, required: true }, // New Field
    pincode: { type: String, required: true },

    gstin: {
        type: String,
        required: true,
        unique: true,
        uppercase: true, // Forces GSTIN to always be uppercase
        minlength: 15,
        maxlength: 15
    },
    panNumber: String,
    // New Aadhaar Field with basic validation
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
        aadhaarCard: String // Added a slot for the uploaded Aadhaar image
    },
    documentsVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    documentsVerifiedAt: Date,
    documentIssues: [String],

    creditLimit: { type: Number, default: 0 },  // Maximum credit allowed by company policy
    paymentTermsDays: { type: Number, default: 0 },  // Number of days allowed for payment after invoice date
    defaultDiscountPercent: { type: Number, default: 0 },
    creditScore: Number, // Calculated by our 0-100 algorithm

    totalOutstanding: { type: Number, default: 0 },
    outstandingDays: Number,      
    creditBalance: { type: Number, default: 0 },
    averagePaymentTime: Number,     
    riskTier: { type: String, enum: ['Green', 'Yellow', 'Red'], default: 'Green' },
    partyTier: { type: String, enum: ['Diamond', 'Platinum', 'Gold', 'Silver'], default: 'Silver' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);