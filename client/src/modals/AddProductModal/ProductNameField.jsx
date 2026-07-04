import { useRef } from 'react';
import { api } from '../../services/api';

export const ProductNameField = ({ formData, setFormData, errors, setErrors, toast, engageTrap, releaseTrap, isLocked }) => {
  const inputRef = useRef(null);

  const handleBlur = async () => {
    if (isLocked) return; // Skip API check if field is locked
    const val = formData.name.trim();
    if (!val) return;
    try {
      const res = await api.checkDuplicate('name', val);
      if (res.exists) {
        const msg = `Product name already exists: ${res.owners[0]?.name}`;
        setErrors(prev => ({ ...prev, name: msg }));
        toast.error(msg);
        engageTrap(inputRef.current);
      } else {
        setErrors(prev => ({ ...prev, name: null }));
        releaseTrap();
      }
    } catch { /* ignore */ }
  };

  return (
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Product Name *</label>
      <input
        ref={inputRef}
        name="name"
        value={formData.name}
        disabled={isLocked}
        onChange={e => {
          setFormData(prev => ({ ...prev, name: e.target.value }));
          if (errors.name) setErrors(prev => ({ ...prev, name: null }));
        }}
        onBlur={handleBlur}
        className={`w-full border ${errors.name ? 'border-red-500' : 'border-slate-300'} rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400 ${isLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
      />
      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
    </div>
  );
};