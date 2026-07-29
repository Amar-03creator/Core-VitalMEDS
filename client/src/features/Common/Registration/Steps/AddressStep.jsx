import { Check } from 'lucide-react';
import Field from '../Field';

const AddressStep = ({ form, set, errors, setLegalModal, inputClass, selectClass }) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-slate-900 text-2xl font-black">Business Address</h2>
      <p className="text-slate-500 text-sm mt-1">For invoicing and delivery</p>
    </div>

    <Field label="Billing Address" required error={errors.billingAddress}>
      <textarea
        value={form.billingAddress}
        onChange={e => set('billingAddress', e.target.value)}
        placeholder="Shop no., street, locality..."
        rows={2}
        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
      />
    </Field>

    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100 transition-colors">
      <button
        type="button"
        onClick={() => set('sameAsBilling', !form.sameAsBilling)}
        className="flex items-start gap-3 w-full text-left"
      >
        <div
          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
            form.sameAsBilling ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'
          }`}
        >
          {form.sameAsBilling && <Check size={12} className="text-white" />}
        </div>
        <p className="text-slate-700 text-sm font-medium">
          Delivery address is same as billing address
        </p>
      </button>
    </div>

    {!form.sameAsBilling && (
      <Field label="Delivery Address" required error={errors.shippingAddress}>
        <textarea
          value={form.shippingAddress}
          onChange={e => set('shippingAddress', e.target.value)}
          placeholder="Different shop address, warehouse, etc."
          rows={2}
          className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
        />
      </Field>
    )}

    <div className="grid grid-cols-2 gap-3">
      <Field label="City / Town" required error={errors.city}>
        <input
          value={form.city}
          onChange={e => set('city', e.target.value)}
          placeholder="e.g. Cuttack"
          className={inputClass}
        />
      </Field>
      <Field label="PIN Code" required error={errors.pincode}>
        <input
          value={form.pincode}
          onChange={e => set('pincode', e.target.value)}
          placeholder="6-digit PIN"
          maxLength={6}
          className={inputClass}
        />
      </Field>
    </div>

    <Field label="District" error={errors.district}>
      <select value={form.district} onChange={e => set('district', e.target.value)} className={selectClass}>
        <option value="">Select district</option>
        {[
          'Cuttack', 'Bhubaneswar', 'Puri', 'Kendrapara', 'Jajpur',
          'Khordha', 'Balasore', 'Ganjam', 'Gajapati', 'Other',
        ].map(d => (
          <option key={d}>{d}</option>
        ))}
      </select>
    </Field>

    {/* Agreement */}
    <div
      className={`rounded-2xl border-2 p-4 transition-colors ${
        errors.agreed ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
      }`}
    >
      <button
        type="button"
        onClick={() => set('agreed', !form.agreed)}
        className="flex items-start gap-3 w-full text-left"
      >
        <div
          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
            form.agreed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'
          }`}
        >
          {form.agreed && <Check size={12} className="text-white" />}
        </div>
        <p className="text-slate-600 text-sm leading-relaxed">
          I confirm that all information provided is accurate and I agree to the{' '}
          <button
            type="button"
            onClick={() => setLegalModal('terms')}
            className="text-emerald-600 font-semibold underline hover:text-emerald-700"
          >
            Terms of Service
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={() => setLegalModal('privacy')}
            className="text-emerald-600 font-semibold underline hover:text-emerald-700"
          >
            Privacy Policy
          </button>{' '}
          of VitalMEDS.
        </p>
      </button>
      {errors.agreed && (
        <p className="text-red-600 text-xs mt-2 ml-8 font-semibold">{errors.agreed}</p>
      )}
    </div>
  </div>
);

export default AddressStep;