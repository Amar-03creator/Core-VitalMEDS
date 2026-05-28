// utils/pdfGenerator.js
export const generateLedgerPDF = (ledgers, dateFrom, dateTo) => {
  const allLedgersHtml = ledgers.map(ledger => `
    <div class="ledger-block">
      <div class="ledger-header">
        <h2>Ledger for ${ledger.party}</h2>
        <p>Period: ${dateFrom} to ${dateTo}</p>
        <p>Mila Agencies</p>
      </div>
      <table class="ledger-table">
        <thead>
          <tr><th>Date</th><th>Particulars</th><th>Voucher No.</th><th class="text-right">Dr (₹)</th><th class="text-right">Cr (₹)</th><th class="text-right">Balance (₹)</th><th class="text-right">Days</th></tr>
        </thead>
        <tbody>
          ${ledger.rows.map(row => `
            <tr class="${row.isOpening ? 'opening-row' : row.isClosing ? 'closing-row' : ''}">
              <td>${row.date}</td>
              <td>${row.type}</td>
              <td>${row.voucher}</td>
              <td class="text-right">${row.dr > 0 ? row.dr.toLocaleString() : ''}</td>
              <td class="text-right">${row.cr > 0 ? row.cr.toLocaleString() : ''}</td>
              <td class="text-right">${Math.abs(row.balance).toLocaleString()} ${row.balance >= 0 ? 'Dr' : 'Cr'}</td>
              <td class="text-center">${row.days || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <footer>Generated on ${new Date().toLocaleString()}</footer>
    </div>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Party Ledger Statement</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 0; background: white; }
        .ledger-container { column-count: 2; column-gap: 20px; column-fill: auto; }
        .ledger-block { break-inside: avoid; margin-bottom: 20px; border-bottom: 1px dashed #e2e8f0; }
        .ledger-header { text-align: center; margin-bottom: 12px; }
        .ledger-header h2 { margin: 0 0 5px; font-size: 15px; }
        .ledger-header p { margin: 2px 0; font-size: 10px; color: #475569; }
        .ledger-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 8px; }
        .ledger-table th, .ledger-table td { border: 1px solid #cbd5e1; padding: 4px 5px; }
        .ledger-table th { background-color: #f1f5f9; font-weight: 600; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .opening-row { background-color: #fffbeb; }
        .closing-row { background-color: #0f172a; color: #34d399; font-weight: bold; }
        .closing-row td { color: #34d399; }
        footer { margin-top: 5px; text-align: center; font-size: 8px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="ledger-container">${allLedgersHtml}</div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.print();
};