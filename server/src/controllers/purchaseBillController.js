const mongoose = require('mongoose');
const PurchaseBill = require('../models/PurchaseBill');
const Product = require('../models/Product');
const Batch = require('../models/Batch');

exports.createPurchaseBill = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const {
            supplierName, supplierId, supplierGSTIN,
            invoiceNumber, billType, invoiceDate, receivedDate, purchaseType,
            items,
            billDiscountPercent, billDiscountValue, billDiscountType,
            paymentStatus,
        } = req.body;

        if (!supplierId || !invoiceNumber || !items || items.length === 0) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        if (!['intrastate', 'interstate'].includes(purchaseType)) {
            return res.status(400).json({ message: 'purchaseType must be intrastate or interstate.' });
        }

        // Validate each item
        for (const item of items) {
            // Auto-calculate PTR if admin left it blank, otherwise use provided
            const ptr = parseFloat(item.ptr) || (parseFloat(item.mrp) * 0.8);
            const mrp = parseFloat(item.mrp);
            const purchaseRate = parseFloat(item.purchaseRate);

            const maxPtr = mrp * 0.8;

            if (ptr > maxPtr) {
                return res.status(400).json({
                    message: `PTR for ${item.productName || 'item'} (₹${ptr}) cannot exceed 80% of MRP (₹${maxPtr.toFixed(2)}).`
                });
            }
            if (ptr < purchaseRate) {
                return res.status(400).json({
                    message: `PTR for ${item.productName || 'item'} (₹${ptr}) cannot be less than Purchase Rate (₹${purchaseRate.toFixed(2)}).`
                });
            }

            // Ensure the validated/calculated PTR is passed down
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

        const gstBreakdown = Object.entries(gstSlabMap).map(([rateLabel, data]) => ({
            rateLabel,
            taxableAmount: data.taxableAmount,
            cgst: data.cgst || 0,
            sgst: data.sgst || 0,
            igst: data.igst || 0,
        }));

        const finalStatus = billType === 'Cash' ? 'PAID' : (paymentStatus || 'UNPAID');

        let savedBill;

        await session.withTransaction(async () => {
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
                netAmount: roundedNet,
                roundOff,
                paymentStatus: finalStatus,
            });

            await newBill.save({ session });

            for (const item of processedItems) {
                const stockReceived = item.billedQty + (item.freeQty || 0);

                const product = await Product.findById(item.productId).session(session);
                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }

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
                    {
                        upsert: true,
                        new: true,
                        session,
                        returnDocument: 'after',
                        setDefaultsOnInsert: true,
                    }
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
                await Product.findByIdAndUpdate(
                    item.productId,
                    { $inc: { totalStock: stockReceived } },
                    { session }
                );
            }

            savedBill = newBill;
        });

        res.status(201).json({
            message: 'Purchase Bill processed! Inventory updated successfully.',
            data: savedBill,
        });

    } catch (error) {
        console.error('createPurchaseBill error:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'An invoice with this number already exists.' });
        }
        res.status(500).json({ error: error.message });
    } finally {
        await session.endSession();
    }
};

exports.getAllPurchaseBills = async (req, res) => {
    try {
        const bills = await PurchaseBill.find().sort({ invoiceDate: -1 });
        res.status(200).json({ success: true, count: bills.length, data: bills });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/* ════════════════════════════════════════════════════════════════════
   ★ EVERYTHING BELOW THIS LINE IS NEW — appended only, nothing above
   this comment has been touched. These are new capabilities for the
   Companies page (supplier-scoped bill list/detail, FIFO payment
   recording, cancel+restock) that didn't exist before.
   ════════════════════════════════════════════════════════════════════ */

/* ── getPurchaseBillsBySupplier ───────────────────────────── ★ NEW
   Powers the "Purchase Bills" tab on the Company Detail page —
   mirrors api.getSalesInvoices() but scoped to one supplier.       */
exports.getPurchaseBillsBySupplier = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const bills = await PurchaseBill.find({ supplierId }).sort({ invoiceDate: -1 });
        res.status(200).json({ success: true, count: bills.length, data: bills });
    } catch (error) {
        console.error('getPurchaseBillsBySupplier error:', error);
        res.status(500).json({ error: error.message });
    }
};

/* ── getPurchaseBillById ──────────────────────────────────── ★ NEW
   Powers PurchaseBillDetailModal (mirrors InvoiceDetailModal).      */
exports.getPurchaseBillById = async (req, res) => {
    try {
        const bill = await PurchaseBill.findById(req.params.id);
        if (!bill) return res.status(404).json({ message: 'Purchase bill not found.' });
        res.status(200).json({ success: true, data: bill });
    } catch (error) {
        console.error('getPurchaseBillById error:', error);
        res.status(500).json({ error: error.message });
    }
};

/* ── recordPurchasePayment ────────────────────────────────── ★ NEW
   FIFO-allocates a payment made TO a supplier against their oldest
   unpaid bills first. Relies on the NEW dueAmount/paidAmount/
   paymentHistory fields added to PurchaseBill.js — does not touch
   or depend on anything inside createPurchaseBill above.

   NOTE: createPurchaseBill (above, untouched) does NOT currently set
   dueAmount/paidAmount on new bills, so until/unless that's changed,
   every newly-created bill will have dueAmount: 0 (the schema default)
   regardless of paymentStatus. This means recordPurchasePayment will
   find nothing to allocate against for bills created through the
   existing flow. Flagging this rather than silently "fixing" it by
   editing createPurchaseBill myself — that function is yours and
   working; let's discuss before I touch it.                         */
exports.recordPurchasePayment = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { supplierId, amount, datePaid, paymentMode, referenceNumber, adminId } = req.body;

        if (!supplierId || !amount || amount <= 0) {
            return res.status(400).json({ message: 'supplierId and a positive amount are required.' });
        }

        let remaining = parseFloat(amount);
        const allocations = [];

        await session.withTransaction(async () => {
            const unpaidBills = await PurchaseBill.find({
                supplierId,
                isCancelled: { $ne: true },
                dueAmount: { $gt: 0 },
            }).sort({ invoiceDate: 1 }).session(session);

            for (const bill of unpaidBills) {
                if (remaining <= 0) break;

                const amountForThisBill = Math.min(remaining, bill.dueAmount);
                bill.paidAmount = (bill.paidAmount || 0) + amountForThisBill;
                bill.dueAmount = Math.max(0, bill.dueAmount - amountForThisBill);
                bill.paymentStatus = bill.dueAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';
                bill.paymentHistory.push({ amountPaid: amountForThisBill, datePaid: datePaid || new Date() });
                bill.updatedBy = adminId;

                await bill.save({ session });

                allocations.push({
                    invoiceId: bill._id,
                    invoiceNumber: bill.invoiceNumber,
                    amountCleared: amountForThisBill,
                });

                remaining -= amountForThisBill;
            }
        });

        res.status(200).json({
            message: 'Payment recorded and allocated to oldest unpaid bills first.',
            data: { allocations, unallocatedAmount: remaining, paymentMode, referenceNumber },
        });
    } catch (error) {
        console.error('recordPurchasePayment error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        await session.endSession();
    }
};

/* ── cancelPurchaseBill ───────────────────────────────────── ★ NEW
   Voids a purchase bill and reverses its stock impact. Blocks the
   cancellation (rather than silently going negative) if any stock
   from this bill's lots has already been consumed by a sale.        */
exports.cancelPurchaseBill = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        const { reason, adminId } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ message: 'A cancellation reason is required.' });
        }

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

                    if (consumedFromLot > 0) {
                        throw new Error(
                            `Cannot cancel: ${consumedFromLot} unit(s) of batch ${item.batchNumber} from this bill have already been sold.`
                        );
                    }

                    batch.purchaseLots = batch.purchaseLots.filter(
                        l => String(l.purchaseInvoiceId) !== String(bill._id)
                    );
                    batch.totalStockQuantity = Math.max(0, batch.totalStockQuantity - stockReceived);
                    await batch.save({ session });
                }

                await Product.findByIdAndUpdate(
                    item.productId,
                    { $inc: { totalStock: -stockReceived } },
                    { session }
                );
            }

            bill.isCancelled = true;
            bill.cancelReason = reason;
            bill.cancelledAt = new Date();
            bill.updatedBy = adminId;
            await bill.save({ session });
        });

        res.status(200).json({ message: 'Purchase bill cancelled and stock reversed.' });
    } catch (error) {
        console.error('cancelPurchaseBill error:', error);
        res.status(400).json({ message: error.message });
    } finally {
        await session.endSession();
    }
};