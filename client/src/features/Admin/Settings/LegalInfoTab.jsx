import { useState } from 'react';
import { Pencil, X, Check, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const MAX_CHANGES_PER_YEAR = 2;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const LegalInfoTab = ({ admin, authAxios, onUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    gstinAdmin: admin.gstinAdmin || '',
    drugsBazaarId: admin.drugsBazaarId || '',
    drugLicenses: admin.drugLicenses || [], // ✨ Now an Array of objects
  });

  const lastChange = admin.lastLegalInfoChangeDate ? new Date(admin.lastLegalInfoChangeDate) : null;
  const countResetsAt = lastChange ? new Date(lastChange.getTime() + ONE_YEAR_MS) : null;
  const countHasReset = !!(countResetsAt && countResetsAt < new Date());
  const effectiveCount = countHasReset ? 0 : admin.legalInfoChangeCount || 0;
  const remaining = MAX_CHANGES_PER_YEAR - effectiveCount;

  const startEdit = () => {
    setForm({
      gstinAdmin: admin.gstinAdmin || '',
      drugsBazaarId: admin.drugsBazaarId || '',
      drugLicenses: admin.drugLicenses?.length ? [...admin.drugLicenses] : [{ formType: '', dlNumber: '' }],
    });
    setEditing(true);
  };

  const handleSave = async () => {
    // Filter out any empty DL rows before saving
    const cleanedDLs = form.drugLicenses.filter(dl => dl.formType.trim() !== '' && dl.dlNumber.trim() !== '');

    setSaving(true);
    try {
      const res = await authAxios.put('/api/admin/me/legal', {
        gstinAdmin: form.gstinAdmin,
        drugsBazaarId: form.drugsBazaarId,
        drugLicenses: cleanedDLs
      });
      toast.success(res.data.message || 'Legal info updated.');
      setEditing(false);
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update legal info.');
    } finally {
      setSaving(false);
    }
  };

  // DL Array Handlers
  const addDlRow = () => setForm(f => ({ ...f, drugLicenses: [...f.drugLicenses, { formType: '', dlNumber: '' }] }));
  
  const updateDlRow = (index, field, value) => {
    const newDls = [...form.drugLicenses];
    newDls[index][field] = value.toUpperCase();
    setForm(f => ({ ...f, drugLicenses: newDls }));
  };

  const removeDlRow = (index) => {
    setForm(f => ({ ...f, drugLicenses: f.drugLicenses.filter((_, i) => i !== index) }));
  };

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

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-slate-800 font-bold text-lg">Legal & Business Info</h2>
          {!editing ? (
            <button onClick={startEdit} disabled={remaining <= 0} className="flex items-center gap-1 text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-lg disabled:opacity-40">
              <Pencil size={14} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(false)} className="text-slate-500 text-sm font-bold px-3 py-1.5 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="text-white bg-slate-900 text-sm font-bold px-4 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1">
                <Check size={14} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* ── Standard Fields ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-slate-500 text-xs font-bold uppercase tracking-wider">GSTIN</label>
            {editing ? (
              <input
                value={form.gstinAdmin}
                onChange={(e) => setForm(f => ({ ...f, gstinAdmin: e.target.value.toUpperCase() }))}
                className="mt-1 w-full text-slate-900 text-sm font-medium border border-slate-300 bg-white rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            ) : (
              <p className="text-slate-900 text-sm font-medium mt-1">{admin.gstinAdmin || '—'}</p>
            )}
          </div>

          <div>
            <label className="text-slate-500 text-xs font-bold uppercase tracking-wider">DrugsBazaar ID</label>
            {editing ? (
              <input
                value={form.drugsBazaarId}
                onChange={(e) => setForm(f => ({ ...f, drugsBazaarId: e.target.value.toUpperCase() }))}
                className="mt-1 w-full text-slate-900 text-sm font-medium border border-slate-300 bg-white rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            ) : (
              <p className="text-slate-900 text-sm font-medium mt-1">{admin.drugsBazaarId || '—'}</p>
            )}
          </div>
        </div>

        {/* ── Dynamic Drug Licenses Array ── */}
        <div className="pt-2">
          <label className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center justify-between mb-2">
            <span>Drug Licenses</span>
            {editing && (
              <button onClick={addDlRow} className="text-emerald-600 flex items-center gap-1 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                <Plus size={12} /> Add License
              </button>
            )}
          </label>
          
          <div className="space-y-2">
            {!editing ? (
              admin.drugLicenses?.length > 0 ? (
                admin.drugLicenses.map((dl, i) => (
                  <div key={i} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 w-24">FORM {dl.formType}</span>
                    <span className="text-sm font-medium text-slate-900">{dl.dlNumber}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-900 text-sm font-medium mt-1">—</p>
              )
            ) : (
              form.drugLicenses.map((dl, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    placeholder="Form (e.g. 20B)"
                    value={dl.formType}
                    onChange={(e) => updateDlRow(i, 'formType', e.target.value)}
                    className="w-1/3 text-slate-900 text-sm font-medium border border-slate-300 bg-white rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    placeholder="DL Number"
                    value={dl.dlNumber}
                    onChange={(e) => updateDlRow(i, 'dlNumber', e.target.value)}
                    className="flex-1 text-slate-900 text-sm font-medium border border-slate-300 bg-white rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                  <button onClick={() => removeDlRow(i)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Read-Only Proprietor Info ── */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-slate-500 text-xs font-bold uppercase tracking-wider">Proprietor PAN</label>
            <p className="text-slate-900 text-sm font-medium mt-1">{admin.proprietor?.pan || '—'}</p>
            {editing && <p className="text-[10px] text-slate-400 mt-1">Edit this in the Admin Profile tab</p>}
          </div>
          <div>
            <label className="text-slate-500 text-xs font-bold uppercase tracking-wider">Proprietor Aadhaar</label>
            <p className="text-slate-900 text-sm font-medium mt-1">{admin.proprietor?.aadhaar || '—'}</p>
            {editing && <p className="text-[10px] text-slate-400 mt-1">Edit this in the Admin Profile tab</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LegalInfoTab;