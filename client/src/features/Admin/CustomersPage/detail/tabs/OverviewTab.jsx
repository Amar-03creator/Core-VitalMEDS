import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Clock, FileText } from 'lucide-react';
import { api } from '../../../../../services/api';
import { billingApi } from '../../../../../services/api/billingApi';
import { RISK_CFG, SCORE_COLOR, TIER_CFG } from '../../utils/constants';
import { DocumentViewerModal } from '../../modals/DocumentViewerModal';
import MonthlySummary from '../../../../Client/Dashboard/MonthlySummary';

const InfoCard = ({ title, children }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 mb-3">
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</p>
    {children}
  </div>
);

const InfoRow = ({ label, value, mono, urgent, onClick }) => (
  <div
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    className={`flex justify-between items-start py-2.5 border-b border-slate-100 last:border-0 gap-3
      ${onClick ? 'cursor-pointer hover:bg-slate-50 -mx-1 px-1 rounded-lg transition-colors' : ''}`}
  >
    <span className={`text-base shrink-0 flex items-center gap-1.5 ${onClick ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
      {label}
      {onClick && <FileText size={13} className="opacity-60" />}
    </span>
    <span className={`text-base font-semibold text-right max-w-[60%]
      ${urgent ? 'text-red-600' : 'text-slate-800'}
      ${mono ? 'font-mono text-sm' : ''}`}>
      {value || '—'}
    </span>
  </div>
);

export const OverviewTab = ({ client, onSuspend, onEdit, onReactivate, onApprove, onTakeAction }) => {
  const [inviting, setInviting] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  const [summary, setSummary] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(false);

  const isActive = client?.status === 'Active';

  useEffect(() => {
    if (!isActive || !client?._id) return;

    let cancelled = false;
    setSummaryLoading(true);

    billingApi.getClientMonthlySummary(client._id)
      .then((res) => { if (!cancelled) setSummary(res.data || {}); })
      .catch(() => { })
      .finally(() => { if (!cancelled) setSummaryLoading(false); });

    return () => { cancelled = true; };
  }, [isActive, client?._id]);

  if (!client) return null;

  const primary = client.contacts?.find(c => c.isPrimary) || client.contacts?.[0];
  const riskCfg = client.riskTier ? RISK_CFG[client.riskTier] : null;
  const tierCfg = client.partyTier ? TIER_CFG[client.partyTier] : null;
  const available = (client.creditLimit || 0) - (client.totalOutstanding || 0);
  const isPending = client.status === 'Pending';

  const docUrls = client.documentUrls || {};
  const showDoc = (label, url, docKey) => (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    setViewingDoc({ label, url, docKey });
  };

  const startDate = client.createdAt
    ? { year: new Date(client.createdAt).getFullYear(), month: new Date(client.createdAt).getMonth() }
    : { year: new Date().getFullYear(), month: new Date().getMonth() };

  const handleInviteClick = async () => {
    setInviting(true);
    try {
      const data = await api.generateClientInvite(client._id);
      toast.success(`Invite code generated successfully!`);
      window.open(data.waLink, '_blank');
    } catch (err) {
      toast.error(err.message || 'Failed to generate invite');
    } finally {
      setInviting(false);
    }
  };

  // 🐛 DEBUGGING DATA FLOW:
  // This will print every single field your frontend knows about this customer
  console.log("====================================");
  console.log("🔍 INSPECTING CLIENT DATA");
  console.log("Establishment:", client.establishmentName);
  console.log("Is Claimed?:", client.isClaimed);
  console.log("Available Fields:", Object.keys(client).join(", "));
  console.log("FULL CLIENT OBJECT:", client);
  console.log("====================================");

  // ✨ NEW LOGIC: Does this client already have an app account?
  // 1. They claimed an invite (isClaimed is true)
  // 2. OR they self-registered (meaning they have a password and are waiting for approval)
  const hasAppAccount = client.isClaimed === true || isPending;

  return (
    <div>
      {isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-3 flex items-center justify-between gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-sm font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
            <Clock size={13} /> Pending Approval
          </span>
          {onTakeAction && (
            <button
              onClick={onTakeAction}
              className="bg-slate-900 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Take Action
            </button>
          )}
        </div>
      )}

      {client.documentRequests?.filter(r => r.status === 'pending').length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-3">
          <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-3 flex items-center gap-2">
            <FileText size={14} /> Client requests permission to update documents
          </p>
          <div className="space-y-2">
            {client.documentRequests.filter(r => r.status === 'pending').map(req => {
              const docNames = {
                gstCert: 'GST Certificate', dlCert: 'Drug License',
                panCard: 'PAN Card', aadhaarCard: 'Aadhaar Card'
              };

              return (
                <div key={req._id} className="bg-white border border-blue-100 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{docNames[req.documentType] || req.documentType}</p>
                    <p className="text-xs text-slate-500 mt-0.5"><span className="font-semibold">Reason given:</span> {req.message}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        try {
                          await api.approveRejectDocumentRequest(req._id, 'approved');
                          toast.success('Approved. The client can now upload the new document.');
                          setTimeout(() => window.location.reload(), 1000);
                        } catch (err) { toast.error('Failed to approve'); }
                      }}
                      className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                    >
                      Approve Request
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await api.approveRejectDocumentRequest(req._id, 'rejected', 'Request denied by Admin');
                          toast.success('Request rejected.');
                          setTimeout(() => window.location.reload(), 1000);
                        } catch (err) { toast.error('Failed to reject'); }
                      }}
                      className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <InfoCard title="Summary & Credit">
        {isActive && (
          <div className="mb-6">
            {summaryLoading ? (
              <p className="text-base text-slate-400 py-6 text-center">Loading summary…</p>
            ) : (
              <MonthlySummary summaryData={summary} startDate={startDate} currentDate={new Date()} />
            )}
          </div>
        )}

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
            { label: 'Credit limit', value: client.creditLimit ? `₹${client.creditLimit.toLocaleString('en-IN')}` : '—' },
            { label: 'Outstanding', value: client.totalOutstanding ? `₹${client.totalOutstanding.toLocaleString('en-IN')}` : '₹0', urgent: client.totalOutstanding > 0 },
            { label: 'Available credit', value: available > 0 ? `₹${available.toLocaleString('en-IN')}` : '₹0' },
            { label: 'Payment terms', value: client.paymentTermsDays ? `${client.paymentTermsDays} days` : '—' },
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
          <InfoRow label="Risk tier" value={`${{ Green: '🟢', Yellow: '🟡', Red: '🔴' }[client.riskTier]} ${client.riskTier}`} />
        )}
      </InfoCard>

      <InfoCard title="Business information">
        <InfoRow label="Type" value={client.businessType} />

        <InfoRow
          label="GSTIN"
          value={client.gstin}
          mono={!!client.gstin}
          onClick={docUrls?.gstCert ? showDoc('GSTIN Certificate', docUrls.gstCert, 'gstCert') : undefined}
        />
        <InfoRow
          label="PAN"
          value={client.panNumber}
          mono={!!client.panNumber}
          onClick={docUrls?.panCard ? showDoc('PAN Card', docUrls.panCard, 'panCard') : undefined}
        />
        <InfoRow
          label="Aadhaar"
          value={client.aadhaarNumber}
          mono={!!client.aadhaarNumber}
          onClick={docUrls?.aadhaarCard ? showDoc('Aadhaar Card', docUrls.aadhaarCard, 'aadhaarCard') : undefined}
        />
        <InfoRow
          label="Drug Licenses"
          value={client.drugLicenses?.length ? client.drugLicenses.join(', ') : null}
          onClick={docUrls?.dlCert ? showDoc('Drug Licenses', docUrls.dlCert, 'dlCert') : undefined}
        />

        <InfoRow label="Docs verified" value={client.documentsVerified ? '✅ Verified' : '⚠️ Pending'} />
        {tierCfg && <InfoRow label="Party tier" value={`${tierCfg.icon} ${client.partyTier}`} />}
        <InfoRow label="Default discount" value={client.defaultDiscountPercent ? `${client.defaultDiscountPercent}%` : null} />
      </InfoCard>

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

      <InfoCard title="Address & delivery">
        <InfoRow label="Billing" value={client.billingAddress} />
        {client.shippingAddress && <InfoRow label="Shipping" value={client.shippingAddress} />}
        <InfoRow label="City" value={client.city} />
        <InfoRow label="District" value={client.district} />
        <InfoRow label="State" value={client.state} />
        <InfoRow label="Pincode" value={client.pincode} />
        <InfoRow label="Line / Route" value={client.line || client.deliveryRoute} />
      </InfoCard>

      {(onSuspend || onEdit || onReactivate || onApprove) && (
        <div className="flex flex-wrap gap-3 mt-4 pb-4">

          {/* ✨ FIX: Hide the Invite button if the client already has an AWS Cognito Account attached */}
          {!hasAppAccount && (
            <button
              onClick={handleInviteClick}
              disabled={inviting}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-slate-900 text-emerald-400 px-4 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {inviting ? 'Generating...' : '📱 Invite to App via WhatsApp'}
            </button>
          )}

          {onEdit && !isPending && (
            <button
              onClick={onEdit}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-slate-100 text-slate-700 text-base font-semibold px-4 py-3 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Profile
            </button>
          )}

          {onReactivate && (
            <button
              onClick={onReactivate}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 text-base font-semibold px-4 py-3 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reactivate Account
            </button>
          )}

          {onSuspend && (client.status === 'Active' || client.status === 'Credit Alert') && (
            <button
              onClick={onSuspend}
              className="flex-1 min-w-[180px] flex items-center justify-center gap-2 bg-red-50 text-red-700 text-base font-semibold px-4 py-3 rounded-xl hover:bg-red-100 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              Suspend Account
            </button>
          )}

          {onApprove && isPending && (
            <button
              onClick={onApprove}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-emerald-600 text-white text-base font-semibold px-4 py-3 rounded-xl hover:bg-emerald-700 transition-colors"
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

      {viewingDoc && (
        <DocumentViewerModal
          client={client}
          docKey={viewingDoc.docKey}
          label={viewingDoc.label}
          url={viewingDoc.url}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
};