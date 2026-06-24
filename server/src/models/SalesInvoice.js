const mongoose = require('mongoose');

const lotConsumptionSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  lotId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  qty:     { type: Number, required: true, min: 0 },
}, { _id: false });

const salesInvoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    seq: { type: Number },
    orderObjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    clientObjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },

    clientName: { type: String, required: true },
    clientGSTIN: { type: String },
    clientBillingAddress: { type: String },
    clientDrugLicense: { type: String },

    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date },
    billType: { type: String, enum: ['Cash', 'Credit'], required: true },

    invoiceStatus: {
        type: String,
        enum: ['DRAFT', 'FINALIZED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
        default: 'FINALIZED'
    },

    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        companyShortCode: { type: String },
        batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },

        productName: { type: String, required: true },
        companyShortCode: { type: String },
        batchNumber: { type: String, required: true },
        packing: { type: String },
        hsn: { type: String },
        expiryDate: { type: Date, required: true },
        mrp: { type: Number, required: true },

        billedQty: { type: Number, required: true },
        chargeableQty: { type: Number, required: true },
        freeQty: { type: Number, default: 0 },
        rate: { type: Number, required: true },

        grossAmount: { type: Number, required: true },
        discountPercent: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        taxableValue: { type: Number, required: true },
        cgst: { type: Number, default: 0 },
        sgst: { type: Number, default: 0 },
        igst: { type: Number, default: 0 },   // ★ new
        lineTotal: { type: Number, required: true },

        lotConsumption: [lotConsumptionSchema],
    }],

    dispatchDetails: {
        transportMode: String,
        vehicleNumber: String,
        lrNumber: String
    },

    totalGrossAmount: { type: Number, required: true },
    totalTaxable: { type: Number, required: true },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },    // ★ new
    totalGST: { type: Number, required: true },
    roundOff: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },

    globalDiscountPercent: { type: Number, default: 0 },
    globalDiscountAmount: { type: Number, default: 0 },

    previousOutstanding: { type: Number, default: 0 },
    previousOutstandingDate: { type: Date },
    totalPayable: { type: Number, required: true },
    creditApplied: { type: Number, default: 0 },
    dueAmount: { type: Number, required: true },
    paymentStatus: {
        type: String,
        enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'ON_HOLD', 'DISPUTED'],
        default: 'UNPAID'
    }
}, { timestamps: true });

module.exports = mongoose.model('SalesInvoice', salesInvoiceSchema);