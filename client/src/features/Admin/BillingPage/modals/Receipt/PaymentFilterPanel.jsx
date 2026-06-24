import { useState, useEffect, useMemo } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { api } from '../../../../../services/api';
import { toast } from 'sonner';

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Newest first' },
  { value: 'date_asc', label: 'Oldest first' },
  { value: 'amount_desc', label: 'Amount: High to Low' },
  { value: 'amount_asc', label: 'Amount: Low to High' },
];

const DEFAULT_SORT = 'date_desc';

export const PaymentFilterPanel = ({ onClose, onApply, initialFilters }) => {
  const [sort, setSort] = useState(initialFilters?.sort || DEFAULT_SORT);
  const [line, setLine] = useState(initialFilters?.line || '');
  const [city, setCity] = useState(initialFilters?.city || '');
  const [partyId, setPartyId] = useState(initialFilters?.partyId || '');
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
    setPartyId('');
  };

  const handleCityChange = (val) => {
    setCity(val);
    setPartyId('');
  };

  const handleReset = () => {
    setSort(DEFAULT_SORT);
    setLine('');
    setCity('');
    setPartyId('');
    setFrom('');
    setTo('');
  };

  const handleApply = () => {
    onApply({ sort, line, city, partyId, from, to });
    onClose();
  };

  const dateHint = useMemo(() => {
    if (from && to) return `From ${from} to ${to}`;
    if (from && !to) return `From ${from} through today`;
    if (!from && to) return `From earliest receipt through ${to}`;
    return 'All receipts (no date filter)';
  }, [from, to]);

  return (
    <div className="fixed inset-0 z-[65] bg-black/50 flex items-end">
      <div className="w-full bg-white rounded-t-2xl max-h-[88vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-2xl flex items-center gap-2">
            <SlidersHorizontal size={24} /> Filter Payments
          </h3>
          <button onClick={onClose}><X size={28} className="text-slate-400" /></button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {loadError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-base text-amber-700">
              Couldn't load line/city/party options. Date filtering still works below.
            </div>
          )}

          <div>
            <label className="text-lg text-slate-600 block mb-2 font-semibold">Sort by</label>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-lg text-slate-800 outline-none"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-lg text-slate-600 block mb-2 font-semibold">Line</label>
            <select
              value={line}
              onChange={e => handleLineChange(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-lg text-slate-800 outline-none disabled:opacity-50"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-lg text-slate-800 outline-none disabled:opacity-50"
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
              value={partyId}
              onChange={e => setPartyId(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-lg text-slate-800 outline-none disabled:opacity-50"
            >
              <option value="">All parties</option>
              {parties.map(p => (
                <option key={p._id} value={p._id}>{p.establishmentName}{p.city ? ` (${p.city})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-lg text-slate-600 block mb-2 font-semibold">Payment Date Range</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-base text-slate-500 block mb-1">From</span>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg text-slate-800 outline-none" />
              </div>
              <div>
                <span className="text-base text-slate-500 block mb-1">To</span>
                <input type="date" value={to} onChange={e => setTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg text-slate-800 outline-none" />
              </div>
            </div>
            <p className="text-base text-slate-500 mt-2">{dateHint}</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-5 flex gap-4">
          <button
            onClick={handleReset}
            className="flex-1 bg-slate-100 text-slate-700 font-semibold py-4 rounded-xl text-lg hover:bg-slate-200"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-xl text-lg hover:bg-slate-800"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};