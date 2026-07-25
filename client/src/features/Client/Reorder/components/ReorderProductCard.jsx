// features/Client/Reorder/components/ReorderProductCard.jsx
import { CheckCircle2, Package, ShoppingCart } from 'lucide-react';
import QuantityStepper from '../../../../components/QuantityStepper';

const ReorderProductCard = ({ product, qty, onQtyChange, staged, onAdd }) => {
  const { name, resolvedShortCode, packing, mrp, inStock, totalStock } = product;
  const isEmpty = qty === '' || qty === undefined || qty === null;
  const canAdd = inStock && !isEmpty && Number(qty) > 0;

  return (
    <div className={`bg-white rounded-2xl border p-4 ${!inStock ? 'opacity-60 border-slate-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
            <Package size={18} className="text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-900 font-semibold text-sm truncate">{name}</p>
            <p className="text-slate-400 text-sm truncate">
              {resolvedShortCode} · {packing}
            </p>
            <p className="text-emerald-600 font-bold text-sm mt-0.5">₹{typeof mrp === 'number' ? mrp.toFixed(2) : mrp}</p>
          </div>
        </div>
        {!inStock && <span className="text-sm font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 shrink-0">Out of Stock</span>}
      </div>

      {inStock && (
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1">
            <QuantityStepper value={qty} onChange={onQtyChange} max={totalStock || 9999} />
            <p className="text-slate-400 text-sm mt-1">Suggested: {product.suggestedQty}</p>
          </div>
          {staged ? (
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-bold shrink-0">
              <CheckCircle2 size={16} /> Added
            </div>
          ) : (
            <button
              onClick={onAdd}
              disabled={!canAdd}
              className="flex items-center gap-1 bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold px-3.5 py-2.5 rounded-xl shrink-0"
            >
              <ShoppingCart size={14} /> Add
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReorderProductCard;