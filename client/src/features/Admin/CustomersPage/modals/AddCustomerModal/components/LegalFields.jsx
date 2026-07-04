// customers/modals/AddCustomerModal/components/LegalFields.jsx
import { FocusTrapInput } from './FocusTrapInput';
import { DrugLicenseManager } from './DrugLicenseManager';

// ✨ ADDED isEditMode = false
export const LegalFields = ({ formData, setFormData, checkDuplicateStrict, isEditMode = false }) => {
  const handleStrictChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FocusTrapInput
          name="gstin"
          label="GSTIN"
          value={formData.gstin}
          onChange={handleStrictChange}
          checkDuplicate={checkDuplicateStrict}
          placeholder="21ABCDE1234F1Z5"
          required
          disabled={isEditMode} // ✨ LOCKED DURING EDIT
        />
        <FocusTrapInput
          name="pan"
          label="PAN"
          value={formData.pan}
          onChange={handleStrictChange}
          checkDuplicate={checkDuplicateStrict}
          placeholder="ABCDE1234F"
          disabled={isEditMode} // ✨ LOCKED DURING EDIT
        />
      </div>

      <div>
        <FocusTrapInput
          name="aadhaar"
          label="Aadhaar"
          value={formData.aadhaar}
          onChange={handleStrictChange}
          checkDuplicate={checkDuplicateStrict}
          placeholder="12-digit number"
          transform="numeric"
          disabled={isEditMode} // ✨ LOCKED DURING EDIT
        />
      </div>

      {/* Drug Licenses are NOT locked, so admins can add/remove them over time */}
      <div className="pt-2 border-t border-slate-200">
        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Drug Licenses</h4>
        <DrugLicenseManager 
          formData={formData} 
          setFormData={setFormData} 
          checkDuplicateStrict={checkDuplicateStrict} 
        />
      </div>
    </div>
  );
};