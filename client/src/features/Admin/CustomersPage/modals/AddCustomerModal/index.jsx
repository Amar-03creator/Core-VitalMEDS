// customers/modals/AddCustomerModal/index.jsx
import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../../../services/api';
import { useModalTrap, useScrollLock } from '../../../../../hooks/useBackHandler';
import { validateField } from './validation';
import { CustomerFormStep }   from './CustomerFormStep';
import { CustomerReviewStep } from './CustomerReviewStep';

const STORAGE_KEY = 'addCustomerForm';

const INITIAL_FORM = {
  establishmentName: '', businessType: 'Retail', status: 'Pending',
  gstin: '', pan: '', aadhaar: '',
  drugLicenses: [], 
  billingAddress: '', shippingAddress: '',
  city: '', district: '', pincode: '', state: '', line: '',
  creditLimit: '', paymentTermsDays: '', defaultDiscountPercent: '',
  contacts: [{ name: '', designation: 'Owner', phone: '', email: '', isPrimary: true, prefersWhatsApp: true }],
};

export const AddCustomerModal = ({ onClose, onSave, disableBackTrap=false }) => {
  const load = () => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; }
  };
  const saved = load();

  const [step, setStep]         = useState(saved?.step ?? 'form');
  const [formData, setFormData] = useState(saved?.formData ?? { ...INITIAL_FORM });
  const [errors, setErrors]     = useState({}); 
  const [isSaving, setIsSaving] = useState(false); // ✨ NEW: Prevent Double Submits
  
  useScrollLock(true);
  useModalTrap(true, { disabled: disableBackTrap || isSaving, onBackClose: onClose });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, formData }));
  }, [step, formData]);

  const handleClose = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    onClose();
  };

  const isFormValid = () => {
    let hasError = false;
    const newErrors = {};

    // 1. Mandatory Core Fields
    if (!formData.establishmentName?.trim()) { toast.error('Establishment name is required'); return false; }
    if (!formData.gstin?.trim()) { toast.error('GSTIN is required'); return false; }
    if (!formData.billingAddress?.trim()) { toast.error('Billing address is required'); return false; }
    if (!formData.city?.trim() || !formData.district?.trim() || !formData.pincode?.trim()) { 
      toast.error('City, District, and Pincode are required'); return false; 
    }
    
    // 2. Strict Contacts Validation
    if (!formData.contacts || formData.contacts.length === 0) {
      toast.error('At least one contact is required');
      return false;
    }

    formData.contacts.forEach((c, i) => {
      if (!c.name?.trim()) {
        toast.error(`Contact ${i + 1}: Name is required`);
        hasError = true;
      }
      if (!c.phone?.trim()) {
        toast.error(`Contact ${i + 1}: Phone number is required`);
        hasError = true;
      } else {
        // ✨ FIXED: Actually tests the regex (must start with 6-9, be 10 digits)
        const phoneErr = validateField('phone', c.phone);
        if (phoneErr) {
          newErrors[`contact_phone_${i}`] = phoneErr;
          hasError = true;
        }
      }
      if (c.email) {
        const emailErr = validateField('email', c.email);
        if (emailErr) {
          newErrors[`contact_email_${i}`] = emailErr;
          hasError = true;
        }
      }
    });

    // 3. Strict Fields Sanity Check
    const strictFields = ['gstin', 'pan', 'aadhaar', 'pincode'];
    for (let field of strictFields) {
      if (formData[field]) {
        const err = validateField(field, formData[field]);
        if (err) { newErrors[field] = err; hasError = true; }
      }
    }

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
    if (isSaving) return;
    setIsSaving(true);

    const payload = {
      ...formData,
      creditLimit: formData.creditLimit ? Number(formData.creditLimit) : 0,
      paymentTermsDays: formData.paymentTermsDays ? Number(formData.paymentTermsDays) : 0,
      defaultDiscountPercent: formData.defaultDiscountPercent ? Number(formData.defaultDiscountPercent) : 0,
      contacts: formData.contacts.filter(c => c.name.trim()),
    };

    try {
      await api.createClient(payload);
      toast.success('Customer added successfully');
      sessionStorage.removeItem(STORAGE_KEY);
      onSave();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save customer');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end overscroll-none">
      <div className="w-full bg-white rounded-t-2xl flex flex-col" style={{ height: '85dvh' }}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b z-10">
          <h3 className="font-bold text-slate-900 text-xl">
            {step === 'form' ? 'Add New Customer' : 'Review Customer'}
          </h3>
          <button onClick={handleClose} disabled={isSaving}>
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3">
          {['form', 'review'].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${step === s || (s === 'form' && step === 'review') ? 'bg-slate-900' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {step === 'form' ? (
            <CustomerFormStep
              formData={formData} setFormData={setFormData}
              errors={errors} setErrors={setErrors} 
              toast={toast}
              goToReview={goToReview}
            />
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <CustomerReviewStep formData={formData} />
              </div>
              
              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100 bg-white sticky bottom-0">
                <button
                  onClick={() => setStep('form')}
                  disabled={isSaving}
                  className="flex-1 bg-slate-100 py-3.5 rounded-xl font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-emerald-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-70"
                >
                  {isSaving ? (
                    <><Loader2 size={18} className="animate-spin" /> Saving...</>
                  ) : (
                    'Confirm & Save'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};