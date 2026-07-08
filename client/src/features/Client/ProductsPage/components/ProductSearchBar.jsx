// src/features/Client/ProductsPage/components/ProductSearchBar.jsx
import { Search, X, SlidersHorizontal } from 'lucide-react';

const ProductSearchBar = ({ search, onSearchChange, onOpenFilters, activeFilterCount }) => (
  <div className="flex gap-2">
    <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-3 sm:py-3.5">
      <Search size={17} className="text-slate-400 shrink-0" />
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search medicines, company, composition…"
        className="flex-1 text-base sm:text-lg text-slate-700 placeholder-slate-400 bg-transparent outline-none"
      />
      {search && (
        <button onClick={() => onSearchChange('')} aria-label="Clear search">
          <X size={16} className="text-slate-400" />
        </button>
      )}
    </div>
    <button
      onClick={onOpenFilters}
      className={`relative flex items-center justify-center px-4 py-3 sm:py-3.5 rounded-xl border text-base font-medium transition-colors ${
        activeFilterCount > 0 ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600'
      }`}
    >
      <SlidersHorizontal size={17} />
      {activeFilterCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
          {activeFilterCount}
        </span>
      )}
    </button>
  </div>
);

export default ProductSearchBar;