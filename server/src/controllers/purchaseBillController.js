const PurchaseBill = require('../models/PurchaseBill'); 
const Product = require('../models/Product'); 
const Batch = require('../models/Batch'); 

exports.createPurchaseBill = async (req, res) => {
    try {
        // 1. Destructure all your amazing fields from the frontend
        const { 
            supplierName, supplierId, supplierGSTIN, invoiceNumber, 
            invoiceDate, receivedDate, items, grossAmount, totalGST, 
            netAmount, paymentStatus 
        } = req.body; 

        // 2. Create the new Purchase Bill in memory
        const newBill = new PurchaseBill({
            supplierName, supplierId, supplierGSTIN, invoiceNumber, 
            invoiceDate, receivedDate, items, grossAmount, totalGST, 
            netAmount, paymentStatus
        });

        // 3. Save the bill to the database
        await newBill.save();

        // 4. Now, for each item in the bill, we need to update our inventory (Batch and Product)
        // We will loop through each item, check if the batch already exists, and update or create accordingly.
        for (let i = 0; i < items.length; i++) {
            const currentItem = items[i];
            const stockReceived = currentItem.billedQty + currentItem.freeQty;

            // First, fetch the Product so we know the Company details for our Batch
            const product = await Product.findById(currentItem.productId);

            // Step A: Check if this specific Batch already exists
            let batch = await Batch.findOne({ 
                productId: currentItem.productId, 
                batchNumber: currentItem.batchNumber 
            });

            if (batch) {
                // The batch exists! Increase its stock and add a new Purchase Lot
                batch.totalStockQuantity += stockReceived;
                batch.purchaseLots.push({
                    purchaseInvoiceId: newBill._id,
                    invoiceNumber: newBill.invoiceNumber,
                    dateReceived: newBill.receivedDate,
                    originalQty: stockReceived,
                    remainingQty: stockReceived
                });
                await batch.save();

                // Update the item in the bill to hold the existing Batch ID
                currentItem.batchId = batch._id; 
            } else {
                // The batch is brand new! Create it.
                const newBatch = new Batch({
                    productId: product._id,
                    companyId: product.companyId,
                    companyName: product.company, // From our Product model!
                    batchNumber: currentItem.batchNumber,
                    expiryDate: currentItem.expiryDate,
                    mrp: currentItem.mrp,
                    sellingRate: currentItem.mrp * 0.8, // Example logic: Selling rate is 20% off MRP
                    totalStockQuantity: stockReceived,
                    purchaseLots: [{
                        purchaseInvoiceId: newBill._id,
                        invoiceNumber: newBill.invoiceNumber,
                        dateReceived: newBill.receivedDate,
                        originalQty: stockReceived,
                        remainingQty: stockReceived
                    }]
                });
                await newBatch.save();

                // Update the item in the bill to hold the NEW Batch ID
                currentItem.batchId = newBatch._id; 
            }

            // Step B: Update the Master Product Stock (Just like before)
            await Product.findByIdAndUpdate(
                currentItem.productId, 
                { $inc: { totalStock: stockReceived } } 
            );
        }

        // Because we updated the currentItem.batchId inside the loop, 
        // we should re-save the bill so it holds the official Batch IDs.
        await newBill.save();

        res.status(201).json({
            message: "Purchase Bill processed! Inventory updated successfully.",
            data: newBill
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- GET ALL PURCHASE BILLS ---
exports.getAllPurchaseBills = async (req, res) => {
    try {
        const bills = await PurchaseBill.find(); // Fetch all bills from the database
        res.status(200).json({
            success: true,
            count: bills.length,
            data: bills
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};