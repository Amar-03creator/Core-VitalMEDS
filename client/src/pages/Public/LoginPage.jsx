import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Pill, Eye, EyeOff, ShieldCheck, ArrowRight,
  Mail, Lock, AlertCircle, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const { login, completeNewPassword } = useAuth();

  const [step, setStep] = useState('credentials'); // 'credentials' | 'new-password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPass, setNewPass] = useState(''); // Unified variable name
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingCogUser, setPendingCogUser] = useState(null); // ✨ Added missing state

  const handleCredentialSubmit = async () => {
    setError('');
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
        setPendingCogUser(result.cogUser);
        setStep('new-password');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPasswordSubmit = async () => {
    setError('');
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
      // ✨ THIS WILL NOW SHOW THE REAL BACKEND ERROR IN RED ON YOUR SCREEN
      const realError = err.response?.data?.error || err.message;
      setError(realError || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      step === 'credentials' ? handleCredentialSubmit() : handleNewPasswordSubmit();
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

            <p className="text-center text-slate-500 text-sm mt-8">
              New pharmacy?{' '}
              <Link to="/register" className="text-emerald-600 font-bold hover:text-emerald-500">
                Register here
              </Link>
            </p>
          </>
        )}

        {step === 'new-password' && (
          <>
            {/* Back */}
            <button
              onClick={() => { setStep('credentials'); setNewPass(''); setError(''); }}
              className="flex items-center gap-1.5 text-slate-500 text-sm font-medium mb-8 hover:text-slate-700"
            >
              <ChevronLeft size={16} /> Cancel
            </button>

            {/* New Password Header */}
            <div className="mb-8">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <ShieldCheck size={24} className="text-emerald-400" />
              </div>
              <h1 className="text-slate-900 text-3xl font-black leading-tight">Update<br />Password</h1>
              <p className="text-slate-500 text-sm mt-2">
                Since this is your first time logging in, AWS requires you to set a permanent, secure password.
              </p>
            </div>

            {/* New Password Input */}
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

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mt-4">
                  <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs leading-relaxed">{error}</p>
                </div>
              )}

              {/* Verify button */}
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