// // server/src/helpers/invoicePdfGenerator.js

// // ✨ FIX: Bulletproof import that handles both CommonJS and ES6 export styles
// const pdfModule = require('./invoicePDF/generateInvoicePdf');
// const generateInvoicePdfDoc = typeof pdfModule === 'function' ? pdfModule : (pdfModule.generateInvoicePdfDoc || pdfModule.default);

// const toInvoiceData = (invoice) => ({
//   id: invoice.invoiceNumber,
//   client: invoice.clientName,
//   gstin: invoice.clientGSTIN,
//   drugLicense: invoice.clientDrugLicense,
//   city: invoice.clientObjectId?.city || invoice.clientObjectId?.district || '',
//   date: invoice.invoiceDate,
//   previousBalance: invoice.previousOutstanding || 0,
//   previousBalanceDate: invoice.previousOutstandingDate || null,
//   billType: invoice.billType,
// });

// const deriveGstRate = (item) => {
//   if (!item.taxableValue) return 0;
//   const totalTax = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
//   return (totalTax / item.taxableValue) * 100;
// };

// const toLineItems = (invoice) =>
//   (invoice.items || []).map((item) => ({
//     productName: item.productName,
//     company: item.companyShortCode,
//     companyShortCode: item.companyShortCode,
//     hsn: item.hsn,
//     packing: item.packing,
//     batchNumber: item.batchNumber,
//     expiryDate: item.expiryDate,
//     mrp: item.mrp,
//     rate: item.rate,
//     chargeableQty: item.chargeableQty,
//     freeQty: item.freeQty || 0,
//     discountPercent: item.discountPercent || 0,
//     discountAmount: item.discountAmount || 0,
//     taxableValue: item.taxableValue,
//     grossAmount: item.grossAmount,
//     cgst: item.cgst || 0,
//     sgst: item.sgst || 0,
//     igst: item.igst || 0,
//     lineTotal: item.lineTotal,
//     gstRate: deriveGstRate(item),
//   }));

// async function generateInvoicePdfBuffer(invoice) {
//   // Defensive check so we never get a ghost error again
//   if (typeof generateInvoicePdfDoc !== 'function') {
//       throw new Error("CRITICAL: generateInvoicePdfDoc is still not being exported properly from ./invoicePDF/generateInvoicePdf.js");
//   }

//   const allItems = toLineItems(invoice);
//   const invoiceData = toInvoiceData(invoice);
//   const billGstType = (invoice.totalIGST || 0) > 0 ? 'interstate' : 'intrastate';

//   const doc = generateInvoicePdfDoc(
//     invoiceData,
//     allItems,
//     invoice.totalTaxable,
//     invoice.totalCGST,
//     invoice.totalSGST,
//     invoice.netAmount,
//     invoice.globalDiscountPercent,
//     invoice.globalDiscountAmount,
//     billGstType
//   );

//   const arrayBuffer = doc.output('arraybuffer');
//   return Buffer.from(arrayBuffer);
// }

// module.exports = { generateInvoicePdfBuffer };



// server/src/helpers/invoicePdfGenerator.js
const { jsPDF } = require('jspdf');

// ✨ FIX: Added './invoicePDF/' to the paths so Node knows where to find them!
const { CONTENT } = require('./invoicePDF/pdfGeometry.js');
const { formatPacking, formatExpiryForBill, getPageSizes } = require('./invoicePDF/pdfHelpers.js');
const { drawPageBorder, drawHeader, drawItemsTable, drawBillTotalLine, drawFooter } = require('./invoicePDF/pdfDraw.js');

