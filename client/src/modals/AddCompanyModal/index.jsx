import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { useModalTrap, useScrollLock } from '../../hooks/useBackHandler';
import { validateField } from './validation';
import { FormStep } from './FormStep';
import { ReviewStep } from './ReviewStep';

const STORAGE_KEY = 'addCompanyForm';
const initialRep = { name: '', phone: '', email: '', role: '' };

export const AddCompanyModal = ({ onClose, onSave, disableBackTrap=false }) => {
  const load = () => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; }
  };
  const saved = load();

  const [step, setStep] = useState(saved?.step ?? 'form');
  useScrollLock(true);
  useModalTrap(true, { disabled: disableBackTrap, onBackClose: onClose });

  const [formData, setFormData] = useState(saved?.formData ?? {
    supplierName: '', shortCode: '', status: 'Active',
    gstin: '', drugLicenses: [''], drugLicenseExpiry: '',
    billingAddress: '', city: '', state: '', pincode: '',
    email: '', whatsapp: '', pan: '', aadhaar: '', drugsBazaarId: '',
    leadTimeDays: '', minimumOrderValue: '',
    representatives: [{ ...initialRep }],
    bankDetails: [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, formData }));
  }, [step, formData]);

  const handleClose = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    onClose();
  };

  const isFormValid = () => {
    if (!formData.supplierName.trim()) {
      toast.error('Supplier name is required');
      return false;
    }
    const requiredRep = formData.representatives.some(rep => rep.name && (rep.phone || rep.email));
    if (!requiredRep) {
      toast.error('At least one representative with name and phone/email is required');
      return false;
    }

    let hasError = false;
    const newErrors = { ...errors };

    // Optional fields
    const optionalFields = ['gstin', 'pan', 'aadhaar', 'email', 'whatsapp', 'drugsBazaarId', 'pincode'];
    optionalFields.forEach(field => {
      const val = formData[field];
      if (val) {
        const err = validateField(field, val);
        if (err) { newErrors[field] = err; hasError = true; }
      }
    });

    // Representatives
    formData.representatives.forEach((rep, i) => {
      if (rep.phone) {
        const err = validateField('phone', rep.phone);
        if (err) { newErrors[`rep_phone_${i}`] = err; hasError = true; }
      }
      if (rep.email) {
        const err = validateField('email', rep.email);
        if (err) { newErrors[`rep_email_${i}`] = err; hasError = true; }
      }
    });

    // Bank details: completeness + format
    formData.bankDetails.forEach((b, i) => {
      const hasAny = b.bankName || b.accountNumber || b.ifscCode || b.branch;
      const hasAll = b.bankName && b.accountNumber && b.ifscCode && b.branch;
      if (hasAny && !hasAll) {
        newErrors[`bank_${i}`] = 'All bank fields are required for this entry.';
        hasError = true;
      }
      // Account number format (9-18 digits)
      if (b.accountNumber) {
        if (!/^\d{9,18}$/.test(b.accountNumber)) {
          newErrors[`bank_${i}_accountNumber`] = 'Account number must be 9-18 digits.';
          hasError = true;
        } else {
          delete newErrors[`bank_${i}_accountNumber`];
        }
      }
      // IFSC format (4 letters, zero, 6 alphanumeric)
      if (b.ifscCode) {
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(b.ifscCode.toUpperCase())) {
          newErrors[`bank_${i}_ifscCode`] = 'Invalid IFSC (e.g., SBIN0001234).';
          hasError = true;
        } else {
          delete newErrors[`bank_${i}_ifscCode`];
        }
      }
    });

    setErrors(newErrors);
    if (hasError) {
      toast.error('Please fix the highlighted fields');
      return false;
    }
    return true;
  };

  const goToReview = () => {
    if (!isFormValid()) return;
    setStep('review');
  };

  const handleSave = async () => {
    const payload = {
      companyName:       formData.supplierName,
      shortCode:         formData.shortCode,
      status:            formData.status,
      representatives:   formData.representatives,
      gstin:             formData.gstin,
      pan:               formData.pan,
      drugLicenses:      formData.drugLicenses.filter(l => l.trim()),
      drugLicenseExpiry: formData.drugLicenseExpiry || undefined,
      email:             formData.email,
      whatsapp:          formData.whatsapp,
      phone:             formData.phone || formData.representatives[0]?.phone,
      billingAddress:    formData.billingAddress,
      city:              formData.city,
      state:             formData.state,
      pincode:           formData.pincode,
      aadhaar:           formData.aadhaar,
      drugsBazaarId:     formData.drugsBazaarId,
      leadTimeDays:      formData.leadTimeDays ? parseInt(formData.leadTimeDays) : undefined,
      minimumOrderValue: formData.minimumOrderValue ? parseFloat(formData.minimumOrderValue) : undefined,
      // Only send complete and valid bank entries (already validated by isFormValid)
      bankDetails:       formData.bankDetails.filter(b => b.bankName && b.accountNumber && b.ifscCode && b.branch),
    };

    try {
      await api.createCompany(payload);
      toast.success('Supplier saved successfully');
      sessionStorage.removeItem(STORAGE_KEY);
      onSave();
      onClose();
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-2xl flex flex-col" style={{ height: '85dvh' }}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b z-10">
          <h3 className="font-bold text-slate-900 text-xl">
            {step === 'form' ? 'Add New Supplier' : 'Review Supplier'}
          </h3>
          <button onClick={handleClose}><X size={24} className="text-slate-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {step === 'form' ? (
            <FormStep
              formData={formData} setFormData={setFormData}
              errors={errors} setErrors={setErrors}
              toast={toast}
              goToReview={goToReview}
            />
          ) : (
            <ReviewStep
              formData={formData}
              onEdit={() => setStep('form')}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </div>
  );
};