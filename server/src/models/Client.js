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
        cognitoId: String, // Links to AWS Cognito for login later
        phone: { type: String, required: true },
        email: String,
        isPrimary: { type: Boolean, default: false },
        role: String,
        prefersWhatsApp: { type: Boolean, default: true }
    }],

    billingAddress: { type: String, required: true },
    shippingAddress: String,
    city: { type: String, required: true },
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
    drugLicense20B: String,
    drugLicense21B: String,

    documentsVerified: { type: Boolean, default: false },
    documentUrls: {
        gstCert: String,
        dlCert: String
    },
    documentsVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    documentsVerifiedAt: Date,
    documentIssues: [String],

    creditLimit: { type: Number, default: 0 },  // Maximum credit allowed by company policy
    paymentTermsDays: { type: Number, default: 0 },  // Number of days allowed for payment after invoice date set by company policy
    defaultDiscountPercent: { type: Number, default: 0 },
    creditScore: Number,// Calculated based on payment history, outstanding amounts, and other factors 

    totalOutstanding: { type: Number, default: 0 },
    outstandingDays: Number,      // Average number of days invoices remain unpaid, calculated from payment history
    creditBalance: { type: Number, default: 0 },
    averagePaymentTime: Number, // in days, calculated from payment history    
    riskTier: { type: String, enum: ['Green', 'Yellow', 'Red'], default: 'Green' },
    partyTier: { type: String, enum: ['Diamond', 'Platinum', 'Gold', 'Silver'], default: 'Silver' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);