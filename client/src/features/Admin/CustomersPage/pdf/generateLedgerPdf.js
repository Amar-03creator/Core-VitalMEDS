// customers/pdf/generateLedgerPdf.js
//
// Generates a Statement of Account PDF for a single party using jsPDF.
// Matches the ledger format defined in the documentation:
//   Date | Particulars | Voucher No. | Dr Amount | Cr Amount | Balance | Days
//
// Called from LedgerTab's "Download PDF" button.
// jsPDF is already installed as a project dependency.

import jsPDF from 'jspdf';
import 'jspdf-autotable';   // if autoTable plugin is available; falls back to manual rows

const toDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
};

const fmt = (n) => {
  if (n == null || n === 0) return '';
  return Math.abs(Math.round(n)).toLocaleString('en-IN');
};

const balanceStr = (n) => {
  if (n == null) return '—';
  const abs = Math.abs(Math.round(n));
  const dir = n > 0 ? ' Dr' : n < 0 ? ' Cr' : '';
  return `₹${abs.toLocaleString('en-IN')}${dir}`;
};

/**
 * generateLedgerPDF
 *
 * @param {object} params
 * @param {string} params.partyName      - e.g. "Sharma Medical Stores"
 * @param {string} params.partyId        - e.g. "CUST-1042"
 * @param {string} params.from           - ISO date string "2026-06-01"
 * @param {string} params.to             - ISO date string "2026-06-30"
 * @param {Array}  params.rows           - ledger rows from getLedger API
 */
export const generateLedgerPDF = ({ partyName, partyId, from, to, rows }) => {
  const doc      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW    = doc.internal.pageSize.getWidth();
  const pageH    = doc.internal.pageSize.getHeight();
  const margin   = 14;
  const colW     = pageW - margin * 2;

  // ── Distributor header ───────────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MILA AGENCIES', pageW / 2, 18, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Statement of Account', pageW / 2, 24, { align: 'center' });
  doc.setTextColor(0);

  // Divider
  doc.setDrawColor(200);
  doc.line(margin, 27, pageW - margin, 27);

  // ── Party + period info ──────────────────────────────────────────────────
  let y = 33;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(partyName, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`ID: ${partyId}`, margin, y + 5);
  doc.setTextColor(0);

  // Period on right
  doc.setFontSize(9);
  doc.text(`Period: ${toDate(from)}  –  ${toDate(to)}`, pageW - margin, y, { align: 'right' });
  doc.setTextColor(100);
  doc.text(`Printed: ${toDate(new Date().toISOString())}`, pageW - margin, y + 5, { align: 'right' });
  doc.setTextColor(0);

  y += 12;
  doc.setDrawColor(220);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  // ── Try autoTable, fall back to manual ───────────────────────────────────
  const tableHead = [['Date', 'Particulars', 'Voucher No.', 'Dr (₹)', 'Cr (₹)', 'Balance', 'Days']];

  const tableBody = rows.map((row) => [
    toDate(row.date),
    row.type || '',
    row.voucher && row.voucher !== '—' ? row.voucher : '',
    row.dr > 0  ? fmt(row.dr)  : '',
    row.cr > 0  ? fmt(row.cr)  : '',
    balanceStr(row.balance),
    row.days != null ? String(row.days) : '',
  ]);

  if (typeof doc.autoTable === 'function') {
    // ── autoTable (preferred) ─────────────────────────────────────────────
    doc.autoTable({
      startY:    y,
      head:      tableHead,
      body:      tableBody,
      margin:    { left: margin, right: margin },
      headStyles: {
        fillColor: [15, 23, 42],   // slate-900
        textColor: 255,
        fontStyle: 'bold',
        fontSize:  8,
      },
      bodyStyles: { fontSize: 8, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 52 },
        2: { cellWidth: 28 },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 12, halign: 'center' },
      },
      // Highlight opening / closing rows
      didParseCell: (data) => {
        const row = rows[data.row.index];
        if (row?.isOpening || row?.isClosing) {
          data.cell.styles.fillColor    = [241, 245, 249]; // slate-100
          data.cell.styles.fontStyle    = 'bold';
          data.cell.styles.textColor    = [30, 41, 59];    // slate-800
        }
      },
      didDrawPage: (data) => {
        // Page footer
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageNumber} — Mila Agencies | Confidential`,
          pageW / 2, pageH - 8, { align: 'center' },
        );
        doc.setTextColor(0);
      },
    });

    // Summary box below table
    const finalY = (doc.lastAutoTable?.finalY || y) + 8;
    const closing = rows[rows.length - 1];
    if (closing) {
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(margin, finalY, colW, 12, 2, 2, 'F');
      doc.setTextColor(255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Closing Balance', margin + 4, finalY + 7.5);
      doc.text(balanceStr(closing.balance), pageW - margin - 4, finalY + 7.5, { align: 'right' });
      doc.setTextColor(0);
      doc.setFont('helvetica', 'normal');
    }

  } else {
    // ── Manual fallback (no autoTable plugin) ─────────────────────────────
    const colXs   = [margin, margin+20, margin+72, margin+100, margin+120, margin+140, margin+164];
    const rowH    = 7;

    // Header row
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, colW, rowH, 'F');
    doc.setTextColor(255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    ['Date','Particulars','Voucher','Dr (₹)','Cr (₹)','Balance','Days'].forEach((h, i) => {
      doc.text(h, colXs[i] + 1, y + 5);
    });
    doc.setTextColor(0);
    y += rowH;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    tableBody.forEach((cols, ri) => {
      if (y + rowH > pageH - 15) {
        doc.addPage();
        y = 15;
      }
      if (ri % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, colW, rowH, 'F');
      }
      cols.forEach((cell, i) => {
        doc.text(String(cell ?? ''), colXs[i] + 1, y + 5);
      });
      y += rowH;
    });
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  const fileName = `Ledger_${partyName.replace(/\s+/g, '_')}_${from}_${to}.pdf`;
  doc.save(fileName);
};
