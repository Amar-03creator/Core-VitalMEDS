// utils/generatePurchaseOrderPdf.js
import { jsPDF } from 'jspdf';

const SELLER_NAME = 'M/S MILA AGENCIES';

const formatToday = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`;
};

/**
 * buildPurchaseOrderDoc
 * One supplier's purchase order — a simple, single-column table (unlike the
 * two-column ledger layout, since PO rows are wider: product name + 3 numeric
 * columns), built with the same manual rect/text/line drawing approach as
 * generateLedgerPdf.js for visual consistency across all your PDFs.
 */
const buildPurchaseOrderDoc = (companyName, rows) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 40;
  const ROW_HEIGHT = 22;
  const TABLE_WIDTH = PAGE_WIDTH - MARGIN * 2;
  const BOTTOM_Y = PAGE_HEIGHT - MARGIN;

  // Column layout: Product (flexible) | Current Stock | Avg Monthly Demand | Order Qty
  const COL_PRODUCT_X = MARGIN;
  const COL_STOCK_X = MARGIN + 260;
  const COL_DEMAND_X = MARGIN + 350;
  const COL_QTY_X = MARGIN + 460;

  let cy = MARGIN;

  const drawHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('Purchase Order', MARGIN, cy);
    cy += 22;

    doc.setFontSize(12);
    doc.setTextColor(60);
    doc.text(companyName, MARGIN, cy);
    cy += 16;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated: ${formatToday()}`, MARGIN, cy);
    cy += 24;
  };

  const drawTableHeader = () => {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(MARGIN, cy, TABLE_WIDTH, ROW_HEIGHT, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);

    doc.text('Product', COL_PRODUCT_X + 6, cy + 14);
    doc.text('Stock', COL_STOCK_X, cy + 14, { align: 'right' });
    doc.text('Avg/mo', COL_DEMAND_X, cy + 14, { align: 'right' });
    doc.text('Order Qty', COL_QTY_X + 50, cy + 14, { align: 'right' });

    cy += ROW_HEIGHT;
  };

  drawHeader();
  drawTableHeader();

  rows.forEach((row, idx) => {
    if (cy + ROW_HEIGHT > BOTTOM_Y) {
      doc.addPage();
      cy = MARGIN;
      drawTableHeader();
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252); // zebra striping, slate-50
      doc.rect(MARGIN, cy, TABLE_WIDTH, ROW_HEIGHT, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30);
    doc.text(String(row.productName || ''), COL_PRODUCT_X + 6, cy + 14, { maxWidth: 240 });

    doc.setTextColor(80);
    doc.text(String(row.currentStock ?? '-'), COL_STOCK_X, cy + 14, { align: 'right' });
    doc.text(String(row.avgMonthlyDemand ?? '-'), COL_DEMAND_X, cy + 14, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(String(row.finalQty), COL_QTY_X + 50, cy + 14, { align: 'right' });

    doc.setDrawColor(230);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, cy + ROW_HEIGHT, MARGIN + TABLE_WIDTH, cy + ROW_HEIGHT);

    cy += ROW_HEIGHT;
  });

  return doc;
};

/**
 * downloadPurchaseOrderPDF
 * Per the chosen flow (one PDF per supplier, separate downloads, no zip),
 * call this once per supplier group — each call triggers its own
 * browser download, exactly like downloadLedgerPDF does for a single party.
 */
export const downloadPurchaseOrderPDF = (companyName, rows) => {
  if (!rows || rows.length === 0) return;
  const doc = buildPurchaseOrderDoc(companyName, rows);
  const safeName = companyName.replace(/\s+/g, '_');
  const monthYear = new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).replace(' ', '');
  doc.save(`PO_${safeName}_${monthYear}.pdf`);
};