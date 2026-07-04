import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { api } from '../../../../services/api';
import { toast } from 'sonner';
import { PURCHASE_BILL_STATUS_CFG } from '../utils/constants';
import { PurchaseBillDetailModal } from '../modals/PurchaseBillDetailModal';
import { PurchaseBillFilterPanel } from '../modals/PurchaseBillFilterPanel';

const PAGE_SIZE = 20;

/**
 * PurchaseBillsTab
 * Tab B on the Company Detail page — "similar to that of invoices list
 * in invoices tab we made" (per spec), scoped to one supplier.
 */
export const PurchaseBillsTab = ({ company, onAddBill, refreshKey }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [filters, setFilters] = useState({ status: 'All', sort: 'newest' });

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await api.getPurchaseBillsBySupplier(company._id);
      setBills(res.data || []);
    } catch {
      toast.error('Failed to load purchase bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBills(); }, [company._id, refreshKey]);

  const filtered = useMemo(() => {
    let list = [...bills];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(b => b.invoiceNumber.toLowerCase().includes(s));
    }
    if (filters.status && filters.status !== 'All') list = list.filter(b => b.paymentStatus === filters.status);
    if (filters.from) list = list.filter(b => b.invoiceDate?.split('T')[0] >= filters.from);
    if (filters.to) list = list.filter(b => b.invoiceDate?.split('T')[0] <= filters.to);

    const sort = filters.sort || 'newest';
    if (sort === 'newest') list.sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate));
    else if (sort === 'highest') list.sort((a, b) => (b.dueAmount || 0) - (a.dueAmount || 0));
    else if (sort === 'oldest_overdue') list.sort((a, b) => new Date(a.invoiceDate) - new Date(b.invoiceDate));
    return list;
  }, [bills, search, filters]);

  const activeFilterCount = ['status', 'from', 'to'].filter(k => {
    if (k === 'status') return filters.status && filters.status !== 'All';
    return !!filters[k];
  }).length;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toIndianDate = (d) => {
    if (!d) return '';
    const [y, m, day] = d.split('T')[0].split('-');
    return `${day}/${m}/${y}`;
  };

  if (loading) {
    return <p className="py-10 text-center text-slate-500 text-base">Loading purchase bills…</p>;
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onAddBill}
        className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl text-base"
      >
        + Add Purchase Bill
      </button>

      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search invoice number..."
            className="flex-1 text-base text-slate-700 placeholder-slate-400 bg-transparent outline-none"
          />
          {search && <button onClick={() => setSearch('')}><X size={16} className="text-slate-400" /></button>}
        </div>
        <button
          onClick={() => setShowFilter(true)}
          className={`relative w-11 h-11 flex items-center justify-center rounded-xl border transition-colors
            ${showFilter ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600'}`}
        >
          <SlidersHorizontal size={20} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <p className="text-slate-500 text-base px-1">
        {filtered.length} bill{filtered.length !== 1 ? 's' : ''} found
        {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
      </p>

      <div className="space-y-3">
        {pageData.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-base bg-white rounded-2xl border border-slate-200">
            No purchase bills found
          </div>
        ) : (
          pageData.map((bill) => {
            const { pill, label } = PURCHASE_BILL_STATUS_CFG[bill.paymentStatus] || { pill: 'bg-slate-100', label: bill.paymentStatus };
            return (
              <button
                key={bill._id}
                onClick={() => setSelectedBill(bill)}
                className="w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <p className="font-mono font-bold text-slate-800 text-base">{bill.invoiceNumber}</p>
                  <span className="text-slate-900 font-bold text-base">₹{Math.round(bill.netAmount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm">{bill.items?.length || 0} items · {toIndianDate(bill.invoiceDate)}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pill}`}>{label}</span>
                </div>
                {bill.dueAmount > 0 && (
                  <p className="text-amber-600 text-sm font-semibold">₹{Math.round(bill.dueAmount).toLocaleString('en-IN')} due</p>
                )}
              </button>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-1.5 text-base font-semibold text-slate-600 disabled:text-slate-300 px-4 py-2 bg-white border border-slate-200 rounded-xl">
            <ChevronLeft size={18} /> Prev
          </button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="flex items-center gap-1.5 text-base font-semibold text-slate-600 disabled:text-slate-300 px-4 py-2 bg-white border border-slate-200 rounded-xl">
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}

      {selectedBill && (
        <PurchaseBillDetailModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onCancelled={fetchBills}
        />
      )}

      {showFilter && (
        <PurchaseBillFilterPanel
          onClose={() => setShowFilter(false)}
          onApply={(newFilters) => { setFilters(newFilters); setPage(1); }}
          initialFilters={filters}
        />
      )}
    </div>
  );
};