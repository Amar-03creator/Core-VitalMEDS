// src/features/Client/ProductsPage/components/ProductsTabBar.jsx
import { Flame } from 'lucide-react';

const ProductsTabBar = ({ tab, onChange }) => (
  <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
    <button
      onClick={() => onChange('all')}
      className={`flex-1 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-colors border-b-2 ${
        tab === 'all' ? 'text-emerald-600 border-emerald-500' : 'text-slate-400 border-transparent'
      }`}
    >
      All Products
    </button>
    <button
      onClick={() => onChange('near-expiry')}
      className={`flex-1 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
        tab === 'near-expiry' ? 'text-orange-600 border-orange-500' : 'text-slate-400 border-transparent'
      }`}
    >
      <Flame size={14} /> Near Expiry
    </button>
  </div>
);

export default ProductsTabBar;