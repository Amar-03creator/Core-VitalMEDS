import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

const tierColorsLight = {
  Diamond: 'bg-cyan-100 text-cyan-700', Platinum: 'bg-slate-100 text-slate-600',
  Gold: 'bg-amber-100 text-amber-700', Silver: 'bg-gray-100 text-gray-600',
};

export const ConcernedParties = ({ parties = [] }) => (
  <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
    <div className="px-4 py-3.5 border-b border-red-100 flex items-center justify-between">
      <h2 className="text-slate-800 font-semibold text-base flex items-center gap-2">
        <AlertCircle size={16} className="text-red-500" />
        <span>Concerned Parties</span>
        {/* ✨ FIX: Increased Watchlist badge text size */}
        <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Watchlist</span>
      </h2>
    </div>

    {parties.length === 0 ? (
      <div className="px-4 py-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
          <CheckCircle2 size={24} className="text-emerald-500" />
        </div>
        <p className="text-slate-900 text-base font-bold">All Clear!</p>
        <p className="text-slate-500 text-sm mt-1">No parties currently have overdue balances.</p>
      </div>
    ) : (
      <div className="divide-y divide-slate-50">
        {parties.map(({ name, outstanding, days, tier, score }) => (
          <div key={name} className="px-4 py-3.5 flex items-center gap-3">
            {/* ✨ FIX: Increased icon box to w-11 h-11 */}
            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              {/* ✨ FIX: Increased name text size */}
              <p className="text-slate-900 text-base font-bold truncate">{name}</p>
              <div className="flex items-center gap-2.5 mt-1">
                {/* ✨ FIX: Increased Tier badge and Score text size */}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${tierColorsLight[tier]}`}>{tier}</span>
                <span className="text-xs font-medium text-slate-500">Score: <span className="text-red-500 font-bold">{score}/100</span></span>
              </div>
            </div>
            <div className="text-right shrink-0">
              {/* ✨ FIX: Increased Outstanding and Days text size */}
              <p className="text-red-600 text-base font-bold">{outstanding}</p>
              <p className="text-slate-500 text-xs font-medium mt-0.5">{days}d overdue</p>
            </div>
          </div>
        ))}
      </div>
    )}

    <div className="px-4 py-3 border-t border-slate-100">
      <Link 
        to="/admin-dashboard/billing" 
        onClick={() => sessionStorage.setItem('billingActiveTab', 'ledgers')}
        className="text-red-500 text-sm font-semibold flex items-center gap-1"
      >
        View outstanding report <ArrowRight size={13} />
      </Link>
    </div>
  </div>
);