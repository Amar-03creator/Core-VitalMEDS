const SalesInvoice = require('../models/SalesInvoice');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Client = require('../models/Client');
const Counter = require('../models/Counter'); // Make sure you have this model!

exports.createSalesInvoice = async (req, res) => {
    try {
        // 1. Destructure the bare minimum data from the frontend
        const {
            clientObjectId, billType, items, dispatchDetails
        } = req.body;

        // 2. THE SECURITY PRE-CHECK
        if (!clientObjectId || !billType || !items || items.length === 0) {
            return res.status(400).json({ 
                message: "Missing required fields. Please ensure client, bill type, and items are provided." 
            });
        }

        // 3. FETCH CLIENT (Auto-fill client details)
        const client = await Client.findById(clientObjectId);
        if (!client) {
            return res.status(404).json({ message: "Client not found in database!" });
        }
        
        const clientName = client.establishmentName;
        const clientGSTIN = client.gstin;

        // 4. AUTO-GENERATE INVOICE NUMBER
        // Safely increments the counter in the DB to prevent duplicate invoice numbers
        const counter = await Counter.findByIdAndUpdate(
            'invoice_seq',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        
        const seqString = String(counter.seq).padStart(3, '0'); // Turns 1 into "001"
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
        const currentYear = new Date().getFullYear();
        const invoiceNumber = `MIL-${currentMonth}-${currentYear}-${seqString}`; // e.g., MIL-04-2026-001
        const invoiceDate = new Date();

        // Initialize backend-calculated totals
        let calculatedTotalTaxable = 0;
        let calculatedTotalCGST = 0;
        let calculatedTotalSGST = 0;
        let calculatedTotalIGST = 0;

        // 5. THE INVENTORY VALIDATION & MATH LOOP
        for (let i = 0; i < items.length; i++) {
            const currentItem = items[i];
            
            const batch = await Batch.findById(currentItem.batchId);
            const product = await Product.findById(currentItem.productId);

            if (!batch || !product) {
                return res.status(404).json({ message: `Product or Batch missing for item ${i+1}` });
            }

            if (batch.totalStockQuantity < currentItem.billedQty) {
                return res.status(400).json({
                    message: `Insufficient stock in Batch ${batch.batchNumber}. Need ${currentItem.billedQty}, have ${batch.totalStockQuantity}!`
                });
            }

            // --- AUTO-FILL BATCH & PRODUCT DATA ---
            items[i].productName = product.name;
            items[i].batchNumber = batch.batchNumber;
            items[i].mrp = batch.mrp;
            items[i].expiryDate = batch.expiryDate;

            // --- CALCULATE CHARGEABLE QTY ---
            const freeBoxes = currentItem.freeQty || 0;
            const chargeableBoxes = currentItem.billedQty - freeBoxes;
            items[i].chargeableQty = chargeableBoxes;

            // --- ZERO-TRUST FINANCIAL CALCULATION ---
            const itemGrossAmount = currentItem.rate * chargeableBoxes;
            
            let itemDiscountAmount = currentItem.discountAmount || 0;
            const itemDiscountPercent = currentItem.discountPercent || 0;

            if (itemDiscountPercent > 0) {
                itemDiscountAmount = itemGrossAmount * (itemDiscountPercent / 100);
            }

            const itemTaxableValue = itemGrossAmount - itemDiscountAmount; 
            
            const productGSTRate = product.gstRate || 0; 
            const itemTotalGST = itemTaxableValue * (productGSTRate / 100);

            let itemCGST = 0, itemSGST = 0, itemIGST = 0;
            const isInterState = false; // Hardcoded for now

            if (isInterState) {
                itemIGST = itemTotalGST; 
            } else {
                itemCGST = itemTotalGST / 2; 
                itemSGST = itemTotalGST / 2;
            }

            // Overwrite frontend data with backend math
            items[i].grossAmount = itemGrossAmount;
            items[i].discountPercent = itemDiscountPercent; 
            items[i].discountAmount = itemDiscountAmount;   
            items[i].taxableValue = itemTaxableValue;
            items[i].cgst = itemCGST;
            items[i].sgst = itemSGST;
            items[i].igst = itemIGST;
            items[i].lineTotal = itemTaxableValue + itemTotalGST;

            calculatedTotalTaxable += itemTaxableValue;
            calculatedTotalCGST += itemCGST;
            calculatedTotalSGST += itemSGST;
            calculatedTotalIGST += itemIGST;
        }

        const calculatedTotalGST = calculatedTotalCGST + calculatedTotalSGST + calculatedTotalIGST;
        const calculatedNetAmount = calculatedTotalTaxable + calculatedTotalGST;

        // 6. APPLY CREDIT & CALCULATE DUE AMOUNT
        const previousOutstanding = client.totalOutstanding || 0;
        let availableCredit = client.creditBalance || 0;
        let creditApplied = 0;

        if (availableCredit > 0) {
            creditApplied = Math.min(availableCredit, calculatedNetAmount);
            client.creditBalance -= creditApplied; 
        }

        const immutableTotalPayable = calculatedNetAmount - creditApplied;
        const startingDueAmount = immutableTotalPayable; 

        let paymentStatus = 'UNPAID';
        if (startingDueAmount === 0) paymentStatus = 'PAID';
        else if (creditApplied > 0) paymentStatus = 'PARTIALLY_PAID';

        // Update Client Ledger
        client.totalOutstanding = previousOutstanding + startingDueAmount;

        // 7. CREATE THE INVOICE
        const newInvoice = new SalesInvoice({
            clientName,
            clientObjectId,
            clientGSTIN,
            invoiceNumber,
            invoiceDate,
            billType,
            items, 
            dispatchDetails,
            totalTaxable: calculatedTotalTaxable,
            totalCGST: calculatedTotalCGST,
            totalSGST: calculatedTotalSGST,
            totalIGST: calculatedTotalIGST,
            totalGST: calculatedTotalGST,
            netAmount: calculatedNetAmount,
            creditApplied: creditApplied,
            previousOutstanding: previousOutstanding, 
            totalPayable: immutableTotalPayable, 
            dueAmount: startingDueAmount,        
            paymentStatus: paymentStatus,
            invoiceStatus: 'FINALIZED' 
        });

        // 8. THE INVENTORY DEDUCTION LOOP
        for (let i = 0; i < items.length; i++) {
            const currentItem = items[i];
            const stockDeducted = currentItem.billedQty;

            await Batch.findByIdAndUpdate(currentItem.batchId, {
                $inc: { totalStockQuantity: -stockDeducted }
            });

            await Product.findByIdAndUpdate(currentItem.productId, {
                $inc: { totalStock: -stockDeducted }
            });
        }

        // Save Invoice and Client 
        await newInvoice.save();
        await client.save();

        res.status(201).json({
            message: `Sales Invoice ${invoiceNumber} generated successfully!`,
            data: newInvoice
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add this at the bottom of salesInvoiceController.js
exports.getAllSalesInvoices = async (req, res) => {
    try {
        const invoices = await SalesInvoice.find();
        res.status(200).json({
            success: true,
            count: invoices.length,
            data: invoices
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getSalesInvoiceById = async (req, res) => {
    try {
        const invoice = await SalesInvoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }
        res.status(200).json({
            success: true,
            data: invoice
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};