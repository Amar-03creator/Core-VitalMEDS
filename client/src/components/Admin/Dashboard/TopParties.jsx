// components/Admin/Dashboard/TopParties.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Users, ArrowRight } from 'lucide-react';
import { topPartiesData, tierColorsLight } from './constants';

export const TopParties = () => {
  const [partySort, setPartySort] = useState('volume');
  const [partySortOpen, setPartySortOpen] = useState(false);

  const parties = topPartiesData[partySort];
  const partySortLabels = {
    volume: 'Sort: Volume',
    speed: 'Sort: Pay Speed',
    mvp: 'Sort: MVP',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-slate-800 font-semibold text-base flex items-center gap-2">
          <Users size={16} className="text-slate-500" /> Top Parties
        </h2>
        <div className="relative">
          <button
            onClick={() => setPartySortOpen(o => !o)}
            className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold bg-slate-100 px-3 py-1.5 rounded-xl"
          >
            {partySortLabels[partySort]}
            <ChevronDown size={13} className={`transition-transform ${partySortOpen ? 'rotate-180' : ''}`} />
          </button>
          {partySortOpen && (
            <div className="absolute right-0 top-8 z-10 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-40">
              {[
                { key: 'volume', label: '📦 Volume' },
                { key: 'speed', label: '⚡ Pay Speed' },
                { key: 'mvp', label: '⭐ MVP Score' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setPartySort(key); setPartySortOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors
                    ${partySort === key ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-50">
        {parties.map(({ name, tier, value, score, meta }, i) => (
          <div key={name} className="px-4 py-3.5 flex items-center gap-3">
            <span className="text-slate-300 text-sm font-bold w-5 shrink-0">{i + 1}</span>
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
              {name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 text-sm font-semibold truncate">{name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${tierColorsLight[tier]}`}>
                  {tier}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">{score}</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-slate-800 text-sm font-bold">{value}</p>
              <p className="text-slate-400 text-[11px]">{meta}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-slate-100">
        <Link to="/admin-dashboard/customers" className="text-emerald-600 text-sm font-semibold flex items-center gap-1">
          View all customers <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};