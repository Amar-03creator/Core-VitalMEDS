const mongoose = require('mongoose');

const purchaseLotSchema = new mongoose.Schema({
    purchaseInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseBill', required: true },
    invoiceNumber: { type: String, required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    dateReceived: { type: Date, required: true },
    purchaseRate: { type: Number, required: true },
    mrp: { type: Number, required: true },
    originalQty: { type: Number, required: true },
    remainingQty: { type: Number, required: true },
}, { _id: true });

const batchSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    productName: { type: String },
    companyName: { type: String, required: true },

    batchNumber: { type: String, required: true },
    expiryDate: { type: Date, required: true },

    mrp: { type: Number, required: true },
    sellingRate: { type: Number, required: true },
    sellingRateShortExpiry: { type: Number },
    shortExpiryThreshold: { type: Number, default: 90 },

    totalStockQuantity: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    nearExpiry: { type: Boolean, default: false },

    purchaseLots: [purchaseLotSchema],
}, { timestamps: true });

batchSchema.index({ productId: 1, batchNumber: 1, companyId: 1 }, { unique: true });

batchSchema.pre('save', function (next) {
    if (this.expiryDate) {
        const daysToExpiry = Math.ceil((this.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        this.nearExpiry = daysToExpiry <= (this.shortExpiryThreshold || 90);
    }
});

module.exports = mongoose.model('Batch', batchSchema);