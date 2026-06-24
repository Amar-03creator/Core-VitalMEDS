export const ThresholdFields = ({ formData, setFormData }) => (
  <div className="grid grid-cols-2 gap-3">
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Short Expiry (days)</label>
      <input type="number" value={formData.shortExpiryThreshold} onChange={e => setFormData(prev => ({ ...prev, shortExpiryThreshold: e.target.value }))}
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400" />
    </div>
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Low Stock Threshold</label>
      <input type="number" value={formData.lowStockThreshold} onChange={e => setFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400" />
    </div>
  </div>
);