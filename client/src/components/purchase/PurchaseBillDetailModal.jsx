// src/components/purchase/PurchaseBillDetailModal.jsx

import { X, Download, Printer } from 'lucide-react';
import { STATUS_CFG } from '../../features/Admin/BillingPage/utils/constants';
import { toast } from 'sonner';
import { useBackHandler, useScrollLock } from '../../hooks/useBackHandler';
import { downloadPurchaseBillPDF, printPurchaseBillPDF } from './generatePurchaseBillPdf';

export const PurchaseBillDetailModal = ({ bill, onClose }) => {
  useBackHandler(!!bill, onClose, `purchaseBillDetail_${bill?.invoiceNumber || bill?._id || 'empty'}`);
  useScrollLock(!!bill);

  if (!bill) return null;

  const { pill, label } = STATUS_CFG[bill.paymentStatus] || { pill: 'bg-slate-100', label: bill.paymentStatus };
  const products = bill.items || [];

  const toIndianDate = (dateInput) => {
    if (!dateInput) return '';
    return new Date(dateInput).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const displaySupplier = bill.supplierId?.shortCode || bill.supplierName;
  const displayCity = bill.supplierId?.city || 'Unknown City';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center">
      <style>{`
        @keyframes slideUpFromBottom {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUpFromBottom 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
      
      <div className="w-full max-w-2xl bg-white rounded-t-2xl flex flex-col overflow-hidden animate-slideUp" style={{ height: '85dvh' }}>
        
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-3 border-b border-slate-100 z-10 shadow-sm">
          <div>
            <p className="font-bold text-blue-600 font-mono text-lg tracking-wide">{bill.invoiceNumber}</p>
            <p className="text-slate-800 font-bold text-base mt-0.5">{displaySupplier}</p>
            <p className="text-slate-500 text-sm font-medium mt-0.5">📍 {displayCity}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 bg-slate-50/50">
          
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${pill}`}>{label}</span>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${bill.billType === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
              {bill.billType} Bill
            </span>
            <span className="text-sm font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
              📅 Inv: {toIndianDate(bill.invoiceDate)}
            </span>
            <span className="text-sm font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
              📦 Rcvd: {toIndianDate(bill.receivedDate)}
            </span>
          </div>

          {/* Items List */}
          <div>
            <h3 className="font-bold text-slate-800 text-lg mb-3">Purchased Items</h3>
            {products.length > 0 ? (
              <div className="space-y-3">
                {products.map((p, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-100">
                      <div>
                        <p className="text-slate-900 font-semibold text-xl">{p.productName}</p>
                        <div className="flex items-center gap-1 text-sm font-bold text-slate-500 mt-0.5">
                          <span className="text-slate-600 text-md font-mono uppercase tracking-wide">
                            Batch: {p.batchNumber}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-900 font-bold text-xl">
                          ₹{Math.round(p.lineTotal)}
                        </p>
                        <p className="text-slate-400 text-sm">
                          incl. {(p.cgstPercent || 0) + (p.sgstPercent || 0) + (p.igstPercent || 0)}% GST
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-white space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-sm font-semibold">
                          📆 Exp: {p.expiryDate ? (typeof p.expiryDate === 'string' ? p.expiryDate.split('T')[0] : p.expiryDate) : 'N/A'}
                        </span>
                        <div className="flex items-center gap-2 text-lg">
                          <span className="font-medium text-slate-600">Qty:</span>
                          <span className="font-bold text-slate-800">{p.billedQty}</span>
                          {p.freeQty > 0 && (
                            <>
                              <span className="text-slate-400">+</span>
                              <span className="font-bold text-emerald-600">{p.freeQty} free</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 text-lg text-slate-600 pt-1">
                        <span>Rate: <strong className="text-slate-800">₹{p.purchaseRate}</strong></span>
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
              <div className="bg-white rounded-xl border border-slate-200 py-8 text-center text-slate-500 text-sm">
                Item details not available
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-xl divide-y divide-slate-100 shadow-sm border border-slate-200 overflow-hidden mb-4">
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-slate-500 font-semibold">Gross Total (Taxable)</span>
              <span className="text-slate-800 font-bold">₹{bill.grossAmount?.toFixed(2)}</span>
            </div>
            
            {bill.billDiscountAmount > 0 && (
              <div className="flex justify-between px-4 py-3 text-sm bg-amber-50 text-amber-700">
                <span className="font-semibold">Bill Discount {bill.billDiscountPercent > 0 && `(${bill.billDiscountPercent}%)`}</span>
                <span className="font-bold">- ₹{bill.billDiscountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-slate-500 font-semibold">Total GST</span>
              <span className="text-slate-800 font-bold">₹{bill.totalGST?.toFixed(2)}</span>
            </div>

            <div className="flex justify-between px-4 py-4 bg-slate-900 items-center">
              <span className="text-slate-200 font-bold text-base uppercase tracking-wider">Net Amount</span>
              <span className="text-emerald-400 font-black text-2xl">₹{Math.round(bill.netAmount || 0).toLocaleString('en-IN')}</span>
            </div>

            {bill.dueAmount > 0 && (
              <div className="flex justify-between px-4 py-3 bg-red-50 text-sm items-center border-t border-red-100">
                <span className="text-red-700 font-bold uppercase tracking-wider">Outstanding Due</span>
                <span className="text-red-700 font-black text-lg">₹{Math.round(bill.dueAmount).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer – now with real Print & Download */}
        <div className="bg-white border-t border-slate-200 px-5 py-4 z-10 flex gap-3">
          <button
            onClick={() => printPurchaseBillPDF(bill)}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Printer size={18} /> Print
          </button>
          <button
            onClick={() => downloadPurchaseBillPDF(bill)}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Download size={18} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};