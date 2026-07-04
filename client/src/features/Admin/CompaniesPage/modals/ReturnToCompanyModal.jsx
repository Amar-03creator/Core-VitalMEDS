import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../../services/api';
import { useScrollLock } from '../../BillingPage/utils/useModalBackHandler';
import { DEBIT_NOTE_REASONS } from '../utils/constants';

const emptyLine = { batchId: '', productId: '', productName: '', batchNumber: '', availableQty: 0, qtyReturned: '', reason: 'Expired' };

/**
 * ReturnToCompanyModal
 * Admin builds a list of {batch, qty, reason} lines, then submits as one
 * DebitNote. Batches are fetched scoped to this supplier so the admin only
 * sees stock that actually belongs to them.
 */
export const ReturnToCompanyModal = ({ company, onClose, onSaved }) => {
  useScrollLock(true);

  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingBatches(true);
      try {
        // Reuses your real, already-mounted getInventory endpoint (filtered
        // by supplier name, same convention it already uses elsewhere),
        // flattened into a simple batch list by api.getBatchesByCompany.
        const res = await api.getBatchesByCompany(company.companyName);
        if (!cancelled) setBatches(res.data || []);
      } catch {
        if (!cancelled) {
          setBatches([]);
          toast.error('Could not load batches for this supplier.');
        }
      } finally {
        if (!cancelled) setLoadingBatches(false);
      }
    })();
    return () => { cancelled = true; };
  }, [company._id]);

  const updateLine = (idx, patch) => {
    setLines(prev => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const handleBatchSelect = (idx, batchId) => {
    const batch = batches.find(b => b._id === batchId);
    if (!batch) {
      updateLine(idx, { batchId: '', productId: '', productName: '', batchNumber: '', availableQty: 0 });
      return;
    }
    updateLine(idx, {
      batchId: batch._id,
      productId: batch.productId,
      productName: batch.productName,
      batchNumber: batch.batchNumber,
      availableQty: batch.totalStockQuantity,
    });
  };

  const addLine = () => setLines(prev => [...prev, { ...emptyLine }]);
  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx));

  const isValid = lines.every(l => l.batchId && l.qtyReturned > 0 && l.qtyReturned <= l.availableQty);

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error('Please complete every line with a valid quantity (within available stock).');
      return;
    }
    setSaving(true);
    try {
      await api.createDebitNote({
        supplierId: company._id,
        returnDate: new Date().toISOString(),
        itemsToReturn: lines.map(l => ({
          productId: l.productId,
          batchId: l.batchId,
          reason: l.reason,
          qtyReturned: parseInt(l.qtyReturned, 10),
        })),
      });
      toast.success('Debit note created and stock adjusted.');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-2xl flex flex-col" style={{ height: '85dvh' }}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b z-10">
          <div>
            <h3 className="font-bold text-slate-900 text-xl">Return to Company</h3>
            <p className="text-slate-500 text-lg">{company.companyName}</p>
          </div>
          <button onClick={onClose}><X size={24} className="text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loadingBatches ? (
            <p className="text-center text-slate-500 text-base py-6">Loading batches…</p>
          ) : batches.length === 0 ? (
            <p className="text-center text-slate-400 text-base py-6">No in-stock batches found for this supplier.</p>
          ) : (
            lines.map((line, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-3 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-700">Item {idx + 1}</span>
                  {lines.length > 1 && (
                    <button onClick={() => removeLine(idx)} className="text-red-500">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <select
                  value={line.batchId}
                  onChange={(e) => handleBatchSelect(idx, e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
                >
                  <option value="">Select product / batch…</option>
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.productName} — {b.batchNumber} ({b.totalStockQuantity} in stock)
                    </option>
                  ))}
                </select>

                {line.batchId && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-lg text-slate-500 block mb-1">Qty to Return (max {line.availableQty})</label>
                      <input
                        type="number"
                        min={1}
                        max={line.availableQty}
                        value={line.qtyReturned}
                        onChange={(e) => updateLine(idx, { qtyReturned: e.target.value })}
                        className={`w-full bg-white border rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400 ${
                          line.qtyReturned > line.availableQty ? 'border-red-400' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-lg text-slate-500 block mb-1">Reason</label>
                      <select
                        value={line.reason}
                        onChange={(e) => updateLine(idx, { reason: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400"
                      >
                        {DEBIT_NOTE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {batches.length > 0 && (
            <button
              type="button"
              onClick={addLine}
              className="w-full flex items-center justify-center gap-1.5 text-emerald-600 font-semibold text-lg py-2 border border-dashed border-emerald-300 rounded-xl"
            >
              <Plus size={14} /> Add another item
            </button>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-3">
          <button
            onClick={handleSubmit}
            disabled={saving || !isValid || batches.length === 0}
            className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl text-lg disabled:opacity-50"
          >
            {saving ? 'Submitting…' : 'Submit Return'}
          </button>
        </div>
      </div>
    </div>
  );
};