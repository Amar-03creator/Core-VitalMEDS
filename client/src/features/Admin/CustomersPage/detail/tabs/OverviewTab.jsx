// src/features/Admin/CustomersPage/detail/tabs/OverviewTab.jsx
import { RISK_CFG, SCORE_COLOR, TIER_CFG } from '../../utils/constants';

const InfoCard = ({ title, children }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 mb-3">
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</p>
    {children}
  </div>
);

const InfoRow = ({ label, value, mono, urgent }) => (
  <div className="flex justify-between items-start py-2.5 border-b border-slate-100 last:border-0 gap-3">
    <span className="text-base text-slate-500 shrink-0">{label}</span>
    <span className={`text-base font-semibold text-right max-w-[60%]
      ${urgent ? 'text-red-600' : 'text-slate-800'}
      ${mono ? 'font-mono text-sm' : ''}`}>
      {value || '—'}
    </span>
  </div>
);

export const OverviewTab = ({ client, onSuspend, onEdit, onReactivate, onApprove }) => {
  if (!client) return null;

  const primary   = client.contacts?.find(c => c.isPrimary) || client.contacts?.[0];
  const riskCfg   = client.riskTier ? RISK_CFG[client.riskTier] : null;
  const tierCfg   = client.partyTier ? TIER_CFG[client.partyTier] : null;
  const available = (client.creditLimit || 0) - (client.totalOutstanding || 0);

  return (
    <div>
      {/* Credit & Risk */}
      <InfoCard title="Credit & risk">
        {client.creditScore != null && (
          <>
            <div className="flex justify-between items-center mb-2">
              <span className="text-base text-slate-500">Credit score</span>
              <span className={`text-lg font-bold ${SCORE_COLOR(client.creditScore)}`}>
                {client.creditScore} / 100
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full ${riskCfg ? riskCfg.bar : 'bg-slate-300'}`}
                style={{ width: `${client.creditScore}%` }}
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Credit limit',    value: client.creditLimit ? `₹${client.creditLimit.toLocaleString('en-IN')}` : '—' },
            { label: 'Outstanding',     value: client.totalOutstanding ? `₹${client.totalOutstanding.toLocaleString('en-IN')}` : '₹0', urgent: client.totalOutstanding > 0 },
            { label: 'Available credit', value: available > 0 ? `₹${available.toLocaleString('en-IN')}` : '₹0' },
            { label: 'Payment terms',    value: client.paymentTermsDays ? `${client.paymentTermsDays} days` : '—' },
          ].map(({ label, value, urgent }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-3">
              <p className={`text-base font-bold ${urgent ? 'text-red-600' : 'text-slate-800'}`}>{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {client.averagePaymentTime != null && (
          <InfoRow label="Avg. payment time" value={`${client.averagePaymentTime} days`} />
        )}
        {client.riskTier && (
          <InfoRow label="Risk tier" value={`${{ Green:'🟢', Yellow:'🟡', Red:'🔴' }[client.riskTier]} ${client.riskTier}`} />
        )}
      </InfoCard>

      {/* Business Info */}
      <InfoCard title="Business information">
        <InfoRow label="Type"          value={client.businessType} />
        <InfoRow label="GSTIN"         value={client.gstin}          mono />
        <InfoRow label="PAN"           value={client.panNumber}      mono />
        <InfoRow label="Aadhaar"       value={client.aadhaarNumber}  mono />
        <InfoRow label="DL 20B"        value={client.drugLicense20B} />
        <InfoRow label="DL 21B"        value={client.drugLicense21B} />
        <InfoRow label="Docs verified" value={client.documentsVerified ? '✅ Verified' : '⚠️ Pending'} />
        {tierCfg && <InfoRow label="Party tier" value={`${tierCfg.icon} ${client.partyTier}`} />}
        <InfoRow label="Default discount" value={client.defaultDiscountPercent ? `${client.defaultDiscountPercent}%` : null} />
      </InfoCard>

      {/* Contacts */}
      <InfoCard title="Contacts">
        {client.contacts?.length ? (
          <div className="space-y-3">
            {client.contacts.map((c, i) => (
              <div key={i} className={`flex items-center gap-3 py-2 ${i < client.contacts.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                  {c.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-slate-800">{c.name}</p>
                  <p className="text-sm text-slate-500">
                    {c.designation}{c.phone ? ` · ${c.phone}` : ''}
                    {c.email ? ` · ${c.email}` : ''}
                  </p>
                </div>
                {c.isPrimary && (
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full shrink-0">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-base text-slate-400">No contacts added</p>}
      </InfoCard>

      {/* Address */}
      <InfoCard title="Address & delivery">
        <InfoRow label="Billing"      value={client.billingAddress} />
        {client.shippingAddress && <InfoRow label="Shipping" value={client.shippingAddress} />}
        <InfoRow label="City"         value={client.city} />
        <InfoRow label="District"     value={client.district} />
        <InfoRow label="State"        value={client.state} />
        <InfoRow label="Pincode"      value={client.pincode} />
        <InfoRow label="Line / Route" value={client.line || client.deliveryRoute} />
      </InfoCard>

      {/* ✨ UPDATED: Suspend, Edit, & Reactivate buttons */}
      {(onSuspend || onEdit || onReactivate || onApprove) && (
        <div className="flex gap-3 mt-4 pb-4">
          
          {/* RECTIVATE BUTTON */}
          {onReactivate && (
            <button
              onClick={onReactivate}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 text-base font-semibold px-4 py-3 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Reactivate Account
            </button>
          )}

          {/* SUSPEND BUTTON */}
          {onSuspend && (client.status === 'Active' || client.status === 'Credit Alert') && (
            <button
              onClick={onSuspend}
              className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-700 text-base font-semibold px-4 py-3 rounded-xl hover:bg-red-100 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
              Suspend Account
            </button>
          )}

          {/* EDIT BUTTON */}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 text-base font-semibold px-4 py-3 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Profile
            </button>
          )}

          {/* APPROVE BUTTON */}
          {onApprove && client.status === 'Pending' && (
            <button
              onClick={onApprove}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white text-base font-semibold px-4 py-3 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Approve & Issue Credentials
            </button>
          )}

        </div>
      )}
    </div>
  );
};