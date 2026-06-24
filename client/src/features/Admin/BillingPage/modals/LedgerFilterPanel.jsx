import { useState, useEffect } from 'react';
import { X, SlidersHorizontal, MapPin, Users } from 'lucide-react';
import { api } from '../../../../services/api';
import { useScrollLock } from '../../../../hooks/useBackHandler';

export const LedgerFilterPanel = ({ onClose, onApply, initialFilters }) => {
  useScrollLock(true);

  const [scope, setScope] = useState(initialFilters?.scope || 'all');
  const [line, setLine] = useState(initialFilters?.line || '');
  const [city, setCity] = useState(initialFilters?.city || '');
  const [partyId, setPartyId] = useState(initialFilters?.partyId || '');
  const [from, setFrom] = useState(initialFilters?.from || '');
  const [to, setTo] = useState(initialFilters?.to || '');

  const [lines, setLines] = useState([]);
  const [cities, setCities] = useState([]);
  const [parties, setParties] = useState([]);
  const [cityForLine, setCityForLine] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getClientFilterOptions(line, city);
        setLines(res.lines || []);
        setCities(res.cities || []);
        setParties(res.parties || []);
        setCityForLine(res.cityForLine || null);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [line, city]);

  const handleApply = () => {
    onApply({ scope, line, city: scope === 'line' ? cityForLine : city, partyId, from, to });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[65] bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-3xl flex flex-col overflow-hidden shadow-2xl" style={{ height: '85dvh' }}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-5 border-b border-slate-100 z-10 shrink-0">
          <h3 className="font-bold text-slate-900 text-2xl flex items-center gap-2">
            <SlidersHorizontal size={24} /> Statement Generator
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X size={28} className="text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div>
            <label className="text-lg text-slate-600 block mb-3 font-semibold">Statement Scope</label>
            <div className="flex bg-slate-100 rounded-2xl p-1.5 gap-1">
              {['party', 'line', 'city', 'all'].map(key => (
                <button key={key} onClick={() => { setScope(key); setLine(''); setCity(''); setPartyId(''); }}
                  className={`flex-1 py-3 rounded-xl text-lg font-bold transition-all ${scope === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  {key === 'party' ? '1 Party' : key === 'line' ? '1 Line' : key === 'city' ? '1 City' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {(scope === 'line' || scope === 'party') && (
            <div>
              <label className="text-lg text-slate-600 block mb-2 font-semibold flex items-center gap-2"><MapPin size={18} /> Collection Line</label>
              <select value={line} onChange={e => { setLine(e.target.value); setPartyId(''); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-lg text-slate-800 outline-none">
                <option value="">Select Line...</option>
                {lines.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {scope === 'line' && cityForLine && <p className="text-sm text-slate-500 mt-2 font-medium">Associated City: {cityForLine}</p>}
            </div>
          )}

          {scope === 'city' && (
            <div>
              <label className="text-lg text-slate-600 block mb-2 font-semibold flex items-center gap-2"><MapPin size={18} /> City</label>
              <select value={city} onChange={e => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-lg text-slate-800 outline-none">
                <option value="">Select City...</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {scope === 'party' && (
            <div>
              <label className="text-lg text-slate-600 block mb-2 font-semibold flex items-center gap-2"><Users size={18} /> Party</label>
              <select value={partyId} onChange={e => setPartyId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-lg text-slate-800 outline-none">
                <option value="">Select party...</option>
                {parties.map(p => <option key={p._id} value={p._id}>{p.establishmentName}</option>)}
              </select>
            </div>
          )}

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-lg text-slate-600 font-semibold">Statement Period</label>
              <button onClick={() => { 
                  const today = new Date();
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                  setFrom(firstDay.toISOString().split('T')[0]); 
                  setTo(today.toISOString().split('T')[0]); 
                }}
                className="text-sm text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                ⚡ This Month
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-base text-slate-500 block mb-1">From</span><input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-lg text-slate-800 outline-none" /></div>
              <div><span className="text-base text-slate-500 block mb-1">To</span><input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-lg text-slate-800 outline-none" /></div>
            </div>
            <p className="text-base text-slate-500 mt-2 font-medium">Opening balance includes all unpaid transactions before the start date.</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-4 z-10 shrink-0">
          <button onClick={handleApply} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl text-xl hover:bg-slate-800 transition-colors">
            Generate Ledgers
          </button>
        </div>
      </div>
    </div>
  );
};