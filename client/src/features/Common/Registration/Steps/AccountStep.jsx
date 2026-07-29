import { Mail, Phone, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import Field from '../Field';


const AccountStep = ({
  form, set, errors,
  showPassword, setShowPassword,
  showConfirm, setShowConfirm, inputClass
}) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-slate-900 text-2xl font-black">Account Details</h2>
      <p className="text-slate-500 text-sm mt-1">Create your login credentials</p>
    </div>

    <Field label="Business Email" required error={errors.email}>
      <div className="relative">
        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          placeholder="your@pharmacy.com"
          className={`${inputClass} pl-10`}
        />
      </div>
    </Field>

    <Field label="Mobile Number" required error={errors.phone}>
      <div className="relative">
        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="tel"
          value={form.phone}
          onChange={e => set('phone', e.target.value)}
          placeholder="10-digit mobile number"
          maxLength={10}
          className={`${inputClass} pl-10`}
        />
      </div>
    </Field>

    <Field label="Password" required error={errors.password}>
      <div className="relative">
        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={e => set('password', e.target.value)}
          placeholder="Min 8 chars, 1 number & 1 symbol"
          className={`${inputClass} pl-10 pr-12`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </Field>

    <Field label="Confirm Password" required error={errors.confirmPassword}>
      <div className="relative">
        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type={showConfirm ? 'text' : 'password'}
          value={form.confirmPassword}
          onChange={e => set('confirmPassword', e.target.value)}
          placeholder="Re-enter password"
          className={`${inputClass} pl-10 pr-12`}
        />
        <button
          type="button"
          onClick={() => setShowConfirm(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </Field>

    <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
      <Shield size={14} className="text-slate-500 shrink-0 mt-0.5" />
      <p className="text-slate-600 text-xs leading-relaxed">
        Use a strong, unique password. This account controls your pharmacy's ordering and billing data.
      </p>
    </div>
  </div>
);

export default AccountStep;