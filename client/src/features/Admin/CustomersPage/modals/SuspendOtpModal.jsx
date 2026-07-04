// customers/modals/SuspendOtpModal.jsx
import { useState, useEffect } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../../services/api';

export const SuspendOtpModal = ({ customer, onClose, onConfirmSuccess }) => {
  const [step, setStep] = useState('requesting'); // 'requesting' | 'input'
  const [otp, setOtp] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-request OTP when modal opens
  useEffect(() => {
    const sendOtp = async () => {
      try {
        await api.requestSuspendOtp(customer._id);
        toast.success('Security OTP sent to admin email');
        setStep('input');
      } catch (err) {
        toast.error(err.message || 'Failed to trigger OTP');
        onClose(); // Failsafe: close modal if network fails
      }
    };
    sendOtp();
  }, [customer._id, onClose]);

  const handleVerify = async () => {
    if (otp.length < 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      await api.verifySuspendOtp(customer._id, otp, reason);
      toast.success('Account securely suspended');
      onConfirmSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Invalid OTP');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-5 pt-4 pb-8 shadow-2xl">
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-5" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <ShieldAlert size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base leading-tight">Authorize Suspension</h3>
            <p className="text-xs font-semibold text-slate-500">{customer?.establishmentName}</p>
          </div>
        </div>

        {step === 'requesting' ? (
          <div className="py-8 flex flex-col items-center justify-center text-slate-500">
            <Loader2 size={32} className="animate-spin text-emerald-500 mb-3" />
            <p className="text-sm font-semibold">Generating secure OTP...</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1">Admin OTP *</label>
              <input
                type="text"
                inputMode="numeric" // ✨ Ensures mobile keyboards show numbers
                maxLength={6}
                value={otp}
                onChange={e => {
                  // ✨ Force string and only allow digits
                  const val = e.target.value.replace(/\D/g, '');
                  setOtp(val);
                }}
                placeholder="Enter 6-digit code"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-lg tracking-[0.2em] font-mono font-bold text-slate-800 outline-none focus:border-red-400 text-center"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1">
                Reason <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g., Suspicious order activity..."
                rows={2}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-red-400 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={loading}
                className="flex-1 bg-red-500 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg shadow-red-500/30"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : 'Verify & Suspend'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};