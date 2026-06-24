import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Pill, Eye, EyeOff, ShieldCheck, ArrowRight,
  Mail, Lock, AlertCircle, ChevronLeft, Smartphone
} from 'lucide-react';

/* ── DEMO CREDENTIALS (replace with real auth later) ── */
const DEMO_USERS = {
  'admin@milaagencies.in': { role: 'admin', name: 'Amarnath Sahu',     needs2FA: true,  otp: '123456' },
  'sharma@example.com':    { role: 'client', name: 'Rajesh Sharma',    needs2FA: false },
  'ravi@example.com':      { role: 'client', name: 'Ravi Kumar',       needs2FA: false },
  'healthfirst@example.com':{ role: 'client', name: 'Sunita Patel',    needs2FA: false },
};

const LoginPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  const handleCredentialSubmit = () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user = DEMO_USERS[email.toLowerCase()];
      if (!user) {
        setError('No account found with this email. Check your email or register.');
        return;
      }
      if (password !== 'password123') {
        setError('Incorrect password. Please try again.');
        return;
      }
      if (user.needs2FA) {
        setPendingUser(user);
        setStep('otp');
      } else {
        navigate('/client-dashboard');
      }
    }, 900);
  };

  const handleOtpInput = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpSubmit = () => {
    setError('');
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (enteredOtp === pendingUser?.otp || enteredOtp === '123456') {
        navigate('/admin-dashboard');
      } else {
        setError('Incorrect OTP. Please try again. (Demo OTP: 123456)');
      }
    }, 700);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      step === 'credentials' ? handleCredentialSubmit() : handleOtpSubmit();
    }
  };

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
            <p className="text-emerald-400 text-[9px] font-semibold tracking-widest uppercase">by Mila Agencies</p>
          </div>
        </Link>
        <Link to="/register" className="text-slate-400 text-sm font-medium hover:text-white transition-colors">
          Register →
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center px-5 py-10 max-w-md mx-auto w-full">

        {step === 'credentials' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-slate-900 text-3xl font-black leading-tight">Welcome back</h1>
              <p className="text-slate-500 text-base mt-1">Sign in to your VitalMEDS account</p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-slate-700 text-sm font-semibold block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    onKeyDown={handleKeyDown}
                    placeholder="your@pharmacy.com"
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3.5 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 text-sm font-semibold">Password</label>
                  <button className="text-emerald-600 text-xs font-semibold hover:text-emerald-500">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
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

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs leading-relaxed">{error}</p>
                </div>
              )}

              {/* Submit */}
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

            {/* Demo credentials */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-blue-700 text-xs font-bold mb-2">🧪 Demo Credentials</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600 font-semibold">Admin:</span>
                  <span className="text-blue-800 font-mono">admin@milaagencies.in</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600 font-semibold">Client:</span>
                  <span className="text-blue-800 font-mono">sharma@example.com</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600 font-semibold">Password:</span>
                  <span className="text-blue-800 font-mono">password123</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600 font-semibold">Admin OTP:</span>
                  <span className="text-blue-800 font-mono">123456</span>
                </div>
              </div>
            </div>

            <p className="text-center text-slate-500 text-sm mt-6">
              New pharmacy?{' '}
              <Link to="/register" className="text-emerald-600 font-bold hover:text-emerald-500">
                Register here
              </Link>
            </p>
          </>
        )}

        {step === 'otp' && (
          <>
            {/* Back */}
            <button
              onClick={() => { setStep('credentials'); setOtp(['','','','','','']); setError(''); }}
              className="flex items-center gap-1.5 text-slate-500 text-sm font-medium mb-8 hover:text-slate-700"
            >
              <ChevronLeft size={16} /> Back
            </button>

            {/* 2FA Header */}
            <div className="mb-8">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <ShieldCheck size={24} className="text-emerald-400" />
              </div>
              <h1 className="text-slate-900 text-3xl font-black leading-tight">Two-Factor<br />Authentication</h1>
              <p className="text-slate-500 text-sm mt-2">
                A 6-digit OTP has been sent to your registered email address.
              </p>
              <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                <Smartphone size={14} className="text-emerald-600 shrink-0" />
                <p className="text-emerald-700 text-xs font-semibold">Admin access requires OTP verification</p>
              </div>
            </div>

            {/* OTP inputs */}
            <div>
              <label className="text-slate-700 text-sm font-semibold block mb-3">Enter 6-digit OTP</label>
              <div className="flex gap-2 justify-between">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpInput(e.target.value, i)}
                    onKeyDown={e => handleOtpKeyDown(e, i)}
                    className={`w-12 h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all
                      ${digit ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-800'}
                      focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100`}
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mt-4">
                <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-red-700 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            {/* Verify button */}
            <button
              onClick={handleOtpSubmit}
              disabled={loading || otp.join('').length < 6}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-2xl text-base shadow-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><ShieldCheck size={18} /> Verify & Enter Admin</>
              )}
            </button>

            <button className="w-full text-center text-slate-500 text-sm mt-4 py-2 hover:text-emerald-600 transition-colors font-medium">
              Resend OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;