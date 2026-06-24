import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight } from 'lucide-react';


export const FinancialSnapshot = ({ period, setPeriod, financials }) => {
  const formatCurrency = (val) => val >= 100000 ? `₹${(val / 100000).toFixed(2)}L` : `₹${val.toLocaleString('en-IN')}`;
  const data = financials[period];

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
        <p className="text-white font-semibold text-base">Financial Snapshot</p>
        <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
          {['month', 'year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${period === p ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
              {p === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-700/30">
        {[
          { label: 'Total Sales', value: formatCurrency(data.sales.value), sub: data.sales.sub, positive: data.sales.positive },
          { label: 'Total Collection', value: formatCurrency(data.collection.value), sub: data.collection.sub, positive: data.collection.positive },
          { label: 'Total Outstanding', value: formatCurrency(data.outstanding.value), sub: data.outstanding.sub, positive: data.outstanding.positive }
        ].map(({ value, label, sub, positive }) => (
          <div key={label} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-slate-400 text-sm">{label}</p>
              <p className="text-white font-black text-xl mt-0.5">{value}</p>
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
              <ArrowUpRight size={14} className={positive ? '' : 'rotate-180'} />
              <span className="text-right text-xs">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-slate-700/40">
        <Link to="/admin-dashboard/billing" className="flex items-center justify-center gap-1.5 text-emerald-400 text-sm font-semibold">
          Full Billing Hub <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};