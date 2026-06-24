export const TaxFields = ({ formData, errors, handleChange, handleBlur }) => (
  <div className="grid grid-cols-2 gap-3">
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">GSTIN</label>
      <input name="gstin" value={formData.gstin} onChange={handleChange} onBlur={handleBlur}
        className={`w-full bg-white border ${errors.gstin ? 'border-red-500' : 'border-slate-300'} rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400`} />
      {errors.gstin && <p className="text-red-500 text-sm mt-1">{errors.gstin}</p>}
    </div>
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">PAN</label>
      <input name="pan" value={formData.pan} onChange={handleChange} onBlur={handleBlur}
        className={`w-full bg-white border ${errors.pan ? 'border-red-500' : 'border-slate-300'} rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400`} />
      {errors.pan && <p className="text-red-500 text-sm mt-1">{errors.pan}</p>}
    </div>
  </div>
);