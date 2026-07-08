import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Pill, ChevronLeft, ChevronRight, Building2, User, FileText,
  MapPin, Mail, Phone, Lock, Eye, EyeOff, Upload, CheckCircle2,
  AlertCircle, Info, Shield, ArrowRight, Check
} from 'lucide-react';

/* ── STEP CONFIG ── */
const STEPS = [
  { id: 1, label: 'Business',  icon: Building2 },
  { id: 2, label: 'Documents', icon: FileText },
  { id: 3, label: 'Account',   icon: User },
  { id: 4, label: 'Address',   icon: MapPin },
];

/* ── FILE UPLOAD BUTTON (optional) ── */
const FileUploadBox = ({ label, hint, value, onChange, accept = '.pdf,.jpg,.jpeg,.png' }) => {
  const ref = useRef();
  return (
    <div>
      <label className="text-slate-600 text-xs font-semibold block mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed text-left transition-all
          ${value ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
      >
        {value ? (
          <>
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-emerald-700 text-sm font-semibold truncate">{value.name}</p>
              <p className="text-emerald-600 text-xs">{(value.size / 1024).toFixed(0)} KB</p>
            </div>
          </>
        ) : (
          <>
            <Upload size={18} className="text-slate-400 shrink-0" />
            <div>
              <p className="text-slate-600 text-sm font-semibold">Upload {label}</p>
              <p className="text-slate-400 text-xs">{hint || 'PDF, JPG or PNG · Max 5MB (optional)'}</p>
            </div>
          </>
        )}
      </button>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => onChange(e.target.files?.[0] || null)} />
    </div>
  );
};

/* ── FIELD COMPONENT ── */
const Field = ({ label, required, error, children }) => (
  <div>
    <label className="text-slate-700 text-sm font-semibold block mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
  </div>
);

const inputClass = "w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all";
const selectClass = `${inputClass} cursor-pointer`;

