const mongoose = require('mongoose');

const salesInvoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    seq: { type: Number }, // Auto-incremented sequence
    orderObjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // OPTIONAL!
    clientObjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    clientName: { type: String, required: true }, // Denormalized for speed
    clientGSTIN: { type: String },
    
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date },
    billType: { type: String, enum: ['Cash', 'Credit'], required: true },
    
    // THE LIFECYCLE TWEAK
    invoiceStatus: { 
        type: String, 
        enum: ['DRAFT', 'FINALIZED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
        default: 'FINALIZED' // Defaulting to finalized for our immediate math testing
    },

    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
        
        // Frozen master & batch data (Historical Integrity)
        productName: { type: String, required: true },
        batchNumber: { type: String, required: true },
        packing: { type: String },
        hsn: { type: String },
        expiryDate: { type: Date, required: true },
        mrp: { type: Number, required: true },
        
        // Quantities & rates
        billedQty: { type: Number, required: true }, // chargeableQty + freeQty
        chargeableQty: { type: Number, required: true },
        freeQty: { type: Number, default: 0 },
        rate: { type: Number, required: true },
        
        // Pre-tax discount & GST math
        grossAmount: { type: Number, required: true }, 
        discountPercent: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        taxableValue: { type: Number, required: true }, 
        cgst: { type: Number, required: true },
        sgst: { type: Number, required: true },
        lineTotal: { type: Number, required: true } 
    }],
    
    // Dispatch Details (Crucial for B2B)
    dispatchDetails: {
        transportMode: String,
        vehicleNumber: String,
        lrNumber: String
    },

    totalTaxable: { type: Number, required: true },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },
    totalGST: { type: Number, required: true },
    roundOff: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    dueAmount: { type: Number, required: true },
    creditApplied: { type: Number, default: 0 },
    previousOutstanding: { type: Number, default: 0 },
    totalPayable: { type: Number, required: true },
    
    paymentStatus: {
        type: String,
        enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'ON_HOLD', 'DISPUTED'],
        default: 'UNPAID'
    }
}, { timestamps: true });

module.exports = mongoose.model('SalesInvoice', salesInvoiceSchema);