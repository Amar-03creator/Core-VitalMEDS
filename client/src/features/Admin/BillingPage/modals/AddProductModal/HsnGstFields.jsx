export const HsnGstFields = ({ formData, setFormData, errors, setErrors, toast, engageTrap, releaseTrap }) => (
  <div className="grid grid-cols-2 gap-3">
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">HSN Code *</label>
      <input
        name="hsnCode"
        value={formData.hsnCode}
        onChange={e => setFormData(prev => ({ ...prev, hsnCode: e.target.value }))}
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400"
      />
      {/* no uniqueness */}
    </div>
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">GST Rate (%)</label>
      <input type="number" value={formData.gstRate} onChange={e => setFormData(prev => ({ ...prev, gstRate: e.target.value }))}
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400" />
    </div>
  </div>
);