const mongoose = require('mongoose');
const inquirySchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    status: { type: String, enum: ['Pending', 'Seen', 'Quoted', 'Changes Requested', 'Final Quote', 'Accepted', 'Rejected'], default: 'Pending' },
    isLockedForEditing: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    isFinalQuote: { type: Boolean, default: false },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        requestedQty: Number,
        addedByAdmin: { type: Boolean, default: false },
        quoteBreakdown: [{
            batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
            mrp: Number, adminOfferedPTR: Number, chargeableQty: Number, freeQty: Number
        }],
        estimatedLineTotal: Number
    }],
    discountPercent: { type: Number, default: 0 },
    discountReason: String, totalPrice: Number, discountedTotalPrice: Number,
    priceVarianceDisclaimer: { type: Boolean, default: false },
    clientRemarks: String, adminRemarks: String,
    billPreference: { type: String, enum: ['Cash', 'Credit'] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });
module.exports = mongoose.model('Inquiry', inquirySchema);