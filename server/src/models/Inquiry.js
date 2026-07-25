// server/src/models/Inquiry.js
const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
    inquiryId: { type: String, unique: true, sparse: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    
    status: { 
        type: String, 
        enum: ['Pending', 'Viewed', 'Quoted', 'Accepted', 'Rejected'], 
        default: 'Pending' 
    },

    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        requestedQty: Number,

        mrp: Number,
        expiryDate: Date,
        
        // ✨ NEW: Values calculated and saved at creation time
        fallbackMrp: Number,
        estPTR: Number,
        
        adminOfferedPTR: Number,
        chargeableQty: Number,
        freeQty: { type: Number, default: 0 },
        offerBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
        offerDescription: { type: String, default: '' }, // ✨ ADDED: Snapshotted Scheme Info
        
        discountType: { type: String, enum: ['percent', 'amount'], default: 'percent' },
        discountValue: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },

        estimatedLineTotal: Number,
    }],

    discountType: { type: String, enum: ['percent', 'amount'], default: 'percent' },
    discountPercent: { type: Number, default: 0 }, 
    discountValue: { type: Number, default: 0 },
    discountReason: String, 
    
    totalPrice: Number, 
    discountedTotalPrice: Number,

    clientRemarks: String,   
    adminRemarks: String,    
    clientNote: String,      
    rejectionReason: String, 
    rejectedBy: { type: String, enum: ['admin', 'client'] },

    billPreference: { type: String, enum: ['Cash', 'Credit'] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

inquirySchema.virtual('linkedOrder', {
    ref: 'Order',
    localField: '_id',
    foreignField: 'inquiryId',
    justOne: true,
});

module.exports = mongoose.model('Inquiry', inquirySchema);