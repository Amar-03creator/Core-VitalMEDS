import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Pill, Eye, EyeOff, ShieldCheck, ArrowRight,
  Mail, Lock, AlertCircle, ChevronLeft, Key, Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
// ✨ IMPORT THE NEW NAVBAR
import Navbar from '../../layouts/common/Navbar'; 

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const { login, completeNewPassword, sendPasswordResetCode, confirmPasswordReset } = useAuth();

  const [step, setStep] = useState('credentials'); // 'credentials' | 'new-password' | 'forgot-init' | 'forgot-confirm'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPass, setNewPass] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('suspended') === 'true') {
      setError('You are suspended by the proprietor.');
    }
  }, [location]);

  const [loading, setLoading] = useState(false);
  const [pendingCogUser, setPendingCogUser] = useState(null);

  /* ── 1. NORMAL LOGIN ── */
  const handleCredentialSubmit = async () => {
    setError(''); setSuccessMsg('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        const targetDashboard = result.role === 'admin' ? '/admin-dashboard' : '/client-dashboard';
        navigate(from || targetDashboard, { replace: true });
      } else if (result.challenge === 'NEW_PASSWORD_REQUIRED') {
        setPendingCogUser(result.cognitoUser); 
        setStep('new-password');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  /* ── 2. FIRST-TIME LOGIN (Force Password Change) ── */
  const handleNewPasswordSubmit = async () => {
    setError(''); setSuccessMsg('');
    if (!newPass.trim()) {
      setError('Please enter a new password.');
      return;
    }

    setLoading(true);
    try {
      const result = await completeNewPassword(pendingCogUser, newPass);
      if (result.success) {
        const targetDashboard = result.role === 'admin' ? '/admin-dashboard' : '/client-dashboard';
        navigate(from || targetDashboard, { replace: true });
      }
    } catch (err) {
      const realError = err.response?.data?.error || err.message;
      setError(realError || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  /* ── 3. FORGOT PASSWORD (Initiate AWS OTP) ── */
  const handleSendResetCode = async () => {
    setError(''); setSuccessMsg('');
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetCode(email.trim());
      setStep('forgot-confirm');
      setSuccessMsg(`A 6-digit secure code has been sent to ${email}`);
    } catch (err) {
      setError(err.message || 'Failed to send reset code. Make sure the email is registered.');
    } finally {
      setLoading(false);
    }
  };

  /* ── 4. FORGOT PASSWORD (Confirm AWS OTP & Reset) ── */
  const handleConfirmReset = async () => {
    setError(''); setSuccessMsg('');
    if (!otpCode.trim() || !newPass.trim()) {
      setError('Please enter the 6-digit code and your new password.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(email.trim(), otpCode.trim(), newPass);
      
      setPassword('');
      setNewPass('');
      setOtpCode('');
      setStep('credentials');
      setSuccessMsg('Password reset successfully! You can now log in.');
    } catch (err) {
      setError(err.message || 'Failed to reset password. The code might be expired or incorrect.');
    } finally {
      setLoading(false);
    }
  };

  /* ── KEYBOARD ENTER HANDLER ── */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (step === 'credentials') handleCredentialSubmit();
      else if (step === 'new-password') handleNewPasswordSubmit();
      else if (step === 'forgot-init') handleSendResetCode();
      else if (step === 'forgot-confirm') handleConfirmReset();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* ✨ REPLACED HARDCODED TOP BAR WITH UNIVERSAL COMPONENT */}
      <Navbar />

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center px-5 py-10 max-w-md mx-auto w-full">

        {/* =========================================
            STATE 1: NORMAL LOGIN
        ============================================= */}
        {step === 'credentials' && (
          <>
            <div className="mb-8">
              <h1 className="text-slate-900 text-3xl font-black leading-tight">Welcome back</h1>
              <p className="text-slate-500 text-base mt-1">Sign in to your VitalMEDS account</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-700 text-sm font-semibold block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); setSuccessMsg(''); }}
                    onKeyDown={handleKeyDown}
                    placeholder="your@pharmacy.com"
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3.5 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 text-sm font-semibold">Password</label>
                  <button 
                    type="button"
                    onClick={() => { setStep('forgot-init'); setError(''); setSuccessMsg(''); }}
                    className="text-emerald-600 text-xs font-semibold hover:text-emerald-500"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); setSuccessMsg(''); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your password"
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-12 py-3.5 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs leading-relaxed">{error}</p>
                </div>
              )}
              {successMsg && (
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                  <ShieldCheck size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-emerald-700 text-xs leading-relaxed">{successMsg}</p>
                </div>
              )}

              <button
                onClick={handleCredentialSubmit}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-2xl text-base shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight size={18} /></>
                )}
              </button>
            </div>

            <p className="text-center text-slate-500 text-sm mt-8">
              New pharmacy?{' '}
              <Link to="/register" className="text-emerald-600 font-bold hover:text-emerald-500">
                Register here
              </Link>
            </p>
          </>
        )}

        {/* =========================================
            STATE 2: FORGOT PASSWORD (INITIATE)
        ============================================= */}
        {step === 'forgot-init' && (
          <>
            <button onClick={() => { setStep('credentials'); setError(''); setSuccessMsg(''); }} className="flex items-center gap-1.5 text-slate-500 text-sm font-medium mb-8 hover:text-slate-700 w-fit">
              <ChevronLeft size={16} /> Back to Login
            </button>

            <div className="mb-8">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Key size={24} className="text-emerald-400" />
              </div>
              <h1 className="text-slate-900 text-3xl font-black leading-tight">Reset Password</h1>
              <p className="text-slate-500 text-sm mt-2">Enter your registered email address and we'll send you a secure 6-digit recovery code.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-700 text-sm font-semibold block mb-1.5">Registered Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your email"
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3.5 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mt-4">
                  <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs leading-relaxed">{error}</p>
                </div>
              )}

              <button
                onClick={handleSendResetCode}
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-2xl text-base shadow-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={18} /> Send Recovery Code</>}
              </button>
            </div>
          </>
        )}

        {/* =========================================
            STATE 3: FORGOT PASSWORD (CONFIRM)
        ============================================= */}
        {step === 'forgot-confirm' && (
          <>
            <button onClick={() => { setStep('forgot-init'); setOtpCode(''); setError(''); setSuccessMsg(''); }} className="flex items-center gap-1.5 text-slate-500 text-sm font-medium mb-8 hover:text-slate-700 w-fit">
              <ChevronLeft size={16} /> Back
            </button>

            <div className="mb-8">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 border border-emerald-200">
                <ShieldCheck size={24} className="text-emerald-600" />
              </div>
              <h1 className="text-slate-900 text-3xl font-black leading-tight">Check your email</h1>
              <p className="text-slate-500 text-sm mt-2">We sent a 6-digit code to <span className="font-bold text-slate-800">{email}</span>. Enter it below.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-700 text-sm font-semibold block mb-1.5">6-Digit Code</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                    onKeyDown={handleKeyDown}
                    placeholder="000000"
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3.5 text-slate-800 tracking-widest font-bold text-base placeholder-slate-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 text-sm font-semibold block mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPass}
                    onChange={e => { setNewPass(e.target.value); setError(''); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter a new secure password"
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-12 py-3.5 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mt-4">
                  <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs leading-relaxed">{error}</p>
                </div>
              )}
              {successMsg && (
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 mt-4">
                  <ShieldCheck size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-emerald-700 text-xs leading-relaxed">{successMsg}</p>
                </div>
              )}

              <button
                onClick={handleConfirmReset}
                disabled={loading || otpCode.length < 6 || !newPass.trim()}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3.5 rounded-2xl text-base shadow-lg shadow-emerald-600/30 mt-6 hover:bg-emerald-500 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ShieldCheck size={18} /> Confirm & Reset Password</>}
              </button>
            </div>
          </>
        )}

        {/* =========================================
            STATE 4: FIRST-TIME LOGIN FORCE RESET
        ============================================= */}
        {step === 'new-password' && (
          <>
            <button
              onClick={() => { setStep('credentials'); setNewPass(''); setError(''); }}
              className="flex items-center gap-1.5 text-slate-500 text-sm font-medium mb-8 hover:text-slate-700 w-fit"
            >
              <ChevronLeft size={16} /> Cancel
            </button>

            <div className="mb-8">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <ShieldCheck size={24} className="text-emerald-400" />
              </div>
              <h1 className="text-slate-900 text-3xl font-black leading-tight">Update<br />Password</h1>
              <p className="text-slate-500 text-sm mt-2">
                Since this is your first time logging in, AWS requires you to set a permanent, secure password.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-700 text-sm font-semibold block mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPass}
                    onChange={e => { setNewPass(e.target.value); setError(''); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter a strong password"
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-12 py-3.5 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mt-4">
                  <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs leading-relaxed">{error}</p>
                </div>
              )}

              <button
                onClick={handleNewPasswordSubmit}
                disabled={loading || !newPass.trim()}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-2xl text-base shadow-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><ShieldCheck size={18} /> Update & Enter</>
                )}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default LoginPage;