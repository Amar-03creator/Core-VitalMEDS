import { PhoneInput } from '../PhoneInput';

export const Representative = ({
  rep, idx,
  handleRepChange, handleRepPhoneBlur, handleRepBlur, handleTollFreePrompt,
  removeRep, errors
}) => (
  <div className="border border-slate-300 rounded-xl p-3 mt-2 space-y-2">
    <div className="flex justify-between">
      <span className="text-sm font-semibold text-slate-700">Rep {idx + 1}</span>
      <button type="button" onClick={() => removeRep(idx)} className="text-red-500 text-sm">Remove</button>
    </div>
    <input placeholder="Name *" value={rep.name} onChange={e => handleRepChange(idx, 'name', e.target.value)}
      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400" />
    <input placeholder="Role" value={rep.role} onChange={e => handleRepChange(idx, 'role', e.target.value)}
      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400" />
    <div className="grid grid-cols-2 gap-2">
      <div>
        <PhoneInput
          value={rep.phone}
          onChange={(full) => handleRepChange(idx, 'phone', full)}
          onBlur={() => handleRepPhoneBlur(idx, rep.phone)}
          error={null}
          maxLength={11}
          onTooLong={() => handleTollFreePrompt(idx)}
        />
      </div>
      <div>
        <input placeholder="Email" value={rep.email}
          onChange={e => handleRepChange(idx, 'email', e.target.value)}
          onBlur={(e) => handleRepBlur(idx, 'email', e.target.value, e)}
          className={`w-full bg-white border ${errors[`rep_email_${idx}`] ? 'border-red-500' : 'border-slate-300'} rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400`} />
        {errors[`rep_email_${idx}`] && <p className="text-red-500 text-xs">{errors[`rep_email_${idx}`]}</p>}
      </div>
    </div>
  </div>
);