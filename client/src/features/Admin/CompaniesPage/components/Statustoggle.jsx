import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * StatusToggle
 * Generic Active/Inactive switch that requires explicit confirmation
 * before calling onConfirm. Reusable wherever a status flip needs a
 * "are you sure?" gate (per spec for the Company Profile tab).
 */
export const StatusToggle = ({ status, onConfirm, busy = false, entityLabel = 'company' }) => {
  const [confirming, setConfirming] = useState(false);
  const isActive = status === 'Active';

  const handleToggleClick = () => setConfirming(true);

  const handleConfirm = async () => {
    await onConfirm();
    setConfirming(false);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggleClick}
        disabled={busy}
        className={`relative w-14 h-8 rounded-full transition-colors shrink-0 ${
          isActive ? 'bg-emerald-500' : 'bg-slate-300'
        } disabled:opacity-50`}
      >
        <span
          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
            isActive ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
      <span className={`text-sm font-semibold ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
        {status}
      </span>

      {confirming && (
        <div className="fixed inset-0 z-80 bg-black/50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle size={20} />
              <p className="font-bold text-slate-900 text-lg">Confirm status change</p>
            </div>
            <p className="text-slate-600 text-base">
              Mark this {entityLabel} as <strong>{isActive ? 'Inactive' : 'Active'}</strong>?
              {isActive && ' Inactive suppliers won\u2019t appear in product/purchase entry searches.'}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={busy}
                className="flex-1 bg-slate-900 text-white font-semibold py-2.5 rounded-xl disabled:opacity-60"
              >
                {busy ? 'Updating…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};