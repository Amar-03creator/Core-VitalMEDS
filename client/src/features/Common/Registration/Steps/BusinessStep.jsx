import Field from '../Field';

const BusinessStep = ({ form, set, errors , inputClass, selectClass}) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-slate-900 text-2xl font-black">Business Information</h2>
      <p className="text-slate-500 text-sm mt-1">Tell us about your pharmacy</p>
    </div>

    <Field label="Establishment Name" required error={errors.establishmentName}>
      <input
        value={form.establishmentName}
        onChange={e => set('establishmentName', e.target.value)}
        placeholder="e.g. Sharma Medical Stores"
        className={inputClass}
      />
    </Field>

    <Field label="Owner / Proprietor Name" required error={errors.ownerName}>
      <input
        value={form.ownerName}
        onChange={e => set('ownerName', e.target.value)}
        placeholder="Full legal name"
        className={inputClass}
      />
    </Field>

    <Field label="Designation" error={errors.designation}>
      <select value={form.designation} onChange={e => set('designation', e.target.value)} className={selectClass}>
        {['Owner', 'Proprietor', 'Manager', 'Partner'].map(d => (
          <option key={d}>{d}</option>
        ))}
      </select>
    </Field>

    <Field label="Business Type" required error={errors.businessType}>
      <div className="grid grid-cols-3 gap-2">
        {['Retail', 'Distributor', 'Hospital / Clinic'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => set('businessType', t)}
            className={`py-3 rounded-2xl text-xs sm:text-sm font-semibold border transition-all ${
              form.businessType === t
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </Field>
  </div>
);

export default BusinessStep;