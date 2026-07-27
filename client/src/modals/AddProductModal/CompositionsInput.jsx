// modals/AddProductModal/CompositionsInput.jsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const CompositionsInput = ({ formData, setFormData, toast, isLocked, onDuplicateError }) => {
  const [duplicateIndexes, setDuplicateIndexes] = useState([]);

  // Check for duplicates dynamically
  const validate = (comps) => {
    const lower = comps.map(c => c.trim().toLowerCase());
    const duplicates = [];
    for (let i = 0; i < lower.length; i++) {
      if (lower[i] && lower.indexOf(lower[i]) !== i) {
        duplicates.push(i);
      }
    }
    setDuplicateIndexes(duplicates);
    if (onDuplicateError) onDuplicateError(duplicates.length > 0);
    return duplicates;
  };

  useEffect(() => {
    validate(formData.compositions);
  }, [formData.compositions]);

  const handleChange = (index, value) => {
    const comps = [...formData.compositions];
    comps[index] = value;
    setFormData(prev => ({ ...prev, compositions: comps }));
  };

  const add = () => setFormData(prev => ({ ...prev, compositions: [...prev.compositions, ''] }));

  const remove = (index) => {
    if (formData.compositions.length <= 1) return;
    const comps = formData.compositions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, compositions: comps }));
  };

  const handleBlur = () => {
    const dups = validate(formData.compositions);
    if (dups.length > 0) toast.error('Duplicate salt composition is not allowed');
  };

  return (
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Composition(s)</label>
      {formData.compositions.map((comp, idx) => {
        const isError = duplicateIndexes.includes(idx);
        return (
          <div key={idx} className="mb-2">
            <div className="flex gap-2">
              <input
                value={comp}
                disabled={isLocked}
                onChange={e => handleChange(idx, e.target.value)}
                onBlur={handleBlur}
                className={`flex-1 border ${
                  isError ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-white'
                } rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400 ${isLocked ? '!bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                placeholder={`Salt ${idx + 1}`}
              />
              {formData.compositions.length > 1 && !isLocked && (
                <button type="button" onClick={() => remove(idx)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              )}
            </div>
            {isError && !isLocked && (
              <p className="text-red-500 text-xs mt-1 font-semibold ml-1">Duplicate salt – please remove or change it.</p>
            )}
          </div>
        );
      })}
      {!isLocked && (
        <button type="button" onClick={add} className="text-sm text-emerald-600 font-semibold mt-1 hover:text-emerald-700">
          + Add another salt
        </button>
      )}
    </div>
  );
};