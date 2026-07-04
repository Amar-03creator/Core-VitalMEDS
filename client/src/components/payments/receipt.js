// utils/generateReceiptPdf.js
import { jsPDF } from 'jspdf';

/* ════════════════════════════════════════════════════════════════════════
   GEOMETRY — A8-sized content (74x52mm), top-left corner of an A4 sheet
════════════════════════════════════════════════════════════════════════ */
const A4 = { w: 210, h: 297 };
const A8 = { w: 52, h: 74 }; // A8 Landscape dimensions
const MARGIN_MM = 3.5;

const BORDER = {
  x: MARGIN_MM,
  y: MARGIN_MM,
  w: A8.w - MARGIN_MM * 2,
  h: A8.h - MARGIN_MM * 2,
};

const CONTENT_PAD = 2;
const CONTENT = {
  x: BORDER.x + CONTENT_PAD,
  y: BORDER.y + CONTENT_PAD,
  w: BORDER.w - CONTENT_PAD * 2,
  h: BORDER.h - CONTENT_PAD * 2,
};

const SELLER_NAME = 'Mila Agencies';

/* ── Helpers ──────────────────────────────────────────────────────────── */
function formatDateIndian(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

const MODE_LABELS = {
  Cash: 'Cash',
  UPI: 'UPI',
  Cheque: 'Cheque',
  BankTransfer: 'Bank Transfer',
};

/**
 * Renders mixed bold/normal text on one logical "paragraph" with wrapping.
 */
function drawMixedText(doc, segments, x, y, maxWidth, lineHeight) {
  let cursorX = x;
  let cursorY = y;

  segments.forEach(seg => {
    const words = seg.text.split(' ').filter(Boolean);
    words.forEach(word => {
      doc.setFont('helvetica', seg.bold ? 'bold' : 'normal');
      const wordWithSpace = word + ' ';
      const wWidth = doc.getTextWidth(wordWithSpace);

      if (cursorX + wWidth > x + maxWidth) {
        cursorY += lineHeight;
        cursorX = x;
      }
      doc.text(wordWithSpace, cursorX, cursorY);
      cursorX += wWidth;
    });
  });
  return cursorY + lineHeight;
}

/* ════════════════════════════════════════════════════════════════════════
   Main entry point
════════════════════════════════════════════════════════════════════════ */
export const downloadReceiptPDF = (receipt) => {
  const doc = generateReceiptPdfDoc(receipt);
  doc.save(`Receipt-${receipt.receiptNumber || 'untitled'}.pdf`);
};

export const printReceiptPDF = (receipt) => {
  const doc = generateReceiptPdfDoc(receipt);
  const blobUrl = doc.output('bloburl');
  const printWindow = window.open(blobUrl, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }
};

export const generateReceiptPdfDoc = (receipt) => {
  // ★ Set paper to A4 so it prints properly on normal printers
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

  const partyName = receipt.clientObjectId?.establishmentName || receipt.clientName || 'Party';
  const amount = receipt.totalAmountPaid || 0;
  const modeLabel = MODE_LABELS[receipt.paymentMode] || receipt.paymentMode || '';
  const dateStr = formatDateIndian(receipt.paymentDate);
  const invoiceNumbers = (receipt.allocatedInvoices || []).map(a => a.invoiceNumber);

  // 1. Draw Border exactly to A8 constraints
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.rect(BORDER.x, BORDER.y, BORDER.w, BORDER.h);

  // Set initial Y slightly below the top padding for text baselines
  let y = CONTENT.y + 2.5; 
  const left = CONTENT.x;
  const width = CONTENT.w;

  // 2. Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(SELLER_NAME, left, y);
  
  doc.setFontSize(6);
  doc.text(receipt.receiptNumber || '', left + width, y, { align: 'right' });

  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.text('PAYMENT RECEIPT', left, y);

  y += 1.5;
  doc.setDrawColor(180);
  doc.line(left, y, left + width, y);
  y += 3.5;

  // 3. The Bold/Normal Mixed Sentence
  doc.setFontSize(6.5);
  const sentenceSegments = [
    { text: 'Payment of', bold: false },
    { text: `Rs.${amount.toLocaleString('en-IN')}`, bold: true },
    { text: 'received via', bold: false },
    { text: modeLabel, bold: true },
    { text: 'from', bold: false },
    { text: partyName, bold: true },
    { text: 'to', bold: false },
    { text: SELLER_NAME, bold: true },
    { text: 'on', bold: false },
    { text: `${dateStr}.`, bold: true },
  ];

  y = drawMixedText(doc, sentenceSegments, left, y, width, 3);

  // 4. Applied Invoices (Compact Single Line)
  y += 1;
  doc.setDrawColor(180);
  doc.line(left, y, left + width, y);
  y += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Applied to:', left, y);
  
  doc.setFont('helvetica', 'bold');
  const invoiceText = invoiceNumbers.length > 0 ? invoiceNumbers.join(', ') : 'Advance payment';
  const invoiceWrapped = doc.splitTextToSize(invoiceText, width - 12);
  doc.text(invoiceWrapped, left + 12, y);

  // 5. Signature (Bottom Right of the A8 box)
  const signatureY = BORDER.y + BORDER.h - 2; 
  doc.setDrawColor(200);
  doc.line(left + width - 25, signatureY - 2.5, left + width, signatureY - 2.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.setTextColor(120);
  doc.text('Signature of receiving party', left + width, signatureY, { align: 'right' });
  doc.setTextColor(0);

  return doc;
};