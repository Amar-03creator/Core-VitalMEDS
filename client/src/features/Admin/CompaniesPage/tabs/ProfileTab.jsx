import { useState, useRef } from 'react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

import { api } from '../../../../services/api';
import { validateField } from '../../../../modals/AddCompanyModal/validation';
import { getCroppedImg } from '../../../../modals/AddProductModal/cropImageHelper';

// ✨ We import your flawlessly working AuthContext!
import { useAuth } from '../../../../context/AuthContext'; 
import { ProfileView } from '../components/ProfileView';
import { ProfileEdit } from '../components/ProfileEdit';

const emptyBank = { bankName: '', accountNumber: '', ifscCode: '', branch: '' };
const emptyRep = { name: '', role: '', phone: '', email: '' };

export const ProfileTab = ({ company, onCompanyUpdated }) => {
  // ✨ Extract the active user and the login function
  const { user, login } = useAuth(); 

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  
  const [form, setForm] = useState(() => toFormState(company));
  const [errors, setErrors] = useState({});
  const [vault, setVault] = useState({ isOpen: false, password: '' });

  const fileInputRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null); 
  const [logoPreview, setLogoPreview] = useState(company.logoUrl || null); 
  const [cropper, setCropper] = useState({ imageSrc: null, crop: { x: 0, y: 0 }, zoom: 1, rotation: 0, pixels: null });

  function toFormState(c) {
    return {
      companyName: c.companyName || '', shortCode: c.shortCode || '', gstin: c.gstin || '',
      pan: c.pan || '', drugLicenses: c.drugLicenses?.length ? c.drugLicenses : [''],
      drugLicenseExpiry: c.drugLicenseExpiry ? c.drugLicenseExpiry.split('T')[0] : '',
      email: c.email || '', whatsapp: c.whatsapp || '', billingAddress: c.billingAddress || '',
      city: c.city || '', state: c.state || '', pincode: c.pincode || '', aadhaar: c.aadhaar || '', 
      drugsBazaarId: c.drugsBazaarId || '', leadTimeDays: c.leadTimeDays ?? '',
      minimumOrderValue: c.minimumOrderValue ?? '',
      representatives: c.representatives?.length ? c.representatives : [{ ...emptyRep }],
      bankDetails: c.bankDetails || [],
    };
  }

  const startEditing = () => { setForm(toFormState(company)); setErrors({}); setLogoFile(null); setLogoPreview(company.logoUrl || null); setEditing(true); };
  const cancelEditing = () => { if (logoFile && logoPreview) URL.revokeObjectURL(logoPreview); setLogoFile(null); setLogoPreview(company.logoUrl || null); setEditing(false); setErrors({}); };

  const handleField = (name, value) => { setForm(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: null })); };

  const handleBlurValidate = async (name, value) => {
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err }));
    if (err || !value?.trim()) return;

    const strictFields = { gstin: 'GSTIN', pan: 'PAN', shortCode: 'Short Code', drugsBazaarId: 'DrugsBazaar ID' };
    if (strictFields[name]) {
      try {
        const res = await api.checkDuplicate(name, value.trim(), company._id);
        if (res.exists) {
          const names = res.owners.map(o => `${o.name} (${o.type})`).join(', ');
          const msg = `${strictFields[name]} is already registered with: ${names}`;
          setErrors(prev => ({ ...prev, [name]: msg })); toast.error(msg);
        }
      } catch { /* silent */ }
    }
  };

  const onLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('Please select an image smaller than 10MB');
    const reader = new FileReader();
    reader.addEventListener('load', () => setCropper({ ...cropper, imageSrc: reader.result }));
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropSave = async () => {
    if (!cropper.imageSrc || !cropper.pixels) return;
    setSaving(true);
    try {
      const croppedBlob = await getCroppedImg(cropper.imageSrc, cropper.pixels, cropper.rotation);
      const compressedFile = await imageCompression(croppedBlob, { maxSizeMB: 0.2, maxWidthOrHeight: 600, useWebWorker: true });
      const newPreview = URL.createObjectURL(compressedFile);
      if (logoFile && logoPreview) URL.revokeObjectURL(logoPreview); 
      setLogoFile(compressedFile); setLogoPreview(newPreview);
      setCropper({ imageSrc: null, crop: { x: 0, y: 0 }, zoom: 1, rotation: 0, pixels: null });
    } catch (err) { toast.error('Failed to crop image'); } finally { setSaving(false); }
  };

  const initiateSave = () => {
    if (!form.companyName.trim()) return toast.error('Company name is required.');
    if (!form.representatives.some(r => r.name && (r.phone || r.email))) return toast.error('At least one representative with name and phone/email is required.');
    if (Object.values(errors).some(Boolean)) return toast.error('Please fix the highlighted fields before saving.');
    if (logoFile) setVault({ isOpen: true, password: '' }); else executeSave();
  };

  // ✨ THE MAGIC TRICK: Verifying the password without changing backend or context!
  const verifyVaultPassword = async () => {
    setSaving(true);
    try {
      // 1. We silently pass the logged-in admin's email and the typed password
      // back into your perfectly working AWS login function.
      await login(user.email, vault.password); 
      
      // 2. If it succeeds, the password is correct!
      setVault({ isOpen: false, password: '' });
      await executeSave();
    } catch (error) {
      // 3. If it rejects, AWS caught a bad password!
      toast.error('Incorrect password. Authorization failed.');
      setSaving(false);
    }
  };

  const executeSave = async () => {
    setSaving(true);
    try {
      const payload = {
        companyName: form.companyName, shortCode: form.shortCode,
        representatives: form.representatives.filter(r => r.name),
        gstin: form.gstin, pan: form.pan,
        drugLicenses: form.drugLicenses.filter(l => l.trim()),
        drugLicenseExpiry: form.drugLicenseExpiry || undefined,
        email: form.email, whatsapp: form.whatsapp, billingAddress: form.billingAddress,
        city: form.city, state: form.state, pincode: form.pincode, aadhaar: form.aadhaar, 
        drugsBazaarId: form.drugsBazaarId,
        leadTimeDays: form.leadTimeDays ? parseInt(form.leadTimeDays) : undefined,
        minimumOrderValue: form.minimumOrderValue ? parseFloat(form.minimumOrderValue) : undefined,
        bankDetails: form.bankDetails.filter(b => b.bankName && b.accountNumber && b.ifscCode && b.branch),
      };

      if (logoFile) {
        const sigRes = await api.getUploadSignature(); 
        const { signature, timestamp, cloudName, apiKey } = sigRes.data || sigRes;
        const fd = new FormData();
        fd.append('file', logoFile); fd.append('api_key', apiKey); fd.append('timestamp', timestamp);
        fd.append('signature', signature); fd.append('folder', 'vitalmeds_products');
        
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
        const cloudData = await uploadRes.json();
        if (cloudData.secure_url) { payload.logoUrl = cloudData.secure_url; payload.logoPublicId = cloudData.public_id; }
        else throw new Error('Image upload failed');
      }

      const res = await api.updateCompany(company._id, payload);
      toast.success('Company profile updated.');
      onCompanyUpdated(res.data);
      setEditing(false);
    } catch (err) { toast.error(err.message || 'Failed to save'); } finally { setSaving(false); }
  };

  if (!editing) {
    return <ProfileView company={company} onStartEditing={startEditing} onToggleStatus={async () => { setStatusBusy(true); try { const res = await api.toggleCompanyStatus(company._id); toast.success(res.message); onCompanyUpdated(res.data); } catch (err) { toast.error(err.message); } finally { setStatusBusy(false); } }} statusBusy={statusBusy} />;
  }

  return (
    <ProfileEdit 
      form={form} errors={errors} saving={saving} logoPreview={logoPreview} cropper={cropper}
      vault={vault} setVault={setVault} verifyVaultPassword={verifyVaultPassword}
      onCancel={cancelEditing} onInitiateSave={initiateSave} onFieldChange={handleField} onBlurValidate={handleBlurValidate}
      onLogoSelect={onLogoSelect} setCropper={setCropper} handleCropSave={handleCropSave} fileInputRef={fileInputRef}
      updateRep={(i, f, v) => setForm(p => { const r = [...p.representatives]; r[i] = { ...r[i], [f]: v }; return { ...p, representatives: r }; })}
      setMainRep={(i) => setForm(p => { const r = [...p.representatives]; const [c] = r.splice(i, 1); r.unshift(c); return { ...p, representatives: r }; })}
      addRep={() => setForm(p => ({ ...p, representatives: [...p.representatives, { ...emptyRep }] }))}
      removeRep={(i) => setForm(p => ({ ...p, representatives: p.representatives.filter((_, idx) => idx !== i) }))}
      updateBank={(i, f, v) => setForm(p => { const b = [...p.bankDetails]; b[i] = { ...b[i], [f]: f === 'ifscCode' ? v.toUpperCase().replace(/\s/g, '') : v }; return { ...p, bankDetails: b }; })}
      addBank={() => setForm(p => ({ ...p, bankDetails: [...p.bankDetails, { ...emptyBank }] }))}
      removeBank={(i) => setForm(p => ({ ...p, bankDetails: p.bankDetails.filter((_, idx) => idx !== i) }))}
      updateLicense={(i, v) => setForm(p => { const l = [...p.drugLicenses]; l[i] = v.toUpperCase().replace(/\s/g, ''); return { ...p, drugLicenses: l }; })}
      addLicenseField={() => setForm(p => ({ ...p, drugLicenses: [...p.drugLicenses, ''] }))}
      removeLicenseField={(i) => setForm(p => ({ ...p, drugLicenses: p.drugLicenses.filter((_, idx) => idx !== i) }))}
    />
  );
};