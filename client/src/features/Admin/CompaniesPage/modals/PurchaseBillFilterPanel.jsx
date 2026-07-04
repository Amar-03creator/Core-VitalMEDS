import { useState, useMemo } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { useScrollLock } from '../../BillingPage/utils/useModalBackHandler';
import { PURCHASE_BILL_SORT_OPTIONS } from '../utils/constants';

const DEFAULT_SORT = 'newest';

/**
 * PurchaseBillFilterPanel
 * Mirrors InvoiceFilterPanel's layout/behavior, but since this list is
 * already scoped to a single supplier (we're inside their detail page),
 * there's no line/city/party dropdown — just status, sort, and date range.
 */
export const PurchaseBillFilterPanel = ({ onClose, onApply, initialFilters }) => {
  useScrollLock(true);

  const [sort, setSort] = useState(initialFilters?.sort || DEFAULT_SORT);
  const [status, setStatus] = useState(initialFilters?.status || 'All');
  const [from, setFrom] = useState(initialFilters?.from || '');
  const [to, setTo] = useState(initialFilters?.to || '');

  const handleReset = () => {
    setSort(DEFAULT_SORT);
    setStatus('All');
    setFrom('');
    setTo('');
  };

  const handleApply = () => {
    onApply({ sort, status, from, to });
    onClose();
  };

  const dateHint = useMemo(() => {
    if (from && to) return `From ${from} to ${to}`;
    if (from && !to) return `From ${from} through today`;
    if (!from && to) return `From earliest bill through ${to}`;
    return 'All bills (no date filter)';
  }, [from, to]);

  return (
    <div className="fixed inset-0 z-[65] bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-3xl flex flex-col overflow-hidden shadow-2xl" style={{ height: '70dvh' }}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 z-10 shrink-0">
          <h3 className="font-bold text-slate-900 text-2xl flex items-center gap-2">
            <SlidersHorizontal size={24} /> Filter Bills
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
            <X size={28} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-lg text-slate-600 block mb-2 font-semibold">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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
                onChange={(e) => setSort(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-lg text-slate-800 outline-none"
              >
                {PURCHASE_BILL_SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-lg text-slate-600 block mb-2 font-semibold">Bill Date Range</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-base text-slate-500 block mb-1">From</span>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-lg text-slate-800 outline-none" />
              </div>
              <div>
                <span className="text-base text-slate-500 block mb-1">To</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-lg text-slate-800 outline-none" />
              </div>
            </div>
            <p className="text-base text-slate-500 mt-2 font-medium">{dateHint}</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-4 z-10 shrink-0">
          <button onClick={handleReset} className="flex-1 bg-slate-100 text-slate-700 font-semibold py-4 rounded-2xl text-xl hover:bg-slate-200 transition-colors">
            Reset
          </button>
          <button onClick={handleApply} className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl text-xl hover:bg-slate-800 transition-colors">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};