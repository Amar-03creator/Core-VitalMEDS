import { useState } from 'react';
import { Edit2, Save, X as XIcon, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../../services/api';
import { validateField } from '../../../../modals/AddCompanyModal/validation';
import { RepCard } from '../components/RepCard';
import { BankDetailCard } from '../components/BankDetailCard';
import { StatusToggle } from '../components/StatusToggle';

const emptyBank = { bankName: '', accountNumber: '', ifscCode: '', branch: '' };
const emptyRep = { name: '', role: '', phone: '', email: '' };

/**
 * ProfileTab
 * Per spec: explicit Edit/Save toggle (view mode -> edit mode), not an
 * always-editable form and not a separate modal.
 */
export const ProfileTab = ({ company, onCompanyUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [form, setForm] = useState(() => toFormState(company));
  const [errors, setErrors] = useState({});

  function toFormState(c) {
    return {
      companyName: c.companyName || '',
      shortCode: c.shortCode || '',
      gstin: c.gstin || '',
      pan: c.pan || '',
      drugLicenses: c.drugLicenses?.length ? c.drugLicenses : [''],
      drugLicenseExpiry: c.drugLicenseExpiry ? c.drugLicenseExpiry.split('T')[0] : '',
      email: c.email || '',
      whatsapp: c.whatsapp || '',
      billingAddress: c.billingAddress || '',
      city: c.city || '',
      state: c.state || '',
      pincode: c.pincode || '',
      aadhaar: c.aadhaar || '',
      drugsBazaarId: c.drugsBazaarId || '',
      leadTimeDays: c.leadTimeDays ?? '',
      minimumOrderValue: c.minimumOrderValue ?? '',
      representatives: c.representatives?.length ? c.representatives : [{ ...emptyRep }],
      bankDetails: c.bankDetails || [],
    };
  }

  const startEditing = () => {
    setForm(toFormState(company));
    setErrors({});
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setErrors({});
  };

  const handleField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleBlurValidate = async (name, value) => {
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err }));
    if (err || !value?.trim()) return;

    // Live duplicate-check, excluding this company itself (per decision: reuse checkDuplicate).
    // NOTE: this assumes api.checkDuplicate is extended to accept an excludeId param and the
    // backend /duplicates/check route filters it out server-side (see PROFILE_TAB_BACKEND_NOTE.md
    // for the exact change needed — I haven't seen that controller's current code).
    const strictFields = { gstin: 'GSTIN', pan: 'PAN', shortCode: 'Short Code', drugsBazaarId: 'DrugsBazaar ID' };
    if (strictFields[name]) {
      try {
        const res = await api.checkDuplicate(name, value.trim(), company._id);
        if (res.exists) {
          const names = res.owners.map(o => `${o.name} (${o.type})`).join(', ');
          const msg = `${strictFields[name]} is already registered with: ${names}`;
          setErrors(prev => ({ ...prev, [name]: msg }));
          toast.error(msg);
        }
      } catch { /* silent */ }
    }
  };

  /* ── Representatives ──────────────────────────────────────── */
  const updateRep = (idx, field, value) => {
    setForm(prev => {
      const reps = [...prev.representatives];
      reps[idx] = { ...reps[idx], [field]: value };
      return { ...prev, representatives: reps };
    });
  };
  const setMainRep = (idx) => {
    setForm(prev => {
      const reps = [...prev.representatives];
      const [chosen] = reps.splice(idx, 1);
      reps.unshift(chosen);
      return { ...prev, representatives: reps };
    });
  };
  const addRep = () => setForm(prev => ({ ...prev, representatives: [...prev.representatives, { ...emptyRep }] }));
  const removeRep = (idx) => setForm(prev => ({ ...prev, representatives: prev.representatives.filter((_, i) => i !== idx) }));

  /* ── Bank details ─────────────────────────────────────────── */
  const updateBank = (idx, field, value) => {
    setForm(prev => {
      const banks = [...prev.bankDetails];
      banks[idx] = { ...banks[idx], [field]: field === 'ifscCode' ? value.toUpperCase().replace(/\s/g, '') : value };
      return { ...prev, bankDetails: banks };
    });
  };
  const addBank = () => setForm(prev => ({ ...prev, bankDetails: [...prev.bankDetails, { ...emptyBank }] }));
  const removeBank = (idx) => setForm(prev => ({ ...prev, bankDetails: prev.bankDetails.filter((_, i) => i !== idx) }));

  /* ── Drug Licenses (simple multi-input list, no Add/Update gating here
     since Profile tab is a single Save action, not a stepwise form) ── */
  const updateLicense = (idx, value) => {
    setForm(prev => {
      const lics = [...prev.drugLicenses];
      lics[idx] = value.toUpperCase().replace(/\s/g, '');
      return { ...prev, drugLicenses: lics };
    });
  };
  const addLicenseField = () => setForm(prev => ({ ...prev, drugLicenses: [...prev.drugLicenses, ''] }));
  const removeLicenseField = (idx) => setForm(prev => ({ ...prev, drugLicenses: prev.drugLicenses.filter((_, i) => i !== idx) }));

  /* ── Save ─────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!form.companyName.trim()) {
      toast.error('Company name is required.');
      return;
    }
    if (!form.representatives.some(r => r.name && (r.phone || r.email))) {
      toast.error('At least one representative with name and phone/email is required.');
      return;
    }

    const hasBlockingError = Object.values(errors).some(Boolean);
    if (hasBlockingError) {
      toast.error('Please fix the highlighted fields before saving.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        companyName: form.companyName,
        shortCode: form.shortCode,
        representatives: form.representatives.filter(r => r.name),
        gstin: form.gstin,
        pan: form.pan,
        drugLicenses: form.drugLicenses.filter(l => l.trim()),
        drugLicenseExpiry: form.drugLicenseExpiry || undefined,
        email: form.email,
        whatsapp: form.whatsapp,
        billingAddress: form.billingAddress,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        aadhaar: form.aadhaar,
        drugsBazaarId: form.drugsBazaarId,
        leadTimeDays: form.leadTimeDays ? parseInt(form.leadTimeDays) : undefined,
        minimumOrderValue: form.minimumOrderValue ? parseFloat(form.minimumOrderValue) : undefined,
        bankDetails: form.bankDetails.filter(b => b.bankName && b.accountNumber && b.ifscCode && b.branch),
      };
      const res = await api.updateCompany(company._id, payload);
      toast.success('Company profile updated.');
      onCompanyUpdated(res.data);
      setEditing(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    setStatusBusy(true);
    try {
      const res = await api.toggleCompanyStatus(company._id);
      toast.success(res.message);
      onCompanyUpdated(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStatusBusy(false);
    }
  };

  /* ════════════════════════════ VIEW MODE ════════════════════════════ */
  if (!editing) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <StatusToggle status={company.status} onConfirm={handleToggleStatus} busy={statusBusy} entityLabel="supplier" />
          <button
            onClick={startEditing}
            className="flex items-center gap-1.5 bg-slate-900 text-white text-sm font-semibold px-3.5 py-2 rounded-xl"
          >
            <Edit2 size={14} /> Edit Profile
          </button>
        </div>

        <Section title="Legal & Tax">
          <Field label="GSTIN" value={company.gstin} />
          <Field label="PAN" value={company.pan} />
          <Field label="Drug Licenses" value={company.drugLicenses?.join(', ')} />
          <Field label="License Expiry" value={company.drugLicenseExpiry ? new Date(company.drugLicenseExpiry).toLocaleDateString('en-IN') : null} />
          <Field label="Aadhaar" value={company.aadhaar} />
          <Field label="DrugsBazaar ID" value={company.drugsBazaarId} />
        </Section>

        <Section title="Contact & Address">
          <Field label="Email" value={company.email} />
          <Field label="WhatsApp" value={company.whatsapp} />
          <Field label="Billing Address" value={company.billingAddress} />
          <Field label="City / State / Pincode" value={[company.city, company.state, company.pincode].filter(Boolean).join(' / ')} />
        </Section>

        <Section title="Procurement Settings">
          <Field label="Lead Time" value={company.leadTimeDays ? `${company.leadTimeDays} days` : null} />
          <Field label="Min. Order Value" value={company.minimumOrderValue ? `₹${company.minimumOrderValue.toLocaleString('en-IN')}` : null} />
        </Section>

        <div>
          <h4 className="text-slate-700 font-semibold text-base mb-2">Representatives</h4>
          <div className="space-y-2">
            {company.representatives?.map((rep, i) => (
              <RepCard key={i} rep={rep} isMain={i === 0} />
            ))}
          </div>
        </div>

        {company.bankDetails?.length > 0 && (
          <div>
            <h4 className="text-slate-700 font-semibold text-base mb-2">Bank Details</h4>
            <div className="space-y-2">
              {company.bankDetails.map((b, i) => <BankDetailCard key={i} bank={b} />)}
            </div>
          </div>
        )}

        <DocumentStub label="Drug License Certificate" />
        <DocumentStub label="GST Certificate" />
      </div>
    );
  }

  /* ════════════════════════════ EDIT MODE ════════════════════════════ */
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-900 font-bold text-lg">Editing Profile</h3>
        <div className="flex gap-2">
          <button onClick={cancelEditing} className="flex items-center gap-1 bg-slate-100 text-slate-600 text-sm font-semibold px-3 py-2 rounded-xl">
            <XIcon size={14} /> Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 bg-emerald-500 text-white text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-60">
            <Save size={14} /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <LabeledInput label="Company Name *" value={form.companyName} onChange={(v) => handleField('companyName', v)} />

      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="Short Code" value={form.shortCode} onChange={(v) => handleField('shortCode', v)} onBlur={() => handleBlurValidate('shortCode', form.shortCode)} error={errors.shortCode} />
        <LabeledInput label="GSTIN" value={form.gstin} onChange={(v) => handleField('gstin', v.toUpperCase())} onBlur={() => handleBlurValidate('gstin', form.gstin)} error={errors.gstin} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="PAN" value={form.pan} onChange={(v) => handleField('pan', v.toUpperCase())} onBlur={() => handleBlurValidate('pan', form.pan)} error={errors.pan} />
        <LabeledInput label="Aadhaar" value={form.aadhaar} onChange={(v) => handleField('aadhaar', v.replace(/\D/g, ''))} onBlur={() => handleBlurValidate('aadhaar', form.aadhaar)} error={errors.aadhaar} />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-1">Drug Licenses</label>
        <div className="space-y-2">
          {form.drugLicenses.map((lic, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={lic}
                onChange={(e) => updateLicense(i, e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400"
              />
              {form.drugLicenses.length > 1 && (
                <button onClick={() => removeLicenseField(i)} className="px-3 text-red-500 font-semibold">✕</button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addLicenseField} className="text-emerald-600 text-sm font-semibold mt-1.5">+ Add license</button>
      </div>

      <LabeledInput type="date" label="Drug License Expiry" value={form.drugLicenseExpiry} onChange={(v) => handleField('drugLicenseExpiry', v)} />
      <LabeledInput label="DrugsBazaar ID" value={form.drugsBazaarId} onChange={(v) => handleField('drugsBazaarId', v.toUpperCase())} onBlur={() => handleBlurValidate('drugsBazaarId', form.drugsBazaarId)} error={errors.drugsBazaarId} />

      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="Email" value={form.email} onChange={(v) => handleField('email', v.toLowerCase())} onBlur={() => handleBlurValidate('email', form.email)} error={errors.email} />
        <LabeledInput label="WhatsApp" value={form.whatsapp} onChange={(v) => handleField('whatsapp', v.replace(/\D/g, '').slice(0, 10))} />
      </div>

      <LabeledInput label="Billing Address" value={form.billingAddress} onChange={(v) => handleField('billingAddress', v)} textarea />

      <div className="grid grid-cols-3 gap-3">
        <LabeledInput label="City" value={form.city} onChange={(v) => handleField('city', v)} />
        <LabeledInput label="State" value={form.state} onChange={(v) => handleField('state', v)} />
        <LabeledInput label="Pincode" value={form.pincode} onChange={(v) => handleField('pincode', v.replace(/\D/g, ''))} onBlur={() => handleBlurValidate('pincode', form.pincode)} error={errors.pincode} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LabeledInput type="number" label="Lead Time (days)" value={form.leadTimeDays} onChange={(v) => handleField('leadTimeDays', v)} />
        <LabeledInput type="number" label="Min. Order Value (₹)" value={form.minimumOrderValue} onChange={(v) => handleField('minimumOrderValue', v)} />
      </div>

      <div>
        <h4 className="text-slate-700 font-semibold text-base mb-2">Representatives *</h4>
        <div className="space-y-2">
          {form.representatives.map((rep, i) => (
            <RepCard
              key={i}
              rep={rep}
              isMain={i === 0}
              editable
              onChange={(field, value) => updateRep(i, field, value)}
              onSetMain={() => setMainRep(i)}
              onRemove={form.representatives.length > 1 ? () => removeRep(i) : undefined}
            />
          ))}
        </div>
        <button onClick={addRep} className="text-emerald-600 text-sm font-semibold mt-2">+ Add Representative</button>
      </div>

      <div>
        <h4 className="text-slate-700 font-semibold text-base mb-2">Bank Details</h4>
        <div className="space-y-2">
          {form.bankDetails.map((b, i) => (
            <div key={i} className="border border-slate-300 rounded-xl p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-slate-700">Bank #{i + 1}</span>
                <button onClick={() => removeBank(i)} className="text-red-500 text-sm">Remove</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Bank Name" value={b.bankName} onChange={(e) => updateBank(i, 'bankName', e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-base outline-none focus:border-emerald-400" />
                <input placeholder="Account Number" value={b.accountNumber} onChange={(e) => updateBank(i, 'accountNumber', e.target.value.replace(/\D/g, ''))}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-base outline-none focus:border-emerald-400" />
                <input placeholder="IFSC Code" value={b.ifscCode} onChange={(e) => updateBank(i, 'ifscCode', e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-base outline-none focus:border-emerald-400" />
                <input placeholder="Branch" value={b.branch} onChange={(e) => updateBank(i, 'branch', e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-base outline-none focus:border-emerald-400" />
              </div>
            </div>
          ))}
        </div>
        <button onClick={addBank} className="text-emerald-600 text-sm font-semibold mt-2">+ Add Bank</button>
      </div>

      <DocumentStub label="Drug License Certificate" />
      <DocumentStub label="GST Certificate" />
    </div>
  );
};

/* ── small local presentational helpers (kept private to this file
   since they're trivial wrappers only used inside ProfileTab) ───────── */

const Section = ({ title, children }) => (
  <div>
    <h4 className="text-slate-700 font-semibold text-base mb-2">{title}</h4>
    <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200">
      {children}
    </div>
  </div>
);

const Field = ({ label, value }) => (
  <div className="flex justify-between px-3 py-2.5 text-base">
    <span className="text-slate-500">{label}</span>
    <span className="text-slate-800 font-medium text-right">{value || '—'}</span>
  </div>
);

const LabeledInput = ({ label, value, onChange, onBlur, error, type = 'text', textarea = false }) => (
  <div>
    <label className="text-sm font-semibold text-slate-700 block mb-1">{label}</label>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className={`w-full bg-white border ${error ? 'border-red-500' : 'border-slate-300'} rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400 resize-none`}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`w-full bg-white border ${error ? 'border-red-500' : 'border-slate-300'} rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400`}
      />
    )}
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const DocumentStub = ({ label }) => (
  <div className="border border-dashed border-slate-300 rounded-xl px-3 py-3 flex items-center justify-between">
    <span className="flex items-center gap-2 text-slate-500 text-base">
      <FileText size={16} /> {label}
    </span>
    <button disabled className="flex items-center gap-1 text-slate-400 text-sm font-semibold cursor-not-allowed">
      <Plus size={14} /> Upload (coming soon)
    </button>
  </div>
);