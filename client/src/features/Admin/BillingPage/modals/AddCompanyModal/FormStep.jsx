import { useRef } from 'react';
import { validateField } from './validation';
import { api } from '../../../../../services/api';
import { useFocusTrap } from './hooks/useFocusTrap';
import { useDrugLicenses } from './hooks/useDrugLicenses';
import { usePhoneValidation } from './hooks/usePhoneValidation';
import { BasicFields } from './components/BasicFields';
import { TaxFields } from './components/TaxFields';
import { DrugLicenses } from './components/DrugLicenses';
import { AddressFields } from './components/AddressFields';
import { ContactFields } from './components/ContactFields';
import { OptionalIds } from './components/OptionalIds';
import { SettingsFields } from './components/SettingsFields';
import { Representatives } from './components/RepresentativeList';
import { BankDetailsList } from './components/BankDetailsList';

export const FormStep = ({
  formData, setFormData,
  errors, setErrors,
  toast,
  goToReview,
}) => {
  const formRef = useRef(null);
  const { engageTrap, releaseTrap, isActive } = useFocusTrap(errors, formRef);

  const {
    licenseInput, setLicenseInput,
    licenseInputRef,
    editingLicenseIndex,
    handleLicenseInputBlur,
    handleAddOrUpdateLicense,
    handleEditLicense,
    cancelEditLicense,
    removeDrugLicense,
  } = useDrugLicenses(formData, setFormData, errors, setErrors, toast);

  const {
    handleWhatsAppBlur,
    handleRepPhoneBlur,
    handleTollFreePrompt,
  } = usePhoneValidation(formData, setFormData, setErrors, toast);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'email') {
      processedValue = value.toLowerCase();
    } else if (['aadhaar', 'pan', 'gstin', 'drugsBazaarId', 'pincode'].includes(name)) {
      processedValue = value.toUpperCase().replace(/\s/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const checkDuplicateStrict = async (fieldName, value, label, element) => {
    if (!value) return;
    try {
      const res = await api.checkDuplicate(fieldName, value);
      if (res.exists) {
        const names = res.owners.map(o => `${o.name} (${o.type})`).join(', ');
        const msg = `${label} is already registered with: ${names}`;
        setErrors(prev => ({ ...prev, [fieldName]: msg }));
        toast.error(msg);
        if (element) engageTrap(element);
      }
    } catch { /* silent */ }
  };

  const checkDuplicateSoft = async (fieldName, value, label) => {
    if (!value) return;
    try {
      const res = await api.checkDuplicate(fieldName, value);
      if (res.exists) {
        const names = res.owners.map(o => `${o.name} (${o.type})`).join(', ');
        toast.info(`${label} is already used by: ${names}`);
      }
    } catch { /* silent */ }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));

    if (error) {
      toast.error(error);
      engageTrap(e.target);
      return;
    }

    releaseTrap();

    const strictFields = {
      gstin: 'GSTIN',
      pan: 'PAN',
      shortCode: 'Short Code',
      drugsBazaarId: 'DrugsBazaar ID',
    };
    if (strictFields[name] && value.trim()) {
      checkDuplicateStrict(name, value.trim(), strictFields[name], e.target);
      return;
    }

    const softFields = {
      email: 'Email',
      aadhaar: 'Aadhaar',
    };
    if (softFields[name] && value.trim()) {
      checkDuplicateSoft(name, value.trim(), softFields[name]);
    }
  };

  const handleRepChange = (index, field, value) => {
    const reps = [...formData.representatives];
    let processed = value;
    if (field === 'email') processed = value.toLowerCase();
    reps[index] = { ...reps[index], [field]: processed };
    setFormData(prev => ({ ...prev, representatives: reps }));
  };

  const handleRepBlur = (index, field, value, event) => {
    if (field === 'email') {
      const error = validateField('email', value);
      setErrors(prev => ({ ...prev, [`rep_email_${index}`]: error }));
      if (error) {
        toast.error(error);
        event && engageTrap(event.target);
      } else {
        releaseTrap();
        checkDuplicateSoft('email', value, 'Email');
      }
    }
  };

  return (
    <div ref={formRef} className="relative space-y-4">
      {isActive && (
        <div className="absolute inset-0 z-50 bg-transparent" />
      )}

      <BasicFields formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
      <TaxFields formData={formData} errors={errors} handleChange={handleChange} handleBlur={handleBlur} />

      <DrugLicenses
        formData={formData}
        licenseInput={licenseInput}
        setLicenseInput={setLicenseInput}
        licenseInputRef={licenseInputRef}
        editingLicenseIndex={editingLicenseIndex}
        handleLicenseInputBlur={handleLicenseInputBlur}
        handleAddOrUpdateLicense={handleAddOrUpdateLicense}
        handleEditLicense={handleEditLicense}
        cancelEditLicense={cancelEditLicense}
        removeDrugLicense={removeDrugLicense}
        errors={errors}
      />

      <AddressFields
        formData={formData} errors={errors}
        handleChange={handleChange} handleBlur={handleBlur}
        setFormData={setFormData} trapActive={isActive}
      />
      <ContactFields
        formData={formData} errors={errors}
        handleChange={handleChange} handleBlur={handleBlur}
        setFormData={setFormData}
        handleWhatsAppBlur={handleWhatsAppBlur}
      />
      <OptionalIds formData={formData} errors={errors} handleChange={handleChange} handleBlur={handleBlur} />
      <SettingsFields formData={formData} handleChange={handleChange} />
      <Representatives
        formData={formData} setFormData={setFormData}
        errors={errors}
        handleRepChange={handleRepChange}
        handleRepPhoneBlur={handleRepPhoneBlur}
        handleRepBlur={handleRepBlur}
        handleTollFreePrompt={handleTollFreePrompt}
      />

      <BankDetailsList
        bankDetails={formData.bankDetails}
        onChange={(newDetails) => setFormData(prev => ({ ...prev, bankDetails: newDetails }))}
        errors={errors}
        setErrors={setErrors}
        toast={toast}
        engageTrap={engageTrap}
        releaseTrap={releaseTrap}
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