// // server/src/controllers/salesInvoiceController.js
// const mongoose = require('mongoose');
// const SalesInvoice = require('../models/SalesInvoice');
// const Product = require('../models/Product');
// const Batch = require('../models/Batch');
// const Client = require('../models/Client');
// const Order = require('../models/Order');
// const { getNextInvoiceNumber, getNextOrderNumber } = require('../helpers/SequenceHelper');
// const Company = require('../models/Company');
// const { deductFifo } = require('../helpers/inventoryFifo');

// /*
//  * createSalesInvoice — three ways in:
//  *
//  * 1. Plain manual invoice (billing hub, walk-in/phone sale, no order at all).
//  * body: { clientObjectId, billType, items, ... }
//  * 2. Invoicing an EXISTING order ("Confirm & Generate Invoice" from the admin
//  * Orders page). body additionally has { orderId }. On success, the order
//  * moves Placed/Confirmed → Invoiced, gets invoiceDocumentId/invoiceNumber/
//  * finalInvoiceAmount, and the invoice gets orderObjectId set. All inside
//  * one transaction.
//  * 3. Phone-in order created from scratch ("+ Create Order" on the admin page).
//  * body additionally has { createLinkedOrder: true }. A new Order is created
//  * alongside the invoice, status Invoiced immediately (skips Placed/Confirmed
//  * because the admin is finalising the sale on the phone).
//  *
//  * (2) and (3) are mutually exclusive — pass at most one of orderId / createLinkedOrder.
//  */
// exports.createSalesInvoice = async (req, res) => {
//     const session = await mongoose.startSession();
//     try {
//         const { clientObjectId, billType, items, globalDiscountType, globalDiscountValue, orderId, createLinkedOrder, modificationNote, adminNote } = req.body;
//         if (!clientObjectId || !billType || !items || items.length === 0) {
//             return res.status(400).json({ message: 'Missing required fields' });
//         }
//         if (orderId && createLinkedOrder) {
//             return res.status(400).json({ message: 'Pass either orderId or createLinkedOrder, not both.' });
//         }

//         let savedInvoice;
//         let linkedOrder;
//         await session.withTransaction(async () => {
//             const client = await Client.findById(clientObjectId).session(session);
//             if (!client) throw new Error('Client not found');

//             let existingOrder = null;
//             if (orderId) {
//                 existingOrder = await Order.findById(orderId).session(session);
//                 if (!existingOrder) throw new Error('Order not found');
//                 if (!['Placed', 'Confirmed'].includes(existingOrder.status)) {
//                     throw new Error(`Order is ${existingOrder.status} — only a Placed or Confirmed order can be invoiced.`);
//                 }
//             }

//             const companies = await Company.find({}).session(session).select('shortCode');
//             const shortCodeMap = {};
//             companies.forEach(c => { shortCodeMap[c._id.toString()] = c.shortCode || ''; });

//             const invoiceNumber = await getNextInvoiceNumber(session);
//             const invoiceDate = new Date();

//             let totalGross = 0, totalTaxable = 0, totalCGST = 0, totalSGST = 0, totalIGST = 0;
//             const processedItems = [];

//             for (const item of items) {
//                 const batch = await Batch.findById(item.batchId).session(session);
//                 const product = await Product.findById(item.productId).session(session);
//                 if (!batch || !product) throw new Error('Product or Batch missing');

//                 const companyShortCode = shortCodeMap[product.companyId?.toString()] || '';
//                 const billedQty = item.billedQty || (item.chargeableQty + (item.freeQty || 0));

//                 if (batch.totalStockQuantity < billedQty) {
//                     throw new Error(`Insufficient stock in Batch ${batch.batchNumber}`);
//                 }

//                 const free = item.freeQty || 0;
//                 const chargeable = billedQty - free;
//                 const gross = item.rate * chargeable;
//                 let discAmount = item.discountAmount || 0;
//                 const discPercent = item.discountPercent || 0;
//                 if (discPercent > 0) discAmount = gross * discPercent / 100;
//                 const taxable = gross - discAmount;
//                 const gstRate = product.gstRate || 0;
//                 const totalGST = taxable * gstRate / 100;
//                 const cgst = totalGST / 2;
//                 const sgst = totalGST / 2;
//                 const igst = 0; 

