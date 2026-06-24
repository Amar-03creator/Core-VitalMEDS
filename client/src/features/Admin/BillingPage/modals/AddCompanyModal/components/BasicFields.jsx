/**
 * BasicFields
 * Added onBlur to shortCode so the FormStep duplicate-check fires.
 * supplierName has no blur check (not a unique-ID field).
 */
export const BasicFields = ({ formData, handleChange, handleBlur, errors }) => (
  <>
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">
        Supplier Name *
      </label>
      <input
        name="supplierName"
        value={formData.supplierName}
        onChange={handleChange}
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
      />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">
          Short Code
        </label>
        <input
          name="shortCode"
          value={formData.shortCode}
          onChange={handleChange}
          onBlur={handleBlur}   
          className={`w-full bg-white border ${
            errors?.shortCode ? 'border-red-500' : 'border-slate-300'
          } rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400`}
        />
        {errors?.shortCode && (
          <p className="text-red-500 text-sm mt-1">{errors.shortCode}</p>
        )}
      </div>

      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">
          Status
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
        >
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>
    </div>
  </>
);