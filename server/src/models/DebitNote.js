const mongoose = require('mongoose');
const debitNoteSchema = new mongoose.Schema({
    debitNoteNumber: { type: String, required: true, unique: true },
    seq: Number,
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    originalPurchaseInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseBill' },
    supplierName: String,
    returnDate: { type: Date, required: true },
    itemsReturned: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
        batchNumber: String,
        lotAllocations: [{ purchaseInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseBill' }, qty: Number }],
        qtyReturned: Number, purchaseRate: Number
    }],
    totalRefundExpected: Number,
    status: { type: String, enum: ['Pending Adjustment', 'Adjusted'], default: 'Pending Adjustment' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });
module.exports = mongoose.model('DebitNote', debitNoteSchema);