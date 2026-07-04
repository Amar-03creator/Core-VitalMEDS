import { DateInput } from '../../AddPurchaseBillModal/DateInput';

export const AddressFields = ({ formData, errors, handleChange, handleBlur, setFormData, trapActive }) => (
  <>
    <DateInput
      value={formData.drugLicenseExpiry}
      onChange={(val) => setFormData(prev => ({ ...prev, drugLicenseExpiry: val }))}
      label="Drug License Expiry"
      disabled={trapActive}
    />
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Billing Address</label>
      <textarea name="billingAddress" value={formData.billingAddress} onChange={handleChange} rows={2}
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400 resize-none" />
    </div>
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">City</label>
        <input name="city" value={formData.city} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400" />
      </div>
      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">State</label>
        <input name="state" value={formData.state} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400" />
      </div>
      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">Pincode</label>
        <input name="pincode" value={formData.pincode} onChange={handleChange} onBlur={handleBlur}
          className={`w-full bg-white border ${errors.pincode ? 'border-red-500' : 'border-slate-300'} rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400`} />
        {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
      </div>
    </div>
  </>
);