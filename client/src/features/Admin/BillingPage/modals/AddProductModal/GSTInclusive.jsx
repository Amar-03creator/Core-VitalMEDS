export const GSTInclusive = ({ formData, setFormData }) => (
  <div>
    <label className="text-base font-semibold text-slate-700 block mb-1">GST</label>
    <select
      value={formData.gstInclusive}
      onChange={e => setFormData(prev => ({ ...prev, gstInclusive: e.target.value }))}
      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400"
    >
      <option value="inclusive">Inclusive (MRP includes GST)</option>
      <option value="exclusive">Exclusive (GST applied extra)</option>
    </select>
  </div>
);