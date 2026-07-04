// customers/modals/AddCustomerModal/components/DrugLicenseManager.jsx
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { validateField } from '../validation';

export const DrugLicenseManager = ({ formData, setFormData, checkDuplicateStrict }) => {
  const [licenseInput, setLicenseInput] = useState('');
  const [validTill, setValidTill] = useState('');
  const inputRef = useRef(null);
  const trapPending = useRef(false);

  const licenses = formData.drugLicenses || [];

  const handleBlur = useCallback(async (e) => {
    const val = licenseInput.trim();
    if (!val) {
      trapPending.current = false;
      return;
    }

    // ✨ UX FIX: Capture where the user's cursor is going BEFORE we validate
    const relatedTarget = e.relatedTarget;
    const isMovingToDate = relatedTarget && relatedTarget.tagName === 'INPUT' && relatedTarget.type === 'date';
    const isMovingToButton = relatedTarget && relatedTarget.tagName === 'BUTTON';

    // 1. Regex Validation
    const formatError = validateField('drugLicense', val);
    if (formatError) {
      toast.error(formatError);
      trapPending.current = true;
    } else {
      // 2. Duplicate Check
      const isDup = await checkDuplicateStrict('drugLicense', val, 'Drug License');
      if (isDup) {
        trapPending.current = true;
      } else {
        // Valid and Unique!
        trapPending.current = false;

        // ✨ UX FIX: Only show a gentle reminder if they click COMPLETELY outside the widget area
        if (!isMovingToDate && !isMovingToButton && !validTill) {
          toast.info("Don't forget to select an expiry date and click Add.");
        }
      }
    }

    // Only steal focus back if there was a HARD error (Regex failure or Duplicate)
    setTimeout(() => {
      if (trapPending.current && inputRef.current) inputRef.current.focus();
    }, 10);
  }, [licenseInput, validTill, checkDuplicateStrict]);

  const handleAdd = async () => {
    const val = licenseInput.trim();
    if (!val || !validTill) {
      toast.error('Both license number and expiry date are required to add.');
      return;
    }
    
    // Check local duplicate
    if (licenses.some(l => l.number === val)) {
      toast.error('License already added to this customer.');
      return;
    }

    // ✨ FAILSAFE: Run duplicate check one last time on Add to be absolutely certain
    const isDup = await checkDuplicateStrict('drugLicense', val, 'Drug License');
    if (isDup) return;

    trapPending.current = false;
    setFormData(prev => ({
      ...prev,
      drugLicenses: [...(prev.drugLicenses || []), { number: val, validTill }]
    }));
    setLicenseInput('');
    setValidTill('');
  };

  const handleRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      drugLicenses: prev.drugLicenses.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-3">
      {licenses.map((lic, idx) => (
        <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 border border-slate-200 rounded-lg">
          <div>
            <p className="font-mono text-sm font-bold text-slate-800">{lic.number}</p>
            <p className="text-xs text-slate-500">Exp: {lic.validTill}</p>
          </div>
          <button onClick={() => handleRemove(idx)} className="text-red-400 p-1 hover:bg-red-50 rounded">
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <input
            ref={inputRef}
            placeholder="License Number"
            value={licenseInput}
            onChange={(e) => setLicenseInput(e.target.value.toUpperCase())}
            onBlur={handleBlur}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400"
          />
        </div>
        <div className="col-span-4">
          <input
            type="date"
            value={validTill}
            onChange={(e) => setValidTill(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-emerald-400"
          />
        </div>
        <div className="col-span-2">
          <button 
            type="button" 
            onClick={handleAdd}
            className="w-full h-full bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};