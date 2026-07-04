// src/features/Admin/CustomersPage/detail/tabs/LedgerTab.jsx
import { useState, useCallback } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { api } from '../../../../../services/api';
import { LedgerTable } from '@/components/ledgers/LedgerTable';
import { WhatsAppReminder } from '@/components/ledgers/WhatsAppReminder';
import { LedgerActions } from '@/components/ledgers/LedgerActions';
import { downloadLedgerPDF, printLedgerPDF } from '@/components/ledgers/ledgerPDF';

const todayStr      = () => new Date().toISOString().split('T')[0];
const monthStartStr = () => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; };

export const LedgerTab = ({ clientId, client }) => {
  const [from,    setFrom]    = useState(monthStartStr());
  const [to,      setTo]      = useState(todayStr());
  const [rows,    setRows]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await api.getLedger({ scope: 'party', partyId: clientId, from, to });
      const data = res.data?.[0];
      setRows(data?.rows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId, from, to]);

  const closing = rows?.[rows.length - 1];
  const outstanding = closing?.balance ?? 0;
  const daysOld = closing?.days ?? 0;

  const handlePrint = () => {
    if (!rows?.length) return;
    printLedgerPDF([{ party: client?.establishmentName || 'Party', rows }], from, to);
  };

  const handleDownload = () => {
    if (!rows?.length) return;
    downloadLedgerPDF([{ party: client?.establishmentName || 'Party', rows }], from, to);
  };

  return (
    <div className="space-y-4">
      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-semibold text-slate-500 block mb-1.5">From</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-500 block mb-1.5">To</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl text-base disabled:opacity-50"
      >
        {loading ? 'Generating…' : 'Generate Statement'}
      </button>

      {error && <p className="text-red-500 text-base text-center">{error}</p>}

      {rows && rows.length > 0 && (
        <>
          {/* WhatsApp reminder (shared component) */}
          <WhatsAppReminder
            partyName={client?.establishmentName || 'Party'}
            outstanding={outstanding}
            days={daysOld}
          />

          {/* Ledger table */}
          <LedgerTable rows={rows} />

          {/* Print / Download actions (shared component) */}
          <LedgerActions onPrint={handlePrint} onDownload={handleDownload} />
        </>
      )}

      {rows?.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <FileSpreadsheet size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-base">No transactions in this period</p>
        </div>
      )}
    </div>
  );
};