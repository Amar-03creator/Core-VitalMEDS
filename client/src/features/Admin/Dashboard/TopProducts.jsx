import { Link } from 'react-router-dom';
import { Star, Package, ArrowRight } from 'lucide-react';

export const TopProducts = ({ period, data }) => {
  const products = data[period] || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-slate-800 font-semibold text-base flex items-center gap-2"><Star size={16} className="text-amber-500" /> Top Products</h2>
        <span className="text-slate-500 text-sm font-medium">{period === 'month' ? 'This month' : 'This year'}</span>
      </div>
      <div className="divide-y divide-slate-50">
        {products.length === 0 ? <p className="px-4 py-6 text-center text-slate-400 text-sm">No sales data found.</p> : products.map(({ name, company, sold, revenue }, i) => (
          <div key={name} className="px-4 py-3.5 flex items-center gap-3">
            {/* ✨ FIX: Increased rank number size */}
            <span className={`text-base font-black w-5 shrink-0 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : 'text-slate-300'}`}>{i + 1}</span>
            {/* ✨ FIX: Increased icon box size to match the avatar (w-11 h-11) */}
            <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center shrink-0"><Package size={20} className="text-slate-400" /></div>
            <div className="flex-1 min-w-0">
              {/* ✨ FIX: Increased name and company text sizes */}
              <p className="text-slate-900 text-base font-bold truncate">{name}</p>
              <p className="text-slate-500 text-sm mt-0.5">{company}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-slate-800 text-base font-bold">₹{Math.round(revenue).toLocaleString('en-IN')}</p>
              <p className="text-slate-500 text-sm mt-0.5">{sold.toLocaleString('en-IN')} units</p>
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