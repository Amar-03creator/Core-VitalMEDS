// components/Admin/BillingPage/modals/MakeInvoiceModal/Step3.jsx
import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';
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
}) => {
  const subtotalBeforeDiscount = totalTaxable + totalCGST + totalSGST;

  // Get party name from the real client object
  const partyName = selectedClient?.establishmentName || selectedClient?.name || '';
  // Build area string only if city exists, and only show dot if line is non‑empty
  const areaDisplay = selectedClient?.city
    ? (selectedClient.line ? `${selectedClient.city} · ${selectedClient.line}` : selectedClient.city)
    : '';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Invoice header */}
        <div className="bg-slate-900 rounded-xl p-4 space-y-2 text-white">
          <div className="flex justify-between text-base">
            <span className="text-slate-400">Invoice No.</span>
            <span className="font-mono font-bold">{invoiceNumber}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="text-slate-400">Party</span>
            <span className="font-semibold">{partyName}</span>
          </div>
          {areaDisplay && (
            <div className="flex justify-between text-base">
              <span className="text-slate-400">Area</span>
              <span className="font-semibold">{areaDisplay}</span>
            </div>
          )}
          <div className="flex justify-between text-base">
            <span className="text-slate-400">Bill Type</span>
            <span className={`px-2 py-0.5 rounded-full text-sm font-bold ${billType === 'Cash' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
              {billType}
            </span>
          </div>
          <div className="flex justify-between text-base">
            <span className="text-slate-400">Invoice Date</span>
            <span>{invoiceDate}</span>
          </div>
          {gstin && (
            <div className="flex justify-between text-base">
              <span className="text-slate-400">GSTIN</span>
              <span className="font-mono text-sm">{gstin}</span>
            </div>
          )}
          {drugLicense && (
            <div className="flex justify-between text-base">
              <span className="text-slate-400">Drug License</span>
              <span className="font-mono text-sm">{drugLicense}</span>
            </div>
          )}
        </div>

        {/* Items table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-3 py-2 grid grid-cols-[1fr_4.25rem_4.25rem_4.25rem] text-sm font-bold text-slate-500 uppercase gap-2">
            <span>Product</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Total</span>
          </div>
          {items.map((item, idx) => {
            const { lineTotal } = calcLineTotal(item);
            const discountLabel =
              item.discountValue > 0
                ? item.discountType === 'percent'
                  ? `${item.discountValue}% off`
                  : `₹${item.discountValue} off`
                : null;

            return (
              <div
                key={idx}
                className="px-3 py-2 grid grid-cols-[1fr_4.25rem_4.25rem_4.25rem] gap-2 border-t border-slate-100 items-start"
              >
                <div className="min-w-0">
                  <p className="text-slate-800 font-semibold text-base truncate">
                    {item.productName}
                  </p>
                  <p className="text-slate-400 text-xs font-mono truncate">
                    {item.batchNumber} ({item.expiryDate ? item.expiryDate.slice(5).replace('-', '/') : '—'})
                  </p>
                </div>
                <span className="text-slate-700 text-base text-right whitespace-nowrap">
                  {item.chargeableQty}
                  {item.freeQty > 0 && (
                    <span className="text-emerald-600 text-sm">+{item.freeQty}</span>
                  )}
                </span>
                <span className="text-slate-700 text-base text-right whitespace-nowrap">
                  ₹{item.rate}
                </span>
                <span className="text-right whitespace-nowrap">
                  {discountLabel && (
                    <span className="block text-xs text-amber-600 font-medium">
                      {discountLabel}
                    </span>
                  )}
                  <span className="text-slate-800 font-bold text-base">
                    ₹{lineTotal.toFixed(0)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Totals section */}
        <div className="bg-slate-50 rounded-xl divide-y divide-slate-200 overflow-hidden border border-slate-200">
          <div className="flex justify-between px-4 py-2 text-base">
            <span className="text-slate-600">Total Taxable</span>
            <span className="font-medium">₹{totalTaxable.toFixed(2)}</span>
          </div>
          <div className="flex justify-between px-4 py-2 text-base">
            <span className="text-slate-600">CGST</span>
            <span className="font-medium">₹{totalCGST.toFixed(2)}</span>
          </div>
          <div className="flex justify-between px-4 py-2 text-base">
            <span className="text-slate-600">SGST</span>
            <span className="font-medium">₹{totalSGST.toFixed(2)}</span>
          </div>
          <div className="flex justify-between px-4 py-2 text-base font-semibold border-b border-slate-200">
            <span>Subtotal (incl. GST)</span>
            <span>₹{subtotalBeforeDiscount.toFixed(2)}</span>
          </div>
          {globalDiscountValue > 0 && (
            <div className="flex justify-between px-4 py-2 text-base text-amber-700 bg-amber-50">
              <span className="font-semibold">Bill Discount ({globalDiscountType === 'percent' ? `${globalDiscountValue}%` : `₹${globalDiscountValue}`})</span>
              <span className="font-bold">- ₹{finalDiscount.toFixed(2)}</span>
            </div>
          )}
          {roundOff !== 0 && (
            <div className="flex justify-between px-4 py-2 text-base">
              <span className="text-slate-600">Round Off</span>
              <span className="font-medium">{roundOff > 0 ? '+' : ''}₹{roundOff.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between px-4 py-3 bg-slate-900 rounded-b-xl">
            <span className="text-white font-bold text-lg">Net Amount</span>
            <span className="text-emerald-400 font-black text-xl">₹{netAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-700 text-sm leading-relaxed">Confirming will deduct stock via FIFO and update the client's outstanding balance. This action cannot be undone.</p>
        </div>
      </div>

      {/* Sticky footer buttons */}
      <div className="sticky bottom-0 bg-white pt-3 flex gap-5 border-t border-slate-100">
        <button
          onClick={onBack}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2 px-3 rounded-xl text-lg transition-all active:scale-95 inline-flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Edit
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold py-3 rounded-xl text-lg shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <CheckCircle2 size={20} /> Confirm & Generate Invoice
        </button>
      </div>
    </div>
  );
};