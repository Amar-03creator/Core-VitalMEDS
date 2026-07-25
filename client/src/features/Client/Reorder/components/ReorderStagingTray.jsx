// features/Client/Reorder/components/ReorderStagingTray.jsx
import { X, ShoppingCart } from 'lucide-react';

const ReorderStagingTray = ({ items, onRemove, onAddToCart, adding }) => {
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] px-4 pt-3 pb-5 max-w-2xl mx-auto sm:rounded-t-2xl">
      <p className="text-slate-500 text-sm font-semibold mb-2">
        {items.length} item{items.length > 1 ? 's' : ''} selected
      </p>
      <div className="max-h-32 overflow-y-auto space-y-1.5 mb-3">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between gap-2">
            <p className="text-slate-800 text-sm truncate flex-1">{item.name}</p>
            <span className="text-slate-500 text-sm shrink-0">×{item.qty}</span>
            <button onClick={() => onRemove(item.productId)} className="text-slate-400 shrink-0">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={onAddToCart}
        disabled={adding}
        className="w-full flex items-center justify-center gap-2 bg-emerald-500 disabled:opacity-60 text-white font-bold py-3 rounded-2xl text-sm"
      >
        <ShoppingCart size={16} /> {adding ? 'Adding…' : 'Add to Cart'}
      </button>
    </div>
  );
};

export default ReorderStagingTray;