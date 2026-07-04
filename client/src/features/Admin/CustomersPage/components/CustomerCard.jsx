import { STATUS_CFG, TIER_CFG } from '../utils/constants';
import { Phone, MapPin } from 'lucide-react';

export const CardContent = ({ customer }) => {
  const statusCfg = STATUS_CFG[customer.status] || STATUS_CFG.Suspended;
  const tierCfg   = TIER_CFG[customer.partyTier || customer.tier] || TIER_CFG.Silver;
  const primary   = customer.contacts?.find(c => c.isPrimary) || customer.contacts?.[0];

  return (
    <div className="relative p-4 pb-7">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-2xl shrink-0">
          {customer.establishmentName?.[0] || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-slate-900 font-bold text-2xl leading-tight truncate">
            {customer.establishmentName}
          </h3>
          <p className="text-slate-500 text-lg mt-1">
            {customer.clientId} · {customer.city}
          </p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`flex items-center gap-1.5 text-base font-semibold px-2.5 py-0.5 rounded-full ${statusCfg.pill}`}>
              <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
              {customer.status}
            </span>
            {customer.totalOutstanding > 0 && (
              <span className="text-base font-semibold text-red-600">
                ₹{customer.totalOutstanding.toLocaleString('en-IN')} due
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact row */}
      <div className="flex items-center gap-4 text-base text-slate-500 mt-3">
        {primary && (
          <span className="flex items-center gap-1.5">
            <Phone size={15} className="shrink-0" />
            {primary.name}{primary.phone ? ` · ${primary.phone}` : ''}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <MapPin size={15} className="shrink-0" />
          {customer.line || customer.city}
        </span>
      </div>

      {/* Tier badge */}
      <span className={`absolute bottom-0 right-0 text-xs font-bold px-2.5 py-1 rounded-tl-xl rounded-br-2xl ${tierCfg.cls}`}>
        {tierCfg.icon} {customer.partyTier || customer.tier}
      </span>
    </div>
  );
};

export const CustomerCard = ({
  customer,
  onViewDetail,
  onApprove,
  onReject,
  cardRefCallback,
  invisible = false,
}) => (
  <div
    ref={cardRefCallback}
    onClick={() => onViewDetail(customer)}
    style={{ visibility: invisible ? 'hidden' : 'visible' }}
    className="bg-white rounded-2xl border border-slate-200 overflow-hidden active:bg-slate-50 transition-colors cursor-pointer select-none"
  >
    <CardContent customer={customer} />

    {customer.status === 'Pending' && (
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={(e) => { e.stopPropagation(); onApprove(customer); }}
          className="flex-1 bg-emerald-500 text-white text-base font-semibold py-2.5 rounded-xl"
        >
          Approve
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onReject(customer); }}
          className="flex-1 bg-red-100 text-red-600 text-base font-semibold py-2.5 rounded-xl"
        >
          Reject
        </button>
      </div>
    )}
  </div>
);