import { Link } from 'react-router-dom';
import { Pill } from 'lucide-react';

const RegistrationTopBar = () => (
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
);

export default RegistrationTopBar;