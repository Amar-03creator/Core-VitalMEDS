// components/Admin/BillingPage/modals/MakeInvoiceModal/Step3.jsx
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { calcLineTotal } from '../../utils/helpers';

export const Step3 = ({
  invoiceNumber,
  selectedClient,
  billType,
  invoiceDate,
  gstin,
  drugLicense,
  items,
  totalTaxable,
  globalDiscountValue,
  globalDiscountType,
  finalDiscount,
  totalCGST,
  totalSGST,
  roundOff,
  netAmount,
  onBack,
  onConfirm
}) => (
  <div className="space-y-5">
    <div className="bg-slate-900 rounded-2xl p-4 space-y-2">
      <div className="flex justify-between"><span className="text-slate-400 text-sm font-semibold uppercase">Invoice No.</span><span className="text-emerald-400 font-mono font-bold text-base">{invoiceNumber}</span></div>
      <div className="flex justify-between"><span className="text-slate-400 text-sm">Party</span><span className="text-white font-semibold text-base">{selectedClient?.name}</span></div>
      <div className="flex justify-between"><span className="text-slate-400 text-sm">Bill Type</span><span className={`text-sm font-bold px-2 py-0.5 rounded-full ${billType === 'Cash' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>{billType}</span></div>
      <div className="flex justify-between"><span className="text-slate-400 text-sm">Invoice Date</span><span className="text-white text-base">{invoiceDate}</span></div>
      <div className="flex justify-between"><span className="text-slate-400 text-sm">GSTIN</span><span className="text-white text-sm font-mono">{gstin}</span></div>
      <div className="flex justify-between"><span className="text-slate-400 text-sm">Drug License</span><span className="text-white text-sm font-mono">{drugLicense}</span></div>
    </div>

    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 grid grid-cols-[1fr_auto_auto_auto] text-xs font-bold text-slate-500 uppercase gap-2">
        <span>Product</span><span className="text-right">Qty</span><span className="text-right">Rate</span><span className="text-right">Total</span>
      </div>
      {items.map((item, idx) => {
        const { lineTotal } = calcLineTotal(item);
        return (
          <div key={idx} className="px-4 py-2.5 grid grid-cols-[1fr_auto_auto_auto] gap-2 border-t border-slate-100 items-center">
            <div><p className="text-slate-800 text-sm font-semibold">{item.productName}</p><p className="text-slate-400 text-[10px] font-mono">{item.batchNumber} ({item.expiryDate ? item.expiryDate.slice(5).replace('-', '/') : '—'})</p></div>
            <span className="text-slate-700 text-sm text-right">{item.chargeableQty}{item.freeQty > 0 && <span className="text-emerald-600">+{item.freeQty}</span>}</span>
            <span className="text-slate-700 text-sm text-right">₹{item.rate}</span>
            <span className="text-slate-800 text-sm font-bold text-right">₹{lineTotal.toFixed(0)}</span>
          </div>
        );
      })}
    </div>

    <div className="bg-slate-50 rounded-2xl divide-y divide-slate-200 overflow-hidden border border-slate-200">
      <div className="flex justify-between px-4 py-2.5 text-sm"><span className="text-slate-600">Total Taxable Value (Before Discount)</span><span className="text-slate-800 font-medium">₹{totalTaxable.toFixed(2)}</span></div>
      {globalDiscountValue > 0 && <div className="flex justify-between px-4 py-2.5 text-sm text-amber-700 bg-amber-50"><span className="font-semibold">Additional Discount ({globalDiscountType === 'percent' ? `${globalDiscountValue}%` : `₹${globalDiscountValue}`})</span><span className="font-bold">- ₹{finalDiscount.toFixed(2)}</span></div>}
      <div className="flex justify-between px-4 py-2.5 text-sm"><span className="text-slate-600">Taxable Value After Discount</span><span className="text-slate-800 font-medium">₹{(totalTaxable - finalDiscount).toFixed(2)}</span></div>
      <div className="flex justify-between px-4 py-2.5 text-sm"><span className="text-slate-600">CGST</span><span className="text-slate-800 font-medium">₹{totalCGST.toFixed(2)}</span></div>
      <div className="flex justify-between px-4 py-2.5 text-sm"><span className="text-slate-600">SGST</span><span className="text-slate-800 font-medium">₹{totalSGST.toFixed(2)}</span></div>
      {roundOff !== 0 && <div className="flex justify-between px-4 py-2.5 text-sm"><span className="text-slate-600">Round Off</span><span className="text-slate-800 font-medium">{roundOff > 0 ? '+' : ''}₹{roundOff.toFixed(2)}</span></div>}
      <div className="flex justify-between px-4 py-3.5 bg-slate-900"><span className="text-white font-bold text-base">Net Amount</span><span className="text-emerald-400 font-black text-xl">₹{netAmount.toLocaleString()}</span></div>
    </div>

    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
      <p className="text-amber-700 text-sm leading-relaxed">Confirming will deduct stock via FIFO and update the client's outstanding balance. This action cannot be undone.</p>
    </div>

    <div className="flex gap-3">
      <button onClick={onBack} className="px-4 py-3.5 bg-slate-100 text-slate-700 font-semibold rounded-2xl text-sm">← Edit</button>
      <button onClick={onConfirm} className="flex-1 bg-emerald-500 text-white font-black py-3.5 rounded-2xl text-base shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
        <CheckCircle2 size={18} /> Confirm & Generate Invoice
      </button>
    </div>
  </div>
);