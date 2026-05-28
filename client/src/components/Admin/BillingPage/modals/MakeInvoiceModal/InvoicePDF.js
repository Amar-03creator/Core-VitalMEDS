// utils/invoicePDF.js – final version with three‑column header and buyer city fix
export const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    let str = '';
    if (n >= 100) { str += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n >= 20) { str += tens[Math.floor(n / 10)] + ' '; n %= 10; }
    else if (n >= 10) { str += teens[n - 10] + ' '; n = 0; }
    if (n > 0) str += ones[n] + ' ';
    return str;
  };

  if (num === 0) return 'Zero';
  let words = '';
  if (num >= 10000000) { words += convertLessThanThousand(Math.floor(num / 10000000)) + 'Crore '; num %= 10000000; }
  if (num >= 100000) { words += convertLessThanThousand(Math.floor(num / 100000)) + 'Lakh '; num %= 100000; }
  if (num >= 1000) { words += convertLessThanThousand(Math.floor(num / 1000)) + 'Thousand '; num %= 1000; }
  words += convertLessThanThousand(num);
  return words.trim() + ' Only';
};

function formatPacking(packing) {
  if (!packing) return '';
  if (
    packing.includes("10'S Strip") ||
    packing.includes("10'S Tab") ||
    packing.includes("10'S Cap") ||
    packing.includes("10 Caps")
  ) return "10's";
  return packing;
}

function getPageSizes(totalItems, maxPerPage = 14) {
  const sizes = [];
  for (let i = 0; i < totalItems; i += maxPerPage) {
    sizes.push(Math.min(maxPerPage, totalItems - i));
  }
  return sizes;
}

