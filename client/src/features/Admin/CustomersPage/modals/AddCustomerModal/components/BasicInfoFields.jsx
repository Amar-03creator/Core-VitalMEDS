// customers/modals/AddCustomerModal/components/BasicInfoFields.jsx

const BUSINESS_TYPES = ['Retail', 'Hospital', 'Clinic'];
const STATUS_OPTIONS  = ['Pending', 'Active'];

export const BasicInfoFields = ({ formData, handleChange, handleBlur, errors }) => (
  <>
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">
        Establishment Name *
      </label>
      <input
        name="establishmentName"
        value={formData.establishmentName}
        onChange={handleChange}
        placeholder="e.g., Apollo Pharmacy"
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
      />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">Business Type *</label>
        <select
          name="businessType"
          value={formData.businessType}
          onChange={handleChange}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
        >
          {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">Status</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
        >
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
    </div>
  </>
);
