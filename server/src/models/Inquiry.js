const mongoose = require('mongoose');
const inquirySchema = new mongoose.Schema({
    // Human-readable ID, same Counter pattern as Order.orderId (see
    // inquiryController.nextInquiryId). Kept optional/sparse so existing
    // documents created before this field existed don't fail validation.
    inquiryId: { type: String, unique: true, sparse: true },

    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    /*
     * 'Cancelled' is distinct from 'Rejected' on purpose — a client
     * backing out before any quote exists reads very differently from
     * an admin/client rejecting a quote after review, and the client UI
     * shows them with different badges/copy. See cancelInquiry below.
     */
    status: { type: String, enum: ['Pending', 'Seen', 'Quoted', 'Changes Requested', 'Final Quote', 'Accepted', 'Rejected', 'Cancelled'], default: 'Pending' },
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

/*
 * linkedOrder — virtual populate, not a stored field. Order.inquiryId
 * already points at the Inquiry that spawned it; this just lets us walk
 * that pointer backwards (Inquiry -> Order) without a second round-trip
 * query in the controller. Populate with .populate('linkedOrder', '...').
 */
inquirySchema.virtual('linkedOrder', {
    ref: 'Order',
    localField: '_id',
    foreignField: 'inquiryId',
    justOne: true,
});

module.exports = mongoose.model('Inquiry', inquirySchema);