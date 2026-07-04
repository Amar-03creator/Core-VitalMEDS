// PackingInput.jsx
import { useState, useMemo } from 'react';

const PACKINGS = [
  "15's Strip", "10's Strip", "8's Strip", "6's Strip", "4's Strip", "3's Strip", "1's Strip",
  "30's Bottle", "60's Bottle", "100's Bottle", "500's Jar", "1000's Jar",
  "30ml", "60ml", "100ml", "200ml", "450ml",
  "5ml", "10ml", "15ml",
  "5g", "10g", "15g", "20g", "30g", "50g",
  "1 Ampoule", "1 Vial", "100ml IV", "500ml IV",
  "1 Sachet", "100g", "200g", "400g",
  "1 Piece", "1 Kit", "Others",
];

export const PackingInput = ({ formData, setFormData }) => {
  const [input, setInput] = useState(formData.packing || '');
  const [show, setShow] = useState(false);

  const filtered = useMemo(
    () => PACKINGS.filter(p => p.toLowerCase().includes(input.toLowerCase())),
    [input]
  );

  const handleChange = (e) => {
    const val = e.target.value;
    setInput(val);
    setShow(true);
    setFormData(prev => ({ ...prev, packing: val }));
  };

  const handleSelect = (val) => {
    setInput(val);
    setFormData(prev => ({ ...prev, packing: val }));
    setShow(false);
  };

  return (
    <div className="relative">
      <label className="text-base font-semibold text-slate-700 block mb-1">Packing</label>
      <input
        value={input}
        onChange={handleChange}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        placeholder="e.g. 10's Strip"
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
      />
      {show && input && (
        <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-lg max-h-44 overflow-y-auto">
          {filtered.map(p => (
            <button
              key={p}
              onMouseDown={() => handleSelect(p)}
              className="w-full text-left px-3 py-2 text-base hover:bg-slate-50 border-b border-slate-100"
            >
              {p}
            </button>
          ))}
          {!PACKINGS.includes(input) && input.trim() && (
            <button
              onMouseDown={() => handleSelect(input.trim())}
              className="w-full text-left px-3 py-2 text-base hover:bg-green-50 text-emerald-600 border-b border-slate-100"
            >
              + Add &quot;{input.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
};