// BillingPage/components/InvoicesTab.jsx
import { useState, useMemo, useEffect } from 'react';
import {
  Plus, Search, SlidersHorizontal, MapPin, Users, FileDown,
  ChevronLeft, ChevronRight, RotateCcw, X, ChevronUp
} from 'lucide-react';
import { STATUS_CFG } from '../utils/constants';
import { InvoiceDetailModal } from '../../../../components/invoices/InvoiceDetailModal';
import { InvoiceFilterPanel } from '../modals/InvoiceFilterPanel';
import { api } from '../../../../services/api';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { InvoiceCard } from '../../../../components/invoices/InvoiceCard';

const STORAGE_KEY = 'invoicesTabState';
const FILTERABLE_KEYS = ['status', 'line', 'city', 'party', 'from', 'to'];

export const InvoicesTab = ({ onGST, onMakeInvoice }) => {
  const loadState = () => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; }
  };
  const saved = loadState();

  const [search, setSearch] = useState(saved?.search ?? '');
  const [page, setPage] = useState(saved?.page ?? 1);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedInv, setSelectedInv] = useState(null);

  // Modal Filters State
  const [filters, setFilters] = useState(saved?.filters ?? { status: 'All', sort: 'newest' });

  // Real invoice data from API
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeFilterCount = FILTERABLE_KEYS.filter(k => {
    if (k === 'status') return filters[k] && filters[k] !== 'All';
    return !!filters[k];
  }).length;

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await api.getSalesInvoices();
        setInvoices(res.data || []);
      } catch (err) {
        toast.error('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      search, page, filters,
    }));
  }, [search, page, filters]);

  const normalized = useMemo(() => {
    return invoices.map(inv => {
      let overdue = 0;
      if (inv.dueDate && inv.paymentStatus !== 'PAID') {
        const diff = new Date() - new Date(inv.dueDate);
        if (diff > 0) overdue = Math.floor(diff / (1000 * 60 * 60 * 24));
      }

      return {
        _id: inv._id,
        id: inv.invoiceNumber,
        client: inv.clientName,
        line: inv.clientObjectId?.line || '',
        city: inv.clientObjectId?.city || '',
        area: inv.clientBillingAddress || '',
        items: inv.items?.length || 0,
        amount: Number(inv.netAmount ?? inv.totalPayable ?? inv.totalGrossAmount ?? 0),
        due: Number(inv.dueAmount ?? inv.totalPayable ?? 0),
        date: inv.invoiceDate ? inv.invoiceDate.split('T')[0] : '',
        dueDate: inv.dueDate ? inv.dueDate.split('T')[0] : '',
        status: inv.paymentStatus,
        overdueDays: overdue,
        billType: inv.billType,
        discount: inv.globalDiscountAmount || 0,
        discountPercent: inv.globalDiscountPercent || 0,
        gstin: inv.clientGSTIN || '',
        drugLicense: inv.clientDrugLicense || '',
        products: inv.items,
        previousOutstanding: inv.previousOutstanding || 0,
        previousOutstandingDate: inv.previousOutstandingDate || null,
        totalPayable: inv.totalPayable || 0,
      };
    });
  }, [invoices]);

  const filtered = useMemo(() => {
    let list = [...normalized];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(inv =>
        inv.client.toLowerCase().includes(s) ||
        inv.id.toLowerCase().includes(s) ||
        inv.id.slice(-3).includes(s)
      );
    }

    if (filters.status && filters.status !== 'All') list = list.filter(inv => inv.status === filters.status);
    if (filters.line) list = list.filter(inv => inv.line === filters.line);
    if (filters.city) list = list.filter(inv => inv.city === filters.city);
    if (filters.party) list = list.filter(inv => inv.client === filters.party);
    if (filters.from) list = list.filter(inv => inv.date >= filters.from);
    if (filters.to) list = list.filter(inv => inv.date <= filters.to);

    const sort = filters.sort || 'newest';
    if (sort === 'newest') list.sort((a, b) => b.date.localeCompare(a.date));
    else if (sort === 'highest') list.sort((a, b) => b.due - a.due);
    else if (sort === 'oldest_overdue') list.sort((a, b) => b.overdueDays - a.overdueDays);
    return list;
  }, [search, filters, normalized]);

  const handleClearFilters = () => {
    setFilters({ sort: filters.sort || 'newest', status: 'All' });
    setPage(1);
  };

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const todayStr = new Date().toISOString().split('T')[0];

  const todaySales = useMemo(() => {
    const todayList = normalized.filter(inv => inv.date === todayStr);
    return todayList.reduce((sum, inv) => sum + inv.amount, 0);
  }, [normalized, todayStr]);

  const outstandingBalance = useMemo(() => {
    return normalized
      .filter(inv => inv.status === 'UNPAID' || inv.status === 'PARTIALLY_PAID')
      .reduce((sum, inv) => sum + inv.due, 0);
  }, [normalized]);

  const formatCurrency = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  if (loading) {
    return <div className="py-10 text-center text-slate-500"><Spinner /> Loading invoices…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={onMakeInvoice}
          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 text-white font-semibold py-3 rounded-xl text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
          <Plus size={18} /> Make Invoice
        </button>
        <button onClick={onGST}
          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl text-base transition-all duration-200 hover:bg-slate-200">
          📊 GST Summary
        </button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Invoice ID, party, last 3 digits..."
            className="flex-1 text-base text-slate-700 placeholder-slate-400 bg-transparent outline-none"
          />
          {search && <button onClick={() => setSearch('')}><X size={16} className="text-slate-400" /></button>}
        </div>
        <button onClick={() => setShowFilter(true)}
          className={`relative w-11 h-11 flex items-center justify-center rounded-xl border transition-colors
            ${showFilter ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>
          <SlidersHorizontal size={20} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-400">Filtered</span>
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 bg-slate-100 text-slate-600 text-sm font-semibold px-2.5 py-1 rounded-full hover:bg-slate-200"
          >
            Clear all <X size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
          <p className="text-2xl font-black text-blue-600">{formatCurrency(todaySales)}</p>
          <p className="text-blue-600 text-base font-medium">Today's Sales</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3">
          <p className="text-2xl font-black text-orange-600">{formatCurrency(outstandingBalance)}</p>
          <p className="text-orange-600 text-base font-medium">Outstanding</p>
        </div>
      </div>

      <p className="text-slate-500 text-base px-1">
        {filtered.length} invoice{filtered.length !== 1 ? 's' : ''} found
        {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
      </p>

      <div className="space-y-5">
        {pageData.length === 0 ? (
          <div className="py-12 text-center ...">No invoices found</div>
        ) : (
          pageData.map(inv => (
            <InvoiceCard
              key={inv._id}
              invoice={inv}
              onClick={() => setSelectedInv(inv)}
            />
          ))
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

      <button className="w-full flex items-center justify-center gap-2 text-slate-600 text-base font-semibold py-3 border border-dashed border-slate-300 rounded-2xl">
        <RotateCcw size={16} /> Load Invoices Older Than 4 Months
      </button>

      {selectedInv && <InvoiceDetailModal invoice={selectedInv} onClose={() => setSelectedInv(null)} />}

      {showFilter && (
        <InvoiceFilterPanel
          onClose={() => setShowFilter(false)}
          onApply={(newFilters) => { setFilters(newFilters); setPage(1); }}
          initialFilters={filters}
        />
      )}
    </div>
  );
};