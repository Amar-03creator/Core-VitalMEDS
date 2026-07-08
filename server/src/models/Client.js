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
    businessType: { type: String, enum: ['Retail', 'Wholesale' , 'Hospital', 'Clinic'], required: true },
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
        required: function() { 
            return !this.aadhaarNumber; 
        },
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
}, {
    timestamps: true,
    // Needed so the two virtuals below actually appear in API responses
    // (res.json(client) / JSON.stringify(client) call toJSON() under the hood).
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Index for fast line/city filtering on the Payments tab
clientSchema.index({ line: 1, city: 1 });

/*
 * isApproved / isSuspended — computed, never stored.
 *
 * These exist so the customer-facing frontend (Products page gating,
 * Cart "Order Now" tab access) can read a plain boolean exactly as the
 * UI spec expects, instead of re-deriving it from the status string in
 * five different components. They're virtuals, not persisted fields, so
 * there's no migration and no risk of drifting out of sync with `status`
 * — approveClient / rejectClient / requestSuspendOtp / verifySuspendOtp /
 * reactivateClient in clientController.js don't need to change at all.
 *
 * 'Static' and 'Credit Alert' are deliberately NOT folded in here — they
 * don't gate anything in the customer-facing flow (the credit-limit check
 * there compares totalOutstanding vs creditLimit directly). If you want
 * them as their own derived flags later, add separate virtuals for them
 * rather than overloading these two.
 */
clientSchema.virtual('isApproved').get(function () {
    return this.status === 'Active';
});

clientSchema.virtual('isSuspended').get(function () {
    return this.status === 'Suspended';
});

module.exports = mongoose.model('Client', clientSchema);