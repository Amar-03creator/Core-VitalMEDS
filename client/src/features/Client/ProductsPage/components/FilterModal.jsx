// src/features/Client/ProductsPage/components/FilterModal.jsx
import { XCircle } from 'lucide-react';
import { useScrollLock, useModalTrap } from '../../../../hooks/useBackHandler';

const TYPE_OPTIONS = ['Tablet', 'Capsule', 'Syrup', 'Injection'];
const CATEGORY_OPTIONS = ['Antibiotic', 'Analgesic', 'Antidiabetic'];
const GST_OPTIONS = ['0', '5', '12', '18'];

export const FilterModal = ({ isOpen, onClose, filters, setFilters, companies }) => {
  useScrollLock(isOpen);
  useModalTrap(isOpen, { onBackClose: onClose });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center sm:justify-center">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl px-5 sm:px-6 py-5 sm:py-6 space-y-5 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-bold text-lg sm:text-xl text-slate-900">Filter Products</h3>
          <button onClick={onClose} aria-label="Close">
            <XCircle size={26} className="text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="text-sm sm:text-base font-semibold text-slate-700 block mb-2">Company</label>
            <select
              value={filters.company}
              onChange={(e) => setFilters({ ...filters, company: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 sm:py-3 outline-none text-sm sm:text-base"
            >
              <option value="All">All Companies</option>
              {companies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm sm:text-base font-semibold text-slate-700 block mb-2">GST Rate</label>
            <select
              value={filters.gstRate}
              onChange={(e) => setFilters({ ...filters, gstRate: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 sm:py-3 outline-none text-sm sm:text-base"
            >
              <option value="All">All Rates</option>
              {GST_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}%</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm sm:text-base font-semibold text-slate-700 block mb-2">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 sm:py-3 outline-none text-sm sm:text-base"
            >
              <option value="All">All Types</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm sm:text-base font-semibold text-slate-700 block mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 sm:py-3 outline-none text-sm sm:text-base"
            >
              <option value="All">All Categories</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Company/GST Rate filter real data; Type/Category are UI-ready
            but the catalog endpoint doesn't return those fields yet (see
            useProductCatalog.js) — surfaced here rather than silently
            no-op'ing. */}
        <p className="text-xs sm:text-sm text-slate-400 -mt-1">
          Company and GST Rate filter your results now. Type and Category will too once the catalog includes that data.
        </p>

        <button
          onClick={onClose}
          className="w-full bg-slate-900 text-white font-bold py-3 sm:py-3.5 rounded-xl text-sm sm:text-base"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default FilterModal;