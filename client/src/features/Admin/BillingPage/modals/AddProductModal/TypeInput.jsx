// TypeInput.jsx
import { useState, useMemo } from 'react';

const TYPES = [
  'Tablet', 'Capsule', 'Softgel', 'Effervescent Tablet', 'Granules', 'Powder', 'Sachet',
  'Syrup', 'Suspension', 'Drops', 'Mouthwash / Gargle',
  'Injection', 'IV Fluid', 'Pre-Filled Syringe (PFS)', 'Cartridge',
  'Inhaler', 'Rotacap', 'Respules (Nebulizer)', 'Spray',
  'Cream', 'Ointment', 'Gel', 'Lotion', 'Dusting Powder', 'Transdermal Patch',
  'Soap', 'Shampoo', 'Gum Paint',
  'Suppository', 'Enema', 'Kit', 'Others',
];

export const TypeInput = ({ formData, setFormData }) => {
  const [input, setInput] = useState(formData.type || '');
  const [show, setShow] = useState(false);

  const filtered = useMemo(
    () => TYPES.filter(t => t.toLowerCase().includes(input.toLowerCase())),
    [input]
  );

  const handleChange = (e) => {
    const val = e.target.value;
    setInput(val);
    setShow(true);
    // always sync to parent
    setFormData(prev => ({ ...prev, type: val }));
  };

  const handleSelect = (val) => {
    setInput(val);
    setFormData(prev => ({ ...prev, type: val }));
    setShow(false);
  };

  return (
    <div className="relative">
      <label className="text-base font-semibold text-slate-700 block mb-1">Type</label>
      <input
        value={input}
        onChange={handleChange}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        placeholder="Tablet, Syrup..."
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
      />
      {show && input && (
        <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-lg max-h-44 overflow-y-auto">
          {filtered.map(t => (
            <button
              key={t}
              onMouseDown={() => handleSelect(t)}
              className="w-full text-left px-3 py-2 text-base hover:bg-slate-50 border-b border-slate-100"
            >
              {t}
            </button>
          ))}
          {!TYPES.includes(input) && input.trim() && (
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