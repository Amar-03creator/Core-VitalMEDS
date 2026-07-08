const mongoose = require('mongoose');
const SalesInvoice = require('../models/SalesInvoice');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Client = require('../models/Client');
const { getNextInvoiceNumber } = require('../helpers/SequenceHelper');
const Company = require('../models/Company');
const { deductFifo, adjustLotConsumption } = require('../helpers/inventoryFifo');

exports.createSalesInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { clientObjectId, billType, items, globalDiscountType, globalDiscountValue } = req.body;
        if (!clientObjectId || !billType || !items || items.length === 0) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        let savedInvoice;
        await session.withTransaction(async () => {
            const client = await Client.findById(clientObjectId).session(session);
            if (!client) throw new Error('Client not found');

            // Pre‑fetch all companies for shortCode lookup
            const companies = await Company.find({}).session(session).select('shortCode');
            const shortCodeMap = {};
            companies.forEach(c => { shortCodeMap[c._id.toString()] = c.shortCode || ''; });

            // ✨ NEW: Single line to get the perfectly formatted MIL-MM-YY-XXX invoice number
            const invoiceNumber = await getNextInvoiceNumber(session);
            const invoiceDate = new Date();

            let totalGross = 0, totalTaxable = 0, totalCGST = 0, totalSGST = 0, totalIGST = 0;
            const processedItems = [];

            for (const item of items) {
                const batch = await Batch.findById(item.batchId).session(session);
                const product = await Product.findById(item.productId).session(session);
                if (!batch || !product) throw new Error('Product or Batch missing');

                const companyShortCode = shortCodeMap[product.companyId?.toString()] || '';
                const billedQty = item.billedQty || (item.chargeableQty + (item.freeQty || 0));

                if (batch.totalStockQuantity < billedQty) {
                    throw new Error(`Insufficient stock in Batch ${batch.batchNumber}`);
                }

                const free = item.freeQty || 0;
                const chargeable = billedQty - free;
                const gross = item.rate * chargeable;
                let discAmount = item.discountAmount || 0;
                const discPercent = item.discountPercent || 0;
                if (discPercent > 0) discAmount = gross * discPercent / 100;
                const taxable = gross - discAmount;
                const gstRate = product.gstRate || 0;
                const totalGST = taxable * gstRate / 100;
                const cgst = totalGST / 2;
                const sgst = totalGST / 2;
                const igst = 0;

                totalGross += gross;
                totalTaxable += taxable;
                totalCGST += cgst;
                totalSGST += sgst;
                totalIGST += igst;

                const { lotConsumption } = await deductFifo(batch._id, billedQty, session);

                processedItems.push({
                    productId: item.productId,
                    batchId: batch._id,
                    productName: product.name,
                    companyShortCode,
                    batchNumber: batch.batchNumber,
                    packing: product.packing,
                    hsn: product.hsnCode,
                    expiryDate: batch.expiryDate,
                    mrp: batch.mrp,
                    billedQty,
                    chargeableQty: chargeable,
                    freeQty: free,
                    rate: item.rate,
                    grossAmount: gross,
                    discountPercent: discPercent,
                    discountAmount: discAmount,
                    taxableValue: taxable,
                    cgst,
                    sgst,
                    igst,
                    lineTotal: taxable + totalGST,
                    lotConsumption,
                });

                await Product.findByIdAndUpdate(item.productId, { $inc: { totalStock: -billedQty } }, { session });
            }

            const totalGST = totalCGST + totalSGST + totalIGST;
            let netAmount = totalTaxable + totalGST;

            let globalDiscAmt = 0;
            if (globalDiscountValue && globalDiscountValue > 0) {
                if (globalDiscountType === 'percent') {
                    globalDiscAmt = (netAmount * globalDiscountValue) / 100;
                } else {
                    globalDiscAmt = globalDiscountValue;
                }
            }
            netAmount -= globalDiscAmt;
            const roundedNet = Math.round(netAmount);
            const roundOff = parseFloat((roundedNet - netAmount).toFixed(2));
            netAmount = roundedNet;

            const previousOutstanding = client.totalOutstanding || 0;
            const previousOutstandingDate = client.outstandingDate || null;
            let availableCredit = client.creditBalance || 0;
            let creditApplied = 0;

            if (availableCredit > 0) {
                creditApplied = Math.min(availableCredit, netAmount);
                client.creditBalance -= creditApplied;
            }
            const totalPayable = netAmount - creditApplied;
            const dueAmount = totalPayable;

            let paymentStatus = 'UNPAID';
            if (dueAmount === 0) paymentStatus = 'PAID';
            else if (creditApplied > 0) paymentStatus = 'PARTIALLY_PAID';

            client.totalOutstanding = previousOutstanding + dueAmount;

            const oldestUnpaid = await SalesInvoice.findOne({
                clientObjectId: client._id,
                paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID'] }
            }).sort({ invoiceDate: 1 }).session(session);
            client.outstandingDate = oldestUnpaid ? oldestUnpaid.invoiceDate : null;

            const newInvoice = new SalesInvoice({
                clientName: client.establishmentName,
                clientObjectId: client._id,
                clientGSTIN: client.gstin,
                clientBillingAddress: client.billingAddress,
                clientDrugLicense: [client.drugLicense20B, client.drugLicense21B].filter(Boolean).join(', '),
                invoiceNumber,
                invoiceDate,
                billType,
                items: processedItems,
                totalGrossAmount: totalGross,
                totalTaxable,
                totalCGST,
                totalSGST,
                totalIGST,
                totalGST,
                roundOff,
                netAmount,
                globalDiscountPercent: globalDiscountType === 'percent' ? globalDiscountValue : 0,
                globalDiscountAmount: globalDiscAmt,
                previousOutstanding,
                previousOutstandingDate,
                totalPayable,
                creditApplied,
                dueAmount,
                paymentStatus,
                invoiceStatus: 'FINALIZED',
            });

            await newInvoice.save({ session });
            await client.save({ session });
            savedInvoice = newInvoice;
        });

        res.status(201).json({
            message: `Sales Invoice ${savedInvoice.invoiceNumber} generated successfully!`,
            data: savedInvoice
        });
    } catch (error) {
        console.error('createSalesInvoice error:', error);
        res.status(error.message?.includes('Insufficient') ? 409 : 500).json({ message: error.message });
    } finally {
        await session.endSession();
    }
};

