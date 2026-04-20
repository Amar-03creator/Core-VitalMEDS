const mongoose = require('mongoose');

const purchaseBillSchema = new mongoose.Schema({
    supplierName: { type: String, required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    supplierGSTIN: { type: String },
    invoiceNumber: { type: String, required: true, unique: true },
    invoiceDate: { type: Date, required: true },
    receivedDate: { type: Date, required: true },
    
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        batchId: { type: mongoose.Schema.Types.ObjectId }, // We will build the Batch model later!
        batchNumber: { type: String, required: true },
        expiryDate: { type: Date, required: true },
        billedQty: { type: Number, required: true },
        freeQty: { type: Number, default: 0 },
        mrp: { type: Number, required: true },
        purchaseRate: { type: Number, required: true },
        taxableValue: { type: Number, required: true },          
        gstAmount: { type: Number, required: true }               
    }],
    
    grossAmount: { type: Number, required: true },
    totalGST: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    
    paymentStatus: {
        type: String,
        enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'ON_HOLD', 'DISPUTED'],
        default: 'UNPAID'
    },
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseBill', purchaseBillSchema);