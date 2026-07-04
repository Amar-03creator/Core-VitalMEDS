// customers/components/FilterDrawer.jsx
// Amazon/Flipkart-style: left nav selects the category, right panel shows options
import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useScrollLock, useBackHandler } from '../../../../hooks/useBackHandler';
import {
  STATUS_OPTIONS, TYPE_OPTIONS, TIER_OPTIONS, SCORE_OPTIONS, RISK_OPTIONS,
} from '../utils/constants';

const RISK_DOT = { Green: 'bg-emerald-500', Yellow: 'bg-amber-400', Red: 'bg-red-500' };

/* ── Checkbox option row ─────────────────────────────────────────── */
const CheckRow = ({ label, checked, onChange, dot }) => (
  <button
    type="button"
    onClick={onChange}
    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
  >
    <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
      ${checked ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white'}`}>
      {checked && <Check size={11} className="text-white" strokeWidth={3} />}
    </span>
    {dot && <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />}
    <span className={`text-base ${checked ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
      {label}
    </span>
  </button>
);

/* ── City / Line searchable check list (inline, no dropdown) ──────── */
const SearchCheckList = ({ options, value = [], onChange, placeholder }) => {
  const [query, setQuery] = useState('');
  const toggle = (opt) =>
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      {options.length > 5 && (
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 mb-2">
          <span className="text-slate-400 text-sm">🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder || 'Search…'}
            className="flex-1 text-base bg-transparent outline-none text-slate-700 placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X size={14} className="text-slate-400" />
            </button>
          )}
        </div>
      )}
      <div className="max-h-64 overflow-y-auto">
        {filtered.length === 0
          ? <p className="text-sm text-slate-400 py-4 text-center">No results for "{query}"</p>
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
        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-100">
          {value.map(v => (
            <span key={v}
              className="flex items-center gap-1 bg-slate-900 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
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
const buildSections = (cityOptions, lineOptions) => [
  { key: 'status',       label: 'Status',         count: (f) => f.status?.length || 0   },
  { key: 'businessType', label: 'Business type',  count: (f) => f.businessType?.length || 0 },
  { key: 'tier',         label: 'Party tier',     count: (f) => f.tier?.length || 0     },
  { key: 'riskTier',     label: 'Risk tier',      count: (f) => f.riskTier?.length || 0 },
  { key: 'scoreRange',   label: 'Credit score',   count: (f) => (f.scoreRange && f.scoreRange !== 'All') ? 1 : 0 },
  ...(cityOptions.length ? [{ key: 'cities', label: 'City',          count: (f) => f.cities?.length || 0 }] : []),
  ...(lineOptions.length ? [{ key: 'lines',  label: 'Delivery line', count: (f) => f.lines?.length || 0  }] : []),
];

/* ── Right-panel content per section ─────────────────────────────── */
const RightPanel = ({ sectionKey, pendingFilters, set, cityOptions, lineOptions }) => {
  const f = pendingFilters;

  if (sectionKey === 'status') return (
    <div>
      {STATUS_OPTIONS.filter(s => s !== 'All').map(opt => (
        <CheckRow key={opt} label={opt}
          checked={(f.status || []).includes(opt)}
          onChange={() => {
            const cur = f.status || [];
            set('status', cur.includes(opt) ? cur.filter(v => v !== opt) : [...cur, opt]);
          }} />
      ))}
    </div>
  );

  if (sectionKey === 'businessType') return (
    <div>
      {TYPE_OPTIONS.filter(t => t !== 'All').map(opt => (
        <CheckRow key={opt} label={opt}
          checked={(f.businessType || []).includes(opt)}
          onChange={() => {
            const cur = f.businessType || [];
            set('businessType', cur.includes(opt) ? cur.filter(v => v !== opt) : [...cur, opt]);
          }} />
      ))}
    </div>
  );

  if (sectionKey === 'tier') return (
    <div>
      {TIER_OPTIONS.map(opt => (
        <CheckRow key={opt} label={opt}
          checked={(f.tier || []).includes(opt)}
          onChange={() => {
            const cur = f.tier || [];
            set('tier', cur.includes(opt) ? cur.filter(v => v !== opt) : [...cur, opt]);
          }} />
      ))}
    </div>
  );

  if (sectionKey === 'riskTier') return (
    <div>
      {RISK_OPTIONS.map(opt => (
        <CheckRow key={opt} label={opt}
          checked={(f.riskTier || []).includes(opt)}
          dot={RISK_DOT[opt]}
          onChange={() => {
            const cur = f.riskTier || [];
            set('riskTier', cur.includes(opt) ? cur.filter(v => v !== opt) : [...cur, opt]);
          }} />
      ))}
    </div>
  );

  if (sectionKey === 'scoreRange') return (
    <div>
      {['All', ...SCORE_OPTIONS.filter(s => s !== 'All')].map(opt => (
        <CheckRow key={opt} label={opt === 'All' ? 'Any score' : opt}
          checked={(f.scoreRange || 'All') === opt}
          onChange={() => set('scoreRange', opt)} />
      ))}
    </div>
  );

  if (sectionKey === 'cities') return (
    <SearchCheckList
      options={cityOptions}
      value={f.cities || []}
      onChange={v => set('cities', v)}
      placeholder="Search city…"
    />
  );

  if (sectionKey === 'lines') return (
    <SearchCheckList
      options={lineOptions}
      value={f.lines || []}
      onChange={v => set('lines', v)}
      placeholder="Search line…"
    />
  );

  return null;
};

/* ── Main FilterDrawer ───────────────────────────────────────────── */
export const FilterDrawer = ({
  open, onClose,
  pendingFilters, setPendingFilters,
  onApply, onReset,
  cityOptions = [],
  lineOptions = [],
}) => {

  // ✨ Auto-apply the filters when the system back button/swipe is used
  useBackHandler(open, () => {
    onApply();
    onClose();
  }, 'filter_drawer_trap');
  
  useScrollLock(open);

  const sections   = buildSections(cityOptions, lineOptions);
  const [active, setActive] = useState(sections[0]?.key || 'status');

  // Make sure active section stays valid if options change
  const activeSection = sections.find(s => s.key === active) ? active : sections[0]?.key;

  const set = (key, val) => setPendingFilters(prev => ({ ...prev, [key]: val }));

  const totalActive = sections.reduce((sum, s) => sum + (s.count(pendingFilters) || 0), 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        // ✨ Auto-apply if the user taps the dark background
        onClick={() => {
          onApply();
          onClose();
        }}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col
          transition-transform duration-300 ease-out
          ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ height: '82dvh' }}
      >
        {/* Header */}
        <div className="shrink-0 px-4 pt-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg">Filter customers</h3>
            {/* ✨ Auto-apply if the user taps the X button */}
            <button onClick={() => { onApply(); onClose(); }}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
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
                  className={`w-full text-left px-3 py-3 text-sm font-medium transition-colors relative
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

          {/* Right options panel */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <RightPanel
              sectionKey={activeSection}
              pendingFilters={pendingFilters}
              set={set}
              cityOptions={cityOptions}
              lineOptions={lineOptions}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 px-4 py-3 flex gap-3 bg-white">
          <button onClick={onReset}
            className="flex-1 bg-slate-100 text-slate-700 font-semibold py-3.5 rounded-xl text-base">
            Reset all
          </button>
          <button onClick={() => { onApply(); onClose(); }}
            className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl text-base">
            Apply{totalActive > 0 ? ` (${totalActive})` : ''}
          </button>
        </div>
      </div>
    </>
  );
};