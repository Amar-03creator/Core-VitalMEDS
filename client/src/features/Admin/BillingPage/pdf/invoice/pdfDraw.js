import autoTable from 'jspdf-autotable';
import { A4, BORDER, CONTENT, BILL_TOTAL_GAP_MM } from './pdfGeometry';
import { numberToWords, formatDateIndian } from './pdfHelpers';

export function drawPageBorder(doc) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.18);
  doc.rect(BORDER.x, BORDER.y, BORDER.w, BORDER.h);
}

export function drawHeader(doc, info) {
  const { seller, buyer, buyerGstin, buyerDl, buyerCity, buyerState, buyerStateCode, invoiceNo, invoiceDate, billType } = info;

  const top = CONTENT.y;
  const colGap = 2;
  const colW = (CONTENT.w - colGap * 2) / 3;
  const sellerX = CONTENT.x;
  const middleX = CONTENT.x + colW + colGap;
  const buyerX = CONTENT.x + (colW + colGap) * 2;

  // Seller
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(seller.name, sellerX, top + 3.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  let y = top + 7.5;
  const sellerLines = [
    seller.address,
    `DIST. ${seller.dist} , Phone: ${seller.phone}`,
    `D.L. No.: ${seller.dlNo}`,
    `GSTIN: ${seller.gstin}  DrugsBazaar ID: ${seller.drugsBazaarId}`,
  ];
  sellerLines.forEach(line => {
    const wrapped = doc.splitTextToSize(line, colW - 1);
    doc.text(wrapped, sellerX, y);
    y += wrapped.length * 2.8;
  });

  // Middle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TAX INVOICE', middleX + colW / 2, top + 4.2, { align: 'center' });

  doc.setFontSize(8.5);
  const metaLines = [`Inv No: ${invoiceNo}`, `Date: ${formatDateIndian(invoiceDate)}`, `Bill Type: ${billType}`];
  let metaY = top + 9;
  metaLines.forEach(line => {
    doc.text(line, middleX + colW / 2, metaY, { align: 'center' });
    metaY += 3.5;
  });

  // Buyer
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const buyerHeader = `To: ${buyer} (${buyerCity})`;
  const buyerHeaderWrapped = doc.splitTextToSize(buyerHeader, colW - 1);
  doc.text(buyerHeaderWrapped, buyerX, top + 3.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  let by = top + 3.5 + (buyerHeaderWrapped.length * 3.2) + 1.8;
  const buyerLines = [
    `GSTIN/UIN: ${buyerGstin}  D.L. No.: ${buyerDl}`,
    `State: ${buyerState}  ID: ${buyerStateCode}`,
  ];
  buyerLines.forEach(line => {
    const wrapped = doc.splitTextToSize(line, colW - 1);
    doc.text(wrapped, buyerX, by);
    by += wrapped.length * 2.8;
  });

  const headerBottom = Math.max(y, by, metaY) + 1;
  doc.setLineWidth(0.1);
  doc.setDrawColor(170, 170, 170);
  doc.line(CONTENT.x, headerBottom, CONTENT.x + CONTENT.w, headerBottom);
  doc.line(middleX - colGap / 2, top, middleX - colGap / 2, headerBottom);
  doc.line(buyerX - colGap / 2, top, buyerX - colGap / 2, headerBottom);

  return headerBottom + 1.5;
}

export function drawItemsTable(doc, page, head, COLS, startY, showPageTotal, isInterstate) {
  const body = [...page.rows];

  if (showPageTotal) {
    const row = [
      { content: `Page total (${page.pageTotalItems})`, colSpan: 9, styles: { halign: 'left', fontStyle: 'bold' } },
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

  // ★ FIXED: Reordered column width mapping to align with Qty -> Disc -> Taxable
  const columnStyles = isInterstate ? {
    0: { cellWidth: COLS.sl, halign: 'center' },
    1: { cellWidth: COLS.mf, halign: 'left' },
    2: { cellWidth: COLS.name, halign: 'left' },
    3: { cellWidth: COLS.pack, halign: 'left' },
    4: { cellWidth: COLS.batch, halign: 'left' },
    5: { cellWidth: COLS.exp, halign: 'center' },
    6: { cellWidth: COLS.mrp, halign: 'right' },
    7: { cellWidth: COLS.rate, halign: 'right' },
    8: { cellWidth: COLS.qty, halign: 'right' },
    9: { cellWidth: COLS.disc, halign: 'right' },      // Index 9 is now Disc
    10: { cellWidth: COLS.taxable, halign: 'right' },  // Index 10 is now Taxable
    11: { cellWidth: COLS.igst, halign: 'right' },
    12: { cellWidth: COLS.total, halign: 'right' },
  } : {
    0: { cellWidth: COLS.sl, halign: 'center' },
    1: { cellWidth: COLS.mf, halign: 'left' },
    2: { cellWidth: COLS.name, halign: 'left' },
    3: { cellWidth: COLS.pack, halign: 'left' },
    4: { cellWidth: COLS.batch, halign: 'left' },
    5: { cellWidth: COLS.exp, halign: 'center' },
    6: { cellWidth: COLS.mrp, halign: 'right' },
    7: { cellWidth: COLS.rate, halign: 'right' },
    8: { cellWidth: COLS.qty, halign: 'left' },
    9: { cellWidth: COLS.disc, halign: 'right' },      // Index 9 is now Disc
    10: { cellWidth: COLS.taxable, halign: 'right' },  // Index 10 is now Taxable
    11: { cellWidth: COLS.cgst, halign: 'right' },
    12: { cellWidth: COLS.sgst, halign: 'right' },
    13: { cellWidth: COLS.total, halign: 'right' },
  };

  autoTable(doc, {
    startY,
    margin: { left: CONTENT.x, right: A4.w - (CONTENT.x + CONTENT.w) },
    head: [head],
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
}

export function drawBillTotalLine(doc, tableEndY, totals) {
  const {
    overallTaxable, overallCGST, overallSGST, overallIGST,
    overallLineDiscount, billDiscountAmount, roundOff, roundedNet,
    isInterstate,
  } = totals;

  const left = CONTENT.x;
  const width = CONTENT.w;
  const y = tableEndY + BILL_TOTAL_GAP_MM;
  const lineH = 5;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.2);
  doc.rect(left, y, width, lineH, 'FD');

  const parts = [];
  parts.push(['Taxable:', `Rs.${overallTaxable.toFixed(2)}`]);
  if (isInterstate) {
    parts.push(['IGST:', `Rs.${overallIGST.toFixed(2)}`]);
  } else {
    parts.push(['CGST+SGST:', `Rs.${(overallCGST + overallSGST).toFixed(2)}`]);
  }
  if (overallLineDiscount > 0) parts.push(['Line Disc:', `-Rs.${overallLineDiscount.toFixed(2)}`]);
  if (billDiscountAmount > 0) parts.push(['Bill Disc:', `-Rs.${billDiscountAmount.toFixed(2)}`]);
  if (roundOff !== 0) parts.push(['R/Off:', `${roundOff > 0 ? '+' : ''}Rs.${roundOff.toFixed(2)}`]);

  doc.setFontSize(6.5);
  let cursorX = left + 2;
  const textY = y + lineH / 2 + 1;
  parts.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(label, cursorX, textY);
    cursorX += doc.getTextWidth(label) + 1;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(value, cursorX, textY);
    cursorX += doc.getTextWidth(value) + 3.5;
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const totalLabel = 'Net Total:';
  const totalValue = `Rs.${roundedNet.toLocaleString('en-IN')}`;
  const totalValueW = doc.getTextWidth(totalValue);
  doc.text(totalValue, left + width - 2, textY, { align: 'right' });
  doc.text(totalLabel, left + width - 2 - totalValueW - 1.5, textY, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  return y + lineH + BILL_TOTAL_GAP_MM;
}

export function drawFooter(doc, startY, info) {
  const { taxSummaryStr, overallLineTotal, allItems, previousBalance, previousOutstandingDate, buyer, invoiceDate } = info;
  const left = CONTENT.x;
  const width = CONTENT.w;
  const bottomEdge = BORDER.y + BORDER.h - 1.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  const taxSummaryWrapped = doc.splitTextToSize(`Tax Summary: ${taxSummaryStr}`, width - 2);
  const taxBoxH = taxSummaryWrapped.length * 2.3 + 2;

  doc.setFontSize(6.5);
  const wordsText = `Amount in Words: ${numberToWords(Math.round(overallLineTotal))}`;
  const wordsWrapped = doc.splitTextToSize(wordsText, width - 3);
  const wordsBoxH = wordsWrapped.length * 2.5 + 2;

  const extraLineH = 4.5;

  doc.setFontSize(6);
  const termsText = 'Terms: E.&O.E. * NB: Registration certificate valid on date of invoice. ' +
    'Net amount rounded off. Warranty under section 18 of Drugs & Cosmetic Act 1940. Transport:';
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

  const newBalance = Math.round(previousBalance + overallLineTotal);
  let balanceText = '';

  if (previousBalance > 0 && previousOutstandingDate) {
      const diffTime = Math.max(0, new Date(invoiceDate) - new Date(previousOutstandingDate));
      const previousDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const prevDateStr = formatDateIndian(previousOutstandingDate);
      
      balanceText = `Prev Bal from ${prevDateStr} (${previousDays}d): Rs. ${previousBalance.toLocaleString('en-IN')}  |  New Balance: Rs. ${newBalance.toLocaleString('en-IN')}`;
  } else {
      balanceText = `Prev Bal: Rs. 0  |  New Balance: Rs. ${newBalance.toLocaleString('en-IN')}`;
  }

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  const totalUnits = allItems.reduce((s, i) => s + i.chargeableQty + (i.freeQty || 0), 0);
  const totalItemsCount = allItems.length;
  doc.text(`Total : ${totalUnits} units of ${totalItemsCount} Item(s)`, left, y + 2.2);
  
  doc.text(balanceText, left + width, y + 2.2, { align: 'right' });
  
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
  doc.text(`Net Amount: Rs.${overallLineTotal.toFixed(2)}`, left + width, y + 1.6, { align: 'right' });
  y += termsBoxH - 1.8 + gapBetween;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 90, 105);
  doc.setDrawColor(80, 90, 105);
  doc.setLineWidth(0.15);
  
  const senderText = 'Signature (Mila Agencies)';
  const receiverText = `Signature (${buyer})`;
  
  const senderLineW = Math.max(40, doc.getTextWidth(senderText));
  const receiverLineW = Math.max(40, doc.getTextWidth(receiverText));
  
  doc.line(left, y, left + senderLineW, y);
  doc.text(senderText, left, y + 2.6, { align: 'left' });
  
  doc.line(left + width - receiverLineW, y, left + width, y);
  doc.text(receiverText, left + width, y + 2.6, { align: 'right' });
  
  doc.setTextColor(0, 0, 0);
}