exports.updateSalesInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        const { billType, items: newItemsInput, globalDiscountType, globalDiscountValue } = req.body;

        if (!newItemsInput || newItemsInput.length === 0) {
            return res.status(400).json({ message: 'At least one item is required.' });
        }

        let updatedInvoice;
        await session.withTransaction(async () => {
            const invoice = await SalesInvoice.findById(id).session(session);
            if (!invoice) throw new Error('Invoice not found');
            if (invoice.invoiceStatus === 'CANCELLED') throw new Error('Cannot edit a cancelled invoice');

            const client = await Client.findById(invoice.clientObjectId).session(session);
            if (!client) throw new Error('Client not found');

            // Pre‑fetch company short codes
            const companies = await Company.find({}).session(session).select('shortCode');
            const shortCodeMap = {};
            companies.forEach(c => { shortCodeMap[c._id.toString()] = c.shortCode || ''; });

            /* ── 1. FULL REVERSAL of original invoice ──────────────────── */
            for (const origItem of invoice.items) {
                await Batch.findByIdAndUpdate(
                    origItem.batchId,
                    { $inc: { totalStockQuantity: origItem.billedQty } },
                    { session }
                );
                await Product.findByIdAndUpdate(
                    origItem.productId,
                    { $inc: { totalStock: origItem.billedQty } },
                    { session }
                );

                // Restore individual purchase lots
                if (origItem.lotConsumption && origItem.lotConsumption.length > 0) {
                    for (const lot of origItem.lotConsumption) {
                        await Batch.updateOne(
                            { _id: origItem.batchId, "purchaseLots._id": lot.lotId },
                            { $inc: { "purchaseLots.$.remainingQty": lot.qty } },
                            { session }
                        );
                    }
                }
            }

            // Reverse client ledger
            client.totalOutstanding = (client.totalOutstanding || 0) - invoice.dueAmount;
            client.creditBalance = (client.creditBalance || 0) + invoice.creditApplied;

            /* ── 2. PROCESS the new items exactly like a create ────────── */
            let totalGross = 0, totalTaxable = 0, totalCGST = 0, totalSGST = 0;
            const processedItems = [];

            for (const newItem of newItemsInput) {
                const batch = await Batch.findById(newItem.batchId).session(session);
                const product = await Product.findById(newItem.productId).session(session);
                if (!batch || !product) throw new Error('Product or Batch missing');

                const companyShortCode = shortCodeMap[product.companyId?.toString()] || '';

                const billedQty = newItem.billedQty || (newItem.chargeableQty + (newItem.freeQty || 0));
                if (batch.totalStockQuantity < billedQty) {
                    throw new Error(`Insufficient stock in Batch ${batch.batchNumber}`);
                }

                const free = newItem.freeQty || 0;
                const chargeable = billedQty - free;
                const gross = newItem.rate * chargeable;
                let discAmount = newItem.discountAmount || 0;
                const discPercent = newItem.discountPercent || 0;
                if (discPercent > 0) discAmount = gross * discPercent / 100;
                const taxable = gross - discAmount;
                const gstRate = product.gstRate || 0;
                const totalGST = taxable * gstRate / 100;
                const cgst = totalGST / 2;
                const sgst = totalGST / 2;
                const lineTotal = taxable + totalGST;

                totalGross += gross;
                totalTaxable += taxable;
                totalCGST += cgst;
                totalSGST += sgst;

                const { lotConsumption } = await deductFifo(batch._id, billedQty, session);

                processedItems.push({
                    productId: newItem.productId,
                    batchId: batch._id,
                    productName: product.name,
                    companyShortCode,                         // ★ fixed
                    batchNumber: batch.batchNumber,
                    packing: product.packing,
                    hsn: product.hsnCode,
                    expiryDate: batch.expiryDate,
                    mrp: batch.mrp,
                    billedQty,
                    chargeableQty: chargeable,
                    freeQty: free,
                    rate: newItem.rate,
                    grossAmount: gross,
                    discountPercent: discPercent,
                    discountAmount: discAmount,
                    taxableValue: taxable,
                    cgst,
                    sgst,
                    lineTotal,
                    lotConsumption,
                });

                await Product.findByIdAndUpdate(newItem.productId, { $inc: { totalStock: -billedQty } }, { session });
            }

            const totalGST = totalCGST + totalSGST;
            let netAmount = totalTaxable + totalGST;

            // Apply global discount
            let globalDiscAmt = 0;
            if (globalDiscountValue && globalDiscountValue > 0) {
                if (globalDiscountType === 'percent') {
                    globalDiscAmt = (netAmount * globalDiscountValue) / 100;
                } else {
                    globalDiscAmt = globalDiscountValue;
                }
            }
            netAmount -= globalDiscAmt;
            const roundedNet = Math.round(netAmount);
            const roundOff = parseFloat((roundedNet - netAmount).toFixed(2));
            netAmount = roundedNet;

            // Re‑calculate client credit
            const previousOutstanding = client.totalOutstanding || 0;
            const previousOutstandingDate = client.outstandingDate || null;
            let availableCredit = client.creditBalance || 0;
            let creditApplied = 0;
            if (availableCredit > 0) {
                creditApplied = Math.min(availableCredit, netAmount);
                client.creditBalance -= creditApplied;
            }
            const totalPayable = netAmount - creditApplied;
            const dueAmount = totalPayable;

            let paymentStatus = 'UNPAID';
            if (dueAmount === 0) paymentStatus = 'PAID';
            else if (creditApplied > 0) paymentStatus = 'PARTIALLY_PAID';

            client.totalOutstanding = previousOutstanding + dueAmount;
            client.outstandingDate = new Date();

            /* ── 3. Overwrite the invoice fields ──────────────────────── */
            invoice.items = processedItems;
            invoice.billType = billType || invoice.billType;
            invoice.totalGrossAmount = totalGross;
            invoice.totalTaxable = totalTaxable;
            invoice.totalCGST = totalCGST;
            invoice.totalSGST = totalSGST;
            invoice.totalGST = totalGST;
            invoice.roundOff = roundOff;
            invoice.netAmount = netAmount;
            invoice.globalDiscountPercent = globalDiscountType === 'percent' ? globalDiscountValue : 0;
            invoice.globalDiscountAmount = globalDiscAmt;
            invoice.previousOutstanding = previousOutstanding;
            invoice.previousOutstandingDate = previousOutstandingDate;
            invoice.totalPayable = totalPayable;
            invoice.creditApplied = creditApplied;
            invoice.dueAmount = dueAmount;
            invoice.paymentStatus = paymentStatus;

            await invoice.save({ session });
            await client.save({ session });
            updatedInvoice = invoice;
        });

        res.status(200).json({
            message: `Sales Invoice ${updatedInvoice.invoiceNumber} updated successfully!`,
            data: updatedInvoice,
        });
    } catch (error) {
        console.error('updateSalesInvoice error:', error);
        res.status(error.message?.includes('Insufficient') ? 409 : 500).json({ message: error.message });
    } finally {
        await session.endSession();
    }
};

