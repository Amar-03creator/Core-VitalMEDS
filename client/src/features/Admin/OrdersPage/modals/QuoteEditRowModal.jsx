import { useState } from 'react';
import { X, CheckCircle2, Pencil } from 'lucide-react';
import { formatMoney } from '../utils';
import { EditPTRModal } from '../../../../features/Admin/InventoryPage/modals/EditPTRModal';

export const formatExp = (dateStr) => {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length >= 2) return `${parts[1]}/${parts[0]}`;
  return dateStr;
};

export const calcQuoteLine = (row) => {
  const cQty = parseFloat(row.chargeableQty) || 0;
  const ptr = parseFloat(row.adminOfferedPTR) || 0;
  const dVal = parseFloat(row.discountValue) || 0;

  const gross = cQty * ptr;
  const disc = row.discountType === 'percent' ? gross * (dVal / 100) : dVal;
  const taxable = gross - disc;
  const gst = taxable * ((row.gstRate || 0) / 100);
  return { gross, disc, taxable, gst, finalTotal: taxable + gst };
};

export default function QuoteEditRowModal({ initialRow, onClose, onSave }) {
  const [localEditRow, setLocalEditRow] = useState({ ...initialRow });
  const [showEditPTR, setShowEditPTR] = useState(false);

  const selectedBatch = localEditRow.batches.find(b => b.no === localEditRow.batchNo) || {};

  const handleBatchChange = (batchNo) => {
    const batch = localEditRow.batches.find((b) => b.no === batchNo);
    if (!batch) return;
    setLocalEditRow(prev => ({
      ...prev,
      batchNo: batch.no,
      expiryDate: batch.expiry || '',
      adminOfferedPTR: batch.mrp ? parseFloat((batch.mrp * 0.8).toFixed(2)) : prev.adminOfferedPTR,
      offerBatchId: batch.nearExpiry ? batch._id : undefined,
      mrp: batch.mrp || 0
    }));
  };

  const handleNumberChange = (field, val) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setLocalEditRow(prev => ({ ...prev, [field]: val }));
    }
  };

  const handleBlur = (field, fallback = 0) => {
    let val = parseFloat(localEditRow[field]);
    if (isNaN(val)) val = fallback;
    setLocalEditRow(prev => ({ ...prev, [field]: val }));
  };

  const { disc, finalTotal } = calcQuoteLine(localEditRow);

  return (
    <>
      <div className="fixed inset-0 z-[110] bg-black/60 flex items-end justify-center p-0 md:p-4">
        {/* Reduced main padding to p-3, tightened space to space-y-3 */}
        <div className="w-full max-w-md bg-white rounded-t-xl md:rounded-xl p-3 md:p-4 space-y-3 shadow-2xl animate-slideUp">

          <div className="flex justify-between items-start border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-lg text-slate-900 leading-tight">{localEditRow.productName}</h3>
              <p className="text-sm text-slate-500 mt-0.5">Req Qty: <span className="font-bold text-slate-800 text-base">{localEditRow.requestedQty}</span></p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
              <X size={22} className="text-slate-400" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider shrink-0">Batch:</label>
                <select
                  value={localEditRow.batchNo}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-md px-1.5 py-1 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-400"
                >
                  {localEditRow.batches.length > 0 ? (
                    localEditRow.batches.map((b) => (
                      <option key={b._id} value={b.no}>
                        {b.no} · Exp: {formatExp(b.expiry)} {b.nearExpiry ? '🔥' : ''}
                      </option>
                    ))
                  ) : (
                    <option disabled>No batches available</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <div className="bg-white border border-slate-100 rounded-md py-1 px-1 text-center flex flex-col justify-center">
                  <span className="block text-base font-bold text-teal-600 uppercase leading-none mb-0.5">Stock</span>
                  <span className="font-mono font-black text-slate-800 text-base leading-none">{selectedBatch.stock ?? 0}</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-md py-1 px-1 text-center flex flex-col justify-center">
                  <span className="block text-base font-bold text-teal-600 uppercase leading-none mb-0.5">MRP</span>
                  <span className="font-mono font-black text-slate-800 text-base leading-none">₹{selectedBatch.mrp ?? 0}</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-md py-1 px-1 text-center flex flex-col justify-center">
                  <span className="block text-base font-bold text-teal-600 uppercase leading-none mb-0.5">GST</span>
                  <span className="font-mono font-black text-slate-800 text-base leading-none">{localEditRow.gstRate}%</span>
                </div>
                <div className="relative bg-blue-50 border border-blue-200 rounded-md py-1 px-1 text-center flex flex-col justify-center group">
                  <span className="block text-base font-bold text-blue-600 uppercase leading-none mb-0.5">PTR (₹)</span>
                  <span className="font-mono font-black text-blue-900 text-base leading-none">₹{localEditRow.adminOfferedPTR}</span>
                  <button onClick={() => setShowEditPTR(true)} className="absolute -top-1.5 -right-1.5 p-1 bg-white rounded-full shadow-sm border border-blue-200 hover:bg-blue-100">
                    <Pencil size={14} className="text-blue-600" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-base font-bold text-slate-500 text-center block mb-1 uppercase tracking-wide">Chargeable</label>
                {/* ✨ FIX: Replaced py-1 with h-[40px] */}
                <input
                  type="text" inputMode="numeric"
                  value={localEditRow.chargeableQty}
                  onChange={(e) => handleNumberChange('chargeableQty', e.target.value)}
                  onBlur={() => handleBlur('chargeableQty', 1)}
                  className="w-full h-[40px] text-center bg-slate-50 border border-slate-300 rounded-lg px-1.5 text-lg sm:text-xl font-black text-slate-900 focus:outline-none focus:border-slate-500 focus:bg-white shadow-inner"
                />
              </div>

              <div>
                <label className="text-base font-bold text-slate-500 text-center block mb-1 uppercase tracking-wide">Free</label>
                {/* ✨ FIX: Replaced py-1 with h-[40px] */}
                <input
                  type="text" inputMode="numeric"
                  value={localEditRow.freeQty}
                  onChange={(e) => handleNumberChange('freeQty', e.target.value)}
                  onBlur={() => handleBlur('freeQty', 0)}
                  className="w-full h-[40px] text-center bg-emerald-50 border border-emerald-300 rounded-lg px-1.5 text-lg sm:text-xl font-black text-emerald-900 focus:outline-none focus:border-emerald-500 focus:bg-white shadow-inner"
                />
              </div>

              <div>
                {/* ✨ FIX: Changed text-left to text-center to match the others */}
                <label className="text-base font-bold text-slate-500 text-center block mb-1 uppercase tracking-wide">Discount</label>
                {/* ✨ FIX: Matched the height to h-[40px] */}
                <div className="flex items-center h-[40px] shadow-sm rounded-lg">
                  <input
                    type="text" inputMode="decimal"
                    value={localEditRow.discountValue}
                    onChange={(e) => handleNumberChange('discountValue', e.target.value)}
                    onBlur={() => handleBlur('discountValue', 0)}
                    className="flex-1 min-w-0 h-full text-center bg-amber-50 border border-amber-300 rounded-l-lg border-r-0 px-1 text-lg sm:text-xl font-black text-amber-900 focus:outline-none focus:border-amber-500 focus:bg-white shadow-inner"
                  />
                  <button
                    onClick={() => setLocalEditRow(p => ({ ...p, discountType: p.discountType === 'percent' ? 'amount' : 'percent' }))}
                    className="shrink-0 h-full px-3 sm:px-4 bg-white border border-slate-300 rounded-r-lg text-lg sm:text-xl font-black hover:bg-slate-100 text-slate-800 transition-colors"
                  >
                    {localEditRow.discountType === 'percent' ? '%' : '₹'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-2.5 flex justify-between items-center text-white mt-1 shadow-sm">
              <div className="leading-tight">
                <span className="text-base font-semibold text-slate-300 block">Line Total <span className="text-sm text-slate-400 font-normal">(inc. GST)</span></span>
                {disc > 0 && <span className="text-sm text-amber-400 font-medium">Saved {formatMoney(disc)}</span>}
              </div>
              <span className="font-black text-2xl">{formatMoney(finalTotal)}</span>
            </div>
          </div>

          <div className="pt-1 flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-base font-bold rounded-lg hover:bg-slate-200">
              Cancel
            </button>
            <button onClick={() => onSave(localEditRow)} className="flex-1 py-2.5 bg-emerald-600 text-white text-base font-bold rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
              <CheckCircle2 size={18} /> Save Item
            </button>
          </div>
        </div>
      </div>

      <EditPTRModal
        isOpen={showEditPTR}
        onClose={() => setShowEditPTR(false)}
        batch={{
          _id: localEditRow.offerBatchId,
          id: selectedBatch._id,
          batchNumber: selectedBatch.no,
          mrp: selectedBatch.mrp,
          sellingRate: localEditRow.adminOfferedPTR,
          purchaseRate: 0
        }}
        onSave={(newPTR) => setLocalEditRow(prev => ({ ...prev, adminOfferedPTR: newPTR }))}
      />
    </>
  );
}