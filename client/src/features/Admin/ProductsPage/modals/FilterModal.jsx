import { XCircle } from 'lucide-react';
import { useScrollLock, useModalTrap } from '../../../../hooks/useBackHandler';

export const FilterModal = ({ isOpen, onClose, filters, setFilters, companies }) => {
  useScrollLock(isOpen);
  useModalTrap(isOpen, { onBackClose: onClose });;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="w-full bg-white rounded-t-2xl px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-lg text-slate-900">Filter Products</h3>
          <button onClick={onClose}><XCircle size={24} className="text-slate-400" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Company</label>
            <select
              value={filters.company}
              onChange={e => setFilters({ ...filters, company: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-sm"
            >
              <option value="All">All Companies</option>
              <option value="Aster Medipharm">Aster Medipharm</option>
              <option value="Cipla">Cipla</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Type</label>
            <select
              value={filters.type}
              onChange={e => setFilters({ ...filters, type: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-sm"
            >
              <option value="All">All Types</option>
              <option value="Tablet">Tablet</option>
              <option value="Capsule">Capsule</option>
              <option value="Syrup">Syrup</option>
              <option value="Injection">Injection</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Category</label>
            <select
              value={filters.category}
              onChange={e => setFilters({ ...filters, category: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-sm"
            >
              <option value="All">All Categories</option>
              <option value="Antibiotic">Antibiotic</option>
              <option value="Analgesic">Analgesic</option>
              <option value="Antidiabetic">Antidiabetic</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">GST Rate</label>
            <select
              value={filters.gstRate}
              onChange={e => setFilters({ ...filters, gstRate: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-sm"
            >
              <option value="All">All Rates</option>
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
            </select>
          </div>
        </div>

        <button onClick={onClose} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl mt-4">
          Apply Filters
        </button>
      </div>
    </div>
  );
};