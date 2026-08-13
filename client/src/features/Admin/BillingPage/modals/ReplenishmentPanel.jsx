// src/features/Admin/BillingPage/modals/ReplenishmentPanel.jsx
//
// Same props, state shape, and API contract as your version — this is a visual
// and structural rework only. Two behavioral changes worth knowing about:
//
// 1. Results are now grouped by company automatically, each group gets its own
//    "Download PO" button — no more picking a company from a dropdown first.
// 2. The Generate button disables itself (with an inline hint) when the config
//    is invalid, instead of only complaining via toast after you click.
//
// If you'd rather keep the single flat list + dropdown, say so and I'll revert
// just that part.
//
import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Loader2, RefreshCw, X, PackageSearch, Download, Settings2, ChevronDown,
  TrendingUp, CalendarRange, Check, Minus, Plus, AlertCircle, Sparkles,
} from 'lucide-react';
import { api } from '../../../../services/api';
import { toast } from 'sonner';
import { generatePurchaseOrderPdf } from '../pdf/replenishment/generatePurchaseOrderPdf';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const PRIORITY_CONFIG = {
  Critical: { dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
  High: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  Normal: { dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200' },
};

function defaultSeasonMonths() {
  const now = new Date();
  return [0, 1, 2].map((i) => ((now.getMonth() + i) % 12) + 1);
}

export const ReplenishmentPanel = ({ companies = [] }) => {
  const [useVelocity, setUseVelocity] = useState(true);
  const [useSeasonal, setUseSeasonal] = useState(false);

  const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
  const [velocityMonths, setVelocityMonths] = useState(2);
  const [seasonMonths, setSeasonMonths] = useState(defaultSeasonMonths());
  const [seasonLookbackYears, setSeasonLookbackYears] = useState(3);
  const [stockCoverMonths, setStockCoverMonths] = useState(1);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMonthDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const companyDataMap = useMemo(() => {
    const map = new Map();
    companies.forEach((c) => map.set(c.id, { name: c.companyName, shortCode: c.shortCode || c.companyName }));
    return map;
  }, [companies]);

  // Group flat results by company so each supplier gets its own card + PO export
  const resultsByCompany = useMemo(() => {
    if (!results) return [];
    const map = new Map();
    results.forEach((r) => {
      if (!map.has(r.companyId)) map.set(r.companyId, []);
      map.get(r.companyId).push(r);
    });
    return [...map.entries()].map(([companyId, items]) => ({
      companyId,
      company: companyDataMap.get(companyId) || { name: items[0]?.companyName, shortCode: items[0]?.companyName },
      items,
    }));
  }, [results, companyDataMap]);

  const summary = useMemo(() => {
    if (!results) return null;
    return {
      total: results.length,
      critical: results.filter((r) => r.priority === 'Critical').length,
      high: results.filter((r) => r.priority === 'High').length,
    };
  }, [results]);

  const canGenerate = (useVelocity || useSeasonal) && !(useSeasonal && seasonMonths.length === 0);

  const toggleCompany = (id) => {
    setSelectedCompanyIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const toggleSeasonMonth = (m) => {
    setSeasonMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b)));
  };

  const handleGenerate = async () => {
    if (!useVelocity && !useSeasonal) {
      toast.error('Pick at least one evaluation strategy (Trend or Seasonal).');
      return;
    }
    if (useSeasonal && seasonMonths.length === 0) {
      toast.error('Pick at least one season month.');
      return;
    }

    setLoading(true);
    setResults(null);
    try {
      const payload = {
        companyIds: selectedCompanyIds.length ? selectedCompanyIds : 'all',
        useVelocity,
        useSeasonal,
        velocityMonths: Number(velocityMonths) || 2,
        seasonMonths,
        seasonLookbackYears: Number(seasonLookbackYears) || 3,
        stockCoverMonths: Number(stockCoverMonths) || 1,
      };

      const res = await api.generateReplenishmentSuggestions(payload);
      const suggestionsArray = res?.data?.data || res?.data || res || [];

      setResults(suggestionsArray);
      if (suggestionsArray.length === 0) {
        toast.message('No reorder suggestions — stock looks sufficient.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const updateFinalQty = (productId, qty) => {
    setResults((prev) => prev.map((r) => (
      r.productId === productId ? { ...r, finalQty: Math.max(0, Math.round(Number(qty)) || 0) } : r
    )));
  };

  const removeSuggestion = (productId) => {
    setResults((prev) => prev.filter((r) => r.productId !== productId));
  };

  const handleDownloadPdf = (group) => {
    generatePurchaseOrderPdf(group.company?.name, group.company?.shortCode, group.items);
    toast.success(`Downloaded PO for ${group.company?.shortCode || group.company?.name}`);
  };

  return (
    <div className="space-y-5">
      {/* ── Panel intro ── */}
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Sparkles size={18} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900">Replenishment Suggestions</h2>
          <p className="text-sm text-slate-500">Forecast what to reorder from recent sales, seasonal history, or both.</p>
        </div>
      </div>

      {/* ── Configuration card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center gap-2">
          <Settings2 size={16} className="text-slate-500" />
          <h3 className="text-sm font-bold text-slate-800">Forecast Configuration</h3>
        </div>

        <div className="p-5 space-y-5">
          {/* Strategy toggles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Trend */}
            <div className={`rounded-2xl border p-4 transition-colors ${useVelocity ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setUseVelocity((v) => !v)}
                aria-pressed={useVelocity}
                className="w-full flex items-center justify-between gap-3 text-left"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${useVelocity ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <TrendingUp size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900">Recent Trend</span>
                    <span className="block text-xs text-slate-500">Sales velocity, last few months</span>
                  </span>
                </span>
                <span className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${useVelocity ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${useVelocity ? 'translate-x-4' : 'translate-x-0'}`} />
                </span>
              </button>

              {useVelocity && (
                <div className="mt-4 pt-4 border-t border-emerald-200/60 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Average sales over past months</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={velocityMonths}
                    onChange={(e) => setVelocityMonths(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg px-3 text-sm font-semibold text-slate-900 tabular-nums outline-none transition-shadow"
                  />
                </div>
              )}
            </div>

            {/* Seasonal */}
            <div className={`rounded-2xl border p-4 transition-colors ${useSeasonal ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setUseSeasonal((v) => !v)}
                aria-pressed={useSeasonal}
                className="w-full flex items-center justify-between gap-3 text-left"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${useSeasonal ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <CalendarRange size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900">Seasonal History</span>
                    <span className="block text-xs text-slate-500">Same months, past years</span>
                  </span>
                </span>
                <span className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${useSeasonal ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${useSeasonal ? 'translate-x-4' : 'translate-x-0'}`} />
                </span>
              </button>

              {useSeasonal && (
                <div className="mt-4 pt-4 border-t border-emerald-200/60 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="relative col-span-2 sm:col-span-1" ref={dropdownRef}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Months to average</label>
                    <button
                      type="button"
                      onClick={() => setShowMonthDropdown((v) => !v)}
                      className="w-full h-10 bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 text-sm flex items-center justify-between outline-none"
                    >
                      <span className="truncate text-slate-700 font-semibold">
                        {seasonMonths.length === 0 ? 'Select months' : `${seasonMonths.length} selected`}
                      </span>
                      <ChevronDown size={15} className={`text-slate-400 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {seasonMonths.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {seasonMonths.map((m) => (
                          <span key={m} className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                            {MONTH_LABELS[m - 1]}
                          </span>
                        ))}
                      </div>
                    )}

                    {showMonthDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-20 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between px-0.5 pb-2 mb-2 border-b border-slate-100">
                          <button type="button" onClick={() => setSeasonMonths(ALL_MONTHS)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                            Select all
                          </button>
                          <button type="button" onClick={() => setSeasonMonths([])} className="text-xs font-semibold text-slate-400 hover:text-slate-600">
                            Clear
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {MONTH_LABELS.map((label, idx) => {
                            const m = idx + 1;
                            const isSelected = seasonMonths.includes(m);
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => toggleSeasonMonth(m)}
                                className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Compare past years</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={seasonLookbackYears}
                      onChange={(e) => setSeasonLookbackYears(e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg px-3 text-sm font-semibold text-slate-900 tabular-nums outline-none transition-shadow"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Suppliers + coverage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Target suppliers</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCompanyIds([])}
                  className={`inline-flex items-center gap-1 pl-3 pr-3.5 h-8 rounded-full text-xs font-bold border transition-colors ${selectedCompanyIds.length === 0 ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                >
                  {selectedCompanyIds.length === 0 && <Check size={12} />}
                  All Companies
                </button>
                {companies.map((c) => {
                  const active = selectedCompanyIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCompany(c.id)}
                      className={`inline-flex items-center gap-1 pl-3 pr-3.5 h-8 rounded-full text-xs font-bold border transition-colors ${active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                    >
                      {active && <Check size={12} />}
                      {c.shortCode || c.companyName}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Order coverage</label>
              <div className="flex items-center gap-2 w-full sm:w-40 h-10 bg-white border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-lg px-3 transition-shadow">
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={stockCoverMonths}
                  onChange={(e) => setStockCoverMonths(e.target.value)}
                  className="w-full text-sm font-semibold text-slate-900 tabular-nums outline-none"
                />
                <span className="text-xs text-slate-400 font-medium shrink-0">months</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">How many months of stock the suggested quantity should cover.</p>
            </div>
          </div>

          {!canGenerate && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertCircle size={14} className="shrink-0" />
              {!useVelocity && !useSeasonal
                ? 'Turn on Recent Trend or Seasonal History above to continue.'
                : 'Pick at least one season month.'}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !canGenerate}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {loading ? 'Crunching numbers…' : 'Generate Suggestions'}
          </button>
        </div>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* ── Results ── */}
      {!loading && results !== null && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
          {results.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <PackageSearch className="text-slate-400" size={26} />
              </div>
              <h4 className="text-slate-800 font-bold text-base mb-1">Nothing to reorder</h4>
              <p className="text-slate-500 text-sm">Stock looks sufficient for the criteria you picked.</p>
            </div>
          ) : (
            <>
              {/* summary bar */}
              <div className="flex flex-wrap items-center gap-2 px-1">
                <span className="text-sm font-bold text-slate-800">
                  {summary.total} item{summary.total !== 1 ? 's' : ''} suggested
                </span>
                {summary.critical > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 ring-1 ring-inset ring-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {summary.critical} critical
                  </span>
                )}
                {summary.high > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {summary.high} high
                  </span>
                )}
              </div>

              {/* grouped-by-company cards */}
              {resultsByCompany.map((group) => (
                <div key={group.companyId} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {(group.company?.shortCode || group.company?.name || '?').slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{group.company?.name || 'Unknown company'}</p>
                        <p className="text-xs text-slate-500">{group.items.length} item{group.items.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(group)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shrink-0"
                    >
                      <Download size={13} /> Download PO
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {group.items.map((r) => {
                      const pc = PRIORITY_CONFIG[r.priority] || PRIORITY_CONFIG.Normal;
                      return (
                        <div key={r.productId} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pc.dot}`} />
                              <p className="text-slate-900 font-bold text-sm truncate">{r.productName}</p>
                              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${pc.chip}`}>{r.priority}</span>
                            </div>
                            <p className="text-xs text-slate-500 tabular-nums">
                              Stock: {r.currentStock}
                              <span className="mx-1.5 text-slate-300">·</span>
                              Avg/mo: {r.avgMonthlyDemand}
                            </p>
                            {r.basis && <p className="text-xs text-slate-400 mt-0.5">{r.basis}</p>}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
                              <button
                                type="button"
                                aria-label={`Decrease quantity for ${r.productName}`}
                                onClick={() => updateFinalQty(r.productId, r.finalQty - 1)}
                                className="w-8 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-50 active:bg-slate-100"
                              >
                                <Minus size={13} />
                              </button>
                              <input
                                type="number"
                                min={0}
                                value={r.finalQty}
                                onChange={(e) => updateFinalQty(r.productId, e.target.value)}
                                className="w-14 h-9 text-center text-sm font-bold text-slate-900 tabular-nums outline-none border-x border-slate-200"
                              />
                              <button
                                type="button"
                                aria-label={`Increase quantity for ${r.productName}`}
                                onClick={() => updateFinalQty(r.productId, r.finalQty + 1)}
                                className="w-8 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-50 active:bg-slate-100"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                            <button
                              type="button"
                              aria-label={`Remove ${r.productName} from suggestions`}
                              onClick={() => removeSuggestion(r.productId)}
                              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};