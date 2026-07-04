// customers/modals/AddCustomerModal/components/FocusTrapInput.jsx
import { useState, useRef, useEffect } from 'react';
import { validateField } from '../validation';
import { toast } from 'sonner';

export const FocusTrapInput = ({ 
  name, value, onChange, label, placeholder, 
  checkDuplicate, required, transform = 'uppercase',
  disabled = false // ✨ ADDED THIS PROP
}) => {
  const inputRef = useRef(null);
  const [internalError, setInternalError] = useState(null);
  const trapPending = useRef(false);

  const handleChange = (e) => {
    if (disabled) return; // ✨ Failsafe: Prevent changes if locked
    let val = e.target.value;
    if (transform === 'uppercase') val = val.toUpperCase().replace(/\s/g, '');
    if (transform === 'lowercase') val = val.toLowerCase().replace(/\s/g, '');
    if (transform === 'numeric') val = val.replace(/\D/g, '');
    
    onChange(name, val);
    if (internalError) setInternalError(null);
  };

  const handleBlur = async (e) => {
    if (disabled) return; // ✨ Skip blur validation if locked
    const val = value?.trim();
    
    // Allow closing the modal (clicking buttons)
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && relatedTarget.tagName === 'BUTTON') return;

    if (!val && required) {
      setInternalError(`${label} is required.`);
      trapPending.current = true;
    } else if (val) {
      // 1. Regex Validation
      const formatError = validateField(name, val);
      if (formatError) {
        setInternalError(formatError);
        toast.error(formatError);
        trapPending.current = true;
      } else if (checkDuplicate) {
        // 2. Duplicate Validation
        const isDuplicate = await checkDuplicate(name, val, label);
        if (isDuplicate) {
          setInternalError(`${label} is already registered.`);
          trapPending.current = true;
        } else {
          setInternalError(null);
          trapPending.current = false;
        }
      } else {
        setInternalError(null);
        trapPending.current = false;
      }
    } else {
      setInternalError(null);
      trapPending.current = false;
    }

    // Re-focus if trapped
    setTimeout(() => {
      if (trapPending.current && inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };

  return (
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">
        {label} {required && '*'}
      </label>
      <input
        ref={inputRef}
        name={name}
        value={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled} // ✨ Added native disabled attribute
        className={`w-full border ${
          disabled 
            ? 'bg-slate-100 text-slate-500 cursor-not-allowed' // ✨ Greyed out styling when locked
            : 'bg-white text-slate-800'
        } ${
          internalError ? 'border-red-500' : 'border-slate-300'
        } rounded-xl px-3 py-2.5 text-base outline-none ${
          !disabled ? 'focus:border-emerald-400' : '' // Only allow focus ring if not disabled
        }`}
      />
      {internalError && <p className="text-red-500 text-sm mt-1">{internalError}</p>}
    </div>
  );
};