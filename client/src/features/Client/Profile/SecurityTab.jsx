// features/Client/Profile/SecurityTab.jsx
import { useState } from 'react';
import { KeyRound, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

// NOTE: The plan calls for "change password via Amplify" and "change
// email/phone with OTP (as before)". I haven't been shown AuthContext.jsx
// or any Amplify config, so I can't wire the real calls without guessing
// at method signatures. Two things to know about what's below:
//
// 1. Password change is a real form, but handleChangePassword is a stub —
//    share AuthContext.jsx (wherever Auth.changePassword / equivalent
//    lives) and I'll fill it in.
// 2. Email/phone change is NOT duplicated here. Instead this tab points
//    back to the Profile tab's primary-contact editor, which the backend
//    (clientSelfController.js) already syncs to Cognito on save. Building
//    a second, separate OTP flow here would either conflict with that or
//    with whatever OTP flow you already have — safer to have one path.

const SecurityTab = ({ profile }) => {
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    if (pwForm.next.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    setPwSaving(true);
    try {
      // TODO: wire up to your Amplify Auth.changePassword(user, current, next)
      // (or your Cognito-backed equivalent) once AuthContext.jsx is shared.
      toast.error("Password change isn't wired up yet — see the note in SecurityTab.jsx.");
    } finally {
      setPwSaving(false);
    }
  };

  const primaryContact = (profile.contacts || []).find((c) => c.isPrimary);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-emerald-600" />
          <h2 className="text-slate-800 font-bold text-base">Change Password</h2>
        </div>
        <input
          type="password"
          placeholder="Current password"
          value={pwForm.current}
          onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <input
          type="password"
          placeholder="New password"
          value={pwForm.next}
          onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={pwForm.confirm}
          onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          onClick={handleChangePassword}
          disabled={pwSaving}
          className="w-full bg-emerald-500 text-white font-semibold text-sm py-2.5 rounded-xl disabled:opacity-50"
        >
          {pwSaving ? 'Updating…' : 'Update Password'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Smartphone size={16} className="text-emerald-600" />
          <h2 className="text-slate-800 font-bold text-base">Login Details</h2>
        </div>
        <p className="text-slate-500 text-sm">
          Your login email and phone are your primary contact's — {primaryContact?.email || '—'} / {primaryContact?.phone || '—'}. To
          change them, update your primary contact in the Profile tab.
        </p>
      </div>
    </div>
  );
};

export default SecurityTab;