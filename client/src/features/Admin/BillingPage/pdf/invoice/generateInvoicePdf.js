// generateInvoicePdf.js

import { jsPDF } from 'jspdf';
import { CONTENT, CONTENT_PAD } from './pdfGeometry';
import {
  formatPacking,
  formatExpiryForBill,
  getPageSizes,
} from './pdfHelpers';
import {
  drawPageBorder,
  drawHeader,
  drawItemsTable,
  drawBillTotalLine,
  drawFooter,
} from './pdfDraw';

export const downloadInvoicePDF = (
  invoiceData,
  allItems,
  totalTaxable,
  totalCGST,
  totalSGST,
  netAmount,
  globalDiscValue,
  finalDiscount,
  billGstType = 'intrastate'
) => {
  const doc = generateInvoicePdfDoc(
    invoiceData, allItems, totalTaxable, totalCGST, totalSGST,
    netAmount, globalDiscValue, finalDiscount, billGstType
  );
  doc.save(`Invoice-${invoiceData.id || 'untitled'}.pdf`);
};

export const printInvoicePDF = (
  invoiceData, allItems, totalTaxable, totalCGST, totalSGST,
  netAmount, globalDiscValue, finalDiscount, billGstType = 'intrastate'
) => {
  const doc = generateInvoicePdfDoc(
    invoiceData, allItems, totalTaxable, totalCGST, totalSGST,
    netAmount, globalDiscValue, finalDiscount, billGstType
  );

  // Tell the PDF to open the print dialog immediately when opened
  doc.autoPrint();

  // Create a temporary URL in the browser's memory and open it in a new tab
  const blobURL = doc.output('bloburl');
  window.open(blobURL, '_blank');
};

export const generateInvoicePdfDoc = (
  invoiceData,
  allItems,
  totalTaxable,
  totalCGST,
  totalSGST,
  netAmount,
  globalDiscValue,
  finalDiscount,
  billGstType = 'intrastate'
) => {
  const pageSizes = getPageSizes(allItems.length);
  const totalPages = pageSizes.length;
  const isInterstate = billGstType === 'interstate';

  const seller = {
    name: 'M/S MILA AGENCIES',
    address: 'UPENDRA BHANJA COLONY, BERHAMPUR-760008',
    dist: 'GANJAM',
    phone: '9437176172, 9438537878',
    dlNo: 'SL-GA-I-3902-W, GA-I-3903-WC, GA-I-3904-WX',
    gstin: '21CIJPM8416K1Z2',
    drugsBazaarId: 'MILBER008548',
  };

  const buyer = invoiceData.client;
  const buyerGstin = invoiceData.gstin || '21AGNPB6114D1Z2';
  const buyerDl = invoiceData.drugLicense || 'GA/457R, 458RC GA-I-235RX';
  const buyerCity = invoiceData.city || invoiceData.area || '';
  const buyerState = 'Odisha';
  const buyerStateCode = '21';
  const invoiceNo = invoiceData.id;
  const invoiceDate = invoiceData.date;
  const previousBalance = invoiceData.previousBalance || 0;
  const previousOutstandingDate = invoiceData.previousBalanceDate || null;
  const billType = invoiceData.billType || 'Credit';

  // Item math
  let overallTaxable = 0, overallCGST = 0, overallSGST = 0, overallIGST = 0;
  let overallLineDiscount = 0, overallLineTotal = 0;

  const enhancedItems = allItems.map(item => {
    const gross = item.grossAmount ?? (item.chargeableQty * item.rate);
    let discountAmount = item.discountAmount ?? 0;
    if (item.discountAmount === undefined && item.discountValue > 0) {
      discountAmount = item.discountType === 'percent' ? (gross * item.discountValue) / 100 : item.discountValue;
    }
    const taxable = item.taxableValue ?? (gross - discountAmount);
    let cgst = 0, sgst = 0, igst = 0;
    if (isInterstate) {
      igst = item.igst ?? (taxable * (item.gstRate) / 100);
    } else {
      cgst = item.cgst ?? (taxable * (item.gstRate / 2) / 100);
      sgst = item.sgst ?? (taxable * (item.gstRate / 2) / 100);
    }
    const lineTotal = item.lineTotal ?? (taxable + cgst + sgst + igst);

    let discountDisplay = '';
    if (item.discountPercent > 0) discountDisplay = `${item.discountPercent}%`;
    else if (item.discountType === 'percent' && item.discountValue > 0) discountDisplay = `${item.discountValue}%`;
    else if (discountAmount > 0) discountDisplay = `Rs.${discountAmount.toFixed(2)}`;

    overallTaxable += taxable;
    overallCGST += cgst;
    overallSGST += sgst;
    overallIGST += igst;
    overallLineDiscount += discountAmount;
    overallLineTotal += lineTotal;

    return { ...item, taxable, cgst, sgst, igst, discountAmount, discountDisplay, lineTotal };
  });

  const billDiscountAmount = finalDiscount ?? 0;
  const netBeforeRoundOff = overallLineTotal - billDiscountAmount;
  const roundedNet = Math.round(netBeforeRoundOff);
  const roundOff = parseFloat((roundedNet - netBeforeRoundOff).toFixed(2));

  // Pagination
  let start = 0, itemIndex = 0;
  const pages = pageSizes.map((size, idx) => {
    const pageItems = enhancedItems.slice(start, start + size);
    start += size;
    const isLastPage = idx === totalPages - 1;
    let pageTaxable = 0, pageCGST = 0, pageSGST = 0, pageIGST = 0, pageLineTotal = 0;

    const itemRows = pageItems.map((item, rowIdx) => {
      const slNo = itemIndex + rowIdx + 1;
      pageTaxable += item.taxable;
      pageCGST += item.cgst;
      pageSGST += item.sgst;
      pageIGST += item.igst;
      pageLineTotal += item.lineTotal;
      const gstRate = parseFloat(item.gstRate) || 0;

      const taxCols = isInterstate
        ? [`${item.igst.toFixed(2)} (${gstRate.toFixed(1)}%)`]
        : [`${item.cgst.toFixed(2)} (${(gstRate / 2).toFixed(1)}%)`, `${item.sgst.toFixed(2)} (${(gstRate / 2).toFixed(1)}%)`];

      const productNameWithHSN = item.hsn ? `${item.productName || ''} - ${item.hsn}` : (item.productName || '');

      return [
        String(slNo),
        item.companyShortCode || item.company || '',
        productNameWithHSN,
        formatPacking(item.packing),
        item.batchNumber || '',
        formatExpiryForBill(item.expiryDate),
        item.mrp.toFixed(2),
        item.rate.toFixed(2),
        (item.freeQty || 0) > 0 ? `${item.chargeableQty}+${item.freeQty}` : `${item.chargeableQty}`,
        item.discountDisplay,
        item.taxable.toFixed(2),
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

  // Tax summary string
  const taxSummaryStr = Object.values(
    allItems.reduce((acc, item) => {
      const rate = item.gstRate;
      const key = `${item.hsn}|${rate}`;
      if (!acc[key]) acc[key] = { hsn: item.hsn, rate, qty: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
      const taxable = item.chargeableQty * item.rate;
      acc[key].qty += item.chargeableQty + (item.freeQty || 0);
      acc[key].taxable += taxable;
      if (isInterstate) {
        acc[key].igst += taxable * (rate) / 100;
      } else {
        acc[key].cgst += taxable * (rate / 2) / 100;
        acc[key].sgst += taxable * (rate / 2) / 100;
      }
      return acc;
    }, {})
  ).map(g => isInterstate
    ? `HSN ${g.hsn} Q${g.qty} ${g.rate}% A${g.taxable.toFixed(2)} I${g.igst.toFixed(2)}`
    : `HSN ${g.hsn} Q${g.qty} ${g.rate}% A${g.taxable.toFixed(2)} C${g.cgst.toFixed(2)} S${g.sgst.toFixed(2)}`
  ).join(', ');

  // Build PDF document
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

  const RAW_COLS = isInterstate
    ? { sl: 4, mf: 11, name: 33, pack: 9, batch: 14, exp: 7, mrp: 9, rate: 8, qty: 7, taxable: 12, igst: 16, disc: 11, total: 13 }
    : { sl: 4, mf: 11, name: 32, pack: 9, batch: 14, exp: 7, mrp: 9, rate: 8, qty: 7, taxable: 11, cgst: 13, sgst: 13, disc: 10, total: 12 };

  const rawTotal = Object.values(RAW_COLS).reduce((a, b) => a + b, 0);
  const scale = CONTENT.w / rawTotal;
  const COLS = Object.fromEntries(Object.entries(RAW_COLS).map(([k, v]) => [k, v * scale]));

  const TABLE_HEAD = isInterstate
    ? ['Sl', 'Co.', 'Product Name - (HSN)', 'Pack', 'Batch No.', 'Exp.', 'MRP', 'Rate', 'Qty.', 'Dis.',  'Taxable', 'IGST (%)','Total']
    : ['Sl', 'Co.', 'Product Name - (HSN)', 'Pack', 'Batch No.', 'Exp.', 'MRP', 'Rate', 'Qty.', 'Dis.',  'Taxable', 'CGST (%)', 'SGST (%)','Total'];

  pages.forEach((page, pageIdx) => {
    if (pageIdx > 0) doc.addPage();
    drawPageBorder(doc);
    let cursorY = drawHeader(doc, { seller, buyer, buyerGstin, buyerDl, buyerCity, buyerState, buyerStateCode, invoiceNo, invoiceDate, billType });

    const showPageTotal = totalPages > 1;
    const tableEndY = drawItemsTable(doc, page, TABLE_HEAD, COLS, cursorY, showPageTotal, isInterstate);

    if (page.isLastPage) {
      const billTotalEndY = drawBillTotalLine(doc, tableEndY, {
        overallTaxable, overallCGST, overallSGST, overallIGST,
        overallLineDiscount, billDiscountAmount, roundOff, roundedNet,
        isInterstate,
      });
      drawFooter(doc, billTotalEndY, {
        taxSummaryStr, overallLineTotal: roundedNet, allItems, previousBalance, previousOutstandingDate, buyer, invoiceDate,
      });
    }
  });

  return doc;
};