// src/features/Client/BillingPage/tabs/LedgerTab.jsx
import { useState, useCallback } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { financeApi } from '../../../../services/api/financeApi';
import { LedgerTable } from '../../../../components/ledgers/LedgerTable';
import { LedgerActions } from '../../../../components/ledgers/LedgerActions';
import { downloadLedgerPDF, printLedgerPDF } from '../../../../components/ledgers/ledgerPDF';

const todayStr = () => new Date().toISOString().split('T')[0];
const monthStartStr = () => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; };

const LedgerTab = ({ client }) => {
  const [from, setFrom] = useState(monthStartStr());
  const [to, setTo] = useState(todayStr());
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async () => {
    if (!client?._id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await financeApi.getLedger({ scope: 'party', partyId: client._id, from, to });
      const data = res.data?.[0];
      setRows(data?.rows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [client, from, to]);

  const handlePrint = () => {
    if (!rows?.length) return;
    printLedgerPDF([{ party: client?.establishmentName || 'You', rows }], from, to);
  };

  const handleDownload = () => {
    if (!rows?.length) return;
    downloadLedgerPDF([{ party: client?.establishmentName || 'You', rows }], from, to);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm sm:text-base font-semibold text-slate-500 block mb-1.5">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base sm:text-lg text-slate-800 outline-none focus:border-emerald-400"
          />
        </div>
        <div>
          <label className="text-sm sm:text-base font-semibold text-slate-500 block mb-1.5">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base sm:text-lg text-slate-800 outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl text-base sm:text-lg disabled:opacity-50"
      >
        {loading ? 'Generating…' : 'Generate Statement'}
      </button>

      {error && <p className="text-red-500 text-base sm:text-lg text-center">{error}</p>}

      {rows && rows.length > 0 && (
        <>
          <LedgerTable rows={rows} />
          <LedgerActions onPrint={handlePrint} onDownload={handleDownload} />
        </>
      )}

      {rows?.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <FileSpreadsheet size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-base sm:text-lg">No transactions in this period</p>
        </div>
      )}
    </div>
  );
};

export default LedgerTab;