// CompaniesPage/pdf/generatePurchaseBillPdf.js
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { A4, BORDER, CONTENT, BILL_TOTAL_GAP_MM } from '../../BillingPage/pdf/invoice/pdfGeometry';
import {
  formatExpiryForBill,
  formatDateIndian,
  numberToWords,
  getPageSizes,
} from '../../BillingPage/pdf/invoice/pdfHelpers';
import {
  drawPageBorder,
  drawItemsTable,
  drawBillTotalLine,
} from '../../BillingPage/pdf/invoice/pdfDraw';

// Same fixed identity used everywhere else in the app (matches
// generateInvoicePdf.js's `seller` block) — on a purchase bill, this is
// the "Bill To" side instead of "From".
const US = {
  name: 'M/S MILA AGENCIES',
  address: 'UPENDRA BHANJA COLONY, BERHAMPUR-760008',
  dist: 'GANJAM',
  phone: '9437176172, 9438537878',
  dlNo: 'SL-GA-I-3902-W, GA-I-3903-WC, GA-I-3904-WX',
  gstin: '21CIJPM8416K1Z2',
  drugsBazaarId: 'MILBER008548',
};

/**
 * drawPurchaseBillHeader
 * Mirrors drawHeader's three-column layout (From / meta / To), but with the
 * sides swapped for a purchase bill: the SUPPLIER is "From", and we (Mila
 * Agencies) are "To". Kept as a standalone function in this file (not added
 * to the real pdfDraw.js) so the working invoice header is never touched.
 */
