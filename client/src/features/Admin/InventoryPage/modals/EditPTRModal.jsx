// src/features/Admin/InventoryPage/modals/EditPTRModal.jsx
import { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../../services/api';
import { useScrollLock, useModalTrap } from '../../../../hooks/useBackHandler';

export const EditPTRModal = ({ isOpen, onClose, batch, onSave, disableBackTrap=false }) => {
  const [ptr, setPtr] = useState(batch?.sellingRate || '');
  const [isSaving, setIsSaving] = useState(false);

  // Lock background scroll when modal is open
  useScrollLock(isOpen);
  useModalTrap(isOpen, { disabled: disableBackTrap, onBackClose: onClose });
  
  // Reset PTR value when batch changes
  useEffect(() => {
    if (batch) {
      setPtr(batch.sellingRate || '');
    }
  }, [batch]);

  if (!isOpen || !batch) return null;

  const numPtr = Number(ptr);
  const absoluteMaxPtr = batch.mrp || 0;
  const recommendedMaxPtr = absoluteMaxPtr * 0.8;
  const minPtr = batch.purchaseRate || 0;

  const handleSave = async () => {
    if (!ptr || isNaN(ptr) || numPtr <= 0) {
      toast.error('Please enter a valid PTR amount');
      return;
    }

    if (numPtr > absoluteMaxPtr) {
      toast.error(`PTR cannot exceed the MRP (₹${absoluteMaxPtr.toFixed(2)})`);
      return;
    }

    if (numPtr < minPtr) {
      toast.error(`PTR cannot be less than Cost (₹${minPtr.toFixed(2)})`);
      return;
    }
    
    setIsSaving(true);
    try {
      await api.updateBatchPTR(batch._id || batch.id, numPtr);
      toast.success('PTR updated successfully!');
      
      // Pass the new PTR back to the parent so it instantly updates the UI locally
      if (onSave) onSave(numPtr); 
      
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update PTR');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl animate-slideUp">
        {/* Header */}
        <div className="flex justify-between items-center mb-5 border-b border-slate-200 pb-4">
          <h3 className="font-bold text-2xl text-slate-900">Edit Selling Rate (PTR)</h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <XCircle size={28} className="text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Batch Info Card */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <p className="text-lg font-bold text-slate-800">Batch - {batch.batchNumber}</p>
            <div className="flex flex-wrap gap-2 mt-2 text-md font-medium">
              <span className="text-slate-600">MRP: <strong className="text-slate-900">₹{batch.mrp}</strong></span>
              <span className="text-slate-600">Cost: <strong className="text-slate-900">₹{batch.purchaseRate || 0}</strong></span>
              <span className="text-slate-600 bg-emerald-50 rounded-xl border border-emerald-200 px-1">Current PTR: <strong className="text-slate-900">₹{batch.sellingRate}</strong></span>
            </div>
          </div>

          {/* New PTR Input */}
          <div>
            <label className="text-base font-semibold text-slate-700 block mb-2">New PTR (₹) *</label>
            <input
              type="number"
              step="0.01"
              value={ptr}
              onChange={(e) => setPtr(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-bold text-slate-900 text-2xl"
              placeholder="e.g. 120.50"
              autoFocus
            />
            {/* The new Warning Requirement */}
            {numPtr > recommendedMaxPtr && numPtr <= absoluteMaxPtr && (
               <p className="text-red-500 font-semibold text-sm mt-2">
                 PTR is generally 20% less than MRP. Please check again.
               </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl text-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl text-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Updating...' : 'Save PTR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};