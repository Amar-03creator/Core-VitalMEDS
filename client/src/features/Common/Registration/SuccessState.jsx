import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

const SuccessState = ({ establishmentName }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-5 py-10">
    <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-sm w-full shadow-lg">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 size={40} className="text-emerald-500" />
      </div>
      <h2 className="text-slate-900 text-2xl font-black mb-2">Registration Submitted!</h2>
      <p className="text-slate-500 text-sm leading-relaxed mb-6">
        Your account for <span className="font-bold text-slate-700">{establishmentName}</span> has been created securely.
      </p>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
        <p className="text-amber-800 text-sm font-bold mb-2 flex items-center gap-1.5">
          <AlertCircle size={16} /> Mandatory Action Required
        </p>
        <p className="text-amber-700 text-xs leading-relaxed">
          Please log in to your dashboard to <b>upload your KYC documents</b>. Your account will remain
          locked from ordering until documents are uploaded and verified.
        </p>
      </div>
      <Link
        to="/login"
        className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl"
      >
        Go to Login <ArrowRight size={16} />
      </Link>
    </div>
  </div>
);

export default SuccessState;