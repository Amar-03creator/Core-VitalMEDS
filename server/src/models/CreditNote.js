const mongoose = require('mongoose');
const creditNoteSchema = new mongoose.Schema({
    creditNoteNumber: { type: String, required: true, unique: true },
    seq: Number,
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    originalInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesInvoice' },
    returnDate: { type: Date, required: true },
    itemsReturned: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
        batchNumber: String, qtyReturned: Number, unitPrice: Number, refundAmount: Number
    }],
    totalRefund: Number, reason: String,
    status: { type: String, enum: ['Pending', 'Applied'], default: 'Pending' },
    appliedToInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesInvoice' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });
module.exports = mongoose.model('CreditNote', creditNoteSchema);