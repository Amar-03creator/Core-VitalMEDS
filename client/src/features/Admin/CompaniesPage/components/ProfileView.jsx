import { Edit2 } from 'lucide-react';
import { RepCard } from './Repcard'; 
import { BankDetailCard } from './Bankdetailcard'; 
import { StatusToggle } from './Statustoggle'; 

export const ProfileView = ({ company, onStartEditing, onToggleStatus, statusBusy }) => {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <StatusToggle status={company.status} onConfirm={onToggleStatus} busy={statusBusy} entityLabel="supplier" />
        <button onClick={onStartEditing} className="flex items-center gap-1.5 bg-slate-900 text-white text-sm font-semibold px-3.5 py-2 rounded-xl hover:bg-slate-800 transition-colors">
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
          {company.representatives?.map((rep, i) => <RepCard key={i} rep={rep} isMain={i === 0} />)}
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
    </div>
  );
};

const Section = ({ title, children }) => (
  <div>
    <h4 className="text-slate-700 font-semibold text-base mb-2">{title}</h4>
    <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200">{children}</div>
  </div>
);

const Field = ({ label, value }) => (
  <div className="flex justify-between px-3 py-2.5 text-base">
    <span className="text-slate-500">{label}</span>
    <span className="text-slate-800 font-medium text-right">{value || '—'}</span>
  </div>
);