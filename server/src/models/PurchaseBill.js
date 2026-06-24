const mongoose = require('mongoose');

const purchaseBillSchema = new mongoose.Schema({
    supplierName: { type: String, required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    supplierGSTIN: { type: String },                         // ★ will be null when not provided
    invoiceNumber: { type: String, required: true, unique: true },
    billType: { type: String, enum: ['Cash', 'Credit'], default: 'Credit' },
    invoiceDate: { type: Date, required: true },
    receivedDate: { type: Date, required: true },
    purchaseType: { type: String, enum: ['intrastate', 'interstate'], default: 'intrastate' },  // ★ renamed

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

    // Bill‑level discount
    billDiscountPercent: { type: Number, default: 0 },
    billDiscountAmount: { type: Number, default: 0 },

    // GST breakdown (array of slabs)
    gstBreakdown: [
        {
            rateLabel: { type: String },       // e.g. "CGST+SGST 12.0%"
            taxableAmount: { type: Number },
            cgst: { type: Number, default: 0 },
            sgst: { type: Number, default: 0 },
            igst: { type: Number, default: 0 },
        }
    ],

    grossAmount: { type: Number, required: true },
    totalGST: { type: Number, required: true },          // ★ still present as total
    netAmount: { type: Number, required: true },
    roundOff: { type: Number, default: 0 },

    paymentStatus: {
        type: String,
        enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'ON_HOLD', 'DISPUTED'],
        default: 'UNPAID',
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

module.exports = mongoose.model('PurchaseBill', purchaseBillSchema);