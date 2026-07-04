const mongoose = require('mongoose');

// ★ NEW — mirrors SalesInvoice.paymentHistory so we can FIFO-allocate payments
// made to a supplier against their oldest unpaid purchase bills.
// (This is a pure addition — it didn't exist on the old schema at all,
// so it can't conflict with anything that already worked.)
const paymentHistorySchema = new mongoose.Schema({
    receiptId:  { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierPaymentReceipt' },
    amountPaid: { type: Number, required: true },
    datePaid:   { type: Date, default: Date.now },
}, { _id: false });

const purchaseBillSchema = new mongoose.Schema({
    supplierName: { type: String, required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    supplierGSTIN: { type: String },
    invoiceNumber: { type: String, required: true, unique: true },
    billType: { type: String, enum: ['Cash', 'Credit'], default: 'Credit' },
    invoiceDate: { type: Date, required: true },
    receivedDate: { type: Date, required: true },
    purchaseType: { type: String, enum: ['intrastate', 'interstate'], default: 'intrastate' },

    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            productName: { type: String, required: true },
            batchId: { type: mongoose.Schema.Types.ObjectId },
            batchNumber: { type: String, required: true },
            expiryDate: { type: Date, required: true },
            billedQty: { type: Number, required: true },
            freeQty: { type: Number, default: 0 },
            mrp: { type: Number, required: true },
            purchaseRate: { type: Number, required: true },
            ptr: { type: Number },
            discountPercent: { type: Number, default: 0 },
            discountAmount: { type: Number, default: 0 },
            cgstPercent: { type: Number, default: 0 },
            sgstPercent: { type: Number, default: 0 },
            igstPercent: { type: Number, default: 0 },
            taxableValue: { type: Number },
            gstAmount: { type: Number },
            lineTotal: { type: Number },
        },
    ],

    // Bill-level discount
    billDiscountPercent: { type: Number, default: 0 },
    billDiscountAmount: { type: Number, default: 0 },

    // GST breakdown (array of slabs)
    gstBreakdown: [
        {
            rateLabel: { type: String },
            taxableAmount: { type: Number },
            cgst: { type: Number, default: 0 },
            sgst: { type: Number, default: 0 },
            igst: { type: Number, default: 0 },
        }
    ],

    grossAmount: { type: Number, required: true },
    totalGST: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    roundOff: { type: Number, default: 0 },

    paymentStatus: {
        type: String,
        enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'ON_HOLD', 'DISPUTED'],
        default: 'UNPAID',
    },

    // ★ NEW — additive only. Absent on every document that existed before
    // this change; default: 0 means old docs read these as 0, not undefined,
    // and nothing pre-existing ever reads/writes these fields, so there's
    // no behavior change for any code that doesn't explicitly use them.
    dueAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    paymentHistory: [paymentHistorySchema],

    // ★ NEW — additive only, same reasoning as above.
    isCancelled: { type: Boolean, default: false },
    cancelReason: { type: String },
    cancelledAt: { type: Date },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

// ★ NEW — safety net only. Only fires when netAmount or paidAmount is
// explicitly modified; on a plain create() through your existing
// createPurchaseBill controller, dueAmount is being set directly anyway,
// so this hook is a no-op there. It only matters for the new payment-
// recording flow (recordPurchasePayment) and won't touch documents that
// don't modify these two fields.
// ★ FIX: Switched to async function and removed 'next' to prevent kareem crash
purchaseBillSchema.pre('save', async function () {
    if (this.isModified('netAmount') || this.isModified('paidAmount')) {
        this.dueAmount = Math.max(0, (this.netAmount || 0) - (this.paidAmount || 0));
    }
});

module.exports = mongoose.model('PurchaseBill', purchaseBillSchema);

module.exports = mongoose.model('PurchaseBill', purchaseBillSchema);