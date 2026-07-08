const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    company: { type: String, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    compositions: [{ type: String, trim: true }],      // array of salt strings
    categories: [{ type: String, trim: true }],
    type: { type: String, required: true },
    packing: { type: String, required: true },
    hsnCode: { type: String, required: true },
    sku: { type: String },
    photoUrl: String,
    description: String,
    usageTips: String,
    gstRate: { type: Number, required: true },
    shortExpiryThreshold: { type: Number, default: 90 },
    lowStockThreshold: { type: Number, default: 50 },

    /*
     * criticalStockThresholdPercent — % of lowStockThreshold below which
     * stock is considered "Critical" and the exact remaining qty is
     * allowed to be disclosed to clients (per the Cart/Inquiry doc,
     * Section C). Default 50, admin-configurable per product.
     * e.g. lowStockThreshold: 50, criticalStockThresholdPercent: 50
     *   → critical when totalStock <= 25.
     */
    criticalStockThresholdPercent: { type: Number, default: 50 },

    totalStock: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);