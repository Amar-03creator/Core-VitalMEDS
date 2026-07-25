// src/modals/MakeInvoiceModal/components/InvoiceOverlays.jsx
import { AlertTriangle, Loader2, XCircle } from 'lucide-react';

export const ExitDialog = ({ isOpen, onComplete, onDiscard, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={24} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">Edit in progress</h3>
            <p className="text-slate-600 text-sm">
              You have unsaved changes. You must either complete the edit or discard the invoice entirely.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={onComplete} className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-base hover:bg-slate-800">
            Complete Editing
          </button>
          <button onClick={onDiscard} className="w-full bg-red-50 text-red-700 font-semibold py-2.5 rounded-xl text-base hover:bg-red-100 border border-red-200">
            Discard Changes
          </button>
          <button onClick={onCancel} className="w-full bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl text-base hover:bg-slate-200">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export const ModReasonPrompt = ({ isOpen, modReason, setModReason, onBack, onContinue }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-3">
        <h3 className="font-bold text-lg text-slate-900">Why the change?</h3>
        <p className="text-slate-600 text-sm">
          You've added or removed a product from what the client originally ordered. A short note is required.
        </p>
        <textarea
          value={modReason}
          onChange={(e) => setModReason(e.target.value)}
          rows={4}
          placeholder="e.g. Substituted with the equivalent from the same manufacturer…"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
        <div className="flex gap-2">
          <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold text-base">Back</button>
          <button onClick={onContinue} disabled={!modReason.trim()} className="flex-1 bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500 text-white py-2.5 rounded-xl font-semibold text-base">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export const ClientEditingPrompt = ({ isOpen, onOk, onGoToOrders }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl animate-fadeIn">
        <AlertTriangle size={48} className="mx-auto text-amber-500 mb-3" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">Client is Editing!</h3>
        <p className="text-slate-600 text-sm mb-6">Please wait. The client is currently editing this order's quantities.</p>
        <div className="flex gap-3">
          <button onClick={onOk} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors">
            OK
          </button>
          <button onClick={onGoToOrders} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition-colors">
            Go to Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export const LiveTimerOverlay = ({ isOpen, timer, onBackToOrders }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[140] bg-white/60 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn">
      <Loader2 size={48} className="animate-spin text-emerald-600 mb-6" />
      <h2 className="text-5xl font-black text-slate-900 font-mono tracking-wider">{timer}</h2>
      <p className="text-slate-700 font-bold mt-4 text-lg text-center">Waiting for client to finish...</p>
      <p className="text-slate-500 text-sm mt-2 text-center max-w-xs">
        When the timer expires or the client saves, you can resume invoicing.
      </p>
      <button onClick={onBackToOrders} className="mt-8 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-colors">
        Back to Orders Page
      </button>
    </div>
  );
};

export const OrderCancelledPrompt = ({ isOpen, reason, onGoToOrders }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl animate-fadeIn">
        <XCircle size={48} className="mx-auto text-red-500 mb-3" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">Order Cancelled!</h3>
        <p className="text-slate-600 text-sm mb-4">The client has just cancelled this order.</p>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-left">
          <span className="block text-xs font-bold text-red-800 uppercase mb-1">Reason provided:</span>
          <span className="text-red-900 text-sm font-medium">{reason || 'No reason provided.'}</span>
        </div>
        
        <button onClick={onGoToOrders} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors shadow-md">
          Close & Go to Orders
        </button>
      </div>
    </div>
  );
};