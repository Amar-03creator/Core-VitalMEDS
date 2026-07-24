// src/features/Admin/OrdersPage/components/OrderFilterBar.jsx

import { Search } from 'lucide-react';
import { SORT_OPTIONS } from '../utils';

export default function OrderFilterBar({ group, setGroup, filters, setFilters, pendingOrdersCount }) {
  return (
    <div className="space-y-4">
      {/* Pending / Completed Tabs */}
      <div className="flex border-b border-slate-200 mb-2">
        <button onClick={() => setGroup('pending')}
          className={`relative px-6 py-3.5 text-base md:text-lg font-bold border-b-2 transition-colors -mb-[1px] ${group === 'pending' ? 'text-slate-900 border-slate-900' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
          Pending
          {pendingOrdersCount > 0 && (
            <span className="absolute top-2.5 right-1 bg-red-500 text-white text-[10px] sm:text-sm px-1.5 py-0.5 rounded-full shadow-sm">
              {pendingOrdersCount}
            </span>
          )}
        </button>
        <button onClick={() => setGroup('completed')}
          className={`px-6 py-3.5 text-base md:text-lg font-bold border-b-2 transition-colors -mb-[1px] ${group === 'completed' ? 'text-slate-900 border-slate-900' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
          Completed
        </button>
      </div>

      {/* ✨ FIX: Show Filter Options ONLY when viewing Completed orders */}
      {group === 'completed' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search Order ID or Invoice ID..."
                className="w-full pl-10 pr-4 py-2.5 text-sm md:text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all"
              />
            </div>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
              className="text-sm md:text-base border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-700 font-bold focus:outline-none transition-all cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[{ key: 'all', label: 'All time' }, { key: '30d', label: 'Last 30 Days' }, { key: 'month', label: 'This Month' }, { key: 'custom', label: 'Custom' }].map((p) => (
              <button key={p.key} type="button"
                onClick={() => setFilters((f) => ({ ...f, dateRange: { ...f.dateRange, preset: p.key } }))}
                className={`px-3 py-2 rounded-full text-sm md:text-sm font-bold border transition-colors
                  ${filters.dateRange.preset === p.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {p.label}
              </button>
            ))}

            {/* ✨ FIX: Single row, full width, highly visible Custom Date Picker */}
            {filters.dateRange.preset === 'custom' && (
              <div className="flex items-center gap-2 w-full mt-1 bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
                <span className="hidden sm:inline-block text-xs font-bold text-slate-400 uppercase tracking-wider pl-2 shrink-0">Range:</span>

                <input
                  type="text"
                  placeholder="Start Date..."
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => (e.target.value === "" ? (e.target.type = "text") : null)}
                  value={filters.dateRange.from || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, dateRange: { ...f.dateRange, from: e.target.value } }))}
                  className="flex-1 min-w-0 text-sm md:text-base bg-slate-50 border border-slate-300 rounded-lg px-2 sm:px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-inner"
                />

                <span className="text-slate-400 text-sm font-bold shrink-0">to</span>

               <input 
                type="text"
                placeholder="End Date..."
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => (e.target.value === "" ? (e.target.type = "text") : null)}
                value={filters.dateRange.to || ''}
                onChange={(e) => setFilters((f) => ({ ...f, dateRange: { ...f.dateRange, to: e.target.value } }))}
                className="flex-1 min-w-0 text-sm md:text-base bg-slate-50 border border-slate-300 rounded-lg px-2 sm:px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-inner"
              />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}