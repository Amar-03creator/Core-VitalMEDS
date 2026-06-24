export const SettingsFields = ({ formData, handleChange }) => (
  <div className="grid grid-cols-2 gap-3">
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Lead Time (days)</label>
      <input type="number" name="leadTimeDays" value={formData.leadTimeDays} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400" />
    </div>
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Min Order Value (₹)</label>
      <input type="number" name="minimumOrderValue" value={formData.minimumOrderValue} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400" />
    </div>
  </div>
);