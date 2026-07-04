// client/src/features/Admin/BillingPage/components/LedgersTab.jsx
import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, ChevronDown, Download, Printer, XIcon } from 'lucide-react';
import { api } from '../../../../services/api';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { LedgerFilterPanel } from '../modals/LedgerFilterPanel';
import { downloadLedgerPDF, printLedgerPDF } from '@/components/ledgers/ledgerPDF';
import { WhatsAppReminder } from '@/components/ledgers/WhatsAppReminder';
import { LedgerTable } from '@/components/ledgers/LedgerTable';
import { LedgerActions } from '@/components/ledgers/LedgerActions';

const STORAGE_KEY = 'ledgersTabState';

export const LedgersTab = () => {
  const loadState = () => { try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; } };
  const saved = loadState();

  const [search, setSearch] = useState(saved?.search ?? '');
  const [showFilter, setShowFilter] = useState(false);
  const [expanded, setExpanded] = useState(saved?.expanded ?? null);
  
  const defaultFrom = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
  const defaultTo = new Date().toISOString().split('T')[0];
  
  const [filters, setFilters] = useState(saved?.filters ?? { scope: 'all', from: defaultFrom, to: defaultTo });

  const [rawLedgers, setRawLedgers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ search, filters, expanded }));
  }, [search, filters, expanded]);

  const fetchLedgers = async (currentFilters) => {
    setLoading(true);
    try {
      const res = await api.getLedger(currentFilters);
      setRawLedgers(res.data || []);
    } catch (err) {
      toast.error('Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgers(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const processedLedgers = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return rawLedgers.map(ledger => {
      const closingRow = ledger.rows[ledger.rows.length - 1];
      const outstanding = closingRow ? closingRow.balance : 0;

      let days = 0;
      if (outstanding > 0) {
        let remainingToAllocate = outstanding;
        for (let i = ledger.rows.length - 1; i >= 0; i--) {
          const row = ledger.rows[i];
          if (row.dr > 0 && row.type.includes('Sales')) {
            days = Math.max(days, row.days || 0);
            remainingToAllocate -= row.dr;
            if (remainingToAllocate <= 0) break;
          }
        }
      }

      let bucket = 'Current';
      if (outstanding <= 0) bucket = 'Cleared';
      else if (days > 90) bucket = 'Critical';
      else if (days > 60) bucket = '60-90 Days';
      else if (days > 30) bucket = '30-60 Days';

      const recentPayments = ledger.rows
        .filter(r => r.cr > 0 && r.type.includes('Payment') && new Date(r.date) >= thirtyDaysAgo)
        .reduce((sum, r) => sum + r.cr, 0);

      return { ...ledger, outstanding, days, bucket, recentPayments };
    });
  }, [rawLedgers]);

  const totalOutstanding = processedLedgers.reduce((sum, l) => sum + (l.outstanding > 0 ? l.outstanding : 0), 0);
  const criticalCount = processedLedgers.filter(l => l.bucket === 'Critical').length;
  const recentPaymentsTotal = processedLedgers.reduce((sum, l) => sum + l.recentPayments, 0);

  const filteredList = useMemo(() => {
    if (!search) return processedLedgers;
    const s = search.toLowerCase();
    return processedLedgers.filter(l => 
      l.party.toLowerCase().includes(s) || 
      (l.line || '').toLowerCase().includes(s) || 
      (l.city || '').toLowerCase().includes(s)
    );
  }, [search, processedLedgers]);

  const sortedList = [...filteredList].sort((a, b) => b.outstanding - a.outstanding);

  const getFilterLabel = () => {
    if (filters.scope === 'party') return '1 Party';
    if (filters.scope === 'line') return `${filters.line}`;
    if (filters.scope === 'city') return `${filters.city}`;
    return 'All Parties';
  };

  const handleClearFilters = () => {
    const cleared = { scope: 'all', from: defaultFrom, to: defaultTo };
    setFilters(cleared);
    fetchLedgers(cleared);
  };

  const isFiltered = filters.scope !== 'all' || filters.from !== defaultFrom || filters.to !== defaultTo;

  if (loading) return <div className="py-10 text-center text-slate-500 text-sm"><Spinner /> Loading Ledgers…</div>;

  return (
    <div className="space-y-4">
      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-900 rounded-2xl p-3 flex flex-col justify-center">
          <p className="text-white text-2xl font-black">₹{(totalOutstanding/1000).toFixed(0)}K</p>
          <p className="text-slate-400 text-xs font-medium mt-0.5">Total Outstanding</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex flex-col justify-center">
          <p className="text-red-700 text-2xl font-black">{criticalCount}</p>
          <p className="text-red-600 text-xs font-medium mt-0.5">Critical Parties</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex flex-col justify-center">
          <p className="text-emerald-700 text-2xl font-black">₹{(recentPaymentsTotal/1000).toFixed(0)}K</p>
          <p className="text-emerald-600 text-xs font-medium mt-0.5">Collected (30d)</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search party, line, city..."
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilter(true)}
          className="relative shrink-0 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-slate-50"
        >
          <SlidersHorizontal size={16} /> Filter
          {isFiltered && (
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              !
            </span>
          )}
        </button>
      </div>

      {/* BIG BULK ACTION BUTTONS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-slate-500 text-xs font-medium">Statement For: <span className="font-bold text-slate-700">{getFilterLabel()}</span></p>
          {isFiltered && (
            <button onClick={handleClearFilters} className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
              Clear filters <XIcon size={12} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
           <button 
             onClick={() => printLedgerPDF(processedLedgers, filters.from, filters.to)} 
             className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2.5 rounded-xl transition-colors text-sm">
             <Printer size={16}/> Print All ({processedLedgers.length})
           </button>
           <button 
             onClick={() => downloadLedgerPDF(processedLedgers, filters.from, filters.to)} 
             className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
             <Download size={16}/> Download All ({processedLedgers.length})
           </button>
        </div>
      </div>

      {/* Main Party List (Accordion Style) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {sortedList.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">No ledgers found for selected filters.</div>
        ) : (
          sortedList.map(a => {
            const isCritical = a.bucket === 'Critical';
            const isCleared = a.bucket === 'Cleared';
            const isExpanded = expanded === a.partyId;
            
            return (
              <div key={a.partyId}>
                {/* Accordion Header */}
                <button 
                  onClick={() => setExpanded(isExpanded ? null : a.partyId)} 
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 font-semibold text-base truncate">{a.party}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{a.line || a.city}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                        ${isCritical ? 'bg-red-100 text-red-700' : isCleared ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {a.bucket}
                      </span>
                      {a.days > 0 && <span className="text-slate-600 font-semibold text-xs">{a.days}d overdue</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-base ${isCleared ? 'text-emerald-500' : 'text-slate-900'}`}>
                      ₹{a.outstanding > 0 ? a.outstanding.toLocaleString('en-IN') : '0'}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-emerald-600 text-xs font-semibold mt-1">
                      View Ledger <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>

                {/* Accordion Body (Expanded Ledger) */}
                {isExpanded && (
                  <div className="px-3 pb-4 pt-1 bg-slate-50 border-t border-slate-100">

                    {/* WhatsApp reminder – shared component */}
                    <div className="mb-3 mt-2">
                      <WhatsAppReminder
                        partyName={a.party}
                        outstanding={a.outstanding}
                        days={a.days}
                      />
                    </div>

                    {/* Ledger table – shared component */}
                    <LedgerTable rows={a.rows} />

                    {/* Print / Download actions – shared component */}
                    <div className="mt-3">
                      <LedgerActions
                        onPrint={() => printLedgerPDF([a], filters.from, filters.to)}
                        onDownload={() => downloadLedgerPDF([a], filters.from, filters.to)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showFilter && (
        <LedgerFilterPanel
          initialFilters={filters}
          onClose={() => setShowFilter(false)}
          onApply={(newFilters) => { setFilters(newFilters); fetchLedgers(newFilters); }}
        />
      )}
    </div>
  );
};