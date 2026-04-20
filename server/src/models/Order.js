const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    inquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inquiry', default: null },
    isCancellable: { type: Boolean, default: true },
    adminCancelReason: String, clientCancelReason: String,
    status: { type: String, enum: ['Placed', 'Confirmed', 'Invoiced', 'Shipped', 'Delivered', 'Cancelled'], default: 'Placed' },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        finalQty: Number, chargeableQty: Number, freeQty: Number, finalPrice: Number,
        plannedBatches: [{
            batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
            chargeableQty: Number, freeQty: Number
        }]
    }],
    estimatedOrderTotal: Number, finalInvoiceAmount: Number,
    invoiceDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesInvoice' },
    invoiceNumber: String, expectedDelivery: Date,
    billPreference: { type: String, enum: ['Cash', 'Credit'] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });
module.exports = mongoose.model('Order', orderSchema);