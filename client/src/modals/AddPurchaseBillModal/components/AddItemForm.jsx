// AddPurchaseBillModal/components/AddItemForm.jsx
import { useState, useRef, useEffect } from 'react';
import { DateInput } from '../DateInput';
import { toast } from 'sonner';
import { X } from 'lucide-react';

export const AddItemForm = ({
  currentItem,
  editingItemId,
  setCurrentItem,
  handleAddOrUpdateItem,
  cancelEdit,
  productSearch, setProductSearch,
  showProductList, setShowProductList,
  productOptions,
  availableBatches = [],
  handleSelectProduct, clearProduct, onBatchChange,
  purchaseType,
  billDate, setShowAddProduct,
  calcItemPreview,
  ratesLoading,
}) => {

  const [showBatchList, setShowBatchList] = useState(false);
  const batchRef = useRef(null);

  // ✨ NEW: Keyboard Auto-Scroll Helper
  const handleFocus = (e) => {
    const target = e.target;
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300); // 300ms waits for keyboard animation to finish
  };

  useEffect(() => {
    const handler = (e) => {
      if (batchRef.current && !batchRef.current.contains(e.target)) {
        setShowBatchList(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredBatches = (availableBatches || []).filter(b =>
    (b.batchNumber || b.no || '').toUpperCase().includes((currentItem.batchNumber || '').toUpperCase())
  );

  const validateAndAdd = () => {
    const ptr = parseFloat(currentItem.ptr);
    const mrp = parseFloat(currentItem.mrp);
    const purchaseRate = parseFloat(currentItem.purchaseRate);

    if (!isNaN(mrp) && !isNaN(purchaseRate) && !isNaN(ptr)) {
      const maxPtr = mrp * 0.8;
      if (ptr > maxPtr) {
        toast.error(`PTR (₹${ptr}) cannot exceed 80% of MRP (₹${maxPtr.toFixed(2)})`);
        return;
      }
      if (ptr < purchaseRate) {
        toast.error(`PTR (₹${ptr}) cannot be less than Purchase Rate (₹${purchaseRate.toFixed(2)})`);
        return;
      }
    }
    handleAddOrUpdateItem();
  };

  return (
    <div className="border border-slate-300 rounded-2xl p-4 space-y-4 bg-white shadow-sm pb-10">

      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <p className="font-bold text-slate-800 text-lg">{editingItemId ? 'Edit Item' : 'Add Item'}</p>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-600">SL No.</label>
          <input
            type="number"
            value={currentItem.slNo}
            onChange={e => setCurrentItem(prev => ({ ...prev, slNo: parseInt(e.target.value) || 1 }))}
            onFocus={handleFocus}
            disabled={!!editingItemId}
            className={`w-16 text-center bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-base text-slate-800 outline-none focus:border-emerald-400 ${editingItemId ? 'bg-slate-100 cursor-not-allowed' : ''}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2 md:gap-3">

        <div className="col-span-9 md:col-span-6">
          {/* ✨ FIX: Fixed min-h-[28px] ensuring it exactly matches HSN height */}
          <div className="flex items-center justify-between min-h-[28px] mb-1">
            <label className="text-sm font-semibold text-slate-600">Product *</label>
            <button type="button" onClick={() => setShowAddProduct(true)} className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg hover:bg-emerald-100">+ New</button>
          </div>
          <div className="relative">
            <div className="flex items-center w-full bg-white border border-slate-300 rounded-xl px-3 focus-within:border-emerald-400">
              <input
                type="text"
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowProductList(true); }}
                onFocus={(e) => { setShowProductList(true); handleFocus(e); }}
                placeholder="Search product..."
                className="w-full py-2.5 text-base text-slate-800 outline-none bg-transparent"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={clearProduct}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            {showProductList && productOptions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                {productOptions.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelectProduct(item); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-800 hover:bg-emerald-50 border-b border-slate-100 last:border-0"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-3 md:col-span-3">
          {/* ✨ FIX: Fixed min-h-[28px] aligns label perfectly with Product block */}
          <div className="flex items-center min-h-[28px] mb-1">
            <label className="text-sm font-semibold text-slate-500">HSN</label>
          </div>
          <input
            type="text"
            value={currentItem.hsn || ''}
            readOnly
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base text-slate-600 outline-none cursor-default"
          />
        </div>

        <div className="col-span-6 md:col-span-3 relative" ref={batchRef}>
          <label className="text-sm font-semibold text-slate-600 block mb-1">Batch No. *</label>
          <input
            type="text"
            value={currentItem.batchNumber}
            onChange={e => { onBatchChange(e.target.value); setShowBatchList(true); }}
            onFocus={(e) => { setShowBatchList(true); handleFocus(e); }}
            placeholder="Enter batch no."
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400 uppercase"
          />
          {showBatchList && filteredBatches.length > 0 && (
            <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto w-64 md:w-full">
              {filteredBatches.map(b => {
                let expDisp = b.expiryDate || b.expiry || '';
                if (expDisp.includes('T')) expDisp = expDisp.split('T')[0].substring(0, 7);
                return (
                  <button
                    key={b.batchNumber || b.no}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); onBatchChange(b.batchNumber || b.no); setShowBatchList(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-800 hover:bg-emerald-50 border-b border-slate-100 last:border-0"
                  >
                    <div className="font-bold">{b.batchNumber || b.no}</div>
                    <div className="text-sm text-slate-500">Exp: {expDisp} | MRP: ₹{b.mrp}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="col-span-6 md:col-span-3">
          <label className="text-sm font-semibold text-slate-600 flex justify-between items-center mb-1">
            <span>Expiry Date *</span>
            {currentItem.isBatchLocked && <span className="text-[10px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded font-bold">LOCKED</span>}
          </label>
          <div onFocusCapture={handleFocus}>
            {currentItem.isBatchLocked ? (
              <input
                type="month"
                value={currentItem.expiryDate}
                disabled
                className="w-full bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed rounded-xl px-3 py-2.5 text-base outline-none"
              />
            ) : (
              <DateInput
                value={currentItem.expiryDate}
                onChange={(val) => setCurrentItem(prev => ({ ...prev, expiryDate: val }))}
                validate={(val) => {
                  if (billDate && val <= billDate) return 'Expiry date must be after bill date';
                  return null;
                }}
              />
            )}
          </div>
        </div>

        <div className="col-span-4 md:col-span-3">
          <label className="text-sm font-semibold text-slate-500 flex justify-between items-center mb-1">
            <span>MRP {ratesLoading && <span className="text-slate-400 font-normal">(...)</span>}</span>
          </label>
          <input
            type="number"
            value={currentItem.mrp}
            onFocus={handleFocus}
            onChange={e => setCurrentItem(prev => ({ ...prev, mrp: e.target.value }))}
            placeholder={ratesLoading ? '...' : '0.00'}
            disabled={ratesLoading}
            className={`w-full border rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400 ${ratesLoading ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-800'}`}
          />
        </div>

        <div className="col-span-4 md:col-span-3">
          <label className="text-sm font-semibold text-slate-500 block mb-1">
            Pur Rate {ratesLoading && <span className="text-slate-400 font-normal">(...)</span>}
          </label>
          <input
            type="number"
            value={currentItem.purchaseRate}
            onFocus={handleFocus}
            onChange={e => setCurrentItem(prev => ({ ...prev, purchaseRate: e.target.value }))}
            placeholder={ratesLoading ? '...' : '0.00'}
            disabled={ratesLoading}
            className={`w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400 ${ratesLoading ? 'opacity-50 cursor-wait' : ''}`}
          />
        </div>

        <div className="col-span-4 md:col-span-3">
          <label className="text-sm font-semibold text-slate-500 block mb-1">
            PTR {ratesLoading && <span className="text-slate-400 font-normal">(...)</span>}
          </label>
          <input
            type="number"
            value={currentItem.ptr}
            onFocus={handleFocus}
            onChange={e => setCurrentItem(prev => ({ ...prev, ptr: e.target.value }))}
            placeholder={ratesLoading ? '...' : '0.00'}
            disabled={ratesLoading}
            className={`w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400 ${ratesLoading ? 'opacity-50 cursor-wait' : ''}`}
          />
        </div>

        {purchaseType === 'intrastate' ? (
          <>
            <div className="col-span-6 md:col-span-2">
              <label className="text-sm font-semibold text-slate-600 block mb-1">CGST (%)</label>
              <input type="text" onFocus={handleFocus} value={currentItem.cgstRate} onChange={e => setCurrentItem(prev => ({ ...prev, cgstRate: e.target.value }))} inputMode="decimal" className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400" />
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="text-sm font-semibold text-slate-600 block mb-1">SGST (%)</label>
              <input type="text" onFocus={handleFocus} value={currentItem.sgstRate} onChange={e => setCurrentItem(prev => ({ ...prev, sgstRate: e.target.value }))} inputMode="decimal" className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400" />
            </div>
          </>
        ) : (
          <div className="col-span-12 md:col-span-4">
            <label className="text-sm font-semibold text-slate-600 block mb-1">IGST (%)</label>
            <input type="text" onFocus={handleFocus} value={currentItem.igstRate} onChange={e => setCurrentItem(prev => ({ ...prev, igstRate: e.target.value }))} inputMode="decimal" className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400" />
          </div>
        )}

        <div className="col-span-3 md:col-span-2">
          <label className="text-sm font-semibold text-slate-600 block mb-1">Qty</label>
          <input
            type="number"
            min="0"
            value={currentItem.qty}
            onFocus={handleFocus}
            onChange={e => setCurrentItem(prev => ({ ...prev, qty: e.target.value }))}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
          />
        </div>

        <div className="col-span-3 md:col-span-2">
          <label className="text-sm font-semibold text-slate-600 block mb-1">Free</label>
          <input
            type="number"
            min="0"
            value={currentItem.free}
            onFocus={handleFocus}
            onChange={e => setCurrentItem(prev => ({ ...prev, free: e.target.value }))}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
          />
        </div>

        <div className={`col-span-6 ${purchaseType === 'intrastate' ? 'md:col-span-4' : 'md:col-span-4'}`}>
          <label className="text-sm font-semibold text-slate-600 block mb-1">Discount</label>
          <div className="flex items-center gap-2 min-w-0">
            <input type="text" onFocus={handleFocus} value={currentItem.discountValue} onChange={e => setCurrentItem(prev => ({ ...prev, discountValue: e.target.value }))} placeholder="0" inputMode="decimal" className="flex-1 min-w-0 bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400 text-center" />
            <button
              type="button"
              onClick={() => setCurrentItem(prev => ({ ...prev, discountType: prev.discountType === 'percent' ? 'amount' : 'percent' }))}
              className="shrink-0 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold w-14 hover:bg-slate-100"
            >
              {currentItem.discountType === 'percent' ? '%' : '₹'}
            </button>
          </div>
        </div>
      </div>

      {currentItem.productId && currentItem.purchaseRate && (
        <div className="bg-slate-50 rounded-xl p-3 text-sm flex items-center justify-between mt-2 border border-slate-100">
          <div className="flex gap-4">
            {purchaseType === 'intrastate' ? (
              <>
                <span className="text-slate-500">CGST: <span className="text-slate-800 font-bold">₹{calcItemPreview().cgst.toFixed(2)}</span></span>
                <span className="text-slate-500">SGST: <span className="text-slate-800 font-bold">₹{calcItemPreview().sgst.toFixed(2)}</span></span>
              </>
            ) : (
              <span className="text-slate-500">IGST: <span className="text-slate-800 font-bold">₹{calcItemPreview().igst.toFixed(2)}</span></span>
            )}
          </div>
          <div>
            <span className="text-slate-500 mr-2">Line Total</span>
            <span className="text-emerald-600 font-bold text-base">₹{calcItemPreview().lineTotal.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <button onClick={validateAndAdd} className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-base font-bold hover:bg-slate-800 transition-colors">
          {editingItemId ? 'Update Item' : '+ Add to List'}
        </button>
        {editingItemId && (
          <button onClick={cancelEdit} className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl text-base font-bold hover:bg-slate-200 transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};