// features/Client/Reorder/components/ReorderStagingTray.jsx
import { X, ShoppingCart } from 'lucide-react';

// variant: 'sheet' (default, fixed bottom bar — original look) | 'panel' (sticky sidebar card for desktop)
const ReorderStagingTray = ({ items, onRemove, onAddToCart, adding, variant = 'sheet' }) => {
  if (items.length === 0) return null;

  const isPanel = variant === 'panel';

  return (
    <div
      className={
        isPanel
          ? 'bg-white rounded-2xl border border-slate-200 shadow-sm p-5'
          : 'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] px-4 pt-3 pb-5 max-w-2xl mx-auto sm:rounded-t-2xl'
      }
    >
      <p className="text-slate-500 text-sm font-semibold mb-2">
        {items.length} item{items.length > 1 ? 's' : ''} selected
      </p>
      <div className={`${isPanel ? 'max-h-[50vh]' : 'max-h-32'} overflow-y-auto space-y-1.5 mb-3`}>
        {items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between gap-2">
            <p className="text-slate-800 text-sm truncate flex-1">{item.name}</p>
            <span className="text-slate-500 text-sm shrink-0">×{item.qty}</span>
            <button
              onClick={() => onRemove(item.productId)}
              className="text-slate-400 hover:text-red-500 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-red-300 rounded"
              aria-label={`Remove ${item.name}`}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={onAddToCart}
        disabled={adding}
        className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold py-3 rounded-2xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
      >
        <ShoppingCart size={16} /> {adding ? 'Adding…' : 'Add to Cart'}
      </button>
    </div>
  );
};

export default ReorderStagingTray;