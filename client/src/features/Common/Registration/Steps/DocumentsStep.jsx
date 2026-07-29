import { AlertCircle, X } from 'lucide-react';
import Field from '../Field';

const DocumentsStep = ({ form, set, errors, handleDlChange, addDlField, removeDlField, inputClass }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
    <div>
      <h2 className="text-slate-900 text-2xl font-black">Legal Documents</h2>
      <p className="text-slate-500 text-sm mt-1">
        Provide your business identification.{' '}
        <span className="font-bold text-slate-700">
          Document uploads will happen securely after login.
        </span>
      </p>
    </div>

    {errors.identity && (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
        <AlertCircle size={16} /> {errors.identity}
      </div>
    )}

    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">
        Personal / Entity Identity
      </h3>

      <Field label="PAN Number" error={errors.pan}>
        <input
          value={form.pan}
          onChange={e => set('pan', e.target.value.replace(/\s/g, '').toUpperCase())}
          placeholder="ABCDE1234F"
          maxLength={10}
          className={inputClass}
        />
      </Field>

      <div className="flex items-center gap-3">
        <div className="h-px bg-slate-200 flex-1" />
        <span className="text-slate-400 text-xs font-bold uppercase">OR</span>
        <div className="h-px bg-slate-200 flex-1" />
      </div>

      <Field label="Aadhaar Number" error={errors.aadhaar}>
        <input
          value={form.aadhaar}
          onChange={e => set('aadhaar', e.target.value.replace(/\D/g, ''))}
          placeholder="12-digit number"
          maxLength={12}
          className={inputClass}
        />
      </Field>
    </div>

    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 mt-4">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">
        Business Licenses (Optional but Recommended)
      </h3>

      <Field label="GSTIN" error={errors.gstin}>
        <input
          value={form.gstin}
          onChange={e => set('gstin', e.target.value.replace(/\s/g, '').toUpperCase())}
          placeholder="15-character GSTIN"
          maxLength={15}
          className={inputClass}
        />
      </Field>

      <div className="pt-2">
        <label className="text-slate-700 text-sm font-semibold block mb-1.5 flex justify-between items-center">
          Drug License(s)
          {errors.drugLicenses && (
            <span className="text-red-500 text-xs font-bold flex items-center gap-1">
              <AlertCircle size={12} /> Duplicate found
            </span>
          )}
        </label>

        {form.drugLicenses.map((dl, index) => (
          <div key={index} className="flex gap-2 mb-2 animate-in slide-in-from-top-2">
            <input
              value={dl}
              onChange={e => handleDlChange(index, e.target.value)}
              placeholder="e.g. OD-XXXX-XXXX"
              className={`flex-1 bg-white border ${
                errors.drugLicenses ? 'border-red-300 bg-red-50' : 'border-slate-200'
              } rounded-xl px-4 py-2.5 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-emerald-400 transition-all`}
            />
            {form.drugLicenses.length > 1 && (
              <button
                type="button"
                onClick={() => removeDlField(index)}
                className="px-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addDlField}
          className="text-sm text-emerald-600 font-bold mt-1 hover:text-emerald-700 transition-colors"
        >
          + Add another license
        </button>
      </div>
    </div>
  </div>
);

export default DocumentsStep;