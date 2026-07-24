// features/Admin/Settings/LegalInfoTab.jsx
import { useState } from 'react';
import { Pencil, X, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const MAX_CHANGES_PER_YEAR = 2;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const LegalInfoTab = ({ admin, authAxios, onUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    gstinAdmin: admin.gstinAdmin || '',
    drugLicense: admin.drugLicense || '',
    aadhaarAdmin: admin.aadhaarAdmin || '',
    panAdmin: admin.panAdmin || '',
  });

  const lastChange = admin.lastLegalInfoChangeDate ? new Date(admin.lastLegalInfoChangeDate) : null;
  const countResetsAt = lastChange ? new Date(lastChange.getTime() + ONE_YEAR_MS) : null;
  const countHasReset = !!(countResetsAt && countResetsAt < new Date());
  const effectiveCount = countHasReset ? 0 : admin.legalInfoChangeCount || 0;
  const remaining = MAX_CHANGES_PER_YEAR - effectiveCount;

  const startEdit = () => {
    setForm({
      gstinAdmin: admin.gstinAdmin || '',
      drugLicense: admin.drugLicense || '',
      aadhaarAdmin: admin.aadhaarAdmin || '',
      panAdmin: admin.panAdmin || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authAxios.put('/api/admin/me/legal', form);
      toast.success(res.data.message || 'Legal info updated.');
      setEditing(false);
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update legal info.');
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key) => (
    <div>
      <label className="text-slate-500 text-sm font-medium">{label}</label>
      {editing ? (
        <input
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value.toUpperCase() }))}
          className="mt-1 w-full text-slate-900 text-base font-medium border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      ) : (
        <p className="text-slate-900 text-base font-medium mt-1">{admin[key] || '—'}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl p-3.5 flex items-center gap-2.5 ${remaining > 0 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
        <AlertTriangle size={16} className={remaining > 0 ? 'text-emerald-600' : 'text-amber-600'} />
        <p className={`text-sm font-medium ${remaining > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
          {remaining > 0
            ? `${remaining} legal info change${remaining === 1 ? '' : 's'} remaining this year.`
            : `No changes remaining. Resets ${countResetsAt?.toDateString()}.`}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-800 font-bold text-base">Legal & Business Info</h2>
          {!editing ? (
            <button
              onClick={startEdit}
              disabled={remaining <= 0}
              className="flex items-center gap-1 text-emerald-600 text-sm font-semibold disabled:opacity-40"
            >
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

        {field('GSTIN', 'gstinAdmin')}
        {field('Drug License', 'drugLicense')}
        {field('Aadhaar Number', 'aadhaarAdmin')}
        {field('PAN Number', 'panAdmin')}

        {admin.legalInfoChanges?.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-slate-500 text-sm font-medium mb-2">Change history</p>
            <div className="space-y-1.5">
              {admin.legalInfoChanges
                .slice()
                .reverse()
                .map((c, i) => (
                  <p key={i} className="text-slate-500 text-sm">
                    {c.field}: {c.oldValue || '—'} → {c.newValue} · {new Date(c.changedAt).toLocaleDateString()}
                  </p>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalInfoTab;