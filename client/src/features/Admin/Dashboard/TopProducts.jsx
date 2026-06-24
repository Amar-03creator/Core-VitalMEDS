import { Link } from 'react-router-dom';
import { Star, Package, ArrowRight } from 'lucide-react';

export const TopProducts = ({ period, data }) => {
  const products = data[period] || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-slate-800 font-semibold text-base flex items-center gap-2"><Star size={15} className="text-amber-500" /> Top Products</h2>
        <span className="text-slate-400 text-xs">{period === 'month' ? 'This month' : 'This year'}</span>
      </div>
      <div className="divide-y divide-slate-50">
        {products.length === 0 ? <p className="px-4 py-6 text-center text-slate-400 text-sm">No sales data found.</p> : products.map(({ name, company, sold, revenue }, i) => (
          <div key={name} className="px-4 py-3.5 flex items-center gap-3">
            <span className={`text-sm font-black w-5 shrink-0 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : 'text-slate-300'}`}>{i + 1}</span>
            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0"><Package size={15} className="text-slate-400" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 text-sm font-semibold truncate">{name}</p>
              <p className="text-slate-400 text-xs">{company}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-slate-800 text-sm font-bold">₹{revenue.toLocaleString('en-IN')}</p>
              <p className="text-slate-400 text-xs">{sold.toLocaleString('en-IN')} units</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-100">
        <Link to="/admin-dashboard/products" className="text-emerald-600 text-sm font-semibold flex items-center gap-1">View full catalog <ArrowRight size={13} /></Link>
      </div>
    </div>
  );
};