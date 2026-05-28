// InvoiceDetailModal.jsx (with sticky status & balance section)
import { X, Download, Plus, Minus, Equal } from 'lucide-react';
import { STATUS_CFG, INVOICES } from '../utils/constants';
import { useModalBackHandler } from '../utils/hooks';

export const InvoiceDetailModal = ({ invoice, onClose }) => {
  if (!invoice) return null;
  useModalBackHandler(true, onClose);
  const { pill, label } = STATUS_CFG[invoice.status];
  const products = invoice.products || [];

  // Calculate totals including line-level discounts
  let totalTaxable = 0, totalGST = 0, totalDiscount = 0;
  const enhancedProducts = products.map(p => {
    const gross = p.rate * p.chargeableQty;
    const discountAmount = (p.discountPercent ? (gross * p.discountPercent / 100) : 0) || 0;
    const taxable = gross - discountAmount;
    const gst = taxable * p.gstRate / 100;
    totalTaxable += taxable;
    totalGST += gst;
    totalDiscount += discountAmount;
    return { ...p, gross, discountAmount, taxable, gst, cgst: gst / 2, sgst: gst / 2 };
  });

  const netAmount = totalTaxable + totalGST;
  const overallDiscount = invoice.discount || 0;
  const finalAmount = netAmount - overallDiscount;

  // Compute previous outstanding for this client
  const clientInvoices = INVOICES.filter(i => i.client === invoice.client && i.id !== invoice.id);
  const previousBalance = clientInvoices.reduce((sum, i) => sum + i.due, 0);
  const newOutstanding = previousBalance + invoice.due;
  const creditBalance = 0; // placeholder

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end animate-fadeIn">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div className="w-full bg-white rounded-t-2xl max-h-[92vh] overflow-y-auto animate-fadeInUp">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-2 border-b border-slate-100 z-10">
          <div>
            <p className="font-bold text-slate-900 font-mono text-base">{invoice.id}</p>
            <p className="text-slate-500 text-sm">{invoice.client} · {invoice.area}</p>
          </div>
          <button onClick={onClose}><X size={22} className="text-slate-400" /></button>
        </div>

        {/* Sticky Status & Balance Section (below header) */}
        <div className="sticky top-15 bg-white z-10 px-5 pb-1 mt-1 border-slate-100 space-y-1">
          {/* Status & date row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pill}`}>{label}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${invoice.billType === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
              {invoice.billType} Bill
            </span>
            <span className="text-sm text-slate-500">📅 {invoice.date}</span>
            <span className="text-sm text-slate-500">⏰ Due: {invoice.dueDate}</span>
            {invoice.overdueDays > 0 && (
              <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full">{invoice.overdueDays} days overdue</span>
            )}
          </div>

          {/* Balance summary cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-50 rounded-xl p-2 text-center">
              <p className="text-blue-600 text-xs font-semibold">Previous Balance</p>
              <p className="text-blue-800 font-bold text-lg">₹{previousBalance.toLocaleString()}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-2 text-center">
              <p className="text-amber-600 text-xs font-semibold">This Bill</p>
              <p className="text-amber-800 font-bold text-lg">₹{invoice.amount.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-2 text-center">
              <p className="text-red-600 text-xs font-semibold">New Outstanding</p>
              <p className="text-red-800 font-bold text-lg">₹{newOutstanding.toLocaleString()}</p>
            </div>
          </div>
          {creditBalance > 0 && (
            <div className="bg-emerald-50 rounded-xl p-2 text-center">
              <p className="text-emerald-600 text-xs font-semibold">Prepaid Credit</p>
              <p className="text-emerald-800 font-bold text-lg">₹{creditBalance.toLocaleString()}</p>
            </div>
          )}
          <div className=" bg-white z-10 px-5 mt-3 pt-2 underline border-t pl-0 border-slate-100 font-bold text-slate-800 text-xl">Invoice Items</div>
        </div>


        {/* Scrollable content below the sticky sections */}
        <div className="px-5 py-4 space-y-5">
          {/* Products section – each product as a card, showing SKU and batch */}
          {products.length > 0 ? (
            <div className="space-y-3">

              {enhancedProducts.map((p, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Header: product name + packing + amount */}
                  <div className="bg-slate-50 px-3 py-2 flex justify-between items-center border-b border-slate-100">
                    <div>
                      <p className="text-slate-900 font-semibold text-base">{p.name}</p>
                      <p className="text-slate-500 text-xs">{p.packing} · HSN: {p.hsn}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-900 font-bold text-base">₹{Math.round(p.gross + p.gst)}</p>
                      <p className="text-slate-400 text-[10px]">incl. GST</p>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    {/* SKU, Batch, Expiry badges */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full font-mono">🔖 SKU: {p.sku}</span>
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-mono">🧬 Batch: {p.batch}</span>
                      <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-full">📆 Exp: {p.expiryDate}</span>
                    </div>

                    {/* Quantity: chargeable + free */}
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium text-slate-600">Quantity:</span>
                      <span className="font-bold text-slate-800">{p.chargeableQty}</span>
                      {p.freeQty > 0 && (
                        <>
                          <Plus size={14} className="text-slate-400" />
                          <span className="font-bold text-emerald-600">{p.freeQty} free</span>
                        </>
                      )}
                    </div>

                    {/* Rate, MRP, Discount % */}
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <span>Rate: <strong className="text-slate-800">₹{p.rate}</strong></span>
                      <span>MRP: <strong className="text-slate-800">₹{p.mrp}</strong></span>
                      {p.discountPercent > 0 && (
                        <span>Disc: <strong className="text-amber-600">{p.discountPercent}%</strong></span>
                      )}
                    </div>

                    {/* Line total formula */}
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
                        <div className="text-center">
                          <p className="text-slate-500">Taxable</p>
                          <p className="font-bold text-slate-800">₹{p.taxable.toFixed(0)}</p>
                        </div>
                        <Plus size={14} className="text-slate-400" />
                        <div className="text-center">
                          <p className="text-slate-500">GST ({p.gstRate}%)</p>
                          <p className="font-bold text-slate-800">₹{p.gst.toFixed(0)}</p>
                        </div>
                        <Minus size={14} className="text-slate-400" />
                        <div className="text-center">
                          <p className="text-slate-500">Discount</p>
                          <p className="font-bold text-amber-600">₹{p.discountAmount.toFixed(0)}</p>
                        </div>
                        <Equal size={14} className="text-emerald-500" />
                        <div className="text-center">
                          <p className="text-slate-500">Line Total</p>
                          <p className="font-bold text-emerald-600">₹{Math.round(p.taxable + p.gst - p.discountAmount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 py-6 text-center text-slate-500 text-sm">
              Product details not available
            </div>
          )}

          {/* Totals section with discounts */}
          <div className="bg-slate-50 rounded-2xl divide-y divide-slate-200 overflow-hidden border border-slate-200">
            <div className="flex justify-between px-4 py-2.5 text-sm">
              <span className="text-slate-600">Subtotal (Taxable)</span>
              <span className="text-slate-800 font-medium">₹{totalTaxable.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between px-4 py-2.5 text-sm text-amber-700">
                <span>Line Discounts</span>
                <span className="font-semibold">- ₹{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            {overallDiscount > 0 && (
              <div className="flex justify-between px-4 py-2.5 text-sm text-amber-700 bg-amber-50">
                <span>Additional Bill Discount</span>
                <span className="font-bold">- ₹{overallDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between px-4 py-2.5 text-sm">
              <span className="text-slate-600">CGST</span>
              <span className="text-slate-800 font-medium">₹{(totalGST / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5 text-sm">
              <span className="text-slate-600">SGST</span>
              <span className="text-slate-800 font-medium">₹{(totalGST / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-4 py-3.5 bg-slate-900">
              <span className="text-white font-bold text-base">Net Amount</span>
              <span className="text-emerald-400 font-black text-xl">₹{Math.round(finalAmount).toLocaleString()}</span>
            </div>
            {invoice.due > 0 && (
              <div className="flex justify-between px-4 py-2.5 bg-red-50">
                <span className="text-red-700 font-semibold text-sm">Due Amount</span>
                <span className="text-red-700 font-black">₹{invoice.due.toLocaleString()}</span>
              </div>
            )}
          </div>

          <button className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3 rounded-xl text-sm">
            <Download size={15} /> Download PDF Invoice
          </button>
        </div>
      </div>
    </div>
  );
};