// features/Admin/Settings/AdminProfileTab.jsx
import { useState } from 'react';
import { Lock, Pencil, X, Check } from 'lucide-react';
import { toast } from 'sonner';

const AdminProfileTab = ({ admin, authAxios, onUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: admin.name || '',
    secondaryEmail: admin.secondaryEmail || '',
    phone: admin.phone || '',
    address: admin.address || '',
  });

  const startEdit = () => {
    setForm({
      name: admin.name || '',
      secondaryEmail: admin.secondaryEmail || '',
      phone: admin.phone || '',
      address: admin.address || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authAxios.put('/api/admin/me', form);
      toast.success('Profile updated.');
      setEditing(false);
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, inputProps = {}) => (
    <div>
      <label className="text-slate-500 text-sm font-medium">{label}</label>
      {editing ? (
        <input
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="mt-1 w-full text-slate-900 text-base font-medium border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          {...inputProps}
        />
      ) : (
        <p className="text-slate-900 text-base font-medium mt-1">{admin[key] || '—'}</p>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-slate-800 font-bold text-base">Business Profile</h2>
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

      <div>
        <label className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
          Registered Proprietor Name <Lock size={12} className="text-slate-400" />
        </label>
        <p className="text-slate-900 text-base font-medium mt-1">{admin.proprietaryName || '— not set —'}</p>
      </div>

      {field('Full Name', 'name')}

      <div>
        <label className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
          Login Email <Lock size={12} className="text-slate-400" />
        </label>
        <p className="text-slate-900 text-base font-medium mt-1">{admin.email}</p>
      </div>

      {field('Secondary Email', 'secondaryEmail', { type: 'email' })}
      {field('Phone', 'phone')}
      {field('Address', 'address')}
    </div>
  );
};

export default AdminProfileTab;