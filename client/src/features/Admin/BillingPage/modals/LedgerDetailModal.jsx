import { X, Printer, Download } from 'lucide-react';
import { useScrollLock } from '../../../../hooks/useBackHandler';
import { downloadLedgerPDF, printLedgerPDF } from '../pdf/ledger';

export const LedgerDetailModal = ({ ledger, dateFrom, dateTo, onClose }) => {
  useScrollLock(true);
  
  if (!ledger) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-3xl flex flex-col overflow-hidden shadow-2xl" style={{ height: '90dvh' }}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-5 border-b border-slate-100 z-10 shrink-0">
          <div>
            <p className="font-bold text-slate-900 text-2xl">{ledger.party}</p>
            <p className="text-slate-500 text-base font-medium">{ledger.line || ledger.city} · {dateFrom} to {dateTo}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X size={28} className="text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-[80px_1fr_90px_90px_110px_60px] bg-slate-900 px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide gap-2 items-center">
              <span>Date</span><span>Particulars</span>
              <span className="text-right">Dr (₹)</span><span className="text-right">Cr (₹)</span>
              <span className="text-right">Balance</span><span className="text-right">Days</span>
            </div>
            
            {ledger.rows.map((row, i) => (
              <div key={i} className={`grid grid-cols-[80px_1fr_90px_90px_110px_60px] px-4 py-3 border-t border-slate-100 text-base gap-2 items-center
                ${row.isOpening ? 'bg-amber-50' : row.isClosing ? 'bg-slate-900' : ''}`}>
                <span className={`text-sm font-medium ${row.isClosing ? 'text-slate-400' : 'text-slate-500'}`}>
                  {typeof row.date === 'string' ? row.date.slice(0, 10) : new Date(row.date).toISOString().slice(0, 10)}
                </span>
                <div className="min-w-0 pr-2">
                  <p className={`font-bold truncate ${row.isOpening ? 'text-amber-800' : row.isClosing ? 'text-white' : 'text-slate-800'}`}>{row.type}</p>
                  <p className="text-slate-400 font-mono text-xs truncate">{row.voucher}</p>
                </div>
                <span className="text-right font-bold text-red-600">{row.dr > 0 ? row.dr.toLocaleString('en-IN') : ''}</span>
                <span className="text-right font-bold text-emerald-600">{row.cr > 0 ? row.cr.toLocaleString('en-IN') : ''}</span>
                <span className={`text-right font-black ${row.isOpening ? 'text-amber-700' : row.isClosing ? 'text-emerald-400' : 'text-slate-900'}`}>
                  {Math.abs(row.balance).toLocaleString('en-IN')} {row.balance >= 0 ? 'Dr' : 'Cr'}
                </span>
                <span className="text-right text-sm font-medium text-slate-500">{row.days ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-4 z-10 shrink-0">
          <button onClick={() => printLedgerPDF([ledger], dateFrom, dateTo)} 
            className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 font-bold py-4 rounded-2xl text-xl hover:bg-slate-50">
            <Printer size={22} /> Print
          </button>
          <button onClick={() => downloadLedgerPDF([ledger], dateFrom, dateTo)} 
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-4 rounded-2xl text-xl hover:bg-slate-800">
            <Download size={22} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};