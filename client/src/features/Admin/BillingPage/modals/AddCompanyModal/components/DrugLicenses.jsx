import { Trash2 } from 'lucide-react';

/**
 * DrugLicenses
 *
 * Changes from original:
 *  - `licenseInputRef` forwarded to the <input> so useDrugLicenses can re-focus it.
 *  - `onBlur={handleLicenseInputBlur}` added to the <input> — this is the gate
 *    that warns the admin when they try to leave with an un-added licence number.
 *  - No UI changes.
 */
export const DrugLicenses = ({
  formData,
  licenseInput, setLicenseInput,
  licenseInputRef,
  editingLicenseIndex,
  handleLicenseInputBlur,
  handleAddOrUpdateLicense,
  handleEditLicense,
  cancelEditLicense,
  removeDrugLicense,
  errors,
}) => (
  <div>
    <label className="text-base font-semibold text-slate-700 block mb-1">Drug License(s)</label>

    {formData.drugLicenses.length > 0 && formData.drugLicenses[0] !== '' && (
      <div className="flex flex-wrap gap-2 mb-2">
        {formData.drugLicenses.map((lic, idx) => (
          lic.trim() && (
            <button
              key={idx}
              type="button"
              onClick={() => handleEditLicense(idx)}
              className={`inline-flex items-center gap-1 border rounded-full px-3 py-1 text-base text-slate-800
                ${editingLicenseIndex === idx
                  ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-200'
                  : 'bg-slate-100 border-slate-300'}`}
            >
              {lic}
              <span
                onClick={(e) => { e.stopPropagation(); removeDrugLicense(idx); }}
                className="text-red-500 hover:text-red-700 cursor-pointer"
              >
                <Trash2 size={14} />
              </span>
            </button>
          )
        ))}
      </div>
    )}

    <div className="flex gap-2">
      <input
        ref={licenseInputRef}
        name="drugLicenseInput"
        value={licenseInput}
        onChange={e => setLicenseInput(e.target.value.toUpperCase().replace(/\s/g, ''))}
        onBlur={handleLicenseInputBlur}
        placeholder="Enter licence number"
        className={`flex-1 bg-white border ${
          errors.drugLicenseInput ? 'border-red-500' : 'border-slate-300'
        } rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400`}
      />
      <button
        type="button"
        onClick={handleAddOrUpdateLicense}
        className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
      >
        {editingLicenseIndex !== null ? '✎ Update' : '✓ Add'}
      </button>
      {editingLicenseIndex !== null && (
        <button
          type="button"
          onClick={cancelEditLicense}
          className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>

    {errors.drugLicenseInput && (
      <p className="text-red-500 text-sm mt-1">{errors.drugLicenseInput}</p>
    )}
  </div>
);