//                 totalGross += gross;
//                 totalTaxable += taxable;
//                 totalCGST += cgst;
//                 totalSGST += sgst;
//                 totalIGST += igst;

//                 const { lotConsumption } = await deductFifo(batch._id, billedQty, session);

//                 processedItems.push({
//                     productId: item.productId,
//                     batchId: batch._id,
//                     productName: product.name,
//                     companyShortCode,
//                     batchNumber: batch.batchNumber,
//                     packing: product.packing,
//                     hsn: product.hsnCode,
//                     expiryDate: batch.expiryDate,
//                     mrp: batch.mrp,
//                     billedQty,
//                     chargeableQty: chargeable,
//                     freeQty: free,
//                     rate: item.rate,
//                     grossAmount: gross,
//                     discountPercent: discPercent,
//                     discountAmount: discAmount,
//                     taxableValue: taxable,
//                     cgst,
//                     sgst,
//                     igst,
//                     lineTotal: taxable + totalGST,
//                     lotConsumption,
//                 });

//                 await Product.findByIdAndUpdate(item.productId, { $inc: { totalStock: -billedQty } }, { session });
//             }

//             const totalGST = totalCGST + totalSGST + totalIGST;
//             let netAmount = totalTaxable + totalGST;

//             let globalDiscAmt = 0;
//             if (globalDiscountValue && globalDiscountValue > 0) {
//                 if (globalDiscountType === 'percent') {
//                     globalDiscAmt = (netAmount * globalDiscountValue) / 100;
//                 } else {
//                     globalDiscAmt = globalDiscountValue;
//                 }
//             }
//             netAmount -= globalDiscAmt;
//             const roundedNet = Math.round(netAmount);
//             const roundOff = parseFloat((roundedNet - netAmount).toFixed(2));
//             netAmount = roundedNet;

//             const previousOutstanding = client.totalOutstanding || 0;
//             const previousOutstandingDate = client.outstandingDate || null;
//             let availableCredit = client.creditBalance || 0;
//             let creditApplied = 0;
//             if (availableCredit > 0) {
//                 creditApplied = Math.min(availableCredit, netAmount);
//                 client.creditBalance -= creditApplied;
//             }
//             const totalPayable = netAmount - creditApplied;
//             const dueAmount = totalPayable;

//             let paymentStatus = 'UNPAID';
//             if (dueAmount === 0) paymentStatus = 'PAID';
//             else if (creditApplied > 0) paymentStatus = 'PARTIALLY_PAID';

//             client.totalOutstanding = previousOutstanding + dueAmount;
//             const oldestUnpaid = await SalesInvoice.findOne({
//                 clientObjectId: client._id,
//                 paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID'] }
//             }).sort({ invoiceDate: 1 }).session(session);
//             client.outstandingDate = oldestUnpaid ? oldestUnpaid.invoiceDate : null;

//             const newInvoice = new SalesInvoice({
//                 clientName: client.establishmentName,
//                 clientObjectId: client._id,
//                 clientGSTIN: client.gstin,
//                 clientBillingAddress: client.billingAddress,
//                 clientDrugLicense: [client.drugLicense20B, client.drugLicense21B].filter(Boolean).join(', '),
//                 invoiceNumber,
//                 invoiceDate,
//                 billType,
//                 items: processedItems,
//                 totalGrossAmount: totalGross,
//                 totalTaxable,
//                 totalCGST,
//                 totalSGST,
//                 totalIGST,
//                 totalGST,
//                 roundOff,
//                 netAmount,
//                 globalDiscountPercent: globalDiscountType === 'percent' ? globalDiscountValue : 0,
//                 globalDiscountAmount: globalDiscAmt,
//                 previousOutstanding,
//                 previousOutstandingDate,
//                 totalPayable,
//                 creditApplied,
//                 dueAmount,
//                 paymentStatus,
//                 invoiceStatus: 'FINALIZED',
//                 modificationNote: modificationNote || undefined,
//             });

//             if (existingOrder) {
//                 newInvoice.orderObjectId = existingOrder._id;
//             }

//             if (createLinkedOrder) {
//                 const orderNumber = await getNextOrderNumber(client.clientId, session);
//                 linkedOrder = new Order({
//                     orderId: orderNumber,
//                     clientId: client._id,
//                     status: 'Invoiced',
//                     billPreference: billType,
//                     invoiceBillType: billType, // ✨ SAVED
//                     adminNote: adminNote || undefined,
//                     items: processedItems.map(pi => {
//                         const origItem = existingOrder ? existingOrder.items.find(oi => oi.productId.toString() === pi.productId.toString()) : null;

//                         return {
//                             productId: pi.productId,
//                             requestedQty: origItem ? origItem.requestedQty : (pi.chargeableQty + pi.freeQty),
//                             finalQty: pi.chargeableQty + pi.freeQty,
//                             chargeableQty: pi.chargeableQty,
//                             freeQty: pi.freeQty,
//                             finalPrice: pi.rate,
//                             taxableValue: pi.taxableValue,   
//                             plannedBatches: [{ batchId: pi.batchId, chargeableQty: pi.chargeableQty, freeQty: pi.freeQty }],
//                         };
//                     }),
//                     estimatedOrderTotal: netAmount,
//                     finalInvoiceAmount: netAmount,
//                     createdBy: req.admin?._id,
//                 });
//                 newInvoice.orderObjectId = linkedOrder._id;
//             }

//             await newInvoice.save({ session });
//             await client.save({ session });

//             if (existingOrder) {
//                 existingOrder.status = 'Invoiced';
//                 existingOrder.invoiceDocumentId = newInvoice._id;
//                 existingOrder.invoiceNumber = newInvoice.invoiceNumber;
//                 existingOrder.finalInvoiceAmount = netAmount;
//                 existingOrder.invoiceBillType = billType; // ✨ OVERWRITE THIS, PRESERVE PREFERENCE
//                 existingOrder.updatedBy = req.admin?._id;
//                 if (adminNote) existingOrder.adminNote = adminNote; 
//                 await existingOrder.save({ session });
//                 linkedOrder = existingOrder;
//             }

//             if (createLinkedOrder) {
//                 await linkedOrder.save({ session });
//             }

//             savedInvoice = newInvoice;
//         });

//         res.status(201).json({
//             message: `Sales Invoice ${savedInvoice.invoiceNumber} generated successfully!`,
//             data: savedInvoice,
//             order: linkedOrder || undefined,
//         });
//     } catch (error) {
//         console.error('createSalesInvoice error:', error);
//         res.status(error.message?.includes('Insufficient') ? 409 : 500).json({ message: error.message });
//     } finally {
//         await session.endSession();
//     }
// };

// exports.updateSalesInvoice = async (req, res) => {
//     const session = await mongoose.startSession();
//     try {
//         const { id } = req.params;
//         const { billType, items: newItemsInput, globalDiscountType, globalDiscountValue, adminNote } = req.body;

//         if (!newItemsInput || newItemsInput.length === 0) {
//             return res.status(400).json({ message: 'At least one item is required.' });
//         }

//         let updatedInvoice;
//         let updatedOrder; 

//         await session.withTransaction(async () => {
//             const invoice = await SalesInvoice.findById(id).session(session);
//             if (!invoice) throw new Error('Invoice not found');
//             if (invoice.invoiceStatus === 'CANCELLED') throw new Error('Cannot edit a cancelled invoice');

//             const client = await Client.findById(invoice.clientObjectId).session(session);
//             if (!client) throw new Error('Client not found');

//             const companies = await Company.find({}).session(session).select('shortCode');
//             const shortCodeMap = {};
//             companies.forEach(c => { shortCodeMap[c._id.toString()] = c.shortCode || ''; });

//             /* ── 1. FULL REVERSAL ──────────────────── */
//             for (const origItem of invoice.items) {
//                 await Batch.findByIdAndUpdate(origItem.batchId, { $inc: { totalStockQuantity: origItem.billedQty } }, { session });
//                 await Product.findByIdAndUpdate(origItem.productId, { $inc: { totalStock: origItem.billedQty } }, { session });

//                 if (origItem.lotConsumption && origItem.lotConsumption.length > 0) {
//                     for (const lot of origItem.lotConsumption) {
//                         await Batch.updateOne(
//                             { _id: origItem.batchId, "purchaseLots._id": lot.lotId },
//                             { $inc: { "purchaseLots.$.remainingQty": lot.qty } },
//                             { session }
//                         );
//                     }
//                 }
//             }

//             // Reverse client ledger
//             client.totalOutstanding = (client.totalOutstanding || 0) - invoice.dueAmount;
//             client.creditBalance = (client.creditBalance || 0) + invoice.creditApplied;

//             /* ── 2. PROCESS  ────────── */
//             let totalGross = 0, totalTaxable = 0, totalCGST = 0, totalSGST = 0;
//             const processedItems = [];

//             for (const newItem of newItemsInput) {
//                 const batch = await Batch.findById(newItem.batchId).session(session);
//                 const product = await Product.findById(newItem.productId).session(session);
//                 if (!batch || !product) throw new Error('Product or Batch missing');

//                 const companyShortCode = shortCodeMap[product.companyId?.toString()] || '';

//                 const billedQty = newItem.billedQty || (newItem.chargeableQty + (newItem.freeQty || 0));
//                 if (batch.totalStockQuantity < billedQty) {
//                     throw new Error(`Insufficient stock in Batch ${batch.batchNumber}`);
//                 }

//                 const free = newItem.freeQty || 0;
//                 const chargeable = billedQty - free;
//                 const gross = newItem.rate * chargeable;
//                 let discAmount = newItem.discountAmount || 0;
//                 const discPercent = newItem.discountPercent || 0;
//                 if (discPercent > 0) discAmount = gross * discPercent / 100;
//                 const taxable = gross - discAmount;
//                 const gstRate = product.gstRate || 0;
//                 const totalGST = taxable * gstRate / 100;
//                 const cgst = totalGST / 2;
//                 const sgst = totalGST / 2;
//                 const lineTotal = taxable + totalGST;

//                 totalGross += gross;
//                 totalTaxable += taxable;
//                 totalCGST += cgst;
//                 totalSGST += sgst;

//                 const { lotConsumption } = await deductFifo(batch._id, billedQty, session);

//                 processedItems.push({
//                     productId: newItem.productId, batchId: batch._id, productName: product.name,
//                     companyShortCode, batchNumber: batch.batchNumber, packing: product.packing,
//                     hsn: product.hsnCode, expiryDate: batch.expiryDate, mrp: batch.mrp,
//                     billedQty, chargeableQty: chargeable, freeQty: free, rate: newItem.rate,
//                     grossAmount: gross, discountPercent: discPercent, discountAmount: discAmount,
//                     taxableValue: taxable, cgst, sgst, lineTotal, lotConsumption,
//                 });

//                 await Product.findByIdAndUpdate(newItem.productId, { $inc: { totalStock: -billedQty } }, { session });
//             }

//             const totalGST = totalCGST + totalSGST;
//             let netAmount = totalTaxable + totalGST;

//             let globalDiscAmt = 0;
//             if (globalDiscountValue && globalDiscountValue > 0) {
//                 if (globalDiscountType === 'percent') {
//                     globalDiscAmt = (netAmount * globalDiscountValue) / 100;
//                 } else {
//                     globalDiscAmt = globalDiscountValue;
//                 }
//             }
//             netAmount -= globalDiscAmt;
//             const roundedNet = Math.round(netAmount);
//             const roundOff = parseFloat((roundedNet - netAmount).toFixed(2));
//             netAmount = roundedNet;

//             const previousOutstanding = client.totalOutstanding || 0;
//             const previousOutstandingDate = client.outstandingDate || null;
//             let availableCredit = client.creditBalance || 0;
//             let creditApplied = 0;
//             if (availableCredit > 0) {
//                 creditApplied = Math.min(availableCredit, netAmount);
//                 client.creditBalance -= creditApplied;
//             }
//             const totalPayable = netAmount - creditApplied;
//             const dueAmount = totalPayable;

//             let paymentStatus = 'UNPAID';
//             if (dueAmount === 0) paymentStatus = 'PAID';
//             else if (creditApplied > 0) paymentStatus = 'PARTIALLY_PAID';

//             client.totalOutstanding = previousOutstanding + dueAmount;
//             client.outstandingDate = new Date();

//             /* ── 3. Overwrite the invoice fields ──────────────────────── */
//             invoice.items = processedItems;
//             invoice.billType = billType || invoice.billType;
//             invoice.totalGrossAmount = totalGross;
//             invoice.totalTaxable = totalTaxable;
//             invoice.totalCGST = totalCGST;
//             invoice.totalSGST = totalSGST;
//             invoice.totalGST = totalGST;
//             invoice.roundOff = roundOff;
//             invoice.netAmount = netAmount;
//             invoice.globalDiscountPercent = globalDiscountType === 'percent' ? globalDiscountValue : 0;
//             invoice.globalDiscountAmount = globalDiscAmt;
//             invoice.previousOutstanding = previousOutstanding;
//             invoice.previousOutstandingDate = previousOutstandingDate;
//             invoice.totalPayable = totalPayable;
//             invoice.creditApplied = creditApplied;
//             invoice.dueAmount = dueAmount;
//             invoice.paymentStatus = paymentStatus;

//             await invoice.save({ session });
//             await client.save({ session });

//             if (invoice.orderObjectId) {
//                 const existingOrder = await Order.findById(invoice.orderObjectId).session(session);
//                 if (existingOrder) {
//                     existingOrder.items = processedItems.map(pi => {
//                         const origItem = existingOrder.items.find(oi => oi.productId.toString() === pi.productId.toString());
//                         return {
//                             productId: pi.productId,
//                             requestedQty: origItem ? origItem.requestedQty : (pi.chargeableQty + pi.freeQty),
//                             finalQty: pi.chargeableQty + pi.freeQty,
//                             chargeableQty: pi.chargeableQty,
//                             freeQty: pi.freeQty,
//                             finalPrice: pi.rate,
//                             taxableValue: pi.taxableValue,
//                             plannedBatches: [{ batchId: pi.batchId, chargeableQty: pi.chargeableQty, freeQty: pi.freeQty }],
//                         };
//                     });

//                     existingOrder.invoiceBillType = billType; // ✨ OVERWRITE INVOICE TYPE ONLY
//                     existingOrder.finalInvoiceAmount = netAmount;
//                     existingOrder.pricingSharedAt = undefined; 
//                     existingOrder.adminNote = adminNote || undefined;

//                     await existingOrder.save({ session });
//                     updatedOrder = existingOrder;
//                 }
//             }

//             updatedInvoice = invoice;
//         });

//         res.status(200).json({
//             message: `Sales Invoice ${updatedInvoice.invoiceNumber} updated successfully!`,
//             data: updatedInvoice,
//             order: updatedOrder
//         });
//     } catch (error) {
//         console.error('updateSalesInvoice error:', error);
//         res.status(error.message?.includes('Insufficient') ? 409 : 500).json({ message: error.message });
//     } finally {
//         await session.endSession();
//     }
// };

// exports.deleteSalesInvoice = async (req, res) => {
//     const session = await mongoose.startSession();
//     try {
//         const { id } = req.params;

//         let deleted;
//         await session.withTransaction(async () => {
//             const invoice = await SalesInvoice.findById(id).session(session);
//             if (!invoice) throw new Error('Invoice not found');

//             const client = await Client.findById(invoice.clientObjectId).session(session);
//             if (!client) throw new Error('Client not found');

//             // Reverse stock
//             for (const item of invoice.items) {
//                 // Restore master stock
//                 await Batch.findByIdAndUpdate(
//                     item.batchId,
//                     { $inc: { totalStockQuantity: item.billedQty } },
//                     { session }
//                 );
//                 await Product.findByIdAndUpdate(
//                     item.productId,
//                     { $inc: { totalStock: item.billedQty } },
//                     { session }
//                 );

//                 // Restore individual purchase lots
//                 if (item.lotConsumption && item.lotConsumption.length > 0) {
//                     for (const lot of item.lotConsumption) {
//                         await Batch.updateOne(
//                             { _id: item.batchId, "purchaseLots._id": lot.lotId },
//                             { $inc: { "purchaseLots.$.remainingQty": lot.qty } },
//                             { session }
//                         );
//                     }
//                 }
//             }

//             // Reverse client ledger
//             client.totalOutstanding = (client.totalOutstanding || 0) - invoice.dueAmount;
//             client.creditBalance = (client.creditBalance || 0) + invoice.creditApplied;
//             await client.save({ session });

//             // If this invoice was linked to an order, revert the order to Confirmed
//             if (invoice.orderObjectId) {
//                 await Order.findByIdAndUpdate(
//                     invoice.orderObjectId,
//                     { status: 'Confirmed', invoiceDocumentId: null, invoiceNumber: undefined, finalInvoiceAmount: undefined },
//                     { session }
//                 );
//             }

