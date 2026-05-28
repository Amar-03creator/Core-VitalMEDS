// components/Admin/Dashboard/ConcernedParties.jsx
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { concernedParties, tierColorsLight } from './constants';

export const ConcernedParties = () => (
  <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
    <div className="px-4 py-3.5 border-b border-red-100 flex items-center justify-between">
      <h2 className="text-slate-800 font-semibold text-base flex items-center gap-2">
        <AlertCircle size={16} className="text-red-500" />
        <span>Concerned Parties</span>
        <span className="text-[11px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Watchlist</span>
      </h2>
    </div>

    <div className="divide-y divide-slate-50">
      {concernedParties.map(({ name, outstanding, days, tier, score }) => (
        <div key={name} className="px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertCircle size={16} className="text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-800 text-sm font-semibold truncate">{name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${tierColorsLight[tier]}`}>{tier}</span>
              <span className="text-[10px] text-slate-400">Score: <span className="text-red-500 font-bold">{score}/100</span></span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-red-600 text-sm font-bold">{outstanding}</p>
            <p className="text-slate-400 text-[11px]">{days}d overdue</p>
          </div>
        </div>
      ))}
    </div>

    <div className="px-4 py-3 border-t border-slate-100">
      <Link to="/admin-dashboard/billing" className="text-red-500 text-sm font-semibold flex items-center gap-1">
        View outstanding report <ArrowRight size={13} />
      </Link>
    </div>
  </div>
);