export const generateInvoicePDF = (
  invoiceData,
  allItems,
  totalTaxable,
  totalCGST,
  totalSGST,
  netAmount,
  globalDiscValue,
  finalDiscount
) => {
  const maxItemsPerPage = 14;
  const pageSizes = getPageSizes(allItems.length, maxItemsPerPage);
  const totalPages = pageSizes.length;

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
  const previousBalance = 26324;
  const previousDays = 39;
  const billType = invoiceData.billType || 'Credit';

  let overallTaxable = 0, overallCGST = 0, overallSGST = 0, overallLineTotal = 0;
  const enhancedItems = allItems.map(item => {
    const taxable = item.chargeableQty * item.rate;
    const cgst = taxable * (item.gstRate / 2) / 100;
    const sgst = taxable * (item.gstRate / 2) / 100;
    let lineTotal = taxable + cgst + sgst;
    let discountAmount = 0;
    if (item.discountValue && item.discountValue > 0) {
      if (item.discountType === 'percent') {
        discountAmount = (lineTotal * item.discountValue) / 100;
      } else {
        discountAmount = item.discountValue;
      }
      lineTotal -= discountAmount;
    }
    overallTaxable += taxable;
    overallCGST += cgst;
    overallSGST += sgst;
    overallLineTotal += lineTotal;
    return {
      ...item,
      taxable,
      cgst,
      sgst,
      discountAmount,
      discountDisplay: item.discountValue && item.discountValue > 0
        ? (item.discountType === 'percent' ? `${item.discountValue}%` : `₹${item.discountValue}`)
        : '',
      lineTotal,
    };
  });

  let start = 0, itemIndex = 0;
  const pages = pageSizes.map((size, idx) => {
    const pageItems = enhancedItems.slice(start, start + size);
    start += size;
    const isLastPage = idx === totalPages - 1;
    let pageTaxable = 0, pageCGST = 0, pageSGST = 0, pageLineTotal = 0;
    const itemRows = pageItems.map((item, rowIdx) => {
      const slNo = itemIndex + rowIdx + 1;
      pageTaxable += item.taxable;
      pageCGST += item.cgst;
      pageSGST += item.sgst;
      pageLineTotal += item.lineTotal;
      const gstRate = parseFloat(item.gstRate) || 0;
      const cgstPercent = (gstRate / 2).toFixed(1);
      const sgstPercent = (gstRate / 2).toFixed(1);
      const cgstDisplay = `${item.cgst.toFixed(2)} (${cgstPercent}%)`;
      const sgstDisplay = `${item.sgst.toFixed(2)} (${sgstPercent}%)`;
      const discountDisplay = item.discountAmount > 0 ? `₹${item.discountAmount.toFixed(2)}` : '';
      return {
        slNo,
        mf: item.company || '',
        name: item.productName,
        packing: formatPacking(item.packing),
        batch: item.batchNumber,
        exp: item.expiryDate ? item.expiryDate.slice(5).replace('-', '/') : '',
        mrp: item.mrp,
        rate: item.rate,
        qtyDisplay: (item.freeQty || 0) > 0 ? `${item.chargeableQty}+${item.freeQty}` : `${item.chargeableQty}`,
        taxable: item.taxable,
        cgstDisplay,
        sgstDisplay,
        discountDisplay,
        lineTotal: item.lineTotal,
      };
    });
    itemIndex += pageItems.length;
    return { items: itemRows, isLastPage, pageIdx: idx + 1, pageTaxable, pageCGST, pageSGST, pageLineTotal, pageTotalItems: pageItems.length };
  });

  const taxSummaryStr = Object.values(
    allItems.reduce((acc, item) => {
      const rate = item.gstRate;
      const key = `${item.hsn}|${rate}`;
      if (!acc[key]) acc[key] = { hsn: item.hsn, rate, qty: 0, taxable: 0, cgst: 0, sgst: 0 };
      const taxable = item.chargeableQty * item.rate;
      const cgst = taxable * (rate / 2) / 100;
      const sgst = taxable * (rate / 2) / 100;
      acc[key].qty += item.chargeableQty + (item.freeQty || 0);
      acc[key].taxable += taxable;
      acc[key].cgst += cgst;
      acc[key].sgst += sgst;
      return acc;
    }, {})
  ).map(g => `HSN ${g.hsn} Q${g.qty} ${g.rate}% A${g.taxable.toFixed(2)} C${g.cgst.toFixed(2)} S${g.sgst.toFixed(2)}`).join(', ');

  const pagesHtml = pages.map(page => `
    <div class="page">
      <div class="page-inner">
        <div class="header-three-col">
          <div class="seller-col">
            <div class="seller-name"><b>${seller.name}</b></div>
            <div>${seller.address}</div>
            <div><b>DIST.</b> ${seller.dist} , <b>Phone:</b> ${seller.phone}</div>
            <div><b>D.L. No.:</b> ${seller.dlNo}</div>
            <div><b>GSTIN:</b> ${seller.gstin} &nbsp;<b>DrugsBazaar ID:</b> ${seller.drugsBazaarId}</div>
          </div>
          <div class="middle-col">
            <div class="tax-invoice">TAX INVOICE</div>
            <div class="invoice-meta-vertical">
              <div><b>Inv No:</b> ${invoiceNo}</div>
              <div><b>Date:</b> ${invoiceDate}</div>
              <div><b>Bill Type:</b> ${billType}</div>
            </div>
          </div>
          <div class="buyer-col">
            <div class="buyer-name"><b>To: ${buyer}</b> (${buyerCity})</div>
            <div><b>GSTIN/UIN:</b> ${buyerGstin} &nbsp;<b>D.L. No.:</b> ${buyerDl}</div>
            <div><b>State:</b> ${buyerState} &nbsp;<b>ID:</b> ${buyerStateCode}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Sl</th><th>Company</th><th>Product Name</th><th>Packing</th>
              <th>Batch No</th><th>Exp Dt</th><th>MRP</th><th>Rate</th>
              <th>Qty</th><th>Taxable</th><th>CGST (%)</th><th>SGST (%)</th>
              <th>Discount</th><th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${page.items.map(row => `
              <tr>
                <td class="c">${row.slNo}</td>
                <td class="l">${row.mf}</td>
                <td class="l">${row.name}</td>
                <td class="l">${row.packing}</td>
                <td class="l">${row.batch}</td>
                <td class="c">${row.exp}</td>
                <td class="r">${row.mrp.toFixed(2)}</td>
                <td class="r">${row.rate.toFixed(2)}</td>
                <td class="l">${row.qtyDisplay}</td>
                <td class="r">${row.taxable.toFixed(2)}</td>
                <td class="r">${row.cgstDisplay}</td>
                <td class="r">${row.sgstDisplay}</td>
                <td class="r">${row.discountDisplay}</td>
                <td class="r">${row.lineTotal.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="page-total">
              <td colspan="9" class="l"><b>Page total (${page.pageTotalItems})</b></td>
              <td class="r"><b>${page.pageTaxable.toFixed(2)}</b></td>
              <td class="r"><b>${page.pageCGST.toFixed(2)}</b></td>
              <td class="r"><b>${page.pageSGST.toFixed(2)}</b></td>
              <td class="r"></td>
              <td class="r"><b>${page.pageLineTotal.toFixed(2)}</b></td>
            </tr>
            ${page.isLastPage ? `
            <tr class="bill-total">
              <td colspan="9" class="l"><b>Bill Total</b></td>
              <td class="r"><b>${overallTaxable.toFixed(2)}</b></td>
              <td class="r"><b>${overallCGST.toFixed(2)}</b></td>
              <td class="r"><b>${overallSGST.toFixed(2)}</b></td>
              <td class="r"></td>
              <td class="r"><b>${overallLineTotal.toFixed(2)}</b></td>
            </tr>` : ''}
          </tbody>
        </table>

        ${page.isLastPage ? `
          <div class="tax-summary">
            <b>Tax Summary:</b> ${taxSummaryStr}
          </div>
          <div class="amount-words">
            <b>Amount in Words:</b> ${numberToWords(Math.round(overallLineTotal))}
          </div>
          <div class="extra-line">
            <span><b>Total Units:</b> ${allItems.reduce((s, i) => s + i.chargeableQty + (i.freeQty || 0), 0)}</span>
            <span><b>Adv. Freight (0)</b></span>
            <span><b>Prev Bal (${previousDays}d):</b> ₹${previousBalance.toLocaleString()}</span>
          </div>
          <div class="footer">
            <div>
              <b>Terms:</b> E.&amp;O.E. * NB: Registration certificate valid on date of invoice.
              Net amount rounded off.<br>
              Warranty under section 18 of Drugs &amp; Cosmetic Act 1940. Transport:
            </div>
            <div><b>Net Amount: ₹${overallLineTotal.toFixed(2)}</b></div>
          </div>
          <div class="signatures">
            <div class="sign-line">Signature (Mila Agencies)</div>
            <div class="sign-line">Signature (${buyer})</div>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${invoiceNo}</title>
  <meta charset="utf-8">
  <style>
    @page { size: A5; margin: 0.35cm; }
    html, body { margin: 0; padding: 0; background: white; font-family: Arial, sans-serif; }
    .page {
      box-sizing: border-box;
      width: calc(148mm - 0.7cm);
      height: calc(210mm - 0.7cm);
      page-break-after: always;
      display: flex;
      flex-direction: column;
    }
    .page:last-child { page-break-after: auto; }
    .page-inner {
      box-sizing: border-box;
      flex: 1;
      border: 0.5px solid #000;
      padding: 2px 4px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
.header-three-col {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 0.5px solid #aaa;
  padding-bottom: 2px;
  margin-bottom: 3px;
}
  .seller-col, .buyer-col {
    flex: 1;
    font-size: 4.5pt;
    line-height: 1.2;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .seller-col {
  flex: 1;
  font-size: 4.5pt;
  line-height: 1.3;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-right: 4px;
}
 .buyer-col {
  flex: 1;
  font-size: 4.5pt;
  line-height: 1.3;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 4px;
}
  .middle-col {
  flex: 0.8;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-left: 0.5px solid #aaa;
  border-right: 0.5px solid #aaa;
  padding: 0 4px;
}
  .seller-name, .buyer-name {
    font-size: 7pt;
    font-weight: bold;
  }

    .tax-invoice {
      font-size: 9pt;
      font-weight: bold;
      margin: 0 0 2px 0;
      line-height: 1;
    }
    .invoice-meta-vertical div {
      font-size: 7pt;
      margin: 1px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 2px 0;
      font-size: 5pt;
    }
    th, td {
      border: 0.5px solid #aaa;
      padding: 1px 2px;
      text-align: center;
    }
    th { background: #f1f5f9; font-weight: bold; }
    .l { text-align: left; }
    .r { text-align: right; }
    .c { text-align: center; }
    .page-total { background: #e2e8f0; font-weight: bold; }
    .bill-total { background: #cbd5e1; font-weight: bold; }
    .tax-summary {
      background: #fefce8;
      border: 0.5px solid #fde047;
      padding: 1px 2px;
      margin: 3px 0;
      font-size: 3.5pt;
      word-break: break-all;
    }
    .amount-words {
      background: #f1f5f9;
      padding: 1px 2px;
      margin: 2px 0;
      border-left: 2px solid #0f172a;
      font-size: 4pt;
    }
    .extra-line {
      display: flex;
      justify-content: space-between;
      font-size: 4pt;
      margin: 2px 0;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      border-top: 0.5px solid #aaa;
      padding-top: 2px;
      font-size: 3.5pt;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 5px;
    }
    .sign-line {
      width: 100px;
      border-top: 0.5px dashed #aaa;
      padding-top: 1px;
      text-align: center;
      font-size: 4pt;
      color: #94a3b8;
    }
  </style>
</head>
<body>
${pagesHtml}
</body>
</html>`;
};