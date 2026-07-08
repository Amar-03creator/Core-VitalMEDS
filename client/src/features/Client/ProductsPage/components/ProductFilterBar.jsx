// src/features/Client/ProductsPage/components/ProductFilterBar.jsx
import { categories, sortOptions } from '../../../../utils/demoProducts';

const ProductFilterBar = ({ category, onCategoryChange, sortBy, onSortChange }) => (
  <div className="space-y-2">
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
      {categories.map((c) => (
        <button
          key={c}
          onClick={() => onCategoryChange(c)}
          className={`shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
            category === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
      {sortOptions.map((s) => (
        <button
          key={s}
          onClick={() => onSortChange(s)}
          className={`shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
            sortBy === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

export default ProductFilterBar;