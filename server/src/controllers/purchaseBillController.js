// src/controllers/purchaseBillController.js

const mongoose = require('mongoose');
const PurchaseBill = require('../models/PurchaseBill');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Company = require('../models/Company'); 
const SupplierPayment = require('../models/SupplierPayment'); // ✨ NEW: Needed for the Double Save

exports.createPurchaseBill = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const {
            supplierName, supplierId, supplierGSTIN,
            invoiceNumber, billType, invoiceDate, receivedDate, purchaseType,
            items,
            billDiscountPercent, billDiscountValue, billDiscountType,
            // ✨ NEW: Catching the inline payment details from the frontend
            paymentAmount, paymentMode, referenceNumber, paymentDate, applyAdvance
        } = req.body;

        if (!supplierId || !invoiceNumber || !items || items.length === 0) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        if (!['intrastate', 'interstate'].includes(purchaseType)) {
            return res.status(400).json({ message: 'purchaseType must be intrastate or interstate.' });
        }

        // Validate each item
        for (const item of items) {
            const ptr = parseFloat(item.ptr) || (parseFloat(item.mrp) * 0.8);
            const mrp = parseFloat(item.mrp);
            const purchaseRate = parseFloat(item.purchaseRate);
            const maxPtr = mrp * 0.8;

            if (ptr > maxPtr) {
                return res.status(400).json({ message: `PTR for ${item.productName || 'item'} (₹${ptr}) cannot exceed 80% of MRP (₹${maxPtr.toFixed(2)}).` });
            }
            if (ptr < purchaseRate) {
                return res.status(400).json({ message: `PTR for ${item.productName || 'item'} (₹${ptr}) cannot be less than Purchase Rate (₹${purchaseRate.toFixed(2)}).` });
            }
            item.ptr = ptr;
        }

        let grossTotal = 0, totalGST = 0, netBeforeDiscount = 0;
        const gstSlabMap = {};

        const processedItems = items.map(item => {
            const gross = item.purchaseRate * item.billedQty;
            let lineDiscAmt = 0;
            if (item.discountValue && parseFloat(item.discountValue) > 0) {
                lineDiscAmt = item.discountType === 'percent'
                    ? (gross * parseFloat(item.discountValue)) / 100
                    : parseFloat(item.discountValue);
            }
            const taxable = gross - lineDiscAmt;
            let cgst = 0, sgst = 0, igst = 0, gstAmt = 0;
            const cgstPct = parseFloat(item.cgstRate) || 0;
            const sgstPct = parseFloat(item.sgstRate) || 0;
            const igstPct = parseFloat(item.igstRate) || 0;

            if (purchaseType === 'intrastate') {
                cgst = taxable * cgstPct / 100;
                sgst = taxable * sgstPct / 100;
                gstAmt = cgst + sgst;
                const slabKey = `CGST+SGST ${(cgstPct + sgstPct).toFixed(1)}%`;
                if (!gstSlabMap[slabKey]) gstSlabMap[slabKey] = { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0 };
                gstSlabMap[slabKey].taxableAmount += taxable;
                gstSlabMap[slabKey].cgst += cgst;
                gstSlabMap[slabKey].sgst += sgst;
            } else {
                igst = taxable * igstPct / 100;
                gstAmt = igst;
                const slabKey = `IGST ${igstPct.toFixed(1)}%`;
                if (!gstSlabMap[slabKey]) gstSlabMap[slabKey] = { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0 };
                gstSlabMap[slabKey].taxableAmount += taxable;
                gstSlabMap[slabKey].igst += igst;
            }

            const lineTotal = taxable + gstAmt;
            grossTotal += gross;
            totalGST += gstAmt;
            netBeforeDiscount += lineTotal;

            return {
                productId: item.productId,
                productName: item.productName || '',
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate,
                billedQty: item.billedQty,
                freeQty: item.freeQty || 0,
                mrp: item.mrp,
                purchaseRate: item.purchaseRate,
                ptr: item.ptr,
                discountPercent: item.discountType === 'percent' ? parseFloat(item.discountValue) : 0,
                discountAmount: lineDiscAmt,
                cgstPercent: cgstPct,
                sgstPercent: sgstPct,
                igstPercent: igstPct,
                taxableValue: taxable,
                gstAmount: gstAmt,
                lineTotal,
            };
        });

        // Bill-level discount
        let finalBillDiscount = 0;
        const bdPct = parseFloat(billDiscountPercent) || 0;
        const bdAmt = parseFloat(billDiscountValue) || 0;
        if (billDiscountType === 'percent' && bdPct > 0) {
            finalBillDiscount = (netBeforeDiscount * bdPct) / 100;
        } else if (bdAmt > 0) {
            finalBillDiscount = bdAmt;
        }
        
        const afterBillDiscount = netBeforeDiscount - finalBillDiscount;
        const roundedNet = Math.round(afterBillDiscount);
        const roundOff = parseFloat((roundedNet - afterBillDiscount).toFixed(2));
        const netAmount = roundedNet;

        const gstBreakdown = Object.entries(gstSlabMap).map(([rateLabel, data]) => ({
            rateLabel,
            taxableAmount: data.taxableAmount,
            cgst: data.cgst || 0,
            sgst: data.sgst || 0,
            igst: data.igst || 0,
        }));

        let savedBill;

        await session.withTransaction(async () => {
            const company = await Company.findById(supplierId).session(session);
            if (!company) throw new Error('Supplier Company not found in ledger');

            let dueForThisBill = netAmount;
            let paidForThisBill = 0;
            let advanceConsumed = 0;

            // ✨ 1. Consume Existing Advance (If admin toggled it)
            if (applyAdvance && company.advancePaid > 0) {
                advanceConsumed = Math.min(company.advancePaid, dueForThisBill);
                company.advancePaid -= advanceConsumed;
                dueForThisBill -= advanceConsumed;
                paidForThisBill += advanceConsumed;
            }

            // ✨ 2. Handle New Inline Payment
            const newPaymentAmt = parseFloat(paymentAmount) || 0;
            let amountAllocatedFromNewPayment = 0;
            let leftoverAdvance = 0;

            if (newPaymentAmt > 0) {
                amountAllocatedFromNewPayment = Math.min(newPaymentAmt, dueForThisBill);
                leftoverAdvance = newPaymentAmt - amountAllocatedFromNewPayment;
                
                dueForThisBill -= amountAllocatedFromNewPayment;
                paidForThisBill += amountAllocatedFromNewPayment;
                
                // Put extra money into the company wallet
                if (leftoverAdvance > 0) {
                    company.advancePaid += leftoverAdvance;
                }
            }

            // Calculate exact payment status
            let paymentStatus = 'UNPAID';
            if (dueForThisBill === 0) paymentStatus = 'PAID';
            else if (paidForThisBill > 0) paymentStatus = 'PARTIALLY_PAID';

            // Add any remaining debt to the Company Ledger
            company.totalOutstanding = (company.totalOutstanding || 0) + dueForThisBill;
            await company.save({ session });

            // ✨ 3. Create the Purchase Bill
            const newBill = new PurchaseBill({
                supplierName,
                supplierId,
                supplierGSTIN: supplierGSTIN || undefined,
                invoiceNumber,
                billType: billType || 'Credit',
                invoiceDate,
                receivedDate,
                purchaseType,
                items: processedItems,
                billDiscountPercent: bdPct,
                billDiscountAmount: finalBillDiscount,
                gstBreakdown,
                grossAmount: grossTotal,
                totalGST,
                netAmount,
                roundOff,
                dueAmount: dueForThisBill,
                paidAmount: paidForThisBill,
                paymentStatus,
            });

            await newBill.save({ session });

            // ✨ 4. DOUBLE SAVE: Generate the formal Payment Voucher in the background
            if (newPaymentAmt > 0) {
                // Loophole 3 Fix: Prevent double-logging the exact same UTR
                if (referenceNumber) {
                    const existingTxn = await SupplierPayment.findOne({ referenceNumber }).session(session);
                    if (existingTxn) throw new Error(`Transaction ID ${referenceNumber} has already been logged.`);
                }

                const dateStr = new Date().toISOString().slice(2, 7).replace('-', '');
                const lastPayment = await SupplierPayment.findOne({ voucherNumber: new RegExp(`^SPV-${dateStr}`) }).sort({ createdAt: -1 }).session(session);
                const nextNum = lastPayment ? parseInt(lastPayment.voucherNumber.split('-')[2], 10) + 1 : 1;
                const voucherNumber = `SPV-${dateStr}-${nextNum.toString().padStart(3, '0')}`;

                const paymentRecord = new SupplierPayment({
                    voucherNumber,
                    supplierObjectId: company._id,
                    paymentDate: paymentDate || new Date(),
                    paymentMode: paymentMode || 'UPI',
                    referenceNumber,
                    totalAmountPaid: newPaymentAmt,
                    allocatedBills: amountAllocatedFromNewPayment > 0 ? [{
                        billId: newBill._id,
                        invoiceNumber: newBill.invoiceNumber,
                        amountCleared: amountAllocatedFromNewPayment
                    }] : [],
                    unallocatedAmount: leftoverAdvance,
                    adminRemarks: `Inline payment for Bill ${invoiceNumber}`
                });
                await paymentRecord.save({ session });
            }

            for (const item of processedItems) {
                const stockReceived = item.billedQty + (item.freeQty || 0);
                const product = await Product.findById(item.productId).session(session);
                if (!product) throw new Error(`Product not found: ${item.productId}`);

                const lotEntry = {
                    purchaseInvoiceId: newBill._id,
                    invoiceNumber: newBill.invoiceNumber,
                    supplierId: supplierId,
                    dateReceived: newBill.receivedDate,
                    purchaseRate: item.purchaseRate,
                    mrp: item.mrp,
                    originalQty: stockReceived,
                    remainingQty: stockReceived,
                };

                const batch = await Batch.findOneAndUpdate(
                    {
                        productId: item.productId,
                        batchNumber: item.batchNumber,
                        companyId: product.companyId,
                    },
                    {
                        $inc: { totalStockQuantity: stockReceived },
                        $push: { purchaseLots: lotEntry },
                        $setOnInsert: {
                            productId: item.productId,
                            companyId: product.companyId,
                            productName: product.name,
                            companyName: product.company,
                            batchNumber: item.batchNumber,
                            expiryDate: item.expiryDate,
                            mrp: item.mrp,
                            sellingRate: parseFloat((item.ptr || item.mrp * 0.8).toFixed(2)),
                            isActive: true,
                        },
                    },
                    { upsert: true, new: true, session, returnDocument: 'after', setDefaultsOnInsert: true }
                );

                if (batch && !batch.productName) {
                    batch.productName = product.name;
                    await batch.save({ session });
                }
                item.batchId = batch._id;
            }

            newBill.items = processedItems;
            await newBill.save({ session });

            for (const item of processedItems) {
                const stockReceived = item.billedQty + (item.freeQty || 0);
                await Product.findByIdAndUpdate(item.productId, { $inc: { totalStock: stockReceived } }, { session });
            }

            savedBill = newBill;
        });

        res.status(201).json({ message: 'Purchase Bill processed! Inventory updated successfully.', data: savedBill });
    } catch (error) {
        console.error('createPurchaseBill error:', error);
        if (error.code === 11000) return res.status(409).json({ message: 'An invoice with this number already exists.' });
        res.status(500).json({ error: error.message });
    } finally {
        await session.endSession();
    }
};

exports.getAllPurchaseBills = async (req, res) => {
    try {
        const bills = await PurchaseBill.find().populate('supplierId', 'shortCode city').sort({ invoiceDate: -1 });
        res.status(200).json({ success: true, count: bills.length, data: bills });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPurchaseBillsBySupplier = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const bills = await PurchaseBill.find({ supplierId }).populate('supplierId', 'shortCode city').sort({ invoiceDate: -1 });
        res.status(200).json({ success: true, count: bills.length, data: bills });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPurchaseBillById = async (req, res) => {
    try {
        const bill = await PurchaseBill.findById(req.params.id);
        if (!bill) return res.status(404).json({ message: 'Purchase bill not found.' });
        res.status(200).json({ success: true, data: bill });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.cancelPurchaseBill = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        const { reason, adminId } = req.body;

        if (!reason || !reason.trim()) return res.status(400).json({ message: 'A cancellation reason is required.' });

        await session.withTransaction(async () => {
            const bill = await PurchaseBill.findById(id).session(session);
            if (!bill) throw new Error('Purchase bill not found.');
            if (bill.isCancelled) throw new Error('This bill is already cancelled.');

            for (const item of bill.items) {
                const stockReceived = item.billedQty + (item.freeQty || 0);
                const batch = await Batch.findById(item.batchId).session(session);
                if (batch) {
                    const lot = batch.purchaseLots.find(l => String(l.purchaseInvoiceId) === String(bill._id));
                    const consumedFromLot = lot ? (lot.originalQty - lot.remainingQty) : 0;
                    if (consumedFromLot > 0) throw new Error(`Cannot cancel: ${consumedFromLot} unit(s) of batch ${item.batchNumber} have already been sold.`);

                    batch.purchaseLots = batch.purchaseLots.filter(l => String(l.purchaseInvoiceId) !== String(bill._id));
                    batch.totalStockQuantity = Math.max(0, batch.totalStockQuantity - stockReceived);
                    await batch.save({ session });
                }
                await Product.findByIdAndUpdate(item.productId, { $inc: { totalStock: -stockReceived } }, { session });
            }

            const company = await Company.findById(bill.supplierId).session(session);
            if (company) {
                company.totalOutstanding = Math.max(0, (company.totalOutstanding || 0) - (bill.dueAmount || 0));
                company.advancePaid = (company.advancePaid || 0) + (bill.paidAmount || 0);
                await company.save({ session });
            }

            bill.isCancelled = true;
            bill.cancelReason = reason;
            bill.cancelledAt = new Date();
            bill.updatedBy = adminId;
            bill.dueAmount = 0; 
            
            await bill.save({ session });
        });

        res.status(200).json({ message: 'Purchase bill cancelled and stock reversed.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    } finally {
        await session.endSession();
    }
};