exports.deleteSalesInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;

        let deleted;
        await session.withTransaction(async () => {
            const invoice = await SalesInvoice.findById(id).session(session);
            if (!invoice) throw new Error('Invoice not found');

            const client = await Client.findById(invoice.clientObjectId).session(session);
            if (!client) throw new Error('Client not found');

            // Reverse stock
            for (const item of invoice.items) {
                // Restore master stock
                await Batch.findByIdAndUpdate(
                    item.batchId,
                    { $inc: { totalStockQuantity: item.billedQty } },
                    { session }
                );
                await Product.findByIdAndUpdate(
                    item.productId,
                    { $inc: { totalStock: item.billedQty } },
                    { session }
                );

                // ★ Restore individual purchase lots
                if (item.lotConsumption && item.lotConsumption.length > 0) {
                    for (const lot of item.lotConsumption) {
                        await Batch.updateOne(
                            { _id: item.batchId, "purchaseLots._id": lot.lotId },
                            { $inc: { "purchaseLots.$.remainingQty": lot.qty } },
                            { session }
                        );
                    }
                }
            }

            // Reverse client ledger
            client.totalOutstanding = (client.totalOutstanding || 0) - invoice.dueAmount;
            client.creditBalance = (client.creditBalance || 0) + invoice.creditApplied;
            await client.save({ session });

            // Delete the invoice
            await SalesInvoice.findByIdAndDelete(id).session(session);

            deleted = invoice;
        });

        res.status(200).json({
            message: `Invoice ${deleted.invoiceNumber} deleted and stock restored.`,
            data: deleted,
        });
    } catch (error) {
        console.error('deleteSalesInvoice error:', error);
        res.status(500).json({ message: error.message });
    } finally {
        await session.endSession();
    }
};

exports.getAllSalesInvoices = async (req, res) => {
    try {
        const invoices = await SalesInvoice.find().sort({ invoiceDate: -1 }).populate('clientObjectId', 'establishmentName city line');
        res.status(200).json({ success: true, count: invoices.length, data: invoices });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSalesInvoiceById = async (req, res) => {
    try {
        const invoice = await SalesInvoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.status(200).json({ success: true, data: invoice });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};