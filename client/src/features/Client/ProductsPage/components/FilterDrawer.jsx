// src/features/Client/ProductsPage/components/FilterDrawer.jsx
// Amazon/Flipkart-style: left nav selects the category, right panel shows options
import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useScrollLock, useBackHandler } from '../../../../hooks/useBackHandler';

const GST_OPTIONS = ['0', '5', '12', '18'];
const TYPE_OPTIONS = ['Tablet', 'Capsule', 'Syrup', 'Injection'];
const CATEGORY_OPTIONS = ['Antibiotic', 'Analgesic', 'Antidiabetic'];

/* ── Checkbox option row — same shape as the admin FilterDrawer's CheckRow ── */
const CheckRow = ({ label, checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
  >
    <span
      className={`w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors
        ${checked ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white'}`}
    >
      {checked && <Check size={12} className="text-white" strokeWidth={3} />}
    </span>
    <span className={`text-sm sm:text-base ${checked ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
      {label}
    </span>
  </button>
);

/* ── Searchable check list — used for Company, which can be a long list ── */
const SearchCheckList = ({ options, value = [], onChange, placeholder }) => {
  const [query, setQuery] = useState('');
  const toggle = (opt) => onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      {options.length > 5 && (
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 mb-2">
          <span className="text-slate-400 text-sm">🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder || 'Search…'}
            className="flex-1 text-sm sm:text-base bg-transparent outline-none text-slate-700 placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search">
              <X size={14} className="text-slate-400" />
            </button>
          )}
        </div>
      )}
      <div className="max-h-64 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No results for "{query}"</p>
        ) : (
          filtered.map((opt) => (
            <CheckRow key={opt} label={opt} checked={value.includes(opt)} onChange={() => toggle(opt)} />
          ))
        )}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-100">
          {value.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-full"
            >
              {v}
              <button type="button" onClick={() => toggle(v)} aria-label={`Remove ${v}`}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Section definitions for the left nav ─────────────────────────── */
const buildSections = () => [
  { key: 'companies', label: 'Company', count: (f) => f.companies?.length || 0 },
  { key: 'gstRates', label: 'GST Rate', count: (f) => f.gstRates?.length || 0 },
  { key: 'types', label: 'Type', count: (f) => f.types?.length || 0 },
  { key: 'categories', label: 'Category', count: (f) => f.categories?.length || 0 },
];

/* ── Right-panel content per section ──────────────────────────────── */
const RightPanel = ({ sectionKey, pendingFilters, set, companyOptions }) => {
  const f = pendingFilters;

  if (sectionKey === 'companies') {
    return (
      <SearchCheckList
        options={companyOptions}
        value={f.companies || []}
        onChange={(v) => set('companies', v)}
        placeholder="Search company…"
      />
    );
  }

  if (sectionKey === 'gstRates') {
    return (
      <div>
        {GST_OPTIONS.map((opt) => (
          <CheckRow
            key={opt}
            label={`${opt}%`}
            checked={(f.gstRates || []).includes(opt)}
            onChange={() => {
              const cur = f.gstRates || [];
              set('gstRates', cur.includes(opt) ? cur.filter((v) => v !== opt) : [...cur, opt]);
            }}
          />
        ))}
      </div>
    );
  }

  if (sectionKey === 'types') {
    return (
      <div>
        <p className="text-xs sm:text-sm text-slate-400 px-3 pb-2">
          Won't narrow results yet — the catalog doesn't return product type.
        </p>
        {TYPE_OPTIONS.map((opt) => (
          <CheckRow
            key={opt}
            label={opt}
            checked={(f.types || []).includes(opt)}
            onChange={() => {
              const cur = f.types || [];
              set('types', cur.includes(opt) ? cur.filter((v) => v !== opt) : [...cur, opt]);
            }}
          />
        ))}
      </div>
    );
  }

  if (sectionKey === 'categories') {
    return (
      <div>
        <p className="text-xs sm:text-sm text-slate-400 px-3 pb-2">
          Won't narrow results yet — the catalog doesn't return categories.
        </p>
        {CATEGORY_OPTIONS.map((opt) => (
          <CheckRow
            key={opt}
            label={opt}
            checked={(f.categories || []).includes(opt)}
            onChange={() => {
              const cur = f.categories || [];
              set('categories', cur.includes(opt) ? cur.filter((v) => v !== opt) : [...cur, opt]);
            }}
          />
        ))}
      </div>
    );
  }

  return null;
};

/* ── Main FilterDrawer ─────────────────────────────────────────────── */
export const FilterDrawer = ({
  open, onClose,
  pendingFilters, setPendingFilters,
  onApply, onReset,
  companyOptions = [],
}) => {
  // Auto-apply whenever the drawer closes, however it closes — matches
  // the admin FilterDrawer's behavior exactly (backdrop tap, X, or a
  // hardware back-swipe all commit the pending selections rather than
  // silently discarding them).
  useBackHandler(open, () => {
    onApply();
    onClose();
  }, 'product_filter_drawer_trap');

  useScrollLock(open);

  const sections = buildSections();
  const [active, setActive] = useState(sections[0]?.key || 'companies');
  const activeSection = sections.find((s) => s.key === active) ? active : sections[0]?.key;

  const set = (key, val) => setPendingFilters((prev) => ({ ...prev, [key]: val }));
  const totalActive = sections.reduce((sum, s) => sum + (s.count(pendingFilters) || 0), 0);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => { onApply(); onClose(); }}
      />

      <div
        className={`fixed bottom-0 left-0 right-0 sm:max-w-2xl sm:mx-auto z-50 bg-white rounded-t-3xl flex flex-col
          transition-transform duration-300 ease-out
          ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ height: '82dvh' }}
      >
        <div className="shrink-0 px-4 sm:px-6 pt-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg sm:text-xl">Filter products</h3>
            <button
              onClick={() => { onApply(); onClose(); }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={18} className="text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-32 sm:w-36 shrink-0 border-r border-slate-100 overflow-y-auto bg-slate-50 py-2">
            {sections.map((sec) => {
              const cnt = sec.count(pendingFilters) || 0;
              const isActive = activeSection === sec.key;
              return (
                <button
                  key={sec.key}
                  onClick={() => setActive(sec.key)}
                  className={`w-full text-left px-3 py-3 text-sm sm:text-base font-medium transition-colors relative
                    ${isActive
                      ? 'bg-white text-slate-900 font-bold border-r-2 border-slate-900 -mr-px'
                      : 'text-slate-500 hover:bg-white/60'}`}
                >
                  {sec.label}
                  {cnt > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            <RightPanel
              sectionKey={activeSection}
              pendingFilters={pendingFilters}
              set={set}
              companyOptions={companyOptions}
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 px-4 sm:px-6 py-3 flex gap-3 bg-white">
          <button
            onClick={onReset}
            className="flex-1 bg-slate-100 text-slate-700 font-semibold py-3.5 rounded-xl text-sm sm:text-base"
          >
            Reset all
          </button>
          <button
            onClick={() => { onApply(); onClose(); }}
            className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl text-sm sm:text-base"
          >
            Apply{totalActive > 0 ? ` (${totalActive})` : ''}
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterDrawer;