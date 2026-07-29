import { X, Mail } from 'lucide-react';

const OtpModal = ({ email, otp, onChange, onVerify, onClose, isVerifying }) => (
  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full transition-colors"
      >
        <X size={18} />
      </button>

      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail size={28} className="text-blue-500" />
      </div>

      <h3 className="text-xl font-black text-center text-slate-900 mb-2">Check Your Email</h3>
      <p className="text-center text-slate-500 text-sm mb-6 px-2">
        We've sent a 6-digit verification code to{' '}
        <span className="font-bold text-slate-800">{email}</span>
      </p>

      <input
        type="text"
        maxLength={6}
        value={otp}
        onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
        placeholder="000000"
        className="w-full text-center text-3xl tracking-[0.4em] font-black bg-slate-50 border border-slate-200 rounded-2xl py-4 outline-none focus:border-emerald-400 focus:bg-white transition-all mb-4"
      />

      <button
        onClick={onVerify}
        disabled={otp.length !== 6 || isVerifying}
        className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-2xl text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition-all flex justify-center"
      >
        {isVerifying ? 'Verifying...' : 'Verify & Create Account'}
      </button>
    </div>
  </div>
);

export default OtpModal;