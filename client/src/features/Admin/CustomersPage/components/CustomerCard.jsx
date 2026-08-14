import { motion } from 'framer-motion';
import { STATUS_CFG, TIER_CFG } from '../utils/constants';
import { Phone, MapPin } from 'lucide-react';

export const CardContent = ({ customer }) => {
  const statusCfg = STATUS_CFG[customer.status] || STATUS_CFG.Suspended;
  const tierCfg   = TIER_CFG[customer.partyTier || customer.tier] || TIER_CFG.Silver;
  const primary   = customer.contacts?.find(c => c.isPrimary) || customer.contacts?.[0];

  // ✨ FIX: Background color now maps strictly to the Risk Tier (Red, Yellow, Green)
  const getRiskTierBg = (riskTier) => {
    switch (riskTier) {
      case 'Red': return 'bg-red-600';
      case 'Yellow': return 'bg-amber-500';
      case 'Green': 
      default: return 'bg-emerald-600';
    }
  };
  const riskBg = getRiskTierBg(customer.riskTier);

  return (
    <div className="relative p-4 pt-8 pb-5 flex-1 min-w-0">
      
      {/* ✨ 1. CUSTOMER CODE (Top-Left) - Now uses Risk Tier color */}
      <span className={`absolute top-0 left-0 text-sm text-white font-black px-3 py-1.5 rounded-tl-2xl rounded-br-xl shadow-sm z-10 ${riskBg}`}>
        {customer.clientId}
      </span>

      {/* ✨ 2. PARTY TIER (Top-Middle) */}
      <span className={`absolute top-0 left-1/2 -translate-x-1/2 text-sm font-bold px-3 py-1.5 rounded-b-xl border-x border-b border-white shadow-sm z-10 ${tierCfg.cls}`}>
        <span className="flex items-center gap-1.5">
          {tierCfg.icon} {customer.partyTier || customer.tier}
        </span>
      </span>

      {/* ✨ 3. STATUS BADGE (Top-Right) */}
      <span className={`absolute top-0 right-0 flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-tr-2xl rounded-bl-xl border-b border-l border-white shadow-sm z-10 ${statusCfg.pill}`}>
        <span className={`w-2 h-2 rounded-full ${statusCfg.dot} ${customer.status === 'Pending' ? 'animate-pulse' : ''}`} />
        {customer.status === 'Pending' ? 'Needs Approval' : customer.status}
      </span>

      {/* ✨ NAME & OUTSTANDING BALANCE */}
      <div className="mt-1">
        <h3 className="text-slate-900 font-bold text-2xl leading-tight truncate">
          {customer.establishmentName}
        </h3>

        {customer.totalOutstanding > 0 && (
          <div className="mt-2">
            <span className="text-sm font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
              ₹{customer.totalOutstanding.toLocaleString('en-IN')} due
            </span>
          </div>
        )}
      </div>

      {/* ✨ CONTACT & CITY */}
      <div className="flex items-center gap-4 text-base text-slate-500 mt-2 overflow-hidden">
        {primary && (
          <span className="flex items-center gap-1.5 truncate shrink-0">
            <Phone size={14} className="shrink-0 text-slate-400" />
            {primary.name}{primary.phone ? ` · ${primary.phone}` : ''}
          </span>
        )}
        <span className="flex items-center gap-1.5 truncate min-w-0">
          <MapPin size={14} className="shrink-0 text-slate-400" />
          <span className="truncate">{customer.line || customer.city}</span>
        </span>
      </div>
    </div>
  );
};

export const CustomerCard = ({
  customer,
  index = 0,
  onViewDetail,
  onApprove,
  onReject,
  invisible = false, 
}) => (
  <motion.div
    layoutId={`customer-card-${customer._id}`}
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04, duration: 0.25 }}
    whileHover={{ scale: 1.005 }}
    whileTap={{ scale: 0.985 }}
    onClick={() => onViewDetail(customer)}
    style={{ opacity: invisible ? 0 : 1 }} 
    className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer select-none relative shadow-sm flex flex-col"
  >
    <CardContent customer={customer} />

    {customer.status === 'Pending' && (
      <div className="flex gap-2 px-4 pb-4 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onApprove(customer); }}
          className="flex-1 bg-emerald-500 text-white text-sm font-bold py-2.5 rounded-xl transition-colors active:bg-emerald-600 hover:bg-emerald-400 shadow-sm"
        >
          Approve
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onReject(customer); }}
          className="flex-1 bg-red-100 text-red-600 text-sm font-bold py-2.5 rounded-xl transition-colors active:bg-red-200 hover:bg-red-50"
        >
          Reject
        </button>
      </div>
    )}
  </motion.div>
);