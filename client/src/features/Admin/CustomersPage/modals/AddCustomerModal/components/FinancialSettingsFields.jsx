// customers/modals/AddCustomerModal/components/FinancialSettingsFields.jsx

export const FinancialSettingsFields = ({ formData, handleChange }) => (
  <div className="space-y-3">
    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Financial settings</h4>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">Credit Limit (₹)</label>
        <input
          type="number"
          name="creditLimit"
          value={formData.creditLimit}
          onChange={handleChange}
          placeholder="e.g., 100000"
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
        />
      </div>
      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">Payment Terms (days)</label>
        <input
          type="number"
          name="paymentTermsDays"
          value={formData.paymentTermsDays}
          onChange={handleChange}
          placeholder="e.g., 21"
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
        />
      </div>
    </div>

    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Default Discount (%)</label>
      <input
        type="number"
        name="defaultDiscountPercent"
        value={formData.defaultDiscountPercent}
        onChange={handleChange}
        placeholder="e.g., 5"
        min={0}
        max={100}
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
      />
    </div>
  </div>
);
