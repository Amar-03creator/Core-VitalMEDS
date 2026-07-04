import { Search, X } from 'lucide-react';

export const CompanySearchBar = ({ value, onChange, placeholder = 'Search supplier, GSTIN, short code...' }) => (
  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
    <Search size={18} className="text-slate-400 shrink-0" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 text-base text-slate-700 placeholder-slate-400 bg-transparent outline-none"
    />
    {value && (
      <button onClick={() => onChange('')}>
        <X size={16} className="text-slate-400" />
      </button>
    )}
  </div>
);