// src/pages/Public/RegistrationPage.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight, ArrowRight, Building2, User, FileText, MapPin } from 'lucide-react';

import StepProgress from '../../features/Common/Registration/StepProgress';
import BusinessStep from '../../features/Common/Registration/Steps/BusinessStep';
import DocumentsStep from '../../features/Common/Registration/Steps/DocumentsStep';
import AccountStep from '../../features/Common/Registration/Steps/AccountStep';
import AddressStep from '../../features/Common/Registration/Steps/AddressStep';
import OtpModal from '../../features/Common/Registration/OtpModal';
import SuccessState from '../../features/Common/Registration/SuccessState';
import LegalModal from '../../features/Common/Registration/LegalModal';
import Navbar from '@/layouts/common/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// ── Shared Tailwind classes ──────────────────────────────────────────
const inputClass =
  "w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all";
const selectClass = `${inputClass} cursor-pointer`;

const STEPS = [
  { id: 1, label: 'Business',  icon: Building2 },
  { id: 2, label: 'Documents', icon: FileText },
  { id: 3, label: 'Account',   icon: User },
  { id: 4, label: 'Address',   icon: MapPin },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [legalModal, setLegalModal] = useState(null);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [form, setForm] = useState({
    establishmentName: '', ownerName: '', designation: 'Owner', businessType: 'Retail',
    gstin: '', aadhaar: '', pan: '',
    drugLicenses: [''],
    email: '', phone: '', password: '', confirmPassword: '',
    billingAddress: '', sameAsBilling: true, shippingAddress: '', city: '', district: '', pincode: '', agreed: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const handleDlChange = (index, value) => {
    const cleanValue = value.replace(/\s/g, '').toUpperCase();
    const newDls = [...form.drugLicenses];
    newDls[index] = cleanValue;
    set('drugLicenses', newDls);
  };

  const addDlField = () => setForm(f => ({ ...f, drugLicenses: [...f.drugLicenses, ''] }));
  const removeDlField = (index) => {
    const newDls = form.drugLicenses.filter((_, i) => i !== index);
    set('drugLicenses', newDls);
  };

  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!form.establishmentName.trim()) errs.establishmentName = 'Required';
      if (!form.ownerName.trim()) errs.ownerName = 'Required';
    }
    if (step === 2) {
      if (!form.pan.trim() && !form.aadhaar.trim()) {
        errs.identity = 'You must provide either a PAN or an Aadhaar Number.';
      }
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      const aadhaarRegex = /^[2-9][0-9]{11}$/;
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{2}[0-9A-Z]{1}$/;

      if (form.pan.trim() && !panRegex.test(form.pan.trim()))
        errs.pan = 'PAN must be 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)';
      if (form.aadhaar.trim() && !aadhaarRegex.test(form.aadhaar.trim()))
        errs.aadhaar = 'Aadhaar must be 12 digits starting with 2‑9 (e.g., 234567890123)';
      if (form.gstin.trim() && !gstinRegex.test(form.gstin.trim()))
        errs.gstin = 'GSTIN must follow 22AAAAA0000A1Z5 format';

      const dlValues = form.drugLicenses.filter(v => v.trim() !== '');
      if (new Set(dlValues).size !== dlValues.length)
        errs.drugLicenses = 'Duplicate Drug License numbers are not allowed.';
    }
    if (step === 3) {
      if (!form.email.trim()) errs.email = 'Required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
      if (!form.phone.trim()) errs.phone = 'Required';
      else if (form.phone.replace(/\D/g, '').length !== 10) errs.phone = 'Enter 10-digit number';

      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
      if (!form.password) errs.password = 'Required';
      else if (!passwordRegex.test(form.password))
        errs.password = 'Use 8+ chars, 1 letter, 1 number & 1 sign (@, -, ., etc)';
      if (!form.confirmPassword) errs.confirmPassword = 'Required';
      else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    if (step === 4) {
      if (!form.billingAddress.trim()) errs.billingAddress = 'Required';
      if (!form.city.trim()) errs.city = 'Required';
      if (!form.pincode.trim()) errs.pincode = 'Required';
      else if (form.pincode.length !== 6) errs.pincode = '6-digit PIN code';
      if (!form.sameAsBilling && !form.shippingAddress.trim())
        errs.shippingAddress = 'Delivery address is required when not same as billing';
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
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register-init`, {
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      if (response.data.success) setShowOtpModal(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) return;
    setIsVerifying(true);
    try {
      const cleanDrugLicenses = form.drugLicenses.filter(v => v.trim() !== '');
      const payload = {
        otp,
        establishmentName: form.establishmentName,
        ownerName: form.ownerName,
        designation: form.designation,
        businessType: form.businessType,
        email: form.email,
        phone: form.phone,
        billingAddress: form.billingAddress,
        shippingAddress: form.sameAsBilling ? form.billingAddress : form.shippingAddress,
        city: form.city,
        district: form.district,
        pincode: form.pincode,
        gstin: form.gstin.trim() ? form.gstin : null,
        pan: form.pan.trim() ? form.pan : null,
        aadhaar: form.aadhaar.trim() ? form.aadhaar.replace(/\s/g, '') : null,
        drugLicenses: cleanDrugLicenses,
      };
      const response = await axios.post(`${API_BASE_URL}/api/auth/register-verify`, payload);
      if (response.data.success) {
        setShowOtpModal(false);
        setSubmitted(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (submitted) return <SuccessState establishmentName={form.establishmentName} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
      {showOtpModal && (
        <OtpModal
          email={form.email}
          otp={otp}
          onChange={setOtp}
          onVerify={handleVerifyOtp}
          onClose={() => setShowOtpModal(false)}
          isVerifying={isVerifying}
        />
      )}

      <Navbar />
      <StepProgress currentStep={currentStep} steps={STEPS} />

      <div className="flex-1 px-5 py-6 max-w-md mx-auto w-full">
        {currentStep === 1 && (
          <BusinessStep
            form={form} set={set} errors={errors}
            inputClass={inputClass} selectClass={selectClass}
          />
        )}
        {currentStep === 2 && (
          <DocumentsStep
            form={form} set={set} errors={errors}
            handleDlChange={handleDlChange} addDlField={addDlField} removeDlField={removeDlField}
            inputClass={inputClass}
          />
        )}
        {currentStep === 3 && (
          <AccountStep
            form={form} set={set} errors={errors}
            showPassword={showPassword} setShowPassword={setShowPassword}
            showConfirm={showConfirm} setShowConfirm={setShowConfirm}
            inputClass={inputClass}
          />
        )}
        {currentStep === 4 && (
          <AddressStep
            form={form} set={set} errors={errors}
            setLegalModal={setLegalModal}
            inputClass={inputClass} selectClass={selectClass}
          />
        )}

        <div className="flex gap-3 mt-8">
          {currentStep > 1 && (
            <button
              onClick={goBack}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 bg-white text-slate-600 font-semibold py-3.5 px-5 rounded-2xl border border-slate-200 text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <button
            onClick={goNext}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait hover:bg-slate-800"
          >
            {isSubmitting ? (
              <span>Sending OTP...</span>
            ) : currentStep < 4 ? (
              <><span>Continue</span> <ChevronRight size={16} /></>
            ) : (
              <><span>Submit Registration</span> <ArrowRight size={16} /></>
            )}
          </button>
        </div>

        <p className="text-center text-slate-500 text-sm mt-5">
          Already registered?{' '}
          <Link to="/login" className="text-emerald-600 font-bold hover:text-emerald-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;