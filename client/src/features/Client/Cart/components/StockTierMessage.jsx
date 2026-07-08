// src/features/Client/Cart/components/StockTierMessage.jsx
import { AlertTriangle } from 'lucide-react';

const StockTierMessage = ({ tier, name }) => {
  if (!tier || tier.tier === 'ok' || tier.tier === 'limited') return null;

  const text =
    tier.tier === 'critical'
      ? `${name} is in critical stock. Only ${tier.availableQty} units are currently available. Final supplied quantity will be confirmed during invoicing.`
      : `Selected quantity for ${name} is currently unavailable. Please reduce the requested quantity and try again.`;

  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
      <AlertTriangle size={13} className="text-amber-600 shrink-0" />
      <p className="text-amber-700 text-xs sm:text-sm">{text}</p>
    </div>
  );
};

export default StockTierMessage;