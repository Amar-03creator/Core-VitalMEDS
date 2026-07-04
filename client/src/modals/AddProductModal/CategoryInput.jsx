import { useState } from 'react';
import { X } from 'lucide-react';

const CATEGORIES = [
  'Analgesic / Pain Relief', 'Anti-allergic', 'Antibiotic', 'Antidiabetic',
  'Antifungal', 'Antipyretic', 'Antiviral', 'Ayurvedic/Herbal', 'Cardiac',
  'Dental / Oral Care', 'Dermatological', 'Diagnostics / Devices',
  'Endocrinology / Hormonal', 'FMCG / OTC', 'Gastrointestinal', 'Gynecological',
  'Neurological', 'Oncology / Anti-cancer', 'Ophthalmic / Otic', 'Orthopedic',
  'Pediatric', 'Psychiatric', 'Respiratory', 'Surgical / Consumables',
  'Urological', 'Vaccines / Biologicals', 'Veterinary', 'Vitamins / Supplements',
  'Others'
];

export const CategoryInput = ({ formData, setFormData, toast }) => {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const categories = formData.categories || [];    // ← safe fallback

  const filtered = CATEGORIES.filter(c => c.toLowerCase().includes(input.toLowerCase()));

  const addCategory = (cat) => {
    const trimmed = cat.trim();
    if (!trimmed) return;
    if (categories.find(c => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Category already added');
      return;
    }
    setFormData(prev => ({ ...prev, categories: [...(prev.categories || []), trimmed] }));
    setInput('');
    setShowDropdown(false);
  };

  const removeCategory = (index) => {
    const newCats = categories.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, categories: newCats }));
  };

  return (
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Categories</label>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {categories.map((cat, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 bg-slate-100 border border-slate-300 rounded-full px-3 py-1 text-base text-slate-800">
              {cat}
              <button type="button" onClick={() => removeCategory(idx)} className="text-red-500 hover:text-red-700"><X size={14} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search or add category..."
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400"
        />
        {showDropdown && input && (
          <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-lg max-h-44 overflow-y-auto">
            {filtered.map(cat => (
              <button key={cat} onMouseDown={() => addCategory(cat)} className="w-full text-left px-3 py-2 text-base hover:bg-slate-50 border-b border-slate-100">
                {cat}
              </button>
            ))}
            {!CATEGORIES.includes(input) && input.trim() && (
              <button onMouseDown={() => addCategory(input)} className="w-full text-left px-3 py-2 text-base hover:bg-green-50 border-b border-slate-100 text-emerald-600">
                + Add "{input}"
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};