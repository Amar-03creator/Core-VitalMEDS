/**
 * OptionalIds
 * No logic changes — just ensuring all onBlur handlers are connected
 * so validateField + checkDuplicate fire for aadhaar and drugsBazaarId too.
 */
export const OptionalIds = ({ formData, errors, handleChange, handleBlur }) => (
  <div className="grid grid-cols-2 gap-3">
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Aadhaar</label>
      <input
        name="aadhaar"
        value={formData.aadhaar}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full bg-white border ${
          errors.aadhaar ? 'border-red-500' : 'border-slate-300'
        } rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400`}
      />
      {errors.aadhaar && <p className="text-red-500 text-sm mt-1">{errors.aadhaar}</p>}
    </div>

    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">DrugsBazaar ID</label>
      <input
        name="drugsBazaarId"
        value={formData.drugsBazaarId}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full bg-white border ${
          errors.drugsBazaarId ? 'border-red-500' : 'border-slate-300'
        } rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400`}
      />
      {errors.drugsBazaarId && (
        <p className="text-red-500 text-sm mt-1">{errors.drugsBazaarId}</p>
      )}
    </div>
  </div>
);