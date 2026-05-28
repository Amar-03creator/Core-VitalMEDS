import { useState } from 'react';
import { AGING, LINES, BUCKET_CFG } from './utils/constants';
import { LedgerDialog } from './modals/LedgerDialog';

export const AgingTab = () => {
  const [sort,    setSort]    = useState('days');
  const [lineF,   setLineF]   = useState('');
  const [bucketF, setBucketF] = useState('');
  const [ledger,  setLedger]  = useState(null);

  const sorted = [...AGING]
    .filter(a => a.outstanding > 0)
    .filter(a => !lineF   || a.line === lineF)
    .filter(a => !bucketF || a.bucket === bucketF)
    .sort((a, b) => sort === 'days' ? b.days - a.days : b.outstanding - a.outstanding);

  const totalOutstanding = sorted.reduce((s, a) => s + a.outstanding, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900 rounded-2xl p-3.5">
          <p className="text-white text-2xl font-black">₹{(totalOutstanding/1000).toFixed(0)}K</p>
          <p className="text-slate-400 text-sm">Total Outstanding</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5">
          <p className="text-red-700 text-2xl font-black">
            {sorted.filter(a => a.bucket === 'Critical').length}
          </p>
          <p className="text-red-600 text-sm">Critical Parties</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none">
          <option value="days">Oldest Overdue</option>
          <option value="amount">Highest Amount</option>
        </select>
        <select value={lineF} onChange={e => setLineF(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none">
          <option value="">All Lines</option>
          {LINES.map(l => <option key={l.name}>{l.name}</option>)}
        </select>
      </div>

      {lineF && (
        <button className="w-full flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-xl">
          🖨️ Print All Ledgers — {lineF}
        </button>
      )}

      <div className="space-y-2">
        {sorted.map(a => {
          const { pill } = BUCKET_CFG[a.bucket];
          return (
            <div key={a.client} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <button onClick={() => setLedger(a)} className="text-slate-900 font-semibold text-base text-left hover:text-emerald-600 transition-colors">
                    {a.client}
                  </button>
                  <p className="text-slate-500 text-sm">{a.line}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${pill}`}>{a.bucket}</span>
                    {a.days > 0 && <span className="text-slate-600 text-sm">{a.days}d overdue</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-slate-900 font-bold text-base">₹{a.outstanding.toLocaleString()}</p>
                  <button onClick={() => setLedger(a)} className="text-emerald-600 text-sm font-semibold">View Ledger</button>
                </div>
              </div>
              {a.bucket !== 'Current' && (
                <div className="px-4 pb-3">
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Dear ${a.client}, your outstanding balance of ₹${a.outstanding.toLocaleString()} for bills older than ${a.days} days is pending. Kindly clear the dues. - Mila Agencies.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 py-2 rounded-xl">
                    📱 Send WhatsApp Reminder
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {ledger && <LedgerDialog party={ledger} onClose={() => setLedger(null)} />}
    </div>
  );
};