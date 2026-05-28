import { Search, Trash2, Percent, DollarSign, Package } from 'lucide-react';
import { calcLineTotal } from '../../utils/helpers';

export const Step2 = ({
  productSearch,
  setProductSearch,
  showProductDrop,
  setShowProductDrop,
  filteredProducts,
  addProduct,
  items,
  removeItem,
  updateItem,
  handleBatchChange,
  globalDiscountType,
  setGlobalDiscountType,
  globalDiscountValue,
  setGlobalDiscountValue,
  finalDiscount,
  canProceed2,
  onBack,
  onNext
}) => {
  // Helper to safely parse number from string
  const parseNumber = (value, defaultValue = 0) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  return (
    <div className="space-y-3">
      {/* Product search */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            value={productSearch}
            onChange={e => { setProductSearch(e.target.value); setShowProductDrop(true); }}
            onFocus={() => setShowProductDrop(true)}
            placeholder="Search and add medicine..."
            className="flex-1 text-sm outline-none"
          />
        </div>
        {showProductDrop && filteredProducts.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-xl mt-1 shadow-lg overflow-hidden max-h-56 overflow-y-auto">
            {filteredProducts.map(p => (
              <button key={p.id} onClick={() => addProduct(p)} className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-slate-800 text-sm font-medium">{p.name}</p>
                  <p className="text-slate-500 text-xs">{p.company} · {p.packing} · GST {p.gstRate}%</p>
                </div>
                <div className="text-right ml-2 shrink-0">
                  <p className="text-emerald-600 font-bold text-sm">₹{p.defaultRate}</p>
                  <p className="text-slate-500 text-[10px]">MRP ₹{p.batches[0]?.mrp}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 py-8 text-center">
          <Package size={28} className="text-slate-300 mx-auto mb-1" />
          <p className="text-slate-500 text-sm">Search and add medicines above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const { taxable, cgst, sgst, lineTotal } = calcLineTotal(item);
            const billedQty = item.chargeableQty + item.freeQty;
            return (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <p className="text-slate-800 font-semibold text-sm">{item.productName}</p>
                    <p className="text-slate-400 text-xs">{item.packing} · GST {item.gstRate}%</p>
                  </div>
                  <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 p-0.5"><Trash2 size={16} /></button>
                </div>
                <div className="px-3 py-2 space-y-2">
                  {/* Batch & expiry */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[10px] font-semibold text-slate-500">Batch:</label>
                      <select
                        value={item.batchNumber}
                        onChange={e => handleBatchChange(idx, e.target.value)}
                        className="flex-1 bg-slate-50 border rounded-lg px-1 py-1 text-xs font-mono"
                      >
                        {item.availableBatches.map(b => <option key={b.no} value={b.no}>{b.no} ({b.expiry})</option>)}
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[10px] font-semibold text-slate-500">Exp:</label>
                      <input type="text" value={item.expiryDate} disabled className="flex-1 bg-slate-100 border rounded-lg px-1 py-1 text-xs text-slate-600" />
                    </div>
                  </div>
                  {/* MRP & HSN */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[10px] font-semibold text-slate-500">MRP:</label>
                      <input type="text" value={item.mrp} disabled className="flex-1 bg-slate-100 border rounded-lg px-1 py-1 text-xs" />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[10px] font-semibold text-slate-500">HSN:</label>
                      <input type="text" value={item.hsn} disabled className="flex-1 bg-slate-100 border rounded-lg px-1 py-1 text-xs font-mono" />
                    </div>
                  </div>
                  {/* Quantities */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[10px] font-semibold text-slate-500">Chg:</label>
                      <input
                        type="text"
                        value={item.chargeableQty}
                        onChange={e => {
                          const val = parseNumber(e.target.value, 0);
                          updateItem(idx, 'chargeableQty', val);
                        }}
                        inputMode="decimal"
                        className="w-12 text-center border rounded-lg px-1 py-1 text-sm font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[10px] font-semibold text-slate-500">Free:</label>
                      <input
                        type="text"
                        value={item.freeQty}
                        onChange={e => {
                          const val = parseNumber(e.target.value, 0);
                          updateItem(idx, 'freeQty', val);
                        }}
                        inputMode="decimal"
                        className="w-12 text-center border rounded-lg px-1 py-1 text-sm font-bold text-emerald-600"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[10px] font-semibold text-slate-500">Total:</label>
                      <div className="w-12 text-center bg-slate-100 rounded-lg px-1 py-1 text-sm font-bold">{billedQty}</div>
                    </div>
                  </div>
                  {/* Rate & discount */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[10px] font-semibold text-slate-500">Rate:</label>
                      <input
                        type="text"
                        value={item.rate}
                        onChange={e => {
                          const val = parseNumber(e.target.value, 0);
                          updateItem(idx, 'rate', val);
                        }}
                        inputMode="decimal"
                        className="flex-1 border rounded-lg px-1 py-1 text-xs font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] font-semibold text-slate-500">Disc:</label>
                      <input
                        type="text"
                        value={item.discountValue}
                        onChange={e => {
                          const val = parseNumber(e.target.value, 0);
                          updateItem(idx, 'discountValue', val);
                        }}
                        placeholder="0"
                        inputMode="decimal"
                        className="w-16 border rounded-lg px-1 py-1 text-xs"
                      />
                      <button
                        onClick={() => updateItem(idx, 'discountType', item.discountType === 'percent' ? 'amount' : 'percent')}
                        className="px-1 py-0.5 bg-slate-100 rounded text-xs font-semibold"
                      >
                        {item.discountType === 'percent' ? '%' : '₹'}
                      </button>
                    </div>
                  </div>
                  {/* Line total summary */}
                  <div className="bg-slate-900 rounded-lg px-2 py-1.5">
                    <div className="grid grid-cols-4 gap-1 text-[9px] text-center">
                      <div><p className="text-slate-400">Taxable</p><p className="text-white font-bold">₹{taxable.toFixed(0)}</p></div>
                      <div><p className="text-slate-400">CGST {item.gstRate/2}%</p><p className="text-amber-400 font-bold">₹{cgst.toFixed(0)}</p></div>
                      <div><p className="text-slate-400">SGST {item.gstRate/2}%</p><p className="text-amber-400 font-bold">₹{sgst.toFixed(0)}</p></div>
                      <div><p className="text-slate-400">Line Total</p><p className="text-emerald-400 font-black">₹{lineTotal.toFixed(0)}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Global Discount */}
      {items.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
          <div className="flex justify-between items-center">
            <p className="font-bold text-amber-800 text-xs">Additional Bill Discount</p>
            <button
              onClick={() => setGlobalDiscountType(globalDiscountType === 'percent' ? 'amount' : 'percent')}
              className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded-full border border-amber-300"
            >
              {globalDiscountType === 'percent' ? '%' : '₹'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-700 text-xs">{globalDiscountType === 'percent' ? 'Discount %' : 'Discount ₹'}</span>
            <input
              type="text"
              value={globalDiscountValue}
              onChange={e => {
                const val = parseFloat(e.target.value);
                setGlobalDiscountValue(isNaN(val) ? 0 : val);
              }}
              inputMode="decimal"
              className="flex-1 bg-white border border-amber-300 rounded-lg px-2 py-1 text-sm"
            />
          </div>
          {globalDiscountValue > 0 && <p className="text-amber-700 text-xs">Discount Amount: ₹{finalDiscount.toFixed(2)}</p>}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <button onClick={onBack} className="px-3 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg text-sm">← Back</button>
        <button onClick={onNext} disabled={!canProceed2} className="flex-1 bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2 rounded-lg text-sm">
          Review Invoice →
        </button>
      </div>
    </div>
  );
};