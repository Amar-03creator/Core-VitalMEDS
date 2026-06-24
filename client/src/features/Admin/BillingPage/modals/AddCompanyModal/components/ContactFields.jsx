import { PhoneInput } from '../PhoneInput';

/**
 * ContactFields
 * WhatsApp PhoneInput now receives the `error` prop from `errors.whatsapp`
 * so duplicate-DB errors are shown inline (not just as a toast).
 */
export const ContactFields = ({
  formData, errors,
  handleChange, handleBlur,
  setFormData, handleWhatsAppBlur,
}) => (
  <div className="grid grid-cols-2 gap-3">
    {/* Email */}
    <div className="min-w-0">
      <label className="text-base font-semibold text-slate-700 block mb-1">Email</label>
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full bg-white border ${
          errors.email ? 'border-red-500' : 'border-slate-300'
        } rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400`}
      />
      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
    </div>

    {/* WhatsApp */}
    <div className="min-w-0">
      <label className="text-base font-semibold text-slate-700 block mb-1">WhatsApp No.</label>
      <PhoneInput
        name="whatsapp"
        value={formData.whatsapp}
        onChange={(val) => setFormData(prev => ({ ...prev, whatsapp: val }))}
        onBlur={handleWhatsAppBlur}
        error={errors.whatsapp}    
        maxLength={10}
        required={true}             
      />
    </div>
  </div>
);