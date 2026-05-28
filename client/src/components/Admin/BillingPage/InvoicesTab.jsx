// InvoicesTab.jsx (improved)
import { useState, useMemo } from 'react';
import { Plus, Search, Filter, MapPin, Users, FileDown, ChevronLeft, ChevronRight, RotateCcw, X, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { INVOICES, LINES, ALL_CLIENTS, STATUS_CFG } from './utils/constants';
import { InvoiceDetailModal } from './modals/InvoiceDetailModal';

export const InvoicesTab = ({ onGST, onMakeInvoice }) => {
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('All');
  const [lineF, setLineF] = useState('');
  const [partyF, setPartyF] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedInv, setSelectedInv] = useState(null);

  const partiesForLine = lineF ? (LINES.find(l => l.name === lineF)?.parties || []) : ALL_CLIENTS;

  const handleLineChange = (val) => {
    setLineF(val);
    setPartyF('');
    setPage(1);
  };

  const filtered = useMemo(() => {
    let list = [...INVOICES];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(inv =>
        inv.client.toLowerCase().includes(s) ||
        inv.id.toLowerCase().includes(s) ||
        inv.id.slice(-3).includes(s)
      );
    }
    if (statusF !== 'All') list = list.filter(inv => inv.status === statusF);
    if (lineF) list = list.filter(inv => inv.line === lineF);
    if (partyF) list = list.filter(inv => inv.client === partyF);
    if (dateFrom) list = list.filter(inv => inv.date >= dateFrom);
    if (dateTo) list = list.filter(inv => inv.date <= dateTo);
    if (sort === 'newest') list.sort((a, b) => b.date.localeCompare(a.date));
    if (sort === 'highest') list.sort((a, b) => b.due - a.due);
    if (sort === 'oldest_overdue') list.sort((a, b) => b.overdueDays - a.overdueDays);
    return list;
  }, [search, statusF, lineF, partyF, dateFrom, dateTo, sort]);

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalUnpaid = INVOICES.reduce((s, i) => s + i.due, 0);
  const totalPaid = INVOICES.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
          <p className="text-xl font-black text-red-600">₹{(totalUnpaid/1000).toFixed(0)}K</p>
          <p className="text-red-600 text-sm font-medium">Total Unpaid</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
          <p className="text-xl font-black text-slate-800">{INVOICES.length}</p>
          <p className="text-slate-600 text-sm font-medium">Bills Generated</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
          <p className="text-xl font-black text-emerald-600">₹{(totalPaid/1000).toFixed(0)}K</p>
          <p className="text-emerald-600 text-sm font-medium">Collected</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button onClick={onMakeInvoice} className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
          <Plus size={16} /> Make Invoice
        </button>
        <button onClick={onGST} className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-all duration-200 hover:bg-slate-200">
          📊 GST Summary
        </button>
      </div>

      {/* Search & filter */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Invoice ID, party, last 3 digits..."
            className="flex-1 text-sm text-slate-700 placeholder-slate-400 bg-transparent outline-none" />
          {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-400" /></button>}
        </div>
        <button onClick={() => setShowFilters(f => !f)}
          className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-colors
            ${showFilters ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>
          <Filter size={18} />
        </button>
      </div>

      {/* Filters panel (unchanged) */}
      {showFilters && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 space-y-3">
          {/* ... same as before ... */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Status</p>
              <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }}
                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-700 outline-none">
                <option value="All">All</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIALLY_PAID">Partial</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Sort</p>
              <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-700 outline-none">
                <option value="newest">Newest First</option>
                <option value="highest">Highest Due</option>
                <option value="oldest_overdue">Oldest Overdue</option>
              </select>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <MapPin size={12} /> Collection Line
            </p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => handleLineChange('')}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all
                  ${!lineF ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>
                All Lines
              </button>
              {LINES.map(l => (
                <button key={l.name} onClick={() => handleLineChange(l.name)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all
                    ${lineF === l.name ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>
                  {l.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <Users size={12} /> Party {lineF && <span className="text-emerald-600 text-xs">({lineF})</span>}
            </p>
            <select value={partyF} onChange={e => { setPartyF(e.target.value); setPage(1); }}
              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-700 outline-none">
              <option value="">All {lineF ? `${lineF} Parties` : 'Parties'}</option>
              {partiesForLine.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">From Date</p>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-700 outline-none" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">To Date</p>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-700 outline-none" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setStatusF('All'); setPartyF(''); setLineF(''); setDateFrom(''); setDateTo(''); setSort('newest'); setSearch(''); setPage(1); }}
              className="flex-1 text-sm text-slate-500 font-semibold py-2 rounded-xl bg-white border border-slate-200">
              Clear All
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 text-sm text-slate-700 font-semibold py-2 rounded-xl bg-white border border-slate-200">
              <FileDown size={14} /> Bulk Download
            </button>
          </div>
        </div>
      )}

      <p className="text-slate-500 text-sm px-1">
        {filtered.length} invoice{filtered.length !== 1 ? 's' : ''} found
        {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
      </p>

      {/* Improved invoice cards - each invoice as a separate card */}
      <div className="space-y-3">
        {pageData.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">No invoices found</div>
        ) : (
          pageData.map(inv => {
            const { pill, label, dot } = STATUS_CFG[inv.status];
            const discountApplied = inv.discount || 0;
            return (
              <button
                key={inv.id}
                onClick={() => setSelectedInv(inv)}
                className="w-full text-left bg-linear-to-br from-white via-slate-50/50 to-slate-100/30 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] p-4 flex flex-col gap-2"
              >
                {/* Header row: invoice number, status, overdue */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-slate-500 font-mono text-xs font-semibold">{inv.id.slice(-9)}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pill}`}>{label}</span>
                    {inv.overdueDays > 0 && (
                      <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-0.5 rounded-full">{inv.overdueDays}d late</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-slate-900 font-bold text-base">₹{inv.amount.toLocaleString()}</p>
                    {inv.due > 0 && <p className="text-red-600 text-sm font-semibold">Due: ₹{inv.due.toLocaleString()}</p>}
                    {inv.due === 0 && <p className="text-emerald-600 text-sm font-semibold">Cleared ✓</p>}
                  </div>
                </div>

                {/* Client & line */}
                <div>
                  <p className="text-slate-800 font-bold text-base">{inv.client}</p>
                  <p className="text-slate-500 text-sm">{inv.line} · {inv.items} items · {inv.date.slice(5).replace('-', ' ')}</p>
                </div>

                {/* Additional info: discount, bill type */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 border-t border-slate-100 pt-2 mt-1">
                  {discountApplied > 0 && <span className="flex items-center gap-1 text-amber-600">💸 Discount: ₹{discountApplied}</span>}
                  {inv.billType === 'Credit' && <span className="flex items-center gap-1 text-blue-600">📋 Credit Bill</span>}
                </div>

                <ChevronRightIcon size={16} className="text-slate-300 absolute right-4 bottom-4" />
              </button>
            );
          })
        )}
      </div>

      {/* Pagination and load older (unchanged) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 disabled:text-slate-300 px-4 py-2 bg-white border border-slate-200 rounded-xl">
            <ChevronLeft size={16} /> Prev
          </button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 disabled:text-slate-300 px-4 py-2 bg-white border border-slate-200 rounded-xl">
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      <button className="w-full flex items-center justify-center gap-2 text-slate-600 text-sm font-semibold py-3 border border-dashed border-slate-300 rounded-2xl">
        <RotateCcw size={14} /> Load Invoices Older Than 4 Months
      </button>

      {selectedInv && <InvoiceDetailModal invoice={selectedInv} onClose={() => setSelectedInv(null)} />}
    </div>
  );
};