/* ── MAIN PAGE ── */
const RegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  /* ── FORM STATE ── */
  const [form, setForm] = useState({
    // Step 1 - Business
    establishmentName: '',
    ownerName: '',
    designation: 'Owner',
    businessType: 'Retail',
    // Step 2 - Documents
    docType: 'gstin',  // 'gstin' | 'aadhaar'
    gstin: '',
    drugLicense20B: '',
    drugLicense21B: '',
    aadhaar: '',
    pan: '',
    gstCertFile: null,
    dlFile: null,
    aadhaarFile: null,
    panFile: null,
    // Step 3 - Account
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Step 4 - Address
    billingAddress: '',
    sameAsBilling: true,           // NEW: checkbox for same address
    shippingAddress: '',           // NEW: separate delivery address
    city: '',
    district: '',
    pincode: '',
    agreed: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  /* ── VALIDATION ── */
  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!form.establishmentName.trim()) errs.establishmentName = 'Required';
      if (!form.ownerName.trim()) errs.ownerName = 'Required';
    }
    if (step === 2) {
      if (form.docType === 'gstin') {
        if (!form.gstin.trim()) errs.gstin = 'GSTIN is required';
        else if (form.gstin.length !== 15) errs.gstin = 'GSTIN must be 15 characters';
        if (!form.drugLicense20B.trim()) errs.drugLicense20B = 'Drug License No. (Form 20B) is required';
      } else {
        if (!form.aadhaar.trim()) errs.aadhaar = 'Aadhaar No. is required';
        else if (form.aadhaar.replace(/\s/g, '').length !== 12) errs.aadhaar = 'Aadhaar must be 12 digits';
      }
    }
    if (step === 3) {
      if (!form.email.trim()) errs.email = 'Required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
      if (!form.phone.trim()) errs.phone = 'Required';
      else if (form.phone.replace(/\D/g, '').length !== 10) errs.phone = 'Enter 10-digit number';
      if (!form.password) errs.password = 'Required';
      else if (form.password.length < 8) errs.password = 'Min 8 characters';
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    if (step === 4) {
      if (!form.billingAddress.trim()) errs.billingAddress = 'Required';
      if (!form.city.trim()) errs.city = 'Required';
      if (!form.pincode.trim()) errs.pincode = 'Required';
      else if (form.pincode.length !== 6) errs.pincode = '6-digit PIN code';
      if (!form.sameAsBilling && !form.shippingAddress.trim()) {
        errs.shippingAddress = 'Delivery address is required when not same as billing';
      }
      if (!form.agreed) errs.agreed = 'Please accept the terms';
    }
    return errs;
  };

  const goNext = () => {
    const errs = validateStep(currentStep);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    if (currentStep < 4) setCurrentStep(s => s + 1);
    else handleSubmit();
  };

  const goBack = () => {
    setErrors({});
    setCurrentStep(s => s - 1);
  };

  const handleSubmit = async () => {
    try {
      // 1. Package the form state into the payload our backend expects
      const payload = {
        establishmentName: form.establishmentName,
        ownerName: form.ownerName,
        designation: form.designation,
        businessType: form.businessType,
        email: form.email,
        phone: form.phone,
        password: form.password,
        billingAddress: form.billingAddress,
        shippingAddress: form.sameAsBilling ? form.billingAddress : form.shippingAddress,
        city: form.city,
        district: form.district,
        pincode: form.pincode,
        gstin: form.docType === 'gstin' ? form.gstin : null,
        drugLicense20B: form.docType === 'gstin' ? form.drugLicense20B : null,
        drugLicense21B: form.docType === 'gstin' ? form.drugLicense21B : null,
        aadhaar: form.docType === 'aadhaar' ? form.aadhaar : null,
        pan: form.docType === 'aadhaar' ? form.pan : null,
      };

      // 2. Send it to your Node.js backend
      // (Change 5000 to whatever port your backend is running on)
      const response = await axios.post('http://localhost:5000/api/auth/register', payload);

      // 3. Show the success screen!
      if (response.data.success) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      // Grab the error message from our backend (e.g., "Email already exists")
      const errorMessage = error.response?.data?.message || 'Something went wrong. Please try again.';
      alert(errorMessage); 
    }
  };

  /* ── SUCCESS STATE ── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-5 py-10">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-sm w-full shadow-lg">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-slate-900 text-2xl font-black mb-2">Registration Submitted!</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Your account for <span className="font-bold text-slate-700">{form.establishmentName}</span> is under review. We'll verify your documents and notify you within 24 hours.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-6 text-left">
            <p className="text-amber-700 text-xs font-semibold mb-1">⏳ What happens next?</p>
            <ul className="text-amber-700 text-xs space-y-0.5">
              <li>• Our team reviews your documents</li>
              <li>• You receive an approval email</li>
              <li>• Log in and start placing orders</li>
            </ul>
          </div>
          <Link to="/login" className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl">
            Go to Login <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Pill size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none">VitalMEDS</p>
            <p className="text-emerald-400 text-[9px] font-semibold tracking-widest uppercase">Register</p>
          </div>
        </Link>
        <Link to="/login" className="text-slate-400 text-sm font-medium hover:text-white transition-colors">
          Sign in →
        </Link>
      </div>

      {/* Progress bar (unchanged) */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = currentStep > s.id;
              const active = currentStep === s.id;
              return (
                <div key={s.id} className="flex items-center">
                  <div className={`flex flex-col items-center gap-1`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
                      ${done ? 'bg-emerald-500' : active ? 'bg-slate-900' : 'bg-slate-100'}`}>
                      {done
                        ? <Check size={16} className="text-white" />
                        : <Icon size={15} className={active ? 'text-white' : 'text-slate-400'} />
                      }
                    </div>
                    <span className={`text-[10px] font-semibold ${active ? 'text-slate-900' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-4 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} style={{ width: 28 }} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 px-5 py-6 max-w-md mx-auto w-full">

        {/* STEP 1,2,3 unchanged – same as previous version */}
        {/* ... (keep the same code for steps 1,2,3 as in the previous answer) ... */}

        {/* ── STEP 1: Business Info ── */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-slate-900 text-2xl font-black">Business Information</h2>
              <p className="text-slate-500 text-sm mt-1">Tell us about your pharmacy</p>
            </div>

            <Field label="Establishment Name" required error={errors.establishmentName}>
              <input value={form.establishmentName} onChange={e => set('establishmentName', e.target.value)}
                placeholder="e.g. Sharma Medical Stores" className={inputClass} />
            </Field>

            <Field label="Owner / Proprietor Name" required error={errors.ownerName}>
              <input value={form.ownerName} onChange={e => set('ownerName', e.target.value)}
                placeholder="Full legal name" className={inputClass} />
            </Field>

            <Field label="Designation" error={errors.designation}>
              <select value={form.designation} onChange={e => set('designation', e.target.value)} className={selectClass}>
                {['Owner', 'Proprietor', 'Manager', 'Partner'].map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>

            <Field label="Business Type" required error={errors.businessType}>
              <div className="grid grid-cols-3 gap-2">
                {['Retail', 'Wholesale', 'Hospital'].map(t => (
                  <button key={t} type="button" onClick={() => set('businessType', t)}
                    className={`py-3 rounded-2xl text-sm font-semibold border transition-all
                      ${form.businessType === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* ── STEP 2: Documents ── */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-slate-900 text-2xl font-black">Legal Documents</h2>
              <p className="text-slate-500 text-sm mt-1">Required for verification. At least one set needed.</p>
            </div>

            <div>
              <label className="text-slate-700 text-sm font-semibold block mb-2">Document Type</label>
              <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
                {[
                  { key: 'gstin', label: 'GSTIN + Drug License' },
                  { key: 'aadhaar', label: 'Aadhaar + PAN' },
                ].map(({ key, label }) => (
                  <button key={key} type="button" onClick={() => set('docType', key)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all
                      ${form.docType === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {form.docType === 'gstin' ? (
              <>
                <Field label="GSTIN" required error={errors.gstin}>
                  <input value={form.gstin} onChange={e => set('gstin', e.target.value.toUpperCase())}
                    placeholder="15-character GSTIN" maxLength={15} className={inputClass} />
                </Field>
                <Field label="Drug License No. (Form 20B)" required error={errors.drugLicense20B}>
                  <input value={form.drugLicense20B} onChange={e => set('drugLicense20B', e.target.value)}
                    placeholder="e.g. OD-XXXX-XXXX" className={inputClass} />
                </Field>
                <Field label="Drug License No. (Form 21B)" error={errors.drugLicense21B}>
                  <input value={form.drugLicense21B} onChange={e => set('drugLicense21B', e.target.value)}
                    placeholder="Retail License (optional)" className={inputClass} />
                </Field>
                <FileUploadBox label="Drug License Document" hint="Upload Form 20B/21B · PDF or image (optional)"
                  value={form.dlFile} onChange={f => set('dlFile', f)} />
                <FileUploadBox label="GST Certificate" hint="Optional"
                  value={form.gstCertFile} onChange={f => set('gstCertFile', f)} />
              </>
            ) : (
              <>
                <Field label="Aadhaar Number" required error={errors.aadhaar}>
                  <input value={form.aadhaar} onChange={e => set('aadhaar', e.target.value)}
                    placeholder="XXXX XXXX XXXX" maxLength={14} className={inputClass} />
                </Field>
                <Field label="PAN Number" error={errors.pan}>
                  <input value={form.pan} onChange={e => set('pan', e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F" maxLength={10} className={inputClass} />
                </Field>
                <FileUploadBox label="Aadhaar Card" hint="Optional" value={form.aadhaarFile} onChange={f => set('aadhaarFile', f)} />
                <FileUploadBox label="PAN Card" hint="Optional" value={form.panFile} onChange={f => set('panFile', f)} />
              </>
            )}

            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
              <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-blue-700 text-xs leading-relaxed">
                Documents are stored securely in encrypted cloud storage and used only for KYC verification.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 3: Account ── */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-slate-900 text-2xl font-black">Account Details</h2>
              <p className="text-slate-500 text-sm mt-1">Create your login credentials</p>
            </div>

            <Field label="Business Email" required error={errors.email}>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="your@pharmacy.com" className={`${inputClass} pl-10`} />
              </div>
            </Field>

            <Field label="Mobile Number" required error={errors.phone}>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="10-digit mobile number" maxLength={10} className={`${inputClass} pl-10`} />
              </div>
            </Field>

            <Field label="Password" required error={errors.password}>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Min. 8 characters" className={`${inputClass} pl-10 pr-12`} />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Field label="Confirm Password" required error={errors.confirmPassword}>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)}
                  placeholder="Re-enter password" className={`${inputClass} pl-10 pr-12`} />
                <button type="button" onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
              <Shield size={14} className="text-slate-500 shrink-0 mt-0.5" />
              <p className="text-slate-600 text-xs leading-relaxed">
                Use a strong, unique password. This account controls your pharmacy's ordering and billing data.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 4: Address (with same-as-billing checkbox) ── */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-slate-900 text-2xl font-black">Business Address</h2>
              <p className="text-slate-500 text-sm mt-1">For invoicing and delivery</p>
            </div>

            <Field label="Billing Address" required error={errors.billingAddress}>
              <textarea value={form.billingAddress} onChange={e => set('billingAddress', e.target.value)}
                placeholder="Shop no., street, locality..." rows={2}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none" />
            </Field>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <button
                type="button"
                onClick={() => set('sameAsBilling', !form.sameAsBilling)}
                className="flex items-start gap-3 w-full text-left"
              >
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
                  ${form.sameAsBilling ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
                  {form.sameAsBilling && <Check size={12} className="text-white" />}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Delivery address is same as billing address
                </p>
              </button>
            </div>

            {!form.sameAsBilling && (
              <Field label="Delivery Address" required error={errors.shippingAddress}>
                <textarea value={form.shippingAddress} onChange={e => set('shippingAddress', e.target.value)}
                  placeholder="Different shop address, warehouse, etc." rows={2}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none" />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="City / Town" required error={errors.city}>
                <input value={form.city} onChange={e => set('city', e.target.value)}
                  placeholder="e.g. Cuttack" className={inputClass} />
              </Field>
              <Field label="PIN Code" required error={errors.pincode}>
                <input value={form.pincode} onChange={e => set('pincode', e.target.value)}
                  placeholder="6-digit PIN" maxLength={6} className={inputClass} />
              </Field>
            </div>

            <Field label="District" error={errors.district}>
              <select value={form.district} onChange={e => set('district', e.target.value)} className={selectClass}>
                <option value="">Select district</option>
                {['Cuttack', 'Bhubaneswar', 'Puri', 'Kendrapara', 'Jajpur', 'Khordha', 'Balasore', 'Ganjam', 'Gajapati', 'Other'].map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>

            {/* Agreement */}
            <div className={`rounded-2xl border-2 p-4 ${errors.agreed ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
              <button type="button" onClick={() => set('agreed', !form.agreed)}
                className="flex items-start gap-3 w-full text-left">
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
                  ${form.agreed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
                  {form.agreed && <Check size={12} className="text-white" />}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  I confirm that all information provided is accurate and I agree to the{' '}
                  <span className="text-emerald-600 font-semibold">Terms of Service</span> and{' '}
                  <span className="text-emerald-600 font-semibold">Privacy Policy</span> of VitalMEDS / Mila Agencies.
                </p>
              </button>
              {errors.agreed && <p className="text-red-600 text-xs mt-2 ml-8">{errors.agreed}</p>}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-8">
          {currentStep > 1 && (
            <button onClick={goBack}
              className="flex items-center gap-1.5 bg-white text-slate-600 font-semibold py-3.5 px-5 rounded-2xl border border-slate-200 text-sm hover:bg-slate-50 transition-all">
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <button onClick={goNext}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg transition-all active:scale-[0.98]">
            {currentStep < 4
              ? <><span>Continue</span> <ChevronRight size={16} /></>
              : <><span>Submit Registration</span> <ArrowRight size={16} /></>
            }
          </button>
        </div>

        <p className="text-center text-slate-500 text-sm mt-5">
          Already registered?{' '}
          <Link to="/login" className="text-emerald-600 font-bold hover:text-emerald-500">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;