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