function drawPurchaseBillHeader(doc, info) {
  const { supplier, supplierGSTIN, billNumber, billDate, billType } = info;

  const top = CONTENT.y;
  const colGap = 2;
  const colW = (CONTENT.w - colGap * 2) / 3;
  const fromX = CONTENT.x;
  const middleX = CONTENT.x + colW + colGap;
  const toX = CONTENT.x + (colW + colGap) * 2;

  // From: Supplier
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const supplierNameWrapped = doc.splitTextToSize(supplier.name, colW - 1);
  doc.text(supplierNameWrapped, fromX, top + 3.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  let y = top + 3.5 + supplierNameWrapped.length * 3.2 + 1.5;
  const supplierLines = [
    supplier.address || '',
    [supplier.city, supplier.state].filter(Boolean).join(', '),
    supplierGSTIN ? `GSTIN: ${supplierGSTIN}` : '',
  ].filter(Boolean);
  supplierLines.forEach(line => {
    const wrapped = doc.splitTextToSize(line, colW - 1);
    doc.text(wrapped, fromX, y);
    y += wrapped.length * 2.8;
  });

  // Middle: meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PURCHASE BILL', middleX + colW / 2, top + 4.2, { align: 'center' });

  doc.setFontSize(8.5);
  const metaLines = [`Bill No: ${billNumber}`, `Date: ${formatDateIndian(billDate)}`, `Bill Type: ${billType}`];
  let metaY = top + 9;
  metaLines.forEach(line => {
    doc.text(line, middleX + colW / 2, metaY, { align: 'center' });
    metaY += 3.5;
  });

  // To: Us
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const toHeader = `Bill To: ${US.name}`;
  const toHeaderWrapped = doc.splitTextToSize(toHeader, colW - 1);
  doc.text(toHeaderWrapped, toX, top + 3.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  let ty = top + 3.5 + toHeaderWrapped.length * 3.2 + 1.8;
  const toLines = [
    US.address,
    `DIST. ${US.dist}, Phone: ${US.phone}`,
    `GSTIN: ${US.gstin}`,
  ];
  toLines.forEach(line => {
    const wrapped = doc.splitTextToSize(line, colW - 1);
    doc.text(wrapped, toX, ty);
    ty += wrapped.length * 2.8;
  });

  const headerBottom = Math.max(y, ty, metaY) + 1;
  doc.setLineWidth(0.1);
  doc.setDrawColor(170, 170, 170);
  doc.line(CONTENT.x, headerBottom, CONTENT.x + CONTENT.w, headerBottom);
  doc.line(middleX - colGap / 2, top, middleX - colGap / 2, headerBottom);
  doc.line(toX - colGap / 2, top, toX - colGap / 2, headerBottom);

  return headerBottom + 1.5;
}

/**
 * drawPurchaseBillFooter
 * Simplified vs the invoice footer — no "Previous Balance / New Balance"
 * line, since that's a client running-ledger concept that doesn't apply
 * to what we owe a supplier on a single bill. Otherwise the same shape:
 * tax summary box, amount-in-words box, item count line, terms, signatures.
 */
function drawPurchaseBillFooter(doc, startY, info) {
  const { taxSummaryStr, netAmount, allItems, supplierName } = info;
  const left = CONTENT.x;
  const width = CONTENT.w;
  const bottomEdge = BORDER.y + BORDER.h - 1.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  const taxSummaryWrapped = doc.splitTextToSize(`Tax Summary: ${taxSummaryStr}`, width - 2);
  const taxBoxH = taxSummaryWrapped.length * 2.3 + 2;

  doc.setFontSize(6.5);
  const wordsText = `Amount in Words: ${numberToWords(Math.round(netAmount))}`;
  const wordsWrapped = doc.splitTextToSize(wordsText, width - 3);
  const wordsBoxH = wordsWrapped.length * 2.5 + 2;

  const extraLineH = 4.5;

  doc.setFontSize(6);
  const termsText = 'Terms: E.&O.E. * Goods received in good condition unless noted otherwise. ' +
    'Net amount rounded off. Subject to verification against physical stock.';
  const termsWrapped = doc.splitTextToSize(termsText, width * 0.62);
  const termsBoxH = Math.max(termsWrapped.length * 2.3, 3.5) + 2;

  const signatureBoxH = 6;
  const gapBetween = 1.2;
  const totalFooterH = taxBoxH + gapBetween + wordsBoxH + gapBetween + extraLineH + gapBetween + termsBoxH + gapBetween + signatureBoxH;

  let y = Math.max(startY, bottomEdge - totalFooterH);

  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(253, 224, 71);
  doc.setLineWidth(0.1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.rect(left, y, width, taxBoxH, 'FD');
  doc.setTextColor(0, 0, 0);
  doc.text(taxSummaryWrapped, left + 1, y + 2.6);
  y += taxBoxH + gapBetween;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.setFontSize(6.5);
  doc.line(left, y, left, y + wordsBoxH);
  doc.rect(left, y, width, wordsBoxH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text(wordsWrapped, left + 1.5, y + 2.7);
  doc.setFont('helvetica', 'normal');
  y += wordsBoxH + gapBetween;

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  const totalUnits = allItems.reduce((s, i) => s + (i.billedQty || 0) + (i.freeQty || 0), 0);
  const totalItemsCount = allItems.length;
  doc.text(`Total : ${totalUnits} units of ${totalItemsCount} Item(s)`, left, y + 2.2);
  y += extraLineH + gapBetween;

  doc.setDrawColor(170, 170, 170);
  doc.setLineWidth(0.1);
  doc.line(left, y, left + width, y);
  y += 1.8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(termsWrapped, left, y + 1.6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(`Net Amount: Rs.${netAmount.toFixed(2)}`, left + width, y + 1.6, { align: 'right' });
  y += termsBoxH - 1.8 + gapBetween;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 90, 105);
  doc.setDrawColor(80, 90, 105);
  doc.setLineWidth(0.15);
  const receivedByText = `Received By (${US.name})`;
  const supplierSigText = `Signature (${supplierName})`;
  const receivedByW = Math.max(40, doc.getTextWidth(receivedByText));
  const supplierSigW = Math.max(40, doc.getTextWidth(supplierSigText));
  doc.line(left, y, left + receivedByW, y);
  doc.text(receivedByText, left, y + 2.6, { align: 'left' });
  doc.line(left + width - supplierSigW, y, left + width, y);
  doc.text(supplierSigText, left + width, y + 2.6, { align: 'right' });
  doc.setTextColor(0, 0, 0);
}

const buildPurchaseBillDoc = (bill) => {
  const allItems = bill.items || [];
  const pageSizes = getPageSizes(allItems.length);
  const totalPages = pageSizes.length;
  const isInterstate = bill.purchaseType === 'interstate';

  // Derive rupee CGST/SGST/IGST per item — the schema only stores the
  // combined gstAmount + the individual percent rates, not pre-split
  // rupee amounts (unlike SalesInvoice items, which do store cgst/sgst
  // separately). Split gstAmount proportionally by percent share.
  const enhancedItems = allItems.map(item => {
    const cgstPct = item.cgstPercent || 0;
    const sgstPct = item.sgstPercent || 0;
    const igstPct = item.igstPercent || 0;
    const totalPct = cgstPct + sgstPct + igstPct;
    const gstAmount = item.gstAmount || 0;

    let cgst = 0, sgst = 0, igst = 0;
    if (totalPct > 0) {
      if (isInterstate) {
        igst = gstAmount;
      } else {
        cgst = gstAmount * (cgstPct / totalPct);
        sgst = gstAmount * (sgstPct / totalPct);
      }
    }

    let discountDisplay = '';
    if (item.discountPercent > 0) discountDisplay = `${item.discountPercent}%`;
    else if (item.discountAmount > 0) discountDisplay = `Rs.${item.discountAmount.toFixed(2)}`;

    return { ...item, cgst, sgst, igst, discountDisplay };
  });

  const overallTaxable = enhancedItems.reduce((s, i) => s + (i.taxableValue || 0), 0);
  const overallCGST = enhancedItems.reduce((s, i) => s + i.cgst, 0);
  const overallSGST = enhancedItems.reduce((s, i) => s + i.sgst, 0);
  const overallIGST = enhancedItems.reduce((s, i) => s + i.igst, 0);
  const overallLineDiscount = enhancedItems.reduce((s, i) => s + (i.discountAmount || 0), 0);

  const billDiscountAmount = bill.billDiscountAmount || 0;
  const roundedNet = bill.netAmount || 0;
  const roundOff = bill.roundOff || 0;

  let start = 0, itemIndex = 0;
  const pages = pageSizes.map((size, idx) => {
    const pageItems = enhancedItems.slice(start, start + size);
    start += size;
    const isLastPage = idx === totalPages - 1;
    let pageTaxable = 0, pageCGST = 0, pageSGST = 0, pageIGST = 0, pageLineTotal = 0;

    const itemRows = pageItems.map((item, rowIdx) => {
      const slNo = itemIndex + rowIdx + 1;
      pageTaxable += item.taxableValue || 0;
      pageCGST += item.cgst;
      pageSGST += item.sgst;
      pageIGST += item.igst;
      pageLineTotal += item.lineTotal || 0;

      const taxCols = isInterstate
        ? [`${item.igst.toFixed(2)} (${(item.igstPercent || 0).toFixed(1)}%)`]
        : [`${item.cgst.toFixed(2)} (${(item.cgstPercent || 0).toFixed(1)}%)`, `${item.sgst.toFixed(2)} (${(item.sgstPercent || 0).toFixed(1)}%)`];

      return [
        String(slNo),
        item.productName || '',
        item.batchNumber || '',
        formatExpiryForBill(item.expiryDate),
        (item.mrp || 0).toFixed(2),
        (item.purchaseRate || 0).toFixed(2),
        (item.ptr || 0).toFixed(2),
        (item.freeQty || 0) > 0 ? `${item.billedQty}+${item.freeQty}` : `${item.billedQty}`,
        (item.taxableValue || 0).toFixed(2),
        ...taxCols,
        item.discountDisplay,
        (item.lineTotal || 0).toFixed(2),
      ];
    });

    itemIndex += pageItems.length;
    return {
      rows: itemRows, isLastPage, pageIdx: idx + 1,
      pageTaxable, pageCGST, pageSGST, pageIGST, pageLineTotal,
      pageTotalItems: pageItems.length,
    };
  });

  // Tax summary string — same shape as the invoice's, grouped by rate only
  // (no HSN available on purchase-bill items, so grouped by GST% alone).
  const taxSummaryStr = Object.values(
    allItems.reduce((acc, item) => {
      const rate = isInterstate ? (item.igstPercent || 0) : ((item.cgstPercent || 0) + (item.sgstPercent || 0));
      const key = `${rate}`;
      if (!acc[key]) acc[key] = { rate, qty: 0, taxable: 0, gst: 0 };
      acc[key].qty += (item.billedQty || 0) + (item.freeQty || 0);
      acc[key].taxable += item.taxableValue || 0;
      acc[key].gst += item.gstAmount || 0;
      return acc;
    }, {})
  ).map(g => `${g.rate}% Q${g.qty} A${g.taxable.toFixed(2)} GST${g.gst.toFixed(2)}`).join(', ');

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

  // Column widths — no "Co." (single supplier per bill) or "Pack" (not
  // stored on the line item) columns; PTR added (purchase-bill-specific).
  const RAW_COLS = isInterstate
    ? { sl: 4, name: 38, batch: 16, exp: 9, mrp: 10, rate: 9, ptr: 9, qty: 10, taxable: 13, igst: 17, disc: 14, total: 14 }
    : { sl: 4, name: 36, batch: 16, exp: 9, mrp: 10, rate: 9, ptr: 9, qty: 10, taxable: 12, cgst: 14, sgst: 14, disc: 13, total: 13 };

  const rawTotal = Object.values(RAW_COLS).reduce((a, b) => a + b, 0);
  const scale = CONTENT.w / rawTotal;
  const COLS = Object.fromEntries(Object.entries(RAW_COLS).map(([k, v]) => [k, v * scale]));

  const TABLE_HEAD = isInterstate
    ? ['Sl', 'Product Name', 'Batch No.', 'Exp.', 'MRP', 'P.Rate', 'PTR', 'Qty.', 'Taxable', 'IGST (%)', 'Dis.', 'Total']
    : ['Sl', 'Product Name', 'Batch No.', 'Exp.', 'MRP', 'P.Rate', 'PTR', 'Qty.', 'Taxable', 'CGST (%)', 'SGST (%)', 'Dis.', 'Total'];

  // drawItemsTable expects COLS keyed as sl/mf/name/pack/batch/exp/mrp/rate/
  // qty/taxable/cgst/sgst/igst/disc/total (built for the invoice's column
  // set). Since our column set differs (no mf/pack, has ptr), we can't
  // reuse drawItemsTable's columnStyles mapping as-is — it hardcodes which
  // numeric index maps to which COLS key. Rather than fork that function's
  // internals (risking the real invoice table), draw the purchase-bill
  // table directly here with autoTable, mirroring its visual styling.
  const drawPurchaseBillItemsTable = (page, startY, showPageTotal) => {
    const body = [...page.rows];

    if (showPageTotal) {
      const row = [
        { content: `Page total (${page.pageTotalItems})`, colSpan: 8, styles: { halign: 'left', fontStyle: 'bold' } },
        { content: page.pageTaxable.toFixed(2), styles: { fontStyle: 'bold' } },
      ];
      if (isInterstate) {
        row.push({ content: page.pageIGST.toFixed(2), styles: { fontStyle: 'bold' } });
      } else {
        row.push({ content: page.pageCGST.toFixed(2), styles: { fontStyle: 'bold' } });
        row.push({ content: page.pageSGST.toFixed(2), styles: { fontStyle: 'bold' } });
      }
      row.push({ content: '', styles: {} });
      row.push({ content: page.pageLineTotal.toFixed(2), styles: { fontStyle: 'bold' } });
      body.push(row);
    }

    const columnStyles = isInterstate ? {
      0: { cellWidth: COLS.sl, halign: 'center' },
      1: { cellWidth: COLS.name, halign: 'left' },
      2: { cellWidth: COLS.batch, halign: 'left' },
      3: { cellWidth: COLS.exp, halign: 'center' },
      4: { cellWidth: COLS.mrp, halign: 'right' },
      5: { cellWidth: COLS.rate, halign: 'right' },
      6: { cellWidth: COLS.ptr, halign: 'right' },
      7: { cellWidth: COLS.qty, halign: 'right' },
      8: { cellWidth: COLS.taxable, halign: 'right' },
      9: { cellWidth: COLS.igst, halign: 'right' },
      10: { cellWidth: COLS.disc, halign: 'right' },
      11: { cellWidth: COLS.total, halign: 'right' },
    } : {
      0: { cellWidth: COLS.sl, halign: 'center' },
      1: { cellWidth: COLS.name, halign: 'left' },
      2: { cellWidth: COLS.batch, halign: 'left' },
      3: { cellWidth: COLS.exp, halign: 'center' },
      4: { cellWidth: COLS.mrp, halign: 'right' },
      5: { cellWidth: COLS.rate, halign: 'right' },
      6: { cellWidth: COLS.ptr, halign: 'right' },
      7: { cellWidth: COLS.qty, halign: 'left' },
      8: { cellWidth: COLS.taxable, halign: 'right' },
      9: { cellWidth: COLS.cgst, halign: 'right' },
      10: { cellWidth: COLS.sgst, halign: 'right' },
      11: { cellWidth: COLS.disc, halign: 'right' },
      12: { cellWidth: COLS.total, halign: 'right' },
    };

    autoTable(doc, {
      startY,
      margin: { left: CONTENT.x, right: A4.w - (CONTENT.x + CONTENT.w) },
      head: [TABLE_HEAD],
      body,
      theme: 'grid',
      styles: { fontSize: 6, cellPadding: 0.7, lineColor: [170, 170, 170], lineWidth: 0.1, textColor: [0, 0, 0] },
      headStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 7.5 },
      bodyStyles: { valign: 'middle' },
      columnStyles,
      didParseCell: (data) => {
        const isPageTotalRow = showPageTotal && data.row.index === page.rows.length && data.section === 'body';
        if (isPageTotalRow) {
          data.cell.styles.fillColor = [226, 232, 240];
        }
      },
    });

    return doc.lastAutoTable.finalY;
  };

  pages.forEach((page, pageIdx) => {
    if (pageIdx > 0) doc.addPage();
    drawPageBorder(doc);
    let cursorY = drawPurchaseBillHeader(doc, {
      supplier: { name: bill.supplierName, address: '' },
      supplierGSTIN: bill.supplierGSTIN,
      billNumber: bill.invoiceNumber,
      billDate: bill.invoiceDate,
      billType: bill.billType,
    });

    const showPageTotal = totalPages > 1;
    const tableEndY = drawPurchaseBillItemsTable(page, cursorY, showPageTotal);

    if (page.isLastPage) {
      const billTotalEndY = drawBillTotalLine(doc, tableEndY, {
        overallTaxable, overallCGST, overallSGST, overallIGST,
        overallLineDiscount, billDiscountAmount, roundOff, roundedNet,
        isInterstate,
      });
      drawPurchaseBillFooter(doc, billTotalEndY, {
        taxSummaryStr, netAmount: roundedNet, allItems: enhancedItems, supplierName: bill.supplierName,
      });
    }
  });

  return doc;
};

export const downloadPurchaseBillPDF = (bill) => {
  const doc = buildPurchaseBillDoc(bill);
  doc.save(`PurchaseBill-${bill.invoiceNumber || 'untitled'}.pdf`);
};

export const printPurchaseBillPDF = (bill) => {
  const doc = buildPurchaseBillDoc(bill);
  doc.autoPrint();
  const blobURL = doc.output('bloburl');
  window.open(blobURL, '_blank');
};