exports.generateInvoicePdfBuffer = async (invoiceData) => {
    const allItems = invoiceData.items || [];
    const pageSizes = getPageSizes(allItems.length);
    const totalPages = pageSizes.length;
    
    // We determine GST type based on whether IGST is present
    const isInterstate = invoiceData.totalIGST > 0;

    const seller = {
        name: 'M/S MILA AGENCIES',
        address: 'UPENDRA BHANJA COLONY, BERHAMPUR-760008',
        dist: 'GANJAM',
        phone: '9437176172, 9438537878',
        dlNo: 'SL-GA-I-3902-W, GA-I-3903-WC, GA-I-3904-WX',
        gstin: '21CIJPM8416K1Z2',
        drugsBazaarId: 'MILBER008548',
    };

    const buyer = invoiceData.clientName;
    const buyerGstin = invoiceData.clientGSTIN || '21AGNPB6114D1Z2';
    const buyerDl = invoiceData.clientDrugLicense || 'GA/457R, 458RC GA-I-235RX';
    const buyerCity = invoiceData.clientObjectId?.city || invoiceData.clientBillingAddress || '';
    const buyerState = 'Odisha';
    const buyerStateCode = '21';
    
    const invoiceNo = invoiceData.invoiceNumber;
    const invoiceDate = invoiceData.invoiceDate;
    const previousBalance = invoiceData.previousOutstanding || 0;
    const previousOutstandingDate = invoiceData.previousOutstandingDate || null;
    const billType = invoiceData.billType || 'Credit';

    // Safely check for .toObject() so it doesn't crash on plain JS arrays
    const enhancedItems = allItems.map(item => {
        let discountDisplay = '';
        if (item.discountPercent > 0) discountDisplay = `${item.discountPercent}%`;
        else if (item.discountAmount > 0) discountDisplay = `Rs.${item.discountAmount.toFixed(2)}`;

        const itemObj = typeof item.toObject === 'function' ? item.toObject() : item;
        return { ...itemObj, discountDisplay };
    });

    let start = 0, itemIndex = 0;
    const pages = pageSizes.map((size, idx) => {
        const pageItems = enhancedItems.slice(start, start + size);
        start += size;
        const isLastPage = idx === totalPages - 1;
        let pageTaxable = 0, pageCGST = 0, pageSGST = 0, pageIGST = 0, pageLineTotal = 0;

        const itemRows = pageItems.map((item, rowIdx) => {
            const slNo = itemIndex + rowIdx + 1;
            pageTaxable += item.taxableValue;
            pageCGST += item.cgst || 0;
            pageSGST += item.sgst || 0;
            pageIGST += item.igst || 0;
            pageLineTotal += item.lineTotal;
            
            // Reconstruct the GST Rate from the raw amounts
            let gstRate = 0;
            if (item.taxableValue > 0) {
                if (isInterstate) gstRate = ((item.igst || 0) / item.taxableValue) * 100;
                else gstRate = (((item.cgst || 0) + (item.sgst || 0)) / item.taxableValue) * 100;
            }

            const taxCols = isInterstate
                ? [`${(item.igst || 0).toFixed(2)} (${gstRate.toFixed(1)}%)`]
                : [`${(item.cgst || 0).toFixed(2)} (${(gstRate / 2).toFixed(1)}%)`, `${(item.sgst || 0).toFixed(2)} (${(gstRate / 2).toFixed(1)}%)`];

            return [
                String(slNo),
                item.companyShortCode || '',
                item.productName || '',
                item.hsn || '',
                formatPacking(item.packing),
                item.batchNumber || '',
                formatExpiryForBill(item.expiryDate),
                item.mrp.toFixed(2),
                item.rate.toFixed(2),
                (item.freeQty || 0) > 0 ? `${item.chargeableQty}+${item.freeQty}` : `${item.chargeableQty}`,
                item.discountDisplay,
                item.taxableValue.toFixed(2),
                ...taxCols,
                item.lineTotal.toFixed(2),
            ];
        });

        itemIndex += pageItems.length;
        return {
            rows: itemRows, isLastPage, pageIdx: idx + 1,
            pageTaxable, pageCGST, pageSGST, pageIGST, pageLineTotal,
            pageTotalItems: pageItems.length,
        };
    });

    const taxSummaryStr = Object.values(
        enhancedItems.reduce((acc, item) => {
            let rate = 0;
            if (item.taxableValue > 0) {
                rate = isInterstate 
                    ? Math.round(((item.igst || 0) / item.taxableValue) * 100) 
                    : Math.round((((item.cgst || 0) + (item.sgst || 0)) / item.taxableValue) * 100);
            }
            const key = `${item.hsn || '0'}|${rate}`;
            if (!acc[key]) acc[key] = { hsn: item.hsn || '', rate, qty: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
            
            acc[key].qty += item.billedQty || item.chargeableQty;
            acc[key].taxable += item.taxableValue || 0;
            acc[key].cgst += item.cgst || 0;
            acc[key].sgst += item.sgst || 0;
            acc[key].igst += item.igst || 0;
            return acc;
        }, {})
    ).map(g => isInterstate
        ? `HSN ${g.hsn} Q${g.qty} ${g.rate}% A${g.taxable.toFixed(2)} I${g.igst.toFixed(2)}`
        : `HSN ${g.hsn} Q${g.qty} ${g.rate}% A${g.taxable.toFixed(2)} C${g.cgst.toFixed(2)} S${g.sgst.toFixed(2)}`
    ).join(', ');

    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

    const RAW_COLS = isInterstate
        ? { sl: 4, mf: 10, name: 30, hsn: 10, pack: 9, batch: 14, exp: 7, mrp: 9, rate: 8, qty: 8, disc: 11, taxable: 12, igst: 16, total: 13 }
        : { sl: 4, mf: 10, name: 30, hsn: 10, pack: 8, batch: 14, exp: 7, mrp: 8, rate: 8, qty: 8, disc: 10, taxable: 11, cgst: 12, sgst: 12, total: 12 };

    const rawTotal = Object.values(RAW_COLS).reduce((a, b) => a + b, 0);
    const scale = CONTENT.w / rawTotal;
    const COLS = Object.fromEntries(Object.entries(RAW_COLS).map(([k, v]) => [k, v * scale]));

    const TABLE_HEAD = isInterstate
        ? ['Sl', 'Co.', 'Product Name', 'HSN', 'Pack', 'Batch No.', 'Exp.', 'MRP', 'Rate', 'Qty.', 'Dis.',  'Taxable', 'IGST (%)','Total']
        : ['Sl', 'Co.', 'Product Name', 'HSN', 'Pack', 'Batch No.', 'Exp.', 'MRP', 'Rate', 'Qty.', 'Dis.',  'Taxable', 'CGST (%)', 'SGST (%)','Total'];

    pages.forEach((page, pageIdx) => {
        if (pageIdx > 0) doc.addPage();
        drawPageBorder(doc);
        let cursorY = drawHeader(doc, { seller, buyer, buyerGstin, buyerDl, buyerCity, buyerState, buyerStateCode, invoiceNo, invoiceDate, billType });

        const showPageTotal = totalPages > 1;
        const tableEndY = drawItemsTable(doc, page, TABLE_HEAD, COLS, cursorY, showPageTotal, isInterstate);

        if (page.isLastPage) {
            const billTotalEndY = drawBillTotalLine(doc, tableEndY, {
                overallTaxable: invoiceData.totalTaxable,
                overallCGST: invoiceData.totalCGST,
                overallSGST: invoiceData.totalSGST,
                overallIGST: invoiceData.totalIGST,
                overallLineDiscount: invoiceData.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0),
                billDiscountAmount: invoiceData.globalDiscountAmount,
                roundOff: invoiceData.roundOff,
                roundedNet: invoiceData.netAmount,
                isInterstate,
            });
            drawFooter(doc, billTotalEndY, {
                taxSummaryStr,
                overallLineTotal: invoiceData.netAmount,
                allItems: enhancedItems,
                previousBalance,
                previousOutstandingDate,
                buyer,
                invoiceDate,
            });
        }
    });

    return Buffer.from(doc.output('arraybuffer'));
};