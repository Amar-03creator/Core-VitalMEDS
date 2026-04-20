const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }, // Added for speed!
    companyName: { type: String, required: true }, // Added for speed!
    
    batchNumber: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    mrp: { type: Number, required: true },
    sellingRate: { type: Number, required: true },             
    sellingRateShortExpiry: { type: Number },  
    shortExpiryThreshold: { type: Number, default: 90 },
    
    totalStockQuantity: { type: Number, default: 0 },      
    isActive: { type: Boolean, default: true },
    nearExpiry: { type: Boolean, default: false },              
    
    purchaseLots: [{
        purchaseInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseBill' },
        invoiceNumber: { type: String },
        dateReceived: { type: Date },
        originalQty: { type: Number },
        remainingQty: { type: Number }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Batch', batchSchema);