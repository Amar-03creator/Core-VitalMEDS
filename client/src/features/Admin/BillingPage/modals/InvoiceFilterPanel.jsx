// modals/InvoiceFilterPanel.jsx
import { useState, useEffect, useMemo } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { api } from '../../../../services/api'; // Adjust path as needed
import { toast } from 'sonner';
import { useScrollLock } from '../../../../hooks/useBackHandler';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'highest', label: 'Highest Due Amount' },
  { value: 'oldest_overdue', label: 'Oldest Overdue' },
];

const DEFAULT_SORT = 'newest';

export const InvoiceFilterPanel = ({ onClose, onApply, initialFilters }) => {
  // ★ PREVENTS BACKGROUND SCROLLING WHILE MODAL IS OPEN
  useScrollLock(true);

  const [sort, setSort] = useState(initialFilters?.sort || DEFAULT_SORT);
  const [status, setStatus] = useState(initialFilters?.status || 'All');
  const [line, setLine] = useState(initialFilters?.line || '');
  const [city, setCity] = useState(initialFilters?.city || '');
  const [party, setParty] = useState(initialFilters?.party || '');
  const [from, setFrom] = useState(initialFilters?.from || '');
  const [to, setTo] = useState(initialFilters?.to || '');

  const [lines, setLines] = useState([]);
  const [cities, setCities] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getClientFilterOptions(line, city);
        if (cancelled) return;
        setLines(res.lines || []);
        setCities(res.cities || []);
        setParties(res.parties || []);
        setLoadError(false);
      } catch {
        if (cancelled) return;
        setLoadError(true);
        toast.error('Failed to load filter options');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [line, city]);

  const handleLineChange = (val) => {
    setLine(val);
    setParty('');
  };

  const handleCityChange = (val) => {
    setCity(val);
    setParty('');
  };

  const handleReset = () => {
    setSort(DEFAULT_SORT);
    setStatus('All');
    setLine('');
    setCity('');
    setParty('');
    setFrom('');
    setTo('');
  };

  const handleApply = () => {
    onApply({ sort, status, line, city, party, from, to });
    onClose();
  };

  const dateHint = useMemo(() => {
    if (from && to) return `From ${from} to ${to}`;
    if (from && !to) return `From ${from} through today`;
    if (!from && to) return `From earliest invoice through ${to}`;
    return 'All invoices (no date filter)';
  }, [from, to]);

  return (
    <div className="fixed inset-0 z-[65] bg-black/60 flex items-end">
      {/* ★ FIXED: Explicit 80dvh height, flex column layout, and overflow hidden */}
      <div 
        className="w-full bg-white rounded-t-3xl flex flex-col overflow-hidden shadow-2xl" 
        style={{ height: '80dvh' }}
      >
        {/* Header - Fixed at Top */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 z-10 shrink-0">
          <h3 className="font-bold text-slate-900 text-2xl flex items-center gap-2">
            <SlidersHorizontal size={24} /> Filter Invoices
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
            <X size={28} className="text-slate-400" />
          </button>
        </div>

        {/* Body - Scrollable Area (Padding adjusted to remove excess space) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loadError && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-lg text-amber-700">
              Couldn't load line/city/party options. Other filters still work.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-lg text-slate-600 block mb-2 font-semibold">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-lg text-slate-800 outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div>
              <label className="text-lg text-slate-600 block mb-2 font-semibold">Sort by</label>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-lg text-slate-800 outline-none"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-lg text-slate-600 block mb-2 font-semibold">Line</label>
            <select
              value={line}
              onChange={e => handleLineChange(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-lg text-slate-800 outline-none disabled:opacity-50"
            >
              <option value="">All lines</option>
              {lines.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="text-lg text-slate-600 block mb-2 font-semibold">City</label>
            <select
              value={city}
              onChange={e => handleCityChange(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-lg text-slate-800 outline-none disabled:opacity-50"
            >
              <option value="">All cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-lg text-slate-600 block mb-2 font-semibold">
              Party {(line || city) && <span className="text-slate-400 font-normal">(filtered)</span>}
            </label>
            <select
              value={party}
              onChange={e => setParty(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-lg text-slate-800 outline-none disabled:opacity-50"
            >
              <option value="">All parties</option>
              {parties.map(p => (
                <option key={p._id} value={p.establishmentName}>{p.establishmentName}{p.city ? ` (${p.city})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-lg text-slate-600 block mb-2 font-semibold">Invoice Date Range</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-base text-slate-500 block mb-1">From</span>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-lg text-slate-800 outline-none" />
              </div>
              <div>
                <span className="text-base text-slate-500 block mb-1">To</span>
                <input type="date" value={to} onChange={e => setTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-lg text-slate-800 outline-none" />
              </div>
            </div>
            <p className="text-base text-slate-500 mt-2 font-medium">{dateHint}</p>
          </div>
        </div>

        {/* Footer - Fixed at Bottom */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-4 z-10 shrink-0">
          <button
            onClick={handleReset}
            className="flex-1 bg-slate-100 text-slate-700 font-semibold py-4 rounded-2xl text-xl hover:bg-slate-200 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl text-xl hover:bg-slate-800 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};