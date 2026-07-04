import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export const CompositionsInput = ({ formData, setFormData, toast, isLocked }) => {
  const [duplicateError, setDuplicateError] = useState(null);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (duplicateError !== null && inputRefs.current[duplicateError]) {
      inputRefs.current[duplicateError].focus();
    }
  }, [duplicateError]);

  const handleChange = (index, value) => {
    const comps = [...formData.compositions];
    comps[index] = value;
    setFormData(prev => ({ ...prev, compositions: comps }));
    if (duplicateError !== null) {
      const nonEmpty = comps.filter(c => c.trim());
      const lower = nonEmpty.map(c => c.toLowerCase());
      const hasDup = lower.some((c, i) => lower.indexOf(c) !== i);
      if (!hasDup) setDuplicateError(null);
    }
  };

  const add = () => setFormData(prev => ({ ...prev, compositions: [...prev.compositions, ''] }));

  const remove = (index) => {
    if (formData.compositions.length <= 1) return;
    const comps = formData.compositions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, compositions: comps }));
    if (duplicateError !== null) setDuplicateError(null);
  };

  const checkDuplicates = () => {
    if (isLocked) return true; // Skip checks if locked
    const nonEmpty = formData.compositions.filter(c => c.trim());
    const lower = nonEmpty.map(c => c.toLowerCase());
    for (let i = 0; i < lower.length; i++) {
      if (lower.indexOf(lower[i]) !== i) {
        setDuplicateError(i);
        toast.error('Duplicate salt composition is not allowed');
        return false;
      }
    }
    setDuplicateError(null);
    return true;
  };

  const handleBlur = () => checkDuplicates();

  return (
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Composition(s)</label>
      {formData.compositions.map((comp, idx) => (
        <div key={idx} className="flex gap-2 mb-2">
          <input
            ref={el => inputRefs.current[idx] = el}
            value={comp}
            disabled={isLocked}
            onChange={e => handleChange(idx, e.target.value)}
            onBlur={handleBlur}
            className={`flex-1 border ${
              duplicateError === idx ? 'border-red-500' : 'border-slate-300'
            } rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400 ${isLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
            placeholder={`Salt ${idx + 1}`}
          />
          {/* Hide remove button if locked */}
          {formData.compositions.length > 1 && !isLocked && (
            <button type="button" onClick={() => remove(idx)} className="text-red-500 p-2"><X size={18} /></button>
          )}
          {duplicateError === idx && !isLocked && (
            <p className="text-red-500 text-xs mt-1">Duplicate salt – enter a unique one</p>
          )}
        </div>
      ))}
      {/* Hide Add button if locked */}
      {!isLocked && (
        <button type="button" onClick={add} className="text-sm text-emerald-600 font-semibold mt-1">+ Add another salt</button>
      )}
    </div>
  );
};