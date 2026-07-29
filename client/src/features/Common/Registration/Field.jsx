import { AlertCircle } from 'lucide-react';

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="text-slate-700 text-sm font-semibold block mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <AlertCircle size={11} />
        {error}
      </p>
    )}
  </div>
);

export default Field;