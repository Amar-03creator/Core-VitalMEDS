// server/src/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    inquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inquiry', default: null },
    source: { type: String, default: 'direct' },

    isCancellable: { type: Boolean, default: true },
    adminCancelReason: String,
    clientCancelReason: String,

    status: {
        type: String,
        enum: ['Placed', 'Editing', 'Confirmed', 'Invoiced', 'Packed', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Placed'
    },
    
    previousStatus: String,

    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        requestedQty: Number,
        finalQty: Number,
        chargeableQty: Number,
        freeQty: Number,

        mrp: Number,
        expiryDate: Date,
        offerDescription: { type: String, default: '' }, // ✨ ADDED: Immutable snapshot of the scheme

        finalPrice: Number, // Unit PTR (Rate)
        grossAmount: Number, // PTR * chargeableQty
        
        // Discount tracking
        discountType: { type: String, enum: ['percent', 'amount'], default: 'percent' },
        discountValue: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        
        taxableValue: Number, // Gross - Discount
        
        // GST tracking
        gstRate: { type: Number, default: 0 },
        gstAmount: { type: Number, default: 0 },
        
        lineTotal: Number, // Taxable + GST

        plannedBatches: [{
            batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
            chargeableQty: Number,
            freeQty: Number
        }]
    }],

    // ✨ NEW: Global bill discount tracking carried over from Inquiry/Cart
    discountType: { type: String, enum: ['percent', 'amount'], default: 'percent' },
    discountValue: { type: Number, default: 0 },
    discountReason: String,

    estimatedOrderTotal: Number,
    finalInvoiceAmount: Number,
    invoiceDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesInvoice' },
    invoiceNumber: String,
    invoiceBillType: { type: String, enum: ['Cash', 'Credit'] },
    expectedDelivery: Date,

    dispatchDetails: {
        transportMode: String,
        vehicleNumber: String,
        lrNumber: String,
        courierName: String,
        trackingId: String,
        trackingUrl: String,
    },
    shippedAt: Date,
    deliveredAt: Date,

    billPreference: { type: String, enum: ['Cash', 'Credit'] },
    clientNote: String,
    adminNote: String,
    
    editWindowExpiresAt: Date,
    pricingSharedAt: Date,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

    actionLogs: [{
        action: String, 
        byName: String, 
        role: String,   
        timestamp: { type: Date, default: Date.now },
        note: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);