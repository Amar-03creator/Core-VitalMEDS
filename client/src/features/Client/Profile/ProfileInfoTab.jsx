// features/Client/Profile/ProfileInfoTab.jsx
import { useState } from 'react';
import { Lock, Plus, Trash2, Star, Pencil, X, Check } from 'lucide-react';
import { toast } from 'sonner';

const BUSINESS_TYPES = ['Retail', 'Wholesale', 'Hospital', 'Clinic'];
const DESIGNATIONS = ['Owner', 'Proprietor', 'Manager', 'Partner', 'Staff'];
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const emptyContact = () => ({
  name: '',
  phone: '',
  email: '',
  designation: 'Staff',
  isPrimary: false,
  prefersWhatsApp: true,
});

const cloneContacts = (contacts) => (contacts || []).map((c) => ({ ...c }));

const ProfileInfoTab = ({ profile, authAxios, onUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [form, setForm] = useState({
    establishmentName: profile.establishmentName || '',
    businessType: profile.businessType || 'Retail',
    shippingAddress: profile.shippingAddress || '',
    contacts: cloneContacts(profile.contacts),
  });

  const isLocked = !!profile.accountApprovedAt;
  const lastBTChange = profile.businessTypeChangedAt ? new Date(profile.businessTypeChangedAt) : null;
  const btLockedUntil = lastBTChange ? new Date(lastBTChange.getTime() + ONE_YEAR_MS) : null;
  const businessTypeLocked = !!(btLockedUntil && btLockedUntil > new Date());

  const startEdit = () => {
    setForm({
      establishmentName: profile.establishmentName || '',
      businessType: profile.businessType || 'Retail',
      shippingAddress: profile.shippingAddress || '',
      contacts: cloneContacts(profile.contacts),
    });
    setErrors([]);
    setEditing(true);
  };

  const updateContact = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      contacts: f.contacts.map((c, i) => {
        if (i === idx) return { ...c, [field]: value };
        // Only one contact can be primary — clear the others when a new one is set
        if (field === 'isPrimary' && value) return { ...c, isPrimary: false };
        return c;
      }),
    }));
  };

  const addContact = () => setForm((f) => ({ ...f, contacts: [...f.contacts, emptyContact()] }));
  const removeContact = (idx) => setForm((f) => ({ ...f, contacts: f.contacts.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    setSaving(true);
    setErrors([]);
    try {
      const payload = {
        shippingAddress: form.shippingAddress,
        contacts: form.contacts,
      };
      if (!isLocked) payload.establishmentName = form.establishmentName;
      if (!businessTypeLocked) payload.businessType = form.businessType;

      await authAxios.put('/api/clients/me', payload);
      toast.success('Profile updated.');
      setEditing(false);
      onUpdated?.();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      setErrors([msg]);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Business details card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-800 font-bold text-base">Business Details</h2>
          {!editing ? (
            <button onClick={startEdit} className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
              <Pencil size={14} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => setEditing(false)} className="text-slate-400 text-sm font-semibold flex items-center gap-1">
                <X size={14} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-emerald-600 text-sm font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Check size={14} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {errors.map((e, i) => (
          <p key={i} className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
            {e}
          </p>
        ))}

        {/* Establishment name */}
        <div>
          <label className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
            Establishment Name
            {isLocked && <Lock size={12} className="text-slate-400" />}
          </label>
          {editing && !isLocked ? (
            <input
              value={form.establishmentName}
              onChange={(e) => setForm((f) => ({ ...f, establishmentName: e.target.value }))}
              className="mt-1 w-full text-slate-900 text-base font-semibold border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          ) : (
            <p className="text-slate-900 text-base font-semibold mt-1">{profile.establishmentName}</p>
          )}
          {isLocked && (
            <p className="text-slate-400 text-sm mt-1">Locked after account approval. Contact support to change this.</p>
          )}
        </div>

        {/* Business type */}
        <div>
          <label className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
            Business Type
            {businessTypeLocked && <Lock size={12} className="text-slate-400" />}
          </label>
          {editing && !businessTypeLocked ? (
            <select
              value={form.businessType}
              onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
              className="mt-1 w-full text-slate-900 text-base font-semibold border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-slate-900 text-base font-semibold mt-1">{profile.businessType}</p>
          )}
          {businessTypeLocked && (
            <p className="text-slate-400 text-sm mt-1">
              Can be changed once a year. Next change allowed on {btLockedUntil.toDateString()}.
            </p>
          )}
        </div>

        {/* Shipping address */}
        <div>
          <label className="text-slate-500 text-sm font-medium">Shipping Address</label>
          {editing ? (
            <textarea
              value={form.shippingAddress}
              onChange={(e) => setForm((f) => ({ ...f, shippingAddress: e.target.value }))}
              rows={2}
              className="mt-1 w-full text-slate-900 text-base border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          ) : (
            <p className="text-slate-900 text-base mt-1">{profile.shippingAddress || '—'}</p>
          )}
        </div>

        {/* Read-only registered details */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
          <div>
            <p className="text-slate-400 text-sm">Billing Address</p>
            <p className="text-slate-700 text-sm font-medium">{profile.billingAddress}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">GSTIN</p>
            <p className="text-slate-700 text-sm font-medium">{profile.gstin || '—'}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">City / District</p>
            <p className="text-slate-700 text-sm font-medium">
              {profile.city}, {profile.district}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Client Code</p>
            <p className="text-slate-700 text-sm font-medium">{profile.clientId}</p>
          </div>
        </div>
      </div>

      {/* Contacts card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-800 font-bold text-base">Contacts</h2>
          {editing && (
            <button onClick={addContact} className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        <div className="space-y-3">
          {(editing ? form.contacts : profile.contacts || []).map((c, idx) => (
            <div key={idx} className="border border-slate-100 rounded-xl p-3 space-y-2">
              {editing ? (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      value={c.name}
                      onChange={(e) => updateContact(idx, 'name', e.target.value)}
                      placeholder="Name"
                      className="flex-1 text-sm font-semibold border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => updateContact(idx, 'isPrimary', !c.isPrimary)}
                      title="Set as primary contact"
                      className={`p-2 rounded-lg ${c.isPrimary ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}
                    >
                      <Star size={16} fill={c.isPrimary ? 'currentColor' : 'none'} />
                    </button>
                    {form.contacts.length > 1 && (
                      <button onClick={() => removeContact(idx)} className="p-2 rounded-lg bg-red-50 text-red-500">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={c.phone}
                      onChange={(e) => updateContact(idx, 'phone', e.target.value)}
                      placeholder="Phone"
                      className="text-sm border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <select
                      value={c.designation}
                      onChange={(e) => updateContact(idx, 'designation', e.target.value)}
                      className="text-sm border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {DESIGNATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={c.email || ''}
                    onChange={(e) => updateContact(idx, 'email', e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-900 text-sm font-semibold flex items-center gap-1.5">
                      {c.name}
                      {c.isPrimary && <Star size={13} className="text-amber-500" fill="currentColor" />}
                    </p>
                    <p className="text-slate-500 text-sm">
                      {c.designation} · {c.phone}
                      {c.email ? ` · ${c.email}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-slate-400 text-sm">Changing the primary contact's email or phone will update your login details too.</p>
      </div>
    </div>
  );
};

export default ProfileInfoTab;