//             // Delete the invoice
//             await SalesInvoice.findByIdAndDelete(id).session(session);
//             deleted = invoice;
//         });

//         res.status(200).json({
//             message: `Invoice ${deleted.invoiceNumber} deleted and stock restored.`,
//             data: deleted,
//         });
//     } catch (error) {
//         console.error('deleteSalesInvoice error:', error);
//         res.status(500).json({ message: error.message });
//     } finally {
//         await session.endSession();
//     }
// };

// exports.getAllSalesInvoices = async (req, res) => {
//     try {
//         const invoices = await SalesInvoice.find().sort({ invoiceDate: -1 }).populate('clientObjectId', 'establishmentName city line');
//         res.status(200).json({ success: true, count: invoices.length, data: invoices });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// exports.getSalesInvoiceById = async (req, res) => {
//     try {
//         const invoice = await SalesInvoice.findById(req.params.id);
//         if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
//         res.status(200).json({ success: true, data: invoice });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };


// server/src/controllers/salesInvoiceController.js
const mongoose = require('mongoose');
const SalesInvoice = require('../models/SalesInvoice');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Client = require('../models/Client');
const Order = require('../models/Order');
const { getNextInvoiceNumber, getNextOrderNumber } = require('../helpers/SequenceHelper');
const Company = require('../models/Company');
const { deductFifo } = require('../helpers/inventoryFifo');

