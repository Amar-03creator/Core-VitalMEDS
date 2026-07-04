// customers/modals/AddCustomerModal/CustomerFormStep.jsx
import { api } from '../../../../../services/api';
import { validateField } from './validation';
import { BasicInfoFields }        from './components/BasicInfoFields';
import { LegalFields }            from './components/LegalFields';
import { AddressFields }          from './components/AddressFields';
import { ContactsList }           from './components/ContactsList';
import { FinancialSettingsFields } from './components/FinancialSettingsFields';

export const CustomerFormStep = ({
  formData, setFormData,
  errors, setErrors,
  toast, goToReview,
}) => {
  
  // Standard handler for non-strict fields (Basic Info, Address, Financials)
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processed = value;
    if (name === 'email') {
      processed = value.toLowerCase();
    } else if (name === 'pincode') {
      processed = value.toUpperCase().replace(/\s/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: processed }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  // ✨ UPDATED: Now returns true/false so the FocusTrapInput knows if it should lock!
  const checkDuplicateStrict = async (fieldName, value, label) => {
    if (!value) return false;
    try {
      const res = await api.checkDuplicate(fieldName, value);
      if (res.exists) {
        const names = res.owners.map(o => `${o.name} (${o.type})`).join(', ');
        const msg   = `${label} already registered with: ${names}`;
        setErrors(prev => ({ ...prev, [fieldName]: msg }));
        toast.error(msg);
        return true; // Tell the trap to LOCK
      }
      return false; // Tell the trap to RELEASE
    } catch { 
      return false; 
    }
  };

  // Standard blur handler for basic fields (Pincode, etc.)
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    if (error) { toast.error(error); }
  };

  return (
    <div className="space-y-4">
      <BasicInfoFields
        formData={formData} handleChange={handleChange}
        handleBlur={handleBlur} errors={errors}
      />
      
      {/* ✨ FIXED: We are now actually passing setFormData and checkDuplicateStrict down! */}
      <LegalFields
        formData={formData} 
        setFormData={setFormData}
        checkDuplicateStrict={checkDuplicateStrict}
      />
      
      <AddressFields
        formData={formData} handleChange={handleChange}
        handleBlur={handleBlur} errors={errors}
      />
      
      <ContactsList
        formData={formData} setFormData={setFormData}
        errors={errors}
      />
      
      <FinancialSettingsFields
        formData={formData} handleChange={handleChange}
      />

      <button
        onClick={goToReview}
        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl text-lg mt-4 hover:bg-slate-800"
      >
        Done
      </button>
    </div>
  );
};