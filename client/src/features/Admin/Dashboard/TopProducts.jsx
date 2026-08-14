import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Package, ArrowRight, Calendar, ChevronDown } from 'lucide-react';
import { api } from '../../../services/api'; // 

const MONTHS = [
  { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' }, { value: 4, label: 'Apr' },
  { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' }, { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
];

export const TopProducts = () => {
  // ✨ LOGIC: Calculate "Last Month" safely (Handles January roll-backs)
  const now = new Date();
  let defaultYear = now.getFullYear();
  let defaultMonth = now.getMonth(); // getMonth is 0-indexed (0 = Jan). So getting current month automatically gives us "Last Month" in 1-indexed.
  
  if (defaultMonth === 0) {
    defaultMonth = 12; // December
    defaultYear -= 1;  // Previous Year
  }

  const [year, setYear] = useState(defaultYear);
  const [fromMonth, setFromMonth] = useState(defaultMonth);
  const [toMonth, setToMonth] = useState(defaultMonth);
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✨ LOGIC: Enforce the "To must be >= From" rule
  const handleFromChange = (e) => {
    const val = parseInt(e.target.value);
    setFromMonth(val);
    if (val > toMonth) setToMonth(val);
  };

  const handleToChange = (e) => {
    const val = parseInt(e.target.value);
    setToMonth(val);
    if (val < fromMonth) setFromMonth(val);
  };

  // ✨ THE FIX: Component fetches its own data based on the dropdowns
  useEffect(() => {
    const fetchCustomRange = async () => {
      setLoading(true);
      try {
        // We will build this backend route next!
        const res = await api.getTopProductsByRange(year, fromMonth, toMonth);
        setProducts(res?.data || []);
      } catch (error) {
        console.error("Failed to fetch top products range", error);
        setProducts([]); // Fallback
      } finally {
        setLoading(false);
      }
    };

    fetchCustomRange();
  }, [year, fromMonth, toMonth]);

  // Generate a quick array of recent years (e.g., current year down to 2 years ago)
  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      
      {/* TOP BAR: Title & Year Selector */}
      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-slate-800 font-semibold text-xl flex items-center gap-2">
          <Star size={16} className="text-amber-500" /> Top Products
        </h2>
        
        <div className="relative">
          <select 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-bold py-1.5 pl-3 pr-8 rounded-lg outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 cursor-pointer shadow-sm"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* FILTER BAR: Month Selectors */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-white">
        <Calendar size={15} className="text-slate-400 shrink-0" />
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>From</span>
          <select 
            value={fromMonth} 
            onChange={handleFromChange}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold py-1 px-2 rounded-md outline-none focus:border-emerald-400 cursor-pointer"
          >
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          
          <span>to</span>
          <select 
            value={toMonth} 
            onChange={handleToChange}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold py-1 px-2 rounded-md outline-none focus:border-emerald-400 cursor-pointer"
          >
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* PRODUCT LIST */}
      <div className="divide-y divide-slate-50 relative min-h-[200px]">
        {loading ? (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : null}

        {products.length === 0 && !loading ? (
          <p className="px-4 py-10 text-center text-slate-400 text-sm">No sales data found for this period.</p>
        ) : (
          products.map(({ name, company, sold, revenue }, i) => (
            <div key={name} className="px-4 py-3.5 flex items-center gap-3">
              <span className={`text-base font-black w-5 shrink-0 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : 'text-slate-300'}`}>
                {i + 1}
              </span>
              <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                <Package size={20} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 text-base font-bold truncate">{name}</p>
                <p className="text-slate-500 text-sm mt-0.5">{company}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-slate-800 text-base font-bold">₹{Math.round(revenue).toLocaleString('en-IN')}</p>
                <p className="text-slate-500 text-sm mt-0.5">{sold.toLocaleString('en-IN')} units</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
        <Link to="/admin-dashboard/products" className="text-emerald-600 text-base font-semibold flex items-center gap-1 hover:text-emerald-700 transition-colors">
          View full catalog <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};