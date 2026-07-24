import { Search, X, ChevronDown } from 'lucide-react';
import { DateInput } from '../../../../../components/ui/DateInput';

export default function FilterBar({ filters, setFilters, showBillType = false, showDateRange = false }) {
  const hasSearchText = filters.search?.length > 0;

  return (
    <div className="flex flex-col gap-3 mb-6 w-full">
      <div className="relative w-full h-14">
        <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={filters.search}
          onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          placeholder="Search ID..."
          className="w-full h-full pl-12 pr-12 text-lg font-medium bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 shadow-sm"
        />
        {hasSearchText && (
          <button 
            onMouseDown={(e) => { e.preventDefault(); setFilters(f => ({ ...f, search: '' })); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
          >
            <X size={22} />
          </button>
        )}
      </div>

      {(showBillType || showDateRange) && (
        <div className="flex flex-row gap-3 w-full h-14">
          {showBillType && (
            <div className="relative flex-1 h-full">
              <select
                value={filters.billType}
                onChange={(e) => setFilters(f => ({ ...f, billType: e.target.value }))}
                className="w-full h-full pl-4 pr-10 text-lg font-medium bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-400 text-slate-700 cursor-pointer shadow-sm appearance-none"
              >
                <option value="All">All Bills</option>
                <option value="Cash">Cash Bill</option>
                <option value="Credit">Credit Bill</option>
              </select>
              <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          )}
          {showDateRange && (
            <div className="relative flex-1 h-full">
              <select
                value={filters.dateRange.preset}
                onChange={(e) => setFilters(f => ({ ...f, dateRange: { ...f.dateRange, preset: e.target.value } }))}
                className="w-full h-full pl-4 pr-10 text-lg font-medium bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-400 text-slate-700 cursor-pointer shadow-sm appearance-none"
              >
                <option value="all">All Time</option>
                <option value="30d">Last 30 Days</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
              <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          )}
        </div>
      )}

      {showDateRange && filters.dateRange.preset === 'custom' && (
        <div className="flex flex-row items-end gap-3 w-full animate-fadeIn">
          <DateInput label="From" value={filters.dateRange.from || ''} onChange={(val) => setFilters(f => ({ ...f, dateRange: { ...f.dateRange, from: val } }))} className="flex-1" />
          <span className="text-slate-400 font-bold pb-2.5">–</span>
          <DateInput label="To" value={filters.dateRange.to || ''} onChange={(val) => setFilters(f => ({ ...f, dateRange: { ...f.dateRange, to: val } }))} className="flex-1" />
        </div>
      )}
    </div>
  );
}