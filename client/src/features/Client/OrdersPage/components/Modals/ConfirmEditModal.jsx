// src/features/Client/OrdersPage/components/Modals/ConfirmEditModal.jsx
import { X, Edit3 } from 'lucide-react';
import { useScrollLock } from '../../../../../hooks/useBackHandler';

export default function ConfirmEditModal({ onClose, onConfirm }) {
  useScrollLock(true);

  return (
    <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Edit3 size={16} className="text-amber-600" />
            </div>
            <h3 className="text-slate-900 font-bold text-lg">Modify Order</h3>
          </div>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-700" /></button>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 text-amber-800 text-sm font-semibold leading-relaxed">
          You can only change quantities or remove items. Adding new products is not permitted. 
          <br/><br/>
          Proceed with editing? The window will only be open for 2 minutes.
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-base font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-base font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors">
            Yes, Proceed
          </button>
        </div>
      </div>
    </div>
  );
}