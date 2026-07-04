// src/components/invoices/InvoiceDetailModal.jsx
import { X, Download, Printer } from 'lucide-react';
import { STATUS_CFG } from '../../features/Admin/BillingPage/utils/constants';
import { useBackHandler, useScrollLock } from '../../hooks/useBackHandler';
import { downloadInvoicePDF, printInvoicePDF } from '../../features/Admin/BillingPage/pdf/invoice/generateInvoicePdf'; 

export const InvoiceDetailModal = ({ invoice, onClose }) => {
  if (!invoice) return null;
  useBackHandler(true, onClose, `invDetail_${invoice.invoiceNumber || invoice.id}`);
  useScrollLock(true);

  const { pill, label } = STATUS_CFG[invoice.status] || { pill: 'bg-slate-100', label: invoice.status };
  const products = invoice.products || invoice.items || [];

  const toIndianDate = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const dueDate = invoice.dueDate
    ? invoice.dueDate
    : (() => {
        if (!invoice.date && !invoice.invoiceDate) return '';
        const dt = new Date(invoice.date || invoice.invoiceDate);
        dt.setDate(dt.getDate() + 21);
        return dt.toISOString().split('T')[0];
      })();

  let totalTaxable = 0, totalCGST = 0, totalSGST = 0, totalIGST = 0, totalDiscount = 0;
  
  const enhancedProducts = products.map(p => {
    const gross = p.grossAmount ?? ((p.rate || 0) * (p.chargeableQty || 0));
    const discountAmount = p.discountAmount ?? 0;
    const taxable = p.taxableValue ?? (gross - discountAmount);
    
    const cgst = p.cgst ?? (taxable * (p.gstRate || 0) / 2 / 100);
    const sgst = p.sgst ?? (taxable * (p.gstRate || 0) / 2 / 100);
    const igst = p.igst ?? 0;
    
    const lineTotal = p.lineTotal ?? (taxable + cgst + sgst + igst);
    
    totalTaxable += taxable;
    totalCGST += cgst;
    totalSGST += sgst;
    totalIGST += igst;
    totalDiscount += discountAmount;
    
    const totalGST = cgst + sgst + igst;
    const computedGstRate = taxable > 0 ? (totalGST / taxable * 100) : 0;
    const gstRate = p.gstRate || computedGstRate;
    
    return { ...p, gross, discountAmount, taxable, cgst, sgst, igst, gstRate, lineTotal };
  });

  const globalDiscount = invoice.globalDiscountAmount || invoice.discount || 0;
  
  // ★ FIXED: Stop recalculating. Trust the final amount saved in the database!
  const finalAmount = invoice.netAmount ?? invoice.amount ?? 0;
  const newOutstanding = invoice.dueAmount || invoice.due || 0;

  const getCleanInvoiceData = () => ({
    id: invoice.invoiceNumber || invoice.id,
    client: invoice.clientName || invoice.client,
    area: invoice.clientBillingAddress || invoice.area || '',
    date: invoice.invoiceDate || invoice.date,
    dueDate: dueDate,
    status: invoice.paymentStatus || invoice.status,
    billType: invoice.billType,
    discount: globalDiscount,
    gstin: invoice.clientGSTIN || invoice.gstin || '',
    drugLicense: invoice.clientDrugLicense || invoice.drugLicense || '',
    previousBalance: invoice.previousOutstanding || 0,
    previousBalanceDate: invoice.previousOutstandingDate || null,
  });

  const handleDownloadPDF = () => {
    downloadInvoicePDF(
      getCleanInvoiceData(), enhancedProducts, totalTaxable, totalCGST, totalSGST,
      finalAmount, globalDiscount, globalDiscount,
      totalIGST > 0 ? 'interstate' : 'intrastate' 
    );
  };

  const handlePrintPDF = () => {
    printInvoicePDF(
      getCleanInvoiceData(), enhancedProducts, totalTaxable, totalCGST, totalSGST,
      finalAmount, globalDiscount, globalDiscount,
      totalIGST > 0 ? 'interstate' : 'intrastate' 
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <style>{`
        @keyframes slideUpFromBottom {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUpFromBottom 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
      <div className="w-full bg-white rounded-t-2xl flex flex-col overflow-hidden animate-slideUp" style={{ height: '82dvh' }}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-3 border-b border-slate-100 z-10">
          <div>
            <p className="font-bold text-slate-900 font-mono text-lg">{invoice.invoiceNumber || invoice.id}</p>
            <p className="text-slate-500 text-base">{invoice.clientName || invoice.client} {invoice.clientBillingAddress ? `· ${invoice.clientBillingAddress}` : ''}</p>
          </div>
          <button onClick={onClose}><X size={24} className="text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${pill}`}>{label}</span>
            <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${invoice.billType === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
              {invoice.billType} Bill
            </span>
            <span className="text-base text-slate-500">📅 {toIndianDate(invoice.invoiceDate || invoice.date)}</span>
            <span className="text-base text-slate-500">⏰ Due: {toIndianDate(dueDate)}</span>
          </div>

          <h3 className="font-bold text-slate-800 text-xl pt-2 border-t border-slate-100">Invoice Items</h3>

          {enhancedProducts.length > 0 ? (
            <div className="space-y-3">
              {enhancedProducts.map((p, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-100">
                    <div>
                      <p className="text-slate-900 font-semibold text-xl">{p.productName || p.name}</p>
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-500">
                        <span>{p.companyShortCode || p.company}</span>
                        <span className="text-slate-600 text-md font-mono">· {p.batchNumber || p.batch}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-900 font-bold text-xl">
                        ₹{Math.round(p.lineTotal)}
                      </p>
                      <p className="text-slate-400 text-sm">incl. {p.gstRate}% GST</p>
                    </div>
                  </div>

                  <div className="p-2 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-sm">
                        📆 Exp: {p.expiryDate ? (typeof p.expiryDate === 'string' ? p.expiryDate.split('T')[0] : p.expiryDate) : 'N/A'}
                      </span>
                      <div className="flex items-center gap-2 text-lg">
                        <span className="font-medium text-slate-600">Qty:</span>
                        <span className="font-bold text-slate-800">{p.chargeableQty}</span>
                        {p.freeQty > 0 && (
                          <>
                            <span className="text-slate-400">+</span>
                            <span className="font-bold text-emerald-600">{p.freeQty} free</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 text-lg text-slate-600">
                      <span>Rate: <strong className="text-slate-800">₹{p.rate}</strong></span>
                      <span>MRP: <strong className="text-slate-800">₹{p.mrp}</strong></span>
                      {p.discountPercent > 0 && (
                        <span>Disc: <strong className="text-amber-600">{p.discountPercent}%</strong></span>
                      )}
                      {p.discountPercent === 0 && p.discountAmount > 0 && (
                        <span>Disc: <strong className="text-amber-600">₹{p.discountAmount.toFixed(2)}</strong></span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 py-8 text-center text-slate-500 text-base">
              Product details not available
            </div>
          )}

          <div className="bg-slate-50 rounded-2xl divide-y divide-slate-200 overflow-hidden border border-slate-200">
            <div className="flex justify-between px-4 py-3 text-base">
              <span className="text-slate-600">Subtotal (Taxable)</span>
              <span className="text-slate-800 font-medium">₹{totalTaxable.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between px-4 py-3 text-base text-amber-700">
                <span>Line Discounts</span>
                <span className="font-semibold">- ₹{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between px-4 py-3 text-base">
              <span className="text-slate-600">CGST</span>
              <span className="text-slate-800 font-medium">₹{totalCGST.toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-4 py-3 text-base">
              <span className="text-slate-600">SGST</span>
              <span className="text-slate-800 font-medium">₹{totalSGST.toFixed(2)}</span>
            </div>
            {totalIGST > 0 && (
              <div className="flex justify-between px-4 py-3 text-base">
                <span className="text-slate-600">IGST</span>
                <span className="text-slate-800 font-medium">₹{totalIGST.toFixed(2)}</span>
              </div>
            )}
            
            {globalDiscount > 0 && (
              <div className="flex justify-between px-4 py-3 text-base text-amber-700 bg-amber-50">
                <span>
                  Bill Discount
                  {invoice.globalDiscountPercent > 0 && ` (${invoice.globalDiscountPercent}%)`}
                </span>
                <span className="font-bold">- ₹{globalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between px-4 py-4 bg-slate-900">
              <span className="text-white font-bold text-lg">Net Amount</span>
              <span className="text-emerald-400 font-black text-xl">₹{Math.round(finalAmount).toLocaleString('en-IN')}</span>
            </div>

            {newOutstanding > 0 && (
              <div className="flex justify-between px-4 py-3 bg-red-50 text-base">
                <span className="text-red-700 font-semibold">Due Amount</span>
                <span className="text-red-700 font-black">₹{Math.round(newOutstanding).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-3 z-10 flex gap-3">
          <button
            onClick={handlePrintPDF}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-xl text-base hover:bg-blue-700 transition-colors"
          >
            <Printer size={18} /> Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3 rounded-xl text-base hover:bg-slate-800 transition-colors"
          >
            <Download size={18} /> Download
          </button>
        </div>
      </div>
    </div>
  );
};