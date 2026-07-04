const mongoose = require('mongoose');

const lotAllocationSchema = new mongoose.Schema({
    purchaseInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseBill', required: true },
    invoiceNumber:       { type: String },
    qty:                  { type: Number, required: true },
}, { _id: false });

const itemReturnedSchema = new mongoose.Schema({
    productId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName:     { type: String },
    batchId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    batchNumber:      { type: String, required: true },
    reason:           { type: String, enum: ['Expired', 'Damaged', 'Wrong Item', 'Other'], default: 'Other' },
    lotAllocations:   [lotAllocationSchema],
    qtyReturned:       { type: Number, required: true },
    purchaseRate:      { type: Number, required: true }, // weighted avg if spread across multiple lots
    refundAmount:       { type: Number, required: true }, // qtyReturned * purchaseRate for this item
}, { _id: false });

const debitNoteSchema = new mongoose.Schema({
    debitNoteNumber: { type: String, required: true, unique: true }, // e.g. "DN-0001"
    seq:             { type: Number, required: true },

    supplierId:                { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    supplierName:               { type: String, required: true },
    originalPurchaseInvoiceId:  { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseBill' }, // primary/most-recent source bill, for quick display

    returnDate:      { type: Date, default: Date.now },
    itemsReturned:   [itemReturnedSchema],

    totalRefundExpected: { type: Number, required: true },

    status: {
        type: String,
        enum: ['Pending Adjustment', 'Adjusted'],
        default: 'Pending Adjustment',
    },
    adjustedAt:   { type: Date },
    adjustedNote: { type: String }, // e.g. "Adjusted against bill PB-2025-040"

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

module.exports = mongoose.model('DebitNote', debitNoteSchema);