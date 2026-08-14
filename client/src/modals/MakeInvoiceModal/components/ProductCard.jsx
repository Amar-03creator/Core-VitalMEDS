// src/modals/MakeInvoiceModal/components/ProductCard.jsx
import { useState, useEffect } from 'react';
import { Trash2, Pencil, Sparkles, AlertCircle } from 'lucide-react';
import { EditPTRModal } from '../../../features/Admin/InventoryPage/modals/EditPTRModal';

const formatExp = (dateStr) => {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length >= 2) return `${parts[1]}/${parts[0].slice(-2)}`;
  return dateStr;
};

const calcItem = (item) => {
  const qty = parseFloat(item.chargeableQty) || 0;
  const rate = parseFloat(item.rate) || 0;
  const discVal = parseFloat(item.discountValue) || 0;

  const gross = qty * rate;
  let disc = 0;
  if (discVal > 0) {
    disc = item.discountType === 'percent' ? (gross * discVal) / 100 : discVal;
  }
  const taxable = gross - disc;
  const cgst = taxable * ((item.gstRate || 0) / 2) / 100;
  const sgst = taxable * ((item.gstRate || 0) / 2) / 100;
  const subtotal = taxable + cgst + sgst;
  return { gross, cgst, sgst, subtotal, disc, lineTotal: subtotal };
};

