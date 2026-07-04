// customers/modals/EditCustomerModal/index.jsx
import { useState } from 'react';
import { X }        from 'lucide-react';
import { toast }    from 'sonner';
import { api }      from '../../../../../services/api';
import { useScrollLock } from '../../../../../hooks/useBackHandler';
import { validateField } from '../AddCustomerModal/validation';
import { BasicInfoFields }         from '../AddCustomerModal/components/BasicInfoFields';
import { LegalFields }             from '../AddCustomerModal/components/LegalFields';
import { AddressFields }           from '../AddCustomerModal/components/AddressFields';
import { ContactsList }            from '../AddCustomerModal/components/ContactsList';
import { FinancialSettingsFields } from '../AddCustomerModal/components/FinancialSettingsFields';

/**
 * EditCustomerModal
 * Pre-populates every field from the existing client document.
 * Reuses every form component from AddCustomerModal — zero duplication.
 */
export const EditCustomerModal = ({ client, onClose, onSaved }) => {
  useScrollLock(true);

  // Map DB field names → form field names
  const toForm = (c) => ({
    establishmentName:      c.establishmentName  || '',
    businessType:           c.businessType        || 'Retail',
    status:                 c.status              || 'Active',
    gstin:                  c.gstin               || '',
    pan:                    c.panNumber           || '',
    aadhaar:                c.aadhaarNumber       || '',
    drugLicense20B:         c.drugLicense20B      || '',
    drugLicense21B:         c.drugLicense21B      || '',
    billingAddress:         c.billingAddress      || '',
    shippingAddress:        c.shippingAddress     || '',
    city:                   c.city                || '',
    district:               c.district            || '',
    pincode:                c.pincode             || '',
    state:                  c.state               || '',
    line:                   c.line                || '',
    creditLimit:            c.creditLimit         != null ? String(c.creditLimit) : '',
    paymentTermsDays:       c.paymentTermsDays    != null ? String(c.paymentTermsDays) : '',
    defaultDiscountPercent: c.defaultDiscountPercent != null ? String(c.defaultDiscountPercent) : '',
    contacts:               c.contacts?.length
      ? c.contacts
      : [{ name: '', designation: 'Owner', phone: '', email: '', isPrimary: true, prefersWhatsApp: true }],
  });

  const [formData, setFormData] = useState(() => toForm(client));
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processed = value;
    if (name === 'email') processed = value.toLowerCase();
    else if (['gstin', 'pan', 'aadhaar', 'pincode'].includes(name)) {
      processed = value.toUpperCase().replace(/\s/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: processed }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    if (error) toast.error(error);
  };

  const isValid = () => {
    if (!formData.establishmentName.trim()) { toast.error('Establishment name is required'); return false; }
    if (!formData.gstin.trim())              { toast.error('GSTIN is required'); return false; }
    if (!formData.billingAddress.trim())     { toast.error('Billing address is required'); return false; }
    if (!formData.contacts?.some(c => c.name.trim())) {
      toast.error('At least one contact name is required');
      return false;
    }
    let hasError = false;
    const newErrors = { ...errors };
    ['gstin','pan','aadhaar','pincode'].forEach(field => {
      if (formData[field]) {
        const err = validateField(field, formData[field]);
        if (err) { newErrors[field] = err; hasError = true; }
      }
    });
    formData.contacts?.forEach((c, i) => {
      if (c.email) {
        const err = validateField('email', c.email);
        if (err) { newErrors[`contact_email_${i}`] = err; hasError = true; }
      }
    });
    setErrors(newErrors);
    if (hasError) { toast.error('Please fix the highlighted fields'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!isValid()) return;
    setSaving(true);
    try {
      const payload = {
        establishmentName:      formData.establishmentName,
        businessType:           formData.businessType,
        status:                 formData.status,
        gstin:                  formData.gstin,
        panNumber:              formData.pan         || undefined,
        aadhaarNumber:          formData.aadhaar     || undefined,
        drugLicense20B:         formData.drugLicense20B  || undefined,
        drugLicense21B:         formData.drugLicense21B  || undefined,
        billingAddress:         formData.billingAddress,
        shippingAddress:        formData.shippingAddress || undefined,
        city:                   formData.city,
        district:               formData.district,
        pincode:                formData.pincode,
        state:                  formData.state,
        line:                   formData.line        || undefined,
        creditLimit:            formData.creditLimit            ? Number(formData.creditLimit) : 0,
        paymentTermsDays:       formData.paymentTermsDays       ? Number(formData.paymentTermsDays) : 0,
        defaultDiscountPercent: formData.defaultDiscountPercent ? Number(formData.defaultDiscountPercent) : 0,
        contacts:               formData.contacts.filter(c => c.name.trim()),
      };
      await api.updateClient(client._id, payload);
      toast.success('Customer updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-2xl flex flex-col" style={{ height: '85dvh' }}>
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b z-10">
          <h3 className="font-bold text-slate-900 text-xl">Edit Customer</h3>
          <button onClick={onClose}>
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <BasicInfoFields
            formData={formData} handleChange={handleChange}
            handleBlur={handleBlur} errors={errors}
          />
          <LegalFields
            formData={formData} 
            setFormData={setFormData}
            // We pass a dummy function because the Strict Fields are locked, so they can't trigger duplicates anyway!
            checkDuplicateStrict={async () => false} 
            isEditMode={true} // ✨ THIS ACTIVATES THE LOCKS
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
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl text-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