exports.createSalesInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { clientObjectId, billType, items, globalDiscountType, globalDiscountValue, orderId, createLinkedOrder, modificationNote, adminNote } = req.body;
        if (!clientObjectId || !billType || !items || items.length === 0) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        if (orderId && createLinkedOrder) {
            return res.status(400).json({ message: 'Pass either orderId or createLinkedOrder, not both.' });
        }

        let savedInvoice;
        let linkedOrder;
        await session.withTransaction(async () => {
            const client = await Client.findById(clientObjectId).session(session);
            if (!client) throw new Error('Client not found');

            let existingOrder = null;
            if (orderId) {
                existingOrder = await Order.findById(orderId).session(session);
                if (!existingOrder) throw new Error('Order not found');
                if (!['Placed', 'Confirmed'].includes(existingOrder.status)) {
                    throw new Error(`Order is ${existingOrder.status} — only a Placed or Confirmed order can be invoiced.`);
                }
            }

            const companies = await Company.find({}).session(session).select('shortCode');
            const shortCodeMap = {};
            companies.forEach(c => { shortCodeMap[c._id.toString()] = c.shortCode || ''; });

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
                    // ✨ FIX 1: Grab the offerDescription from req.body.items and store it in processedItems
                    offerDescription: item.offerDescription || '', 
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
                modificationNote: modificationNote || undefined,
            });

            if (existingOrder) {
                newInvoice.orderObjectId = existingOrder._id;
            }

            if (createLinkedOrder) {
                const orderNumber = await getNextOrderNumber(client.clientId, session);
                linkedOrder = new Order({
                    orderId: orderNumber,
                    clientId: client._id,
                    status: 'Invoiced',
                    billPreference: billType,
                    invoiceBillType: billType,
                    adminNote: adminNote || undefined,

                    items: processedItems.map(pi => {
                        return {
                            productId: pi.productId,
                            requestedQty: pi.chargeableQty + pi.freeQty,
                            finalQty: pi.chargeableQty + pi.freeQty,
                            chargeableQty: pi.chargeableQty,
                            freeQty: pi.freeQty,
                            finalPrice: pi.rate,
                            grossAmount: pi.grossAmount,
                            discountType: 'percent',
                            discountValue: pi.discountPercent,
                            discountAmount: pi.discountAmount,
                            taxableValue: pi.taxableValue,
                            gstRate: (pi.cgst + pi.sgst + pi.igst) > 0 ? ((pi.cgst + pi.sgst + pi.igst) / pi.taxableValue * 100) : 0,
                            gstAmount: pi.cgst + pi.sgst + pi.igst,
                            lineTotal: pi.lineTotal,
                            // ✨ FIX 2: Save offerDescription to new linked orders
                            offerDescription: pi.offerDescription, 
                            plannedBatches: [{ batchId: pi.batchId, chargeableQty: pi.chargeableQty, freeQty: pi.freeQty }],
                        };
                    }),
                    estimatedOrderTotal: netAmount,
                    finalInvoiceAmount: netAmount,
                    createdBy: req.admin?._id,
                });
                newInvoice.orderObjectId = linkedOrder._id;
            }

            await newInvoice.save({ session });
            await client.save({ session });

            if (existingOrder) {
                existingOrder.status = 'Invoiced';
                existingOrder.invoiceDocumentId = newInvoice._id;
                existingOrder.invoiceNumber = newInvoice.invoiceNumber;
                existingOrder.finalInvoiceAmount = netAmount;
                existingOrder.invoiceBillType = billType;
                existingOrder.updatedBy = req.admin?._id;
                if (adminNote) existingOrder.adminNote = adminNote;

                // ✨ OVERWRITE ORDER ITEMS WITH FINAL INVOICE CALCS
                existingOrder.items = processedItems.map(pi => {
                    const origItem = existingOrder.items.find(oi => oi.productId.toString() === pi.productId.toString());
                    return {
                        productId: pi.productId,
                        requestedQty: origItem ? origItem.requestedQty : (pi.chargeableQty + pi.freeQty),
                        finalQty: pi.chargeableQty + pi.freeQty,
                        chargeableQty: pi.chargeableQty,
                        freeQty: pi.freeQty,
                        finalPrice: pi.rate,
                        grossAmount: pi.grossAmount,
                        discountType: origItem ? origItem.discountType : (pi.discountAmount > 0 && pi.discountPercent === 0 ? 'amount' : 'percent'),
                        discountValue: origItem && origItem.discountType === 'amount' ? pi.discountAmount : pi.discountPercent,
                        discountAmount: pi.discountAmount,
                        taxableValue: pi.taxableValue,
                        gstRate: (pi.cgst + pi.sgst + pi.igst) > 0 ? ((pi.cgst + pi.sgst + pi.igst) / pi.taxableValue * 100) : 0,
                        gstAmount: pi.cgst + pi.sgst + pi.igst,
                        lineTotal: pi.lineTotal,
                        // ✨ FIX 3: Preserve offerDescription in overwritten order items!
                        offerDescription: pi.offerDescription || (origItem ? origItem.offerDescription : ''),
                        plannedBatches: [{ batchId: pi.batchId, chargeableQty: pi.chargeableQty, freeQty: pi.freeQty }],
                    };
                });

                await existingOrder.save({ session });
                linkedOrder = existingOrder;
            }

            if (createLinkedOrder) {
                await linkedOrder.save({ session });
            }

            savedInvoice = newInvoice;
        });

        res.status(201).json({
            message: `Sales Invoice ${savedInvoice.invoiceNumber} generated successfully!`,
            data: savedInvoice,
            order: linkedOrder || undefined,
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
        const { billType, items: newItemsInput, globalDiscountType, globalDiscountValue, adminNote } = req.body;

        if (!newItemsInput || newItemsInput.length === 0) {
            return res.status(400).json({ message: 'At least one item is required.' });
        }

        let updatedInvoice;
        let updatedOrder;

        await session.withTransaction(async () => {
            const invoice = await SalesInvoice.findById(id).session(session);
            if (!invoice) throw new Error('Invoice not found');
            if (invoice.invoiceStatus === 'CANCELLED') throw new Error('Cannot edit a cancelled invoice');

            const client = await Client.findById(invoice.clientObjectId).session(session);
            if (!client) throw new Error('Client not found');

            const companies = await Company.find({}).session(session).select('shortCode');
            const shortCodeMap = {};
            companies.forEach(c => { shortCodeMap[c._id.toString()] = c.shortCode || ''; });

            /* ── 1. FULL REVERSAL ──────────────────── */
            for (const origItem of invoice.items) {
                await Batch.findByIdAndUpdate(origItem.batchId, { $inc: { totalStockQuantity: origItem.billedQty } }, { session });
                await Product.findByIdAndUpdate(origItem.productId, { $inc: { totalStock: origItem.billedQty } }, { session });

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

            /* ── 2. PROCESS  ────────── */
            // ✨ FIX: Added totalIGST = 0
            let totalGross = 0, totalTaxable = 0, totalCGST = 0, totalSGST = 0, totalIGST = 0;
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

                // ✨ FIX: Defined igst
                const igst = 0;

                const lineTotal = taxable + totalGST;

                totalGross += gross;
                totalTaxable += taxable;
                totalCGST += cgst;
                totalSGST += sgst;

                // ✨ FIX: Added to totalIGST
                totalIGST += igst;

                const { lotConsumption } = await deductFifo(batch._id, billedQty, session);

                processedItems.push({
                    productId: newItem.productId, batchId: batch._id, productName: product.name,
                    companyShortCode, batchNumber: batch.batchNumber, packing: product.packing,
                    hsn: product.hsnCode, expiryDate: batch.expiryDate, mrp: batch.mrp,
                    billedQty, chargeableQty: chargeable, freeQty: free, rate: newItem.rate,
                    grossAmount: gross, discountPercent: discPercent, discountAmount: discAmount,

                    // ✨ FIX: Pushed igst into the processed item array
                    taxableValue: taxable, cgst, sgst, igst, lineTotal, lotConsumption,
                });

                await Product.findByIdAndUpdate(newItem.productId, { $inc: { totalStock: -billedQty } }, { session });
            }

            // ✨ FIX: Added totalIGST to the final math
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
            client.outstandingDate = new Date();

            /* ── 3. Overwrite the invoice fields ──────────────────────── */
            invoice.items = processedItems;
            invoice.billType = billType || invoice.billType;
            invoice.totalGrossAmount = totalGross;
            invoice.totalTaxable = totalTaxable;
            invoice.totalCGST = totalCGST;
            invoice.totalSGST = totalSGST;
            invoice.totalIGST = totalIGST;
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

            if (invoice.orderObjectId) {
                const existingOrder = await Order.findById(invoice.orderObjectId).session(session);
                if (existingOrder) {

                    // ✨ SYNC ALL INVOICE DATA DIRECTLY INTO THE ORDER
                    existingOrder.items = processedItems.map(pi => {
                        const origItem = existingOrder.items.find(oi => oi.productId.toString() === pi.productId.toString());
                        return {
                            productId: pi.productId,
                            requestedQty: origItem ? origItem.requestedQty : (pi.chargeableQty + pi.freeQty),
                            finalQty: pi.chargeableQty + pi.freeQty,
                            chargeableQty: pi.chargeableQty,
                            freeQty: pi.freeQty,

                            // ✨ FIX: Preserve the MRP and Expiry snapshots!
                            mrp: origItem ? origItem.mrp : pi.mrp,
                            expiryDate: origItem ? origItem.expiryDate : pi.expiryDate,

                            finalPrice: pi.rate,
                            grossAmount: pi.grossAmount,
                            discountType: origItem ? origItem.discountType : (pi.discountAmount > 0 && pi.discountPercent === 0 ? 'amount' : 'percent'),
                            discountValue: origItem && origItem.discountType === 'amount' ? pi.discountAmount : pi.discountPercent,
                            discountAmount: pi.discountAmount,
                            taxableValue: pi.taxableValue,
                            gstRate: (pi.cgst + pi.sgst + pi.igst) > 0 ? ((pi.cgst + pi.sgst + pi.igst) / pi.taxableValue * 100) : 0,
                            gstAmount: pi.cgst + pi.sgst + pi.igst,
                            lineTotal: pi.lineTotal,
                            plannedBatches: [{ batchId: pi.batchId, chargeableQty: pi.chargeableQty, freeQty: pi.freeQty }],
                        };
                    });

                    existingOrder.invoiceBillType = billType;
                    existingOrder.finalInvoiceAmount = netAmount;
                    existingOrder.pricingSharedAt = undefined;
                    existingOrder.adminNote = adminNote || undefined;

                    await existingOrder.save({ session });
                    updatedOrder = existingOrder;
                }
            }

            updatedInvoice = invoice;
        });

        res.status(200).json({
            message: `Sales Invoice ${updatedInvoice.invoiceNumber} updated successfully!`,
            data: updatedInvoice,
            order: updatedOrder
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

                // Restore individual purchase lots
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

            // If this invoice was linked to an order, revert the order to Confirmed
            if (invoice.orderObjectId) {
                await Order.findByIdAndUpdate(
                    invoice.orderObjectId,
                    { status: 'Confirmed', invoiceDocumentId: null, invoiceNumber: undefined, finalInvoiceAmount: undefined },
                    { session }
                );
            }

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