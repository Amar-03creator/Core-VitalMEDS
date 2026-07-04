// src/modals/addPaymentReceiptModal/PaymentModal.jsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { PaymentSuccessModal } from './PaymentSuccessModal';
import { usePersistentModal } from '../../hooks/usePersistentModal';

const today = () => new Date().toISOString().split('T')[0];

export const PaymentModal = ({
  onClose,
  onSaved,
  editingReceipt,
  prefillClient = null,
  lockClient = false,
  disableBackTrap = false,
}) => {
  const STORAGE_KEY = prefillClient
    ? `paymentModalState_client_${prefillClient._id}`
    : 'paymentModalState';

  const buildInitialState = () => {
    if (editingReceipt) {
      return {
        // Store whatever we have — a populated doc if the API sent one,
        // else a bare id which the fallback effect below will resolve.
        selectedClient: editingReceipt.clientObjectId || null,
        amount: editingReceipt.totalAmountPaid?.toString() ?? '',
        date: new Date(editingReceipt.paymentDate).toISOString().split('T')[0],
        mode: editingReceipt.paymentMode ?? 'Cash',
        ref: editingReceipt.referenceNumber ?? '',
      };
    }
    return {
      selectedClient: prefillClient ?? null, // full object — this is the fix
      amount: '',
      date: today(),
      mode: 'Cash',
      ref: '',
    };
  };

  const { state, patch, clear, hardClose, wasRestored } = usePersistentModal({
    key: STORAGE_KEY,
    initialState: buildInitialState(),
    onClose,
    skipPersist: !!editingReceipt,
    disableBackTrap,
  });

  const { selectedClient, amount, date, mode, ref } = state;

  const [clients, setClients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedReceipt, setSavedReceipt] = useState(null);

  useEffect(() => {
    if (wasRestored) {
      toast.info('Restored your in-progress payment', { duration: 2000 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only fetch the full client list when the dropdown is actually visible.
  useEffect(() => {
    if (lockClient && prefillClient) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getClients();
        if (!cancelled) setClients(res.data || []);
      } catch {
        if (!cancelled) toast.error('Failed to load clients');
      }
    })();
    return () => { cancelled = true; };
  }, [lockClient, prefillClient]);

  // FALLBACK ONLY: resolves a bare clientObjectId into a full doc when
  // editing a receipt whose API response didn't populate it. This no
  // longer decides whether "Party Name" shows up for a restored draft —
  // a restored draft already carries the full object from storage.
  useEffect(() => {
    if (lockClient && prefillClient) return;
    if (!editingReceipt) return;
    if (selectedClient?.establishmentName) return; // already a full object
    if (clients.length === 0) return;
    const rawId = editingReceipt.clientObjectId?._id || editingReceipt.clientObjectId;
    const found = clients.find(c => c._id === rawId);
    if (found) patch({ selectedClient: found });
  }, [clients, editingReceipt, selectedClient, lockClient, prefillClient, patch]);

  const resetForm = () => {
    patch({
      selectedClient: lockClient ? prefillClient : null,
      amount: '',
      date: today(),
      mode: 'Cash',
      ref: '',
    });
    setSavedReceipt(null);
  };

  const handleSave = async () => {
    if (!selectedClient || !amount || !ref) return;
    setSaving(true);
    try {
      const payload = {
        clientObjectId: selectedClient._id,
        totalAmountPaid: parseFloat(amount),
        paymentDate: date,
        paymentMode: mode,
        referenceNumber: ref,
        manualAllocation: false,
      };

      let res;
      if (editingReceipt) {
        res = await api.updatePaymentReceipt(editingReceipt._id, payload);
        toast.success('Payment updated successfully');
      } else {
        res = await api.createPaymentReceipt(payload);
        toast.success('Payment recorded successfully');
      }

      clear(); // condition 2 of the clearing rules: successful save
      if (onSaved) onSaved();

      const receipt = res.paymentReceipt || res.data;
      setSavedReceipt({
        ...receipt,
        clientObjectId: receipt.clientObjectId || selectedClient,
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-end">
        <div className="w-full bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto">
          <div className="sticky top-0 bg-white flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-2xl">
              {editingReceipt ? 'Edit Payment' : 'Record Payment'}
            </h3>
            <button onClick={hardClose}>
              <X size={28} className="text-slate-400" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-6">
            {lockClient && prefillClient ? (
              <div>
                <label className="text-lg text-slate-600 block mb-2 font-semibold">Party</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-base shrink-0">
                    {prefillClient.establishmentName?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 leading-tight">
                      {prefillClient.establishmentName}
                    </p>
                    {prefillClient.clientId && (
                      <p className="text-sm text-slate-400">{prefillClient.clientId}</p>
                    )}
                  </div>
                  <span className="ml-auto text-xs font-semibold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                    locked
                  </span>
                </div>
                {prefillClient.totalOutstanding > 0 && (
                  <p className="text-base text-red-600 font-semibold mt-2 px-1">
                    Outstanding: ₹{prefillClient.totalOutstanding.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="text-lg text-slate-600 block mb-2 font-semibold">Party</label>
                <select
                  value={selectedClient?._id || ''}
                  onChange={e => {
                    const client = clients.find(c => c._id === e.target.value);
                    patch({ selectedClient: client || null, amount: '' });
                  }}
                  disabled={!!editingReceipt}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-lg text-slate-800 outline-none disabled:opacity-50"
                >
                  <option value="">Select party...</option>
                  {clients.map(c => (
                    <option key={c._id} value={c._id}>{c.establishmentName}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-lg text-slate-600 block mb-2 font-semibold">Amount (₹)</label>
              <input
                type="text"
                value={amount}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '') { patch({ amount: '' }); return; }
                  const num = parseFloat(val);
                  if (!isNaN(num)) patch({ amount: val });
                }}
                placeholder="0"
                inputMode="decimal"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xl font-bold text-slate-800 outline-none focus:border-emerald-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-lg text-slate-600 block mb-2 font-semibold">Payment Date</label>
                <input
                  type="date" value={date} onChange={e => patch({ date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-lg text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="text-lg text-slate-600 block mb-2 font-semibold">Mode</label>
                <select
                  value={mode} onChange={e => patch({ mode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-lg text-slate-800 outline-none"
                >
                  {['Cash', 'UPI', 'Cheque', 'Bank Transfer'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-lg text-slate-600 block mb-2 font-semibold">
                {mode === 'Cash' ? 'Receipt No. (give to party)' : 'Reference No.'}
              </label>
              <input
                type="text" value={ref} onChange={e => patch({ ref: e.target.value })}
                placeholder={mode === 'Cash' ? 'RCPT-0025' : 'Ref...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-lg text-slate-800 outline-none focus:border-emerald-400"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!selectedClient || !amount || !ref || saving}
              className="w-full bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl text-xl mt-4"
            >
              {saving ? 'Saving…' : editingReceipt ? 'Update Payment' : 'Save Payment Receipt'}
            </button>
          </div>
        </div>
      </div>

      {savedReceipt && (
        <PaymentSuccessModal
          receipt={savedReceipt}
          onRecordAnother={editingReceipt ? null : resetForm}
          onGoToPayments={hardClose}
        />
      )}
    </>
  );
};