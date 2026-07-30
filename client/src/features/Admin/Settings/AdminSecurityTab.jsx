import { useState } from 'react';
import { Lock, Mail, Phone, ShieldCheck, Check, Loader2, Eye, EyeOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';

const AdminSecurityTab = ({ admin }) => {
  const { authAxios, changePassword, updateCognitoContact, verifyContactOtp, logout } = useAuth();

  const originalEmail = admin?.email || '';
  const originalPhone = admin?.phone || '';

  const [contactForm, setContactForm] = useState({ email: originalEmail, phone: originalPhone });
  const [savingContact, setSavingContact] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleContactInitiate = async (e) => {
    e.preventDefault();
    if (contactForm.email === originalEmail && contactForm.phone === originalPhone) {
      return toast.info('No changes made.');
    }

    setSavingContact(true);
    try {
      const emailChanged = contactForm.email !== originalEmail;

      if (emailChanged) {
        await authAxios.post('/api/admin/me/contact/precheck', { email: contactForm.email });
      }

      await updateCognitoContact(emailChanged ? contactForm.email : null, contactForm.phone !== originalPhone ? contactForm.phone : null);

      if (emailChanged) {
        toast.success(`Verification code sent to ${contactForm.email}`);
        setShowOtpModal(true);
      } else {
        await authAxios.put('/api/admin/me/contact', contactForm);
        toast.success('Phone number updated successfully.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update contact details.');
    } finally {
      setSavingContact(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpCode.length < 6) return toast.error('Please enter the 6-digit code.');

    setVerifyingOtp(true);
    try {
      await verifyContactOtp('email', otpCode);
      await authAxios.put('/api/admin/me/contact', contactForm);

      toast.success('Email verified and updated successfully! Logging you out to refresh your session...');
      setShowOtpModal(false);
      setOtpCode('');
      setTimeout(() => logout(), 2500);
    } catch (err) {
      toast.error(err.message || 'Invalid or expired verification code.');
      setVerifyingOtp(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match!');
    }
    if (passwordForm.newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters long.');
    }

    setSavingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password changed successfully! Logging you out to verify new credentials...');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => logout(), 2500);
    } catch (err) {
      toast.error(err.message || 'Failed to change password. Check your current password.');
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <ShieldCheck size={24} className="text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-emerald-900 font-bold text-base">Admin Security</h3>
          <p className="text-emerald-800 text-sm mt-1 leading-relaxed">
            Your admin credentials are secured by AWS. If you change your email, you will need to verify it with a 6-digit code.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-slate-800 font-bold text-lg mb-4">Login & Contact Details</h2>
        <form onSubmit={handleContactInitiate} className="space-y-4">
          <div>
            <label className="text-slate-500 text-sm font-medium flex items-center gap-1.5 mb-1.5">
              <Mail size={14} /> Login Email Address
            </label>
            <input
              type="email"
              required
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              className="w-full text-slate-900 text-base font-medium border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-slate-500 text-sm font-medium flex items-center gap-1.5 mb-1.5">
              <Phone size={14} /> Phone Number
            </label>
            <input
              type="tel"
              required
              value={contactForm.phone}
              onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
              className="w-full text-slate-900 text-base font-medium border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingContact || (contactForm.email === originalEmail && contactForm.phone === originalPhone)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {savingContact ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Update Details
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-slate-800 font-bold text-lg mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="text-slate-500 text-sm font-medium flex items-center gap-1.5 mb-1.5">
              <Lock size={14} /> Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full text-slate-900 text-base font-medium border border-slate-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-500 text-sm font-medium mb-1.5 block">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full text-slate-900 text-base font-medium border border-slate-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-slate-500 text-sm font-medium mb-1.5 block">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full text-slate-900 text-base font-medium border border-slate-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* OTP MODAL OVERLAY */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-xl text-slate-900">Verify Admin Email</h3>
              <button onClick={() => setShowOtpModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-medium mb-5">
                We sent a 6-digit verification code to <strong>{contactForm.email}</strong>. Please enter it below to confirm the change.
              </div>
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="text-slate-500 text-sm font-bold mb-2 block text-center">Enter 6-Digit Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center text-3xl tracking-[0.5em] font-black border border-slate-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifyingOtp || otpCode.length < 6}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                >
                  {verifyingOtp ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                  Verify & Save
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSecurityTab;