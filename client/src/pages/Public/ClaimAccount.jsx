// client/src/pages/ClaimAccount.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, ArrowRight, ShieldCheck, Mail, Lock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
// NOTE: Make sure to add verifyInviteCode and claimAccount functions to your `api.js` wrapper!
import { api } from '../../services/api'; 

export default function ClaimAccount() {
  const navigate = useNavigate();
  
  // State for Step 1
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data retrieved from Step 1
  const [clientData, setClientData] = useState(null);
  
  // State for Step 2
  const [selectedEmail, setSelectedEmail] = useState('new'); // holds the original email or 'new'
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    if (code.length < 5) return setError('Please enter a valid code.');

    setLoading(true);
    try {
      // Call your new endpoint (Make sure you add this to api.js)
      const res = await fetch('http://192.168.1.6:5000/api/auth/verify-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message);
      
      setClientData(data.data);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const finalEmail = selectedEmail === 'new' ? newEmail : selectedEmail;
    
    if (!finalEmail || !password) {
      return setError('Email and password are required.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      // Call your claim endpoint (Make sure you add this to api.js)
      const res = await fetch('http://192.168.1.6:5000/api/auth/claim-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email: finalEmail, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message);

      toast.success('Account successfully claimed! Please log in.', { duration: 5000 });
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 px-5 py-4 flex items-center">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
            <Pill size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none tracking-tight">VitalMEDS</p>
            <p className="text-emerald-400 text-[10px] font-semibold tracking-widest uppercase mt-0.5">by Mila Agencies</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 py-10 max-w-lg mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
          
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-800 text-base">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} className="text-slate-600" />
                </div>
                <h1 className="text-slate-900 text-3xl font-black">Claim Your Account</h1>
                <p className="text-slate-500 text-lg mt-2 leading-relaxed">
                  Enter the unique invite code provided by your distributor to link your past invoices.
                </p>
              </div>

              <div>
                <label className="text-slate-700 text-base font-bold block mb-2">Invite Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A9B2C8D4EF"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-4 text-slate-900 text-xl font-mono tracking-widest uppercase focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-center"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-4 rounded-2xl text-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <>Verify Code <ArrowRight size={20} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleClaimSubmit} className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <h1 className="text-slate-900 text-2xl font-black">Welcome, {clientData?.establishmentName}!</h1>
                <p className="text-slate-500 text-base mt-2">
                  We found your offline profile. Let's set up your digital login credentials.
                </p>
              </div>

              <div className="space-y-5 border-t border-slate-100 pt-6">
                
                {/* Email Selection/Masking */}
                <div>
                  <label className="text-slate-700 text-base font-bold block mb-3">Choose Email Address</label>
                  
                  {clientData?.suggestedContacts.map((contact, i) => contact.originalEmail && (
                    <label key={i} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors mb-3 ${selectedEmail === contact.originalEmail ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <input 
                        type="radio" 
                        name="emailChoice" 
                        value={contact.originalEmail} 
                        checked={selectedEmail === contact.originalEmail}
                        onChange={() => setSelectedEmail(contact.originalEmail)}
                        className="w-5 h-5 text-emerald-600"
                      />
                      <span className="text-slate-800 text-lg font-medium">{contact.maskedEmail}</span>
                    </label>
                  ))}

                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedEmail === 'new' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <input 
                      type="radio" 
                      name="emailChoice" 
                      value="new" 
                      checked={selectedEmail === 'new'}
                      onChange={() => setSelectedEmail('new')}
                      className="w-5 h-5 text-emerald-600"
                    />
                    <span className="text-slate-800 text-lg font-medium">Use a different email</span>
                  </label>

                  {/* New Email Input (Only shows if 'new' is selected) */}
                  {selectedEmail === 'new' && (
                    <div className="mt-4 relative animate-fadeIn">
                      <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full bg-white border border-slate-300 rounded-2xl pl-12 pr-4 py-4 text-slate-900 text-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        required={selectedEmail === 'new'}
                      />
                    </div>
                  )}
                </div>

                {/* Password Setup */}
                <div>
                  <label className="text-slate-700 text-base font-bold block mb-2">Create Password</label>
                  <div className="relative">
                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-white border border-slate-300 rounded-2xl pl-12 pr-4 py-4 text-slate-900 text-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      required
                    />
                  </div>
                </div>

              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-4 rounded-2xl text-lg mt-8 hover:bg-emerald-500 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-600/20"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : 'Secure Account & Login'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}