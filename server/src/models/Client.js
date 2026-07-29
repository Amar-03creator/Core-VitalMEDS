// server/src/models/Client.js
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
    businessType: { type: String, enum: ['Retail', 'Wholesale', 'Hospital / Clinic'], required: true },
    status: {
        type: String,
        enum: ['Pending', 'Active', 'Static', 'Credit Alert', 'Suspended'],
        default: 'Pending'
    },
    suspendOtp: String,
    suspendOtpExpiry: Date,
    deliveryRoute: String,

    /*
     * lastInquiryDate — calendar date this client last submitted an inquiry.
     * Enforces "one inquiry per day". Reset to null when a Pending, 
     * not-yet-Viewed inquiry is deleted.
     */
    lastInquiryDate: Date,

    /*
     * line — the sales route/territory this client belongs to.
     * Used by the Payments tab filter.
     */
    line: { type: String, trim: true },

    contacts: [{
        name: { type: String, required: true },
        cognitoId: String,
        phone: { type: String },
        email: String,
        designation: {
            type: String,
            enum: ['Owner', 'Proprietor', 'Manager', 'Partner'],
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
        unique: true,
        sparse: true, // ✨ FIX: Use sparse so empty strings don't trigger duplicate errors
        uppercase: true,
        minlength: 15,
        maxlength: 15
    },
    panNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    aadhaarNumber: {
        type: String,
        minlength: 12,
        maxlength: 12
    },

    // ✨ NEW: Dynamic Array for Drug Licenses (Replaces 20B/21B)
    drugLicenses: [{
        type: String,
        trim: true,
        uppercase: true
    }],

    documentsUploaded: { type: Boolean, default: false },


    documentsVerified: { type: Boolean, default: false },
    documentUrls: {
        gstCert: String,
        dlCert: String,
        aadhaarCard: String,
        panCard: String
    },
    documentsVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    documentsVerifiedAt: Date,

    // Used to store the reason an ACCOUNT was suspended/rejected. 
    documentIssues: [String],

    // ── Per-document verification status (admin-set, one flag per type) ──
    documentVerification: {
        gstCert: { type: Boolean, default: false },
        dlCert: { type: Boolean, default: false },
        aadhaarCard: { type: Boolean, default: false },
        panCard: { type: Boolean, default: false }
    },

    // ── Has this document type ever been uploaded? ──
    documentFirstUploaded: {
        gstCert: { type: Boolean, default: false },
        dlCert: { type: Boolean, default: false },
        aadhaarCard: { type: Boolean, default: false },
        panCard: { type: Boolean, default: false }
    },

    // ✨ BEST OF BOTH WORLDS: Embedded Document Requests ✨
    documentRequests: [{
        documentType: { type: String, enum: ['gstCert', 'dlCert', 'aadhaarCard', 'panCard', 'other'], default: 'other' },
        message: { type: String, required: true }, // The message/reason shown to the client
        isActive: { type: Boolean, default: true }, // Client only sees isActive: true
        status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed', 'dismissed'], default: 'pending' },
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
        requestedAt: { type: Date, default: Date.now },

        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
        approvedAt: Date,

        resolvedAt: Date, // When swept up or dismissed
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
        resolutionReason: { type: String, enum: ['dismissed', 'client_approved', 'uploaded'] },

        rejectionNote: String,
        completedAt: Date,
        newFileKey: String,
        oldFileKey: String
    }],

    accountApprovedAt: Date,
    businessTypeChangedAt: Date,

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

    inviteCode: {
        type: String,
        unique: true,
        sparse: true,
    },
    inviteCodeExpiry: Date,
    isClaimed: {
        type: Boolean,
        default: false
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

clientSchema.index({ line: 1, city: 1 });

clientSchema.virtual('isApproved').get(function () {
    return this.status === 'Active';
});

clientSchema.virtual('isSuspended').get(function () {
    return this.status === 'Suspended';
});

module.exports = mongoose.model('Client', clientSchema);