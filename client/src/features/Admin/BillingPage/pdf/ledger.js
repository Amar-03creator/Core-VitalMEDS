// utils/generateLedgerPdf.js
import { jsPDF } from 'jspdf';

const SELLER_NAME = 'M/S MILA AGENCIES';

// Helper to format dates to Indian dd-mm-yy
const formatIndianDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr; 
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`;
};

const buildLedgerDoc = (ledgers, dateFrom, dateTo) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  
  // Custom Two-Column Layout Engine Math
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 20; // ~7mm minimal margin
  const GAP = 15;    // Space between the two columns
  
  const COL_WIDTH = (PAGE_WIDTH - (MARGIN * 2) - GAP) / 2; // ~270pt per column
  const COL_1_X = MARGIN;
  const COL_2_X = MARGIN + COL_WIDTH + GAP;
  const BOTTOM_Y = PAGE_HEIGHT - MARGIN;
  const ROW_HEIGHT = 14;

  let col = 1;
  let cx = COL_1_X;
  let cy = MARGIN;

  const formattedFrom = formatIndianDate(dateFrom);
  const formattedTo = formatIndianDate(dateTo);

  // Helper to jump to next column or create a new page
  const addColOrPage = () => {
    if (col === 1) {
      col = 2;
      cx = COL_2_X;
      cy = MARGIN;
    } else {
      doc.addPage();
      col = 1;
      cx = COL_1_X;
      cy = MARGIN;
    }
  };

  // Helper to draw the table header
  const drawTableHeader = () => {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(cx, cy, COL_WIDTH, ROW_HEIGHT, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);

    doc.text('Date', cx + 2, cy + 10);
    doc.text('Voucher No', cx + 45, cy + 10);
    doc.text('Dr', cx + 145, cy + 10, { align: 'right' });
    doc.text('Cr', cx + 185, cy + 10, { align: 'right' });
    doc.text('Balance', cx + 242, cy + 10, { align: 'right' });
    doc.text('Days', cx + 268, cy + 10, { align: 'right' });

    cy += ROW_HEIGHT;
  };

  ledgers.forEach((ledger) => {
    // Check if we have enough space for the Ledger Header + Table Header + at least 1 row
    if (cy + 45 + ROW_HEIGHT + ROW_HEIGHT > BOTTOM_Y) addColOrPage();

    // 1. Ledger Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text(SELLER_NAME, cx + (COL_WIDTH / 2), cy + 10, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(ledger.party, cx + (COL_WIDTH / 2), cy + 22, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(`Period: ${formattedFrom} to ${formattedTo}`, cx + (COL_WIDTH / 2), cy + 32, { align: 'center' });
    
    cy += 40;

    // 2. Table Header
    drawTableHeader();

    // 3. Rows
    ledger.rows.forEach(row => {
      // If we run out of room, move to next col/page and redraw header
      if (cy + ROW_HEIGHT > BOTTOM_Y) {
        addColOrPage();
        drawTableHeader();
      }

      const isOpening = row.isOpening;
      const isClosing = row.isClosing;

      // Row Background
      if (isOpening) {
        doc.setFillColor(254, 252, 232); // amber-50
        doc.rect(cx, cy, COL_WIDTH, ROW_HEIGHT, 'F');
      } else if (isClosing) {
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(cx, cy, COL_WIDTH, ROW_HEIGHT, 'F');
      }

      doc.setFont('helvetica', isClosing || isOpening ? 'bold' : 'normal');
      doc.setFontSize(7);

      // Date
      doc.setTextColor(isClosing ? 150 : 80);
      doc.text(formatIndianDate(row.date), cx + 2, cy + 10);

      // Voucher
      doc.setTextColor(isClosing ? 255 : isOpening ? 180 : 0);
      doc.text(row.voucher || '', cx + 45, cy + 10);

      // Dr
      doc.setTextColor(isClosing ? 255 : 220, isClosing ? 255 : 38, isClosing ? 255 : 38); // Red
      doc.text(row.dr > 0 ? row.dr.toLocaleString('en-IN') : '', cx + 145, cy + 10, { align: 'right' });

      // Cr
      doc.setTextColor(isClosing ? 255 : 5, isClosing ? 255 : 150, isClosing ? 255 : 105); // Green
      doc.text(row.cr > 0 ? row.cr.toLocaleString('en-IN') : '', cx + 185, cy + 10, { align: 'right' });

      // Balance
      doc.setTextColor(isClosing ? 52 : 0, isClosing ? 211 : 0, isClosing ? 153 : 0); // Emerald if closing, else black
      doc.text(`${Math.abs(row.balance).toLocaleString('en-IN')} ${row.balance >= 0 ? 'Dr' : 'Cr'}`, cx + 242, cy + 10, { align: 'right' });

      // Days
      doc.setTextColor(isClosing ? 150 : 100);
      doc.text(row.days?.toString() || '—', cx + 268, cy + 10, { align: 'right' });

      // Subtle horizontal grid line
      doc.setDrawColor(230);
      doc.setLineWidth(0.5);
      doc.line(cx, cy + ROW_HEIGHT, cx + COL_WIDTH, cy + ROW_HEIGHT);

      cy += ROW_HEIGHT;
    });

    // Gap between ledgers
    cy += 20; 
  });

  return doc;
};

export const downloadLedgerPDF = (ledgers, dateFrom, dateTo) => {
  if (!ledgers || ledgers.length === 0) return;
  const doc = buildLedgerDoc(ledgers, dateFrom, dateTo);
  const label = ledgers.length === 1 ? ledgers[0].party.replace(/\s+/g, '_') : 'Bulk_Statement';
  doc.save(`Ledger_${label}_${dateFrom}_to_${dateTo}.pdf`);
};

export const printLedgerPDF = (ledgers, dateFrom, dateTo) => {
  if (!ledgers || ledgers.length === 0) return;
  const doc = buildLedgerDoc(ledgers, dateFrom, dateTo);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};