// src/components/QuantityStepper.jsx
import { useState, useEffect } from 'react';

const QuantityStepper = ({ value, onChange, min = 1, max = 9999, size = 'md', allowTyping = true }) => {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const dec = () => onChange(Math.max(min, Number(value) - 1));
  const inc = () => onChange(Math.min(max, Number(value) + 1));

  const handleChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setLocalVal('');
      onChange(''); // Pass empty string up to disable buttons
    } else {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) {
        const bounded = Math.min(max, parsed);
        setLocalVal(bounded);
        onChange(bounded);
      }
    }
  };

  const handleBlur = () => {
    if (localVal === '' || localVal < min) {
      setLocalVal(min);
      onChange(min);
    }
  };

  const dims = {
    sm: { btn: 'w-7 h-7 text-sm', text: 'text-sm w-8' },
    md: { btn: 'w-8 h-8 sm:w-9 sm:h-9 text-base', text: 'text-base w-10' },
    lg: { btn: 'w-9 h-9 sm:w-10 sm:h-10 text-base', text: 'text-lg w-12' },
  }[size];

  return (
    <div className="flex w-full items-center justify-between bg-slate-100 rounded-xl px-1 py-1">
      <button
        type="button" onClick={dec} disabled={value === '' || value <= min}
        className={`${dims.btn} flex items-center justify-center bg-white rounded-lg text-slate-800 font-bold shadow-sm active:scale-95 transition-transform disabled:opacity-50`}
      >
        -
      </button>
      
      {allowTyping ? (
        <input
          type="number" value={localVal} onChange={handleChange} onBlur={handleBlur}
          className={`${dims.text} text-center text-slate-900 font-bold bg-transparent outline-none flex-1`}
        />
      ) : (
        <span className={`${dims.text} text-slate-900 font-bold text-center flex-1`}>{value}</span>
      )}

      <button
        type="button" onClick={inc} disabled={value !== '' && value >= max}
        className={`${dims.btn} flex items-center justify-center bg-white rounded-lg text-slate-800 font-bold shadow-sm active:scale-95 transition-transform disabled:opacity-50`}
      >
        +
      </button>
    </div>
  );
};

export default QuantityStepper;