export default function ProductCard({
  hasOrder = false, // ✨ NEW
  item, index, isDeleting, isNewlyAdded,
  onDelete, onBatchChange, onUpdateItem,
  usedBatchNos = [], onCloneForNewBatch
}) {
  const itemCalc = calcItem(item);
  const [showRateModal, setShowRateModal] = useState(false);
  const selectedBatch = item.availableBatches?.find(b => b.no === item.batchNumber) || {};

  const [qtyText, setQtyText] = useState(String(item.chargeableQty ?? 1));
  const [freeText, setFreeText] = useState(String(item.freeQty ?? 0));
  const [discText, setDiscText] = useState(String(item.discountValue ?? 0));

  useEffect(() => {
    setQtyText(String(item.chargeableQty ?? 1));
  }, [item.chargeableQty, item.productId]);

  useEffect(() => {
    setFreeText(String(item.freeQty ?? 0));
  }, [item.freeQty, item.productId]);

  useEffect(() => {
    setDiscText(String(item.discountValue ?? 0));
  }, [item.discountValue, item.productId]);

const commitQty = () => {
    let val = parseFloat(qtyText);
    if (isNaN(val) || val <= 0) val = 1;
    setQtyText(String(val));
    setTimeout(() => onUpdateItem(index, 'chargeableQty', val), 150);
  };
  const commitFree = () => {
    let val = parseFloat(freeText);
    if (isNaN(val) || val < 0) val = 0;
    setFreeText(String(val));
    setTimeout(() => onUpdateItem(index, 'freeQty', val), 150);
  };
  const commitDisc = () => {
    let val = parseFloat(discText);
    if (isNaN(val) || val < 0) val = 0;
    setDiscText(String(val));
    setTimeout(() => onUpdateItem(index, 'discountValue', val), 150);
  };

  const cardThemeClasses = item.clientEdited 
    ? 'border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)] bg-amber-50/20' 
    : item.isOfferBatch 
      ? 'border-2 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)] bg-orange-50/10'
      : 'border border-slate-300';

  return (
    <>
      <div className={`relative bg-white rounded-2xl p-3 space-y-3 flex flex-col transition-all duration-300
        ${cardThemeClasses}
        ${isDeleting ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
        ${isNewlyAdded ? 'animate-scaleIn' : ''}`}>

        <div className="absolute top-0 left-0 bg-slate-800 text-white text-xs sm:text-sm font-black px-3 py-1 rounded-br-2xl rounded-tl-2xl shadow-sm z-10">
          #{index + 1}
        </div>

        {item.clientEdited && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs sm:text-sm font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 animate-pulse z-10 whitespace-nowrap border border-amber-300 tracking-wide">
            <AlertCircle size={14} /> ORDER EDITED
          </div>
        )}

        <div className={`flex justify-between items-start rounded-xl p-2 shrink-0 ${item.clientEdited ? 'bg-amber-100/50 border border-amber-200' : 'bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200'}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-black text-xl truncate text-slate-900">{item.productName}</p>
            </div>
            <p className="text-base text-slate-600 font-medium truncate mt-0.5">
              {item.companyShortCode} · {item.packing} · HSN {item.hsn}
            </p>
          </div>
          <button onClick={onDelete} className="text-red-500 p-2 opacity-90 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors shrink-0">
            <Trash2 size={20} />
          </button>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-bold text-slate-600 uppercase tracking-wider shrink-0">Batch</label>
            <select
              value={item.batchNumber || ''}
              onChange={e => onBatchChange(index, e.target.value)}
              disabled={item.isOfferBatch} 
              className={`flex-1 min-w-0 bg-white border rounded-lg px-2 py-1.5 text-base font-mono font-bold shadow-sm ${item.isOfferBatch ? 'border-orange-200 text-orange-900 cursor-not-allowed bg-orange-50' : 'border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500'}`}
            >
              {(item.availableBatches || []).map(b => {
                const isUsed = usedBatchNos.includes(b.no);
                return (
                  <option key={b.no} value={b.no} disabled={isUsed}>
                    {b.no} (Exp: {formatExp(b.expiry)}) {isUsed ? ' - Added' : ''}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white border border-slate-200 rounded-lg py-1.5 px-1 flex flex-col justify-center text-center shadow-sm">
              <span className="block text-xs font-bold text-slate-500 uppercase leading-none mb-1">Stock</span>
              <span className="font-mono font-black text-slate-900 text-base sm:text-lg leading-none">{selectedBatch.stock ?? 0}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg py-1.5 px-1 flex flex-col justify-center text-center shadow-sm">
              <span className="block text-xs font-bold text-slate-500 uppercase leading-none mb-1">MRP</span>
              <span className="font-mono font-black text-slate-900 text-base sm:text-lg leading-none">₹{item.mrp ?? 0}</span>
            </div>
            <div className="relative bg-blue-50 border border-blue-300 rounded-lg py-1.5 px-1 flex flex-col justify-center text-center shadow-sm group">
              <span className="block text-xs font-bold text-blue-700 uppercase leading-none mb-1">PTR (₹)</span>
              <span className="font-mono font-black text-blue-900 text-base sm:text-lg leading-none">₹{item.rate}</span>
              {!item.isOfferBatch && (
                <button onClick={() => setShowRateModal(true)} className="absolute -top-2 -right-2 p-1.5 bg-white rounded-full shadow-md border border-blue-300 hover:bg-blue-100">
                  <Pencil size={14} className="text-blue-700" />
                </button>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-lg py-1.5 px-1 flex flex-col justify-center text-center shadow-sm">
              <span className="block text-xs font-bold text-slate-500 uppercase leading-none mb-1">GST</span>
              <span className="font-mono font-black text-slate-900 text-base sm:text-lg leading-none">{item.gstRate}%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row gap-1.5 sm:gap-3 w-full">
          {/* ✨ FIX: Completely hidden if not building from a client's order! */}
          {hasOrder && (
            <div className="flex-[0.8] min-w-0">
              <label className="text-sm sm:text-xs font-bold text-slate-500 text-center block mb-1 uppercase tracking-wide truncate">Ordered</label>
              <input
                type="text" disabled
                value={item.originalRequestedQty || 1}
                className="nav-input w-full min-w-0 text-center bg-slate-100 border border-slate-200 rounded-lg px-1 sm:px-2 py-1.5 text-base sm:text-xl font-black text-slate-400 shadow-inner cursor-not-allowed"
              />
            </div>
          )}

          <div className="flex-[1] min-w-0">
            <label className="text-sm sm:text-xs font-bold text-slate-600 text-center block mb-1 uppercase tracking-wide truncate">Bill Qty</label>
            <input
              type="text" inputMode="decimal"
              value={qtyText}
              onChange={e => setQtyText(e.target.value)}
              onBlur={commitQty}
              className={`nav-input w-full min-w-0 text-center border rounded-lg px-1 sm:px-2 py-1 text-lg sm:text-xl font-black focus:outline-none focus:bg-white shadow-inner transition-colors ${item.clientEdited ? 'bg-amber-50 border-amber-400 text-amber-900 focus:border-amber-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-600'}`}
            />
          </div>
          <div className="flex-[1] min-w-0">
            <label className="text-sm sm:text-xs font-bold text-slate-600 text-center block mb-1 uppercase tracking-wide truncate">Free</label>
            <input
              type="text" inputMode="decimal"
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              onBlur={commitFree}
              className="nav-input w-full min-w-0 text-center bg-emerald-50 border border-emerald-300 rounded-lg px-1 sm:px-2 py-1 text-lg sm:text-xl font-black text-emerald-900 focus:outline-none focus:border-emerald-600 focus:bg-white shadow-inner"
            />
          </div>
          <div className="flex-[1.5] min-w-0">
            <label className="text-sm sm:text-xs font-bold text-slate-600 text-left block mb-1 uppercase tracking-wide truncate">
              Discount {item.discountValue > 0 && <span className="text-amber-500 font-black lowercase tracking-normal">({item.discountType === 'percent' ? `${item.discountValue}%` : `₹${item.discountValue}`})</span>}
            </label>
            <div className="flex items-center h-[38px] sm:h-[42px] shadow-sm rounded-lg min-w-0">
              <input
                type="text" inputMode="decimal"
                value={discText}
                onChange={e => setDiscText(e.target.value)}
                onBlur={commitDisc}
                disabled={item.isOfferBatch}
                className={`nav-input flex-1 min-w-0 w-full h-full text-center border rounded-l-lg border-r-0 px-0.5 sm:px-1 text-lg sm:text-xl font-black shadow-inner ${item.isOfferBatch ? 'bg-orange-50 border-orange-200 text-orange-900 cursor-not-allowed' : 'bg-amber-50 border-amber-300 text-amber-900 focus:outline-none focus:border-amber-500 focus:bg-white'}`}
              />
              <button
                onClick={() => onUpdateItem(index, 'discountType', item.discountType === 'percent' ? 'amount' : 'percent')}
                disabled={item.isOfferBatch}
                className={`shrink-0 h-full w-10 sm:w-12 flex items-center justify-center border rounded-r-lg text-sm sm:text-base font-black transition-colors ${item.isOfferBatch ? 'bg-orange-100 border-orange-200 text-orange-800 cursor-not-allowed' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'}`}
              >
                {item.discountType === 'percent' ? '%' : '₹'}
              </button>
            </div>
          </div>
        </div>

        {item.isOfferBatch ? (
          <div className="relative w-full mt-3.5 bg-orange-100 border border-orange-300 text-orange-800 font-bold py-2 px-3 rounded-xl flex items-center justify-center shadow-sm text-sm sm:text-base text-center">
            
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-200 border border-orange-400 text-orange-900 text-xs sm:text-sm uppercase tracking-wider font-black px-2 py-0.5 rounded-full flex items-center shadow-sm whitespace-nowrap">
              <Sparkles size={14} className="mr-1" />
              Offer
            </div>

            <span className="line-clamp-2 leading-tight">{item.offerDescription || 'Special Offer Applied'}</span>
          </div>
        ) : (
          <button 
            onClick={()=> {
              document.activeElement?.blur();
              onCloneForNewBatch(); 
            }}
            disabled={!item.availableBatches || item.availableBatches.length <= usedBatchNos.length + 1}
            className="w-full mt-1 border-2 border-dashed border-slate-300 text-slate-500 font-bold py-2 rounded-xl hover:bg-slate-50 hover:text-slate-700 hover:border-slate-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Split into another batch
          </button>
        )}

        <div className="bg-slate-900 rounded-xl py-2 px-2 text-white shadow-md">
          <div className="grid grid-cols-4 gap-1 text-center text-sm sm:text-base font-bold uppercase tracking-wider text-slate-400 mb-1">
            <span className="truncate">Gross</span>
            <span className="truncate">CGST+SGST</span>
            <span className="truncate">Disc</span>
            <span className="truncate">Total</span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center text-sm sm:text-lg font-mono font-black">
            <span className="truncate">₹{itemCalc.gross.toFixed(2)}</span>
            <span className="truncate">₹{(itemCalc.cgst + itemCalc.sgst).toFixed(2)}</span>
            <span className="text-amber-400 truncate">−₹{itemCalc.disc.toFixed(2)}</span>
            <span className="text-emerald-400 truncate">₹{itemCalc.lineTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {!item.isOfferBatch && (
        <EditPTRModal
          isOpen={showRateModal}
          onClose={() => setShowRateModal(false)}
          batch={{
            _id: item.offerBatchId,
            id: selectedBatch._id,
            batchNumber: selectedBatch.no,
            mrp: selectedBatch.mrp,
            sellingRate: item.rate,
            purchaseRate: 0
          }}
          onSave={(newPTR) => onUpdateItem(index, 'rate', newPTR)}
        />
      )}
    </>
  );
}