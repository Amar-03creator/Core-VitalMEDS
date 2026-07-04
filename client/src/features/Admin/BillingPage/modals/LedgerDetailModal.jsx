import { X, Printer, Download } from 'lucide-react';
import { useScrollLock } from '../../../../hooks/useBackHandler';
import { downloadLedgerPDF, printLedgerPDF } from '@/components/ledgers/ledgerPDF';
import { LedgerTable } from '@/components/ledgers/LedgerTable';

export const LedgerDetailModal = ({ ledger, dateFrom, dateTo, onClose }) => {
  useScrollLock(true);
  
  if (!ledger) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-3xl flex flex-col overflow-hidden shadow-2xl" style={{ height: '90dvh' }}>
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-5 border-b border-slate-100 z-10 shrink-0">
          <div>
            <p className="font-bold text-slate-900 text-2xl">{ledger.party}</p>
            <p className="text-slate-500 text-base font-medium">
              {ledger.line || ledger.city} · {dateFrom} to {dateTo}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X size={28} className="text-slate-400" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <LedgerTable rows={ledger.rows} variant="full" />
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-4 z-10 shrink-0">
          <button
            onClick={() => printLedgerPDF([ledger], dateFrom, dateTo)}
            className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 font-bold py-4 rounded-2xl text-xl hover:bg-slate-50"
          >
            <Printer size={22} /> Print
          </button>
          <button
            onClick={() => downloadLedgerPDF([ledger], dateFrom, dateTo)}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-4 rounded-2xl text-xl hover:bg-slate-800"
          >
            <Download size={22} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};