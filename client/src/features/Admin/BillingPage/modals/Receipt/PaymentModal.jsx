import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../../../../services/api';
import { toast } from 'sonner';
import { PaymentSuccessModal } from './PaymentSuccessModal';

const STORAGE_KEY = 'paymentModalState';

export const PaymentModal = ({ onClose, onSaved, editingReceipt }) => {
  const load = () => {
    if (editingReceipt) return null; // Don't load saved session state if editing
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; }
  };
  const saved = load();

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Pre-fill form if editing
  const [amount, setAmount] = useState(editingReceipt?.totalAmountPaid?.toString() ?? saved?.amount ?? '');
  const [date, setDate] = useState(
    editingReceipt ? new Date(editingReceipt.paymentDate).toISOString().split('T')[0] : (saved?.date ?? new Date().toISOString().split('T')[0])
  );
  const [mode, setMode] = useState(editingReceipt?.paymentMode ?? saved?.mode ?? 'Cash');
  const [ref, setRef] = useState(editingReceipt?.referenceNumber ?? saved?.ref ?? '');
  const [saving, setSaving] = useState(false);

  const [savedReceipt, setSavedReceipt] = useState(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.getClients();
        setClients(res.data || []);
      } catch {
        toast.error('Failed to load clients');
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    if (editingReceipt && clients.length > 0) {
      const found = clients.find(c => c._id === (editingReceipt.clientObjectId?._id || editingReceipt.clientObjectId));
      if (found) setSelectedClient(found);
    } else if (saved?.clientId && clients.length > 0) {
      const found = clients.find(c => c._id === saved.clientId);
      if (found) setSelectedClient(found);
    }
  }, [clients, saved, editingReceipt]);

  useEffect(() => {
    if (!editingReceipt) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        clientId: selectedClient?._id, amount, date, mode, ref,
      }));
    }
  }, [selectedClient, amount, date, mode, ref, editingReceipt]);

  const handleClose = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    onClose();
  };

  const resetForm = () => {
    setSelectedClient(null);
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setMode('Cash');
    setRef('');
    setSavedReceipt(null);
    sessionStorage.removeItem(STORAGE_KEY);
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

      sessionStorage.removeItem(STORAGE_KEY);
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
      <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
        <div className="w-full bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto">
          <div className="sticky top-0 bg-white flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-2xl">
              {editingReceipt ? 'Edit Payment' : 'Record Payment'}
            </h3>
            <button onClick={handleClose}><X size={28} className="text-slate-400" /></button>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div>
              <label className="text-lg text-slate-600 block mb-2 font-semibold">Party</label>
              <select
                value={selectedClient?._id || ''}
                onChange={e => {
                  const client = clients.find(c => c._id === e.target.value);
                  setSelectedClient(client || null);
                  setAmount('');
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

            <div>
              <label className="text-lg text-slate-600 block mb-2 font-semibold">Amount (₹)</label>
              <input
                type="text"
                value={amount}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '') { setAmount(''); }
                  else {
                    const num = parseFloat(val);
                    if (!isNaN(num)) setAmount(val);
                  }
                }}
                placeholder="0"
                inputMode="decimal"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xl font-bold text-slate-800 outline-none focus:border-emerald-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-lg text-slate-600 block mb-2 font-semibold">Payment Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-lg text-slate-800 outline-none" />
              </div>
              <div>
                <label className="text-lg text-slate-600 block mb-2 font-semibold">Mode</label>
                <select value={mode} onChange={e => setMode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-lg text-slate-800 outline-none">
                  {['Cash', 'UPI', 'Cheque', 'Bank Transfer'].map(m => <option key={m} value={m}>{m === 'BankTransfer' ? 'Bank Transfer' : m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-lg text-slate-600 block mb-2 font-semibold">
                {mode === 'Cash' ? 'Receipt No. (give to party)' : 'Reference No.'}
              </label>
              <input
                type="text" value={ref} onChange={e => setRef(e.target.value)}
                placeholder={mode === 'Cash' ? 'RCPT-0025' : 'Ref...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-lg text-slate-800 outline-none focus:border-emerald-400"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!selectedClient || !amount || !ref || saving}
              className="w-full bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl text-xl mt-4"
            >
              {saving ? 'Saving…' : (editingReceipt ? 'Update Payment' : 'Save Payment Receipt')}
            </button>
          </div>
        </div>
      </div>

      {savedReceipt && (
        <PaymentSuccessModal
          receipt={savedReceipt}
          onRecordAnother={editingReceipt ? null : resetForm} 
          onGoToPayments={handleClose}
        />
      )}
    </>
  );
};