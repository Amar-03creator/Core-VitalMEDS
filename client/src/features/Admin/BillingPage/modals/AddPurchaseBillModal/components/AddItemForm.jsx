import { SearchableSelect } from '../SearchableSelect';
import { DateInput } from '../DateInput';

export const AddItemForm = ({
  currentItem,
  editingItemId,
  setCurrentItem,
  handleAddOrUpdateItem,
  cancelEdit,
  productSearch, setProductSearch,
  showProductList, setShowProductList,
  productOptions,          // ← already received from ProductsStep
  handleSelectProduct, clearProduct,
  batchNumber, onBatchChange,
  purchaseType,
  billDate,
  showAddProduct, setShowAddProduct,
  calcItemPreview,
  ratesLoading,            // ← Added this prop to handle loading states
}) => (
  <div className="border border-slate-300 rounded-2xl p-4 space-y-3 bg-white shadow-sm">
    <div className="flex items-center justify-between">
      <p className="font-bold text-slate-800 text-lg">{editingItemId ? 'Edit Item' : 'Add Item'}</p>
      <div className="flex items-center gap-2">
        <label className="text-sm font-semibold text-slate-600">SL No.</label>
        <input
          type="number"
          value={currentItem.slNo}
          onChange={e => setCurrentItem(prev => ({ ...prev, slNo: parseInt(e.target.value) || 1 }))}
          disabled={!!editingItemId}
          className={`w-16 text-center bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-base text-slate-800 outline-none focus:border-emerald-400 ${editingItemId ? 'bg-slate-100 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>

    {/* Product search + HSN */}
    <div className="grid grid-cols-4 gap-2">
      <div className="col-span-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-semibold text-slate-600">Product *</label>
          <button type="button" onClick={() => setShowAddProduct(true)} className="text-sm font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg hover:bg-slate-200">+ New</button>
        </div>
        
        {/* Replaced SearchableSelect with explicit input & dropdown from patch */}
        <div className="relative">
          <input
            type="text"
            value={productSearch}
            onChange={e => { setProductSearch(e.target.value); setShowProductList(true); }}
            onFocus={() => setShowProductList(true)}
            placeholder="Search product..."
            className="w-full flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
          />

          {showProductList && productOptions.length > 0 && (
            <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
              {productOptions.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onMouseDown={() => handleSelectProduct(item)} // onMouseDown beats onBlur
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-800 hover:bg-emerald-50 border-b border-slate-100 last:border-0"
                >
                  {item.label} {/* "Paracetamol (HSN 300400)" */}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-1">HSN</label>
        <input
          type="text"
          value={currentItem.hsn || ''}
          readOnly
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base text-slate-600 outline-none cursor-default"
        />
      </div>
    </div>

    {/* Batch + Expiry */}
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="text-sm font-semibold text-slate-600 block mb-1">Batch No. *</label>
        <input
          type="text"
          value={currentItem.batchNumber}
          onChange={e => onBatchChange(e.target.value)}
          placeholder="Enter batch number"
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400"
        />
      </div>
      <DateInput
        value={currentItem.expiryDate}
        onChange={(val) => setCurrentItem(prev => ({ ...prev, expiryDate: val }))}
        label="Expiry Date *"
        validate={(val) => {
          if (billDate && val <= billDate) return 'Expiry date must be after bill date';
          return null;
        }}
      />
    </div>

    {/* MRP, Purchase Rate, PTR */}
    <div className="grid grid-cols-3 gap-2">
      {/* MRP */}
      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-1">
          MRP {ratesLoading && <span className="text-slate-400 font-normal">(loading...)</span>}
        </label>
        <input
          type="number"
          value={currentItem.mrp}
          onChange={e => setCurrentItem(prev => ({ ...prev, mrp: e.target.value }))}
          placeholder={ratesLoading ? '...' : '0.00'}
          disabled={ratesLoading}
          className={`w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400 ${ratesLoading ? 'opacity-50 cursor-wait' : ''}`}
        />
      </div>

      {/* Purchase Rate */}
      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-1">
          Purchase Rate {ratesLoading && <span className="text-slate-400 font-normal">(loading...)</span>}
        </label>
        <input
          type="number"
          value={currentItem.purchaseRate}
          onChange={e => setCurrentItem(prev => ({ ...prev, purchaseRate: e.target.value }))}
          placeholder={ratesLoading ? '...' : '0.00'}
          disabled={ratesLoading}
          className={`w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400 ${ratesLoading ? 'opacity-50 cursor-wait' : ''}`}
        />
      </div>

      {/* PTR (auto-computed from MRP but editable) */}
      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-1">
          PTR {ratesLoading && <span className="text-slate-400 font-normal">(loading...)</span>}
        </label>
        <input
          type="number"
          value={currentItem.ptr}
          onChange={e => setCurrentItem(prev => ({ ...prev, ptr: e.target.value }))}
          placeholder={ratesLoading ? '...' : '0.00'}
          disabled={ratesLoading}
          className={`w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400 ${ratesLoading ? 'opacity-50 cursor-wait' : ''}`}
        />
      </div>
    </div>

    {/* Tax fields */}
    {purchaseType === 'normal' ? (
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-semibold text-slate-600 block mb-1">CGST (%)</label>
          <input type="text" value={currentItem.cgstRate} onChange={e => setCurrentItem(prev => ({ ...prev, cgstRate: e.target.value }))} inputMode="decimal" className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400" />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-600 block mb-1">SGST (%)</label>
          <input type="text" value={currentItem.sgstRate} onChange={e => setCurrentItem(prev => ({ ...prev, sgstRate: e.target.value }))} inputMode="decimal" className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400" />
        </div>
      </div>
    ) : (
      <div>
        <label className="text-sm font-semibold text-slate-600 block mb-1">IGST (%)</label>
        <input type="text" value={currentItem.igstRate} onChange={e => setCurrentItem(prev => ({ ...prev, igstRate: e.target.value }))} inputMode="decimal" className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400" />
      </div>
    )}

    {/* Qty, Free, Discount */}
    <div className="grid grid-cols-4 gap-2">
      <div>
        <label className="text-sm font-semibold text-slate-600 block mb-1">Qty</label>
        <input
          type="number"
          min="0"
          value={currentItem.qty}
          onChange={e => setCurrentItem(prev => ({ ...prev, qty: e.target.value }))}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400"
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-600 block mb-1">Free</label>
        <input
          type="number"
          min="0"
          value={currentItem.free}
          onChange={e => setCurrentItem(prev => ({ ...prev, free: e.target.value }))}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400"
        />
      </div>
      <div className="col-span-2">
        <label className="text-sm font-semibold text-slate-600 block mb-1">Discount</label>
        <div className="flex items-center gap-2 min-w-0">
          <input type="text" value={currentItem.discountValue} onChange={e => setCurrentItem(prev => ({ ...prev, discountValue: e.target.value }))} placeholder="0" inputMode="decimal" className="flex-1 min-w-0 bg-white border border-slate-300 rounded-xl px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400 text-center" />
          <button
            type="button"
            onClick={() => setCurrentItem(prev => ({ ...prev, discountType: prev.discountType === 'percent' ? 'amount' : 'percent' }))}
            className="shrink-0 px-4 py-2 bg-white border border-slate-300 rounded-xl text-base font-bold w-20 hover:bg-slate-50"
          >
            {currentItem.discountType === 'percent' ? '%' : '₹'}
          </button>
        </div>
      </div>
    </div>

    {/* Tax preview */}
    {currentItem.productId && currentItem.purchaseRate && (
      <div className="bg-slate-50 rounded-xl p-3 text-sm grid grid-cols-2 gap-2">
        {purchaseType === 'normal' ? (
          <>
            <span className="text-slate-500">CGST</span>
            <span className="text-slate-800 font-bold">₹{calcItemPreview().cgst.toFixed(2)} ({currentItem.cgstRate}%)</span>
            <span className="text-slate-500">SGST</span>
            <span className="text-slate-800 font-bold">₹{calcItemPreview().sgst.toFixed(2)} ({currentItem.sgstRate}%)</span>
          </>
        ) : (
          <>
            <span className="text-slate-500">IGST</span>
            <span className="text-slate-800 font-bold">₹{calcItemPreview().igst.toFixed(2)} ({currentItem.igstRate}%)</span>
          </>
        )}
        <span className="text-slate-500">Line Total</span>
        <span className="text-emerald-600 font-bold">₹{calcItemPreview().lineTotal.toFixed(2)}</span>
      </div>
    )}

    <div className="flex gap-2">
      <button onClick={handleAddOrUpdateItem} className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-base font-semibold hover:bg-slate-800">
        {editingItemId ? 'Update Item' : '+ Add to List'}
      </button>
      {editingItemId && (
        <button onClick={cancelEdit} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-base font-semibold hover:bg-slate-200">
          Cancel
        </button>
      )}
    </div>
  </div>
);