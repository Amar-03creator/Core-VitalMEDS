// src/features/Admin/InventoryPage/modals/InventoryFilterModal.jsx
import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { api } from '../../../../services/api';
import { useScrollLock, useBackHandler } from '../../../../hooks/useBackHandler';

/* ── Checkbox option row ─────────────────────────────────────────── */
const CheckRow = ({ label, checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
  >
    <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
      ${checked ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white'}`}>
      {checked && <Check size={11} className="text-white" strokeWidth={3} />}
    </span>
    <span className={`text-lg ${checked ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
      {label}
    </span>
  </button>
);

/* ── Searchable check list (inline, no dropdown) ──────── */
const SearchCheckList = ({ options, value = [], onChange, placeholder, isLoading }) => {
  const [query, setQuery] = useState('');
  
  const toggle = (opt) =>
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
    
  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  if (isLoading) {
    return <p className="text-sm text-slate-400 py-4 text-center italic">Loading options...</p>;
  }

  return (
    <div className="flex flex-col h-full">
      
      {options.length > 5 && (
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 mb-2 shrink-0">
          <span className="text-slate-400 text-xl">🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder || 'Search…'}
            className="flex-1 text-lg bg-transparent outline-none text-slate-700 placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X size={14} className="text-slate-400" />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-2">
        {filtered.length === 0
          ? <p className="text-sm text-slate-400 py-4 text-center">No results found</p>
          : filtered.map(opt => (
              <CheckRow
                key={opt}
                label={opt}
                checked={value.includes(opt)}
                onChange={() => toggle(opt)}
              />
            ))
        }
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-100 shrink-0">
          {value.map(v => (
            <span key={v}
              className="flex items-center gap-1 bg-slate-900 text-white text-sm font-semibold px-2.5 py-1 rounded-full">
              {v}
              <button type="button" onClick={() => toggle(v)}><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Filter section definitions ──────────────────────────────────── */
const buildSections = () => [
  { key: 'companies', label: 'Companies', count: (f) => f.companies?.length || 0 },
  { key: 'categories', label: 'Categories', count: (f) => f.categories?.length || 0 },
];

/* ── Right-panel content per section ─────────────────────────────── */
const RightPanel = ({ sectionKey, pendingFilters, set, companies, categories, isLoading }) => {
  const f = pendingFilters;

  if (sectionKey === 'companies') return (
    <SearchCheckList
      options={companies}
      value={f.companies || []}
      onChange={v => set('companies', v)}
      placeholder="Search company…"
      isLoading={isLoading}
    />
  );

  if (sectionKey === 'categories') return (
    <SearchCheckList
      options={categories}
      value={f.categories || []}
      onChange={v => set('categories', v)}
      placeholder="Search category…"
      isLoading={isLoading}
    />
  );

  return null;
};

/* ── Main Filter Drawer ───────────────────────────────────────────── */
export const InventoryFilterModal = ({ isOpen, onClose, filters, setFilters }) => {
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Local state for filters before applying
  const [pendingFilters, setPendingFilters] = useState({ companies: [], categories: [] });

  useEffect(() => {
    if (isOpen) {
      // Sync local state with active filters when opened
      setPendingFilters({
        companies: filters.companies || [],
        categories: filters.categories || []
      });
      
      setIsLoading(true);
      Promise.all([
        api.getCompanies(),
        api.getProducts({ limit: 5000 }) 
      ])
        .then(([compRes, prodRes]) => {
          if (compRes.data) {
            const dynamicCompanies = compRes.data.map(c => c.companyName).sort();
            setCompanies(dynamicCompanies);
          }
          if (prodRes.data) {
            const uniqueCategories = new Set();
            prodRes.data.forEach(product => {
              if (product.categories && Array.isArray(product.categories)) {
                product.categories.forEach(cat => uniqueCategories.add(cat));
              }
            });
            setCategories([...uniqueCategories].sort());
          }
        })
        .catch(err => console.error("Failed to load dynamic filter options:", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, filters]);

  const handleApply = () => {
    setFilters({ ...filters, ...pendingFilters });
    onClose();
  };

  const handleReset = () => {
    setPendingFilters({ companies: [], categories: [] });
  };

  useBackHandler(isOpen, () => {
    handleApply();
  }, 'inventory_filter_trap');
  
  useScrollLock(isOpen);

  const sections = buildSections();
  const [active, setActive] = useState(sections[0]?.key || 'companies');

  const activeSection = sections.find(s => s.key === active) ? active : sections[0]?.key;
  const set = (key, val) => setPendingFilters(prev => ({ ...prev, [key]: val }));
  const totalActive = sections.reduce((sum, s) => sum + (s.count(pendingFilters) || 0), 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={handleApply}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ height: '82dvh' }}
      >
        {/* Header */}
        <div className="shrink-0 px-4 pt-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg">Filter Inventory</h3>
            <button onClick={handleApply}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center transition-colors hover:bg-slate-200">
              <X size={18} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left nav */}
          <div className="w-32 shrink-0 border-r border-slate-100 overflow-y-auto bg-slate-50 py-2">
            {sections.map(sec => {
              const cnt = sec.count(pendingFilters) || 0;
              const isActive = activeSection === sec.key;
              return (
                <button
                  key={sec.key}
                  onClick={() => setActive(sec.key)}
                  className={`w-full text-left px-3 py-3 text-base font-heading transition-colors relative
                    ${isActive
                      ? 'bg-white text-slate-900 font-bold border-r-2 border-slate-900 -mr-px'
                      : 'text-slate-500 hover:bg-white/60'}`}
                >
                  {sec.label}
                  {cnt > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right options panel */}
          {/* ✨ FIX: Applied flex flex-col overflow-hidden here so the list doesn't cut off */}
          <div className="flex-1 flex flex-col overflow-hidden px-2 py-2">
            <RightPanel
              sectionKey={activeSection}
              pendingFilters={pendingFilters}
              set={set}
              companies={companies}
              categories={categories}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 px-3 py-2 flex gap-3 bg-white">
          <button onClick={handleReset}
            className="flex-1 bg-slate-100 text-slate-700 font-semibold py-3.5 rounded-xl text-lg hover:bg-slate-200 transition-colors">
            Reset all
          </button>
          <button onClick={handleApply}
            className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl text-lg hover:bg-slate-800 transition-colors">
            Apply{totalActive > 0 ? ` (${totalActive})` : ''}
          </button>
        </div>
      </div>
    </>
  );
};