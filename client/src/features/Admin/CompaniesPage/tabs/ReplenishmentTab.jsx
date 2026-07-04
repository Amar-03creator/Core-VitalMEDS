import { useState } from 'react';
import { Zap, RefreshCw, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../../services/api';
import { REPLENISH_STRATEGIES } from '../utils/constants';
import { ReplenishmentRow } from '../components/ReplenishmentRow';
import { downloadPurchaseOrderPDF } from '../utils/generatePurchaseOrderPdf';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * ReplenishmentTab
 * Tab D on the Company Detail page. Defaults to suggestions scoped to
 * THIS supplier (companyId = company._id), but lets the admin switch to
 * "All Registered Companies" as the spec describes for the master view.
 */
export const ReplenishmentTab = ({ company, allCompanies = [] }) => {
  const [targetSupplier, setTargetSupplier] = useState(company._id);
  const [strategy, setStrategy] = useState(REPLENISH_STRATEGIES[0]);
  const [seasonMonths, setSeasonMonths] = useState([]);
  const [stockCoverMonths, setStockCoverMonths] = useState(1);
  const [suggestions, setSuggestions] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isSeasonal = strategy === 'Upcoming Season Average';
  const showCompanyColumn = targetSupplier === 'all';

  const toggleMonth = (m) => {
    setSeasonMonths(prev => (prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]));
  };

  const handleGenerate = async () => {
    if (isSeasonal && seasonMonths.length === 0) {
      toast.error('Select at least one season month.');
      return;
    }
    setGenerating(true);
    try {
      const res = await api.generateReplenishmentSuggestions({
        supplierId: targetSupplier,
        strategy,
        seasonMonths,
        stockCoverMonths,
      });
      setSuggestions(res.data || []);
      if ((res.data || []).length === 0) {
        toast.info('No reorder suggestions — current stock covers projected demand.');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleQtyChange = (productId, value) => {
    setSuggestions(prev => prev.map(s => (s.productId === productId ? { ...s, finalQty: value } : s)));
  };

  /* ── Export ───────────────────────────────────────────────────────────
     ★ CHANGED: no longer calls the server (api.exportPurchaseOrders /
     pdfmake) — that endpoint was crashing (pdfmake constructor error) and
     the project's convention is client-side jsPDF generation. This groups
     the suggestion list by supplier and triggers one PDF download per
     supplier directly in the browser, per your "no zip" decision.        */
  const handleExport = () => {
    setExporting(true);
    try {
      const itemsToExport = suggestions
        .map(s => ({ ...s, finalQty: parseInt(s.finalQty, 10) || 0 }))
        .filter(s => s.finalQty > 0);

      if (itemsToExport.length === 0) {
        toast.error('All quantities are zero — nothing to export.');
        return;
      }

      const grouped = new Map(); // companyName -> rows[]
      itemsToExport.forEach(item => {
        const key = item.companyName || company.companyName;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(item);
      });

      grouped.forEach((rows, companyName) => {
        downloadPurchaseOrderPDF(companyName, rows);
      });

      toast.success(
        grouped.size > 1
          ? `${grouped.size} purchase order PDFs downloaded.`
          : 'Purchase order PDF downloaded.'
      );
    } catch (err) {
      toast.error(err.message || 'Failed to generate purchase order PDF.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-slate-900 rounded-2xl p-4 space-y-3">
        <h3 className="text-white font-semibold text-lg flex items-center gap-2">
          <Zap size={17} className="text-emerald-400" /> Smart Replenishment
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-base block mb-1.5">Target Supplier</label>
            <select
              value={targetSupplier}
              onChange={(e) => setTargetSupplier(e.target.value)}
              className="w-full text-lg text-slate-800 bg-white rounded-xl px-3 py-2.5 outline-none"
            >
              <option value={company._id}>{company.companyName} (this supplier)</option>
              <option value="all">All Registered Companies</option>
              {allCompanies.filter(c => c._id !== company._id).map(c => (
                <option key={c._id} value={c._id}>{c.companyName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 text-base block mb-1.5">Forecast Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full text-lg text-slate-800 bg-white rounded-xl px-3 py-2.5 outline-none"
            >
              {REPLENISH_STRATEGIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {isSeasonal && (
            <div>
              <label className="text-slate-400 text-base block mb-1.5">Target Season Months</label>
              <div className="flex flex-wrap gap-2">
                {MONTH_NAMES.map((name, idx) => {
                  const monthNum = idx + 1;
                  const active = seasonMonths.includes(monthNum);
                  return (
                    <button
                      key={name}
                      onClick={() => toggleMonth(monthNum)}
                      className={`text-base font-semibold px-3 py-1.5 rounded-lg ${
                        active ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-400 text-base block mb-1.5">Stock Cover Needed (months)</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={stockCoverMonths}
              onChange={(e) => setStockCoverMonths(e.target.value)}
              className="w-full text-lg text-slate-800 bg-white rounded-xl px-3 py-2.5 outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-lg disabled:opacity-60"
        >
          <RefreshCw size={17} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generating…' : 'Generate Suggestion List'}
        </button>
      </div>

      {suggestions && suggestions.length > 0 && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 flex gap-2">
            <AlertTriangle size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <p className="text-blue-700 text-base">
              Suggestions based on {strategy.toLowerCase()} + current stock levels.
            </p>
          </div>

          {suggestions.map((s) => (
            <ReplenishmentRow
              key={s.productId}
              suggestion={s}
              onQtyChange={handleQtyChange}
              showCompany={showCompanyColumn}
            />
          ))}

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-2xl text-lg disabled:opacity-60"
          >
            <Download size={17} /> {exporting ? 'Generating PDFs…' : 'Download Purchase Order PDF(s)'}
          </button>
          <p className="text-slate-400 text-base text-center">One PDF downloads per supplier</p>
        </>
      )}

      {suggestions && suggestions.length === 0 && (
        <p className="text-center text-slate-400 text-lg py-6">No reorder suggestions right now.</p>
      )}
    </div>
  );
};