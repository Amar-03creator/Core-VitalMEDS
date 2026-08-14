// server/src/helpers/invoicePdfGenerator.js

const pdfModule = require('./invoicePDF/generateInvoicePdf');
const generateInvoicePdfDoc = typeof pdfModule === 'function' ? pdfModule : (pdfModule.generateInvoicePdfDoc || pdfModule.default);

const toInvoiceData = (invoice) => ({
   id: invoice.invoiceNumber,
   client: invoice.clientName,
   gstin: invoice.clientGSTIN,
   drugLicense: invoice.clientDrugLicense,
   city: invoice.clientObjectId?.city || invoice.clientObjectId?.district || '',
   area: invoice.clientBillingAddress || '',
   date: invoice.invoiceDate,
   previousBalance: invoice.previousOutstanding || 0,
   previousBalanceDate: invoice.previousOutstandingDate || null,
   billType: invoice.billType,
   // ✨ Pass the snapshot data down!
   sellerSnapshot: invoice.sellerSnapshot 
});

const deriveGstRate = (item) => {
   if (!item.taxableValue) return 0;
   const totalTax = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
   return (totalTax / item.taxableValue) * 100;
};

const toLineItems = (invoice) =>
   (invoice.items || []).map((item) => ({
     productName: item.productName,
     company: item.companyShortCode,
     companyShortCode: item.companyShortCode,
     hsn: item.hsn,
     packing: item.packing,
     batchNumber: item.batchNumber,
     expiryDate: item.expiryDate,
     mrp: item.mrp,
     rate: item.rate,
     chargeableQty: item.chargeableQty,
     freeQty: item.freeQty || 0,
     discountPercent: item.discountPercent || 0,
     discountAmount: item.discountAmount || 0,
     taxableValue: item.taxableValue,
     grossAmount: item.grossAmount,
     cgst: item.cgst || 0,
     sgst: item.sgst || 0,
     igst: item.igst || 0,
     lineTotal: item.lineTotal,
     gstRate: deriveGstRate(item),
   }));

async function generateInvoicePdfBuffer(invoice, adminProfile = {}) {
   if (typeof generateInvoicePdfDoc !== 'function') {
       throw new Error("CRITICAL: generateInvoicePdfDoc is not exported properly from ./invoicePDF/generateInvoicePdf.js");
   }

   const allItems = toLineItems(invoice);
   const invoiceData = toInvoiceData(invoice);
   const billGstType = (invoice.totalIGST || 0) > 0 ? 'interstate' : 'intrastate';

   // ✨ Pass the adminProfile as the final parameter
   const doc = generateInvoicePdfDoc(
     invoiceData,
     allItems,
     invoice.totalTaxable,
     invoice.totalCGST,
     invoice.totalSGST,
     invoice.netAmount,
     invoice.globalDiscountAmount, 
     invoice.globalDiscountAmount,
     billGstType,
     adminProfile
   );

   const arrayBuffer = doc.output('arraybuffer');
   return Buffer.from(arrayBuffer);
}

module.exports = { generateInvoicePdfBuffer };