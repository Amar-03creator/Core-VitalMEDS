// features/Client/Reorder/components/ReorderProductCard.jsx
import { CheckCircle2, Package, ShoppingCart } from 'lucide-react';
import QuantityStepper from '../../../../components/QuantityStepper';

const ReorderProductCard = ({ product, qty, onQtyChange, staged, onAdd, isAlreadyInCart }) => {
  const { name, resolvedShortCode, packing, mrp, inStock, totalStock, suggestedQty } = product;
  const isEmpty = qty === '' || qty === undefined || qty === null;
  const canAdd = inStock && !isEmpty && Number(qty) > 0;

  // Safely extract the image
  const imgSrc = product.images?.[0] || product.photoUrl || null;

  return (
    <div
      // ✨ FIX: Reduced padding from p-4 to p-2.5 / sm:p-3 for a much tighter look
      className={`bg-white rounded-2xl border p-2.5 sm:p-3 transition-shadow duration-150 ${
        inStock ? 'border-slate-200 hover:shadow-md hover:border-slate-300' : 'opacity-60 border-slate-200 grayscale-[20%]'
      }`}
    >
      {/* ── TOP SECTION: Image + Details ── */}
      <div className="flex items-start gap-2.5">
        
        {/* Product Image */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative">
          {imgSrc ? (
            <img src={imgSrc} alt={name} className="w-full h-full object-cover" />
          ) : (
            <Package size={22} className="text-slate-300" />
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-2">
            {/* ✨ FIX: Enforced text-base sm:text-lg as requested */}
            <p className="text-slate-900 font-bold text-base sm:text-lg leading-tight line-clamp-2">
              {name}
            </p>
            {!inStock && (
              <span className="text-xs font-black px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 shrink-0 whitespace-nowrap mt-0.5">
                NO STOCK
              </span>
            )}
          </div>
          
          {/* HORIZONTAL ROW: Company, Packing & MRP */}
          <div className="flex items-center justify-between gap-2 mt-1">
            {/* ✨ FIX: Bumped up to text-sm */}
            <p className="text-slate-500 font-medium text-sm truncate">
              {resolvedShortCode} <span className="mx-1 opacity-50">•</span> {packing}
            </p>
            {/* ✨ FIX: Bumped up to text-base */}
            <p className="text-emerald-600 font-black text-base shrink-0">
              ₹{typeof mrp === 'number' ? mrp.toFixed(2) : mrp}
            </p>
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: Actions & Suggestions ── */}
      {inStock && (
        // ✨ FIX: Reduced top margins and padding to pull it closer
        <div className="mt-2.5 pt-2.5 border-t border-slate-100">
          
          {isAlreadyInCart ? (
            /* Already In Cart State */
            <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 w-full py-2 rounded-xl text-sm font-bold shadow-sm">
              <CheckCircle2 size={18} /> Currently in your cart
            </div>
          ) : (
            /* Action State */
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              
              {/* Left: Stepper */}
              {/* ✨ FIX: Increased width slightly to prevent 2-digit clipping and forced Number() on max */}
              <div className="w-32 sm:w-35 shrink-0">
                <QuantityStepper value={qty} onChange={onQtyChange} max={9999} />
              </div>

              {/* Right: Suggestion & Add Button */}
              <div className="flex flex-1 items-center justify-end gap-2.5 sm:gap-3">
                
                {/* STACKED SUGGESTION */}
                <div className="text-right flex flex-col justify-center">
                  {/* ✨ FIX: Changed "Suggest" to "Suggested" and bumped to text-xs */}
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">
                    Suggested
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-700 leading-none mt-1">
                    {suggestedQty}
                  </span>
                </div>

                {/* Action Button */}
                {staged ? (
                  <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl text-sm font-bold shrink-0">
                    <CheckCircle2 size={16} /> <span className="hidden sm:inline">Staged</span>
                  </div>
                ) : (
                  <button
                    onClick={onAdd}
                    disabled={!canAdd}
                    className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold px-3 py-2 rounded-xl shrink-0 transition-colors focus:outline-none shadow-sm"
                  >
                    <ShoppingCart size={16} className="shrink-0" />
                    <span>Add</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReorderProductCard;