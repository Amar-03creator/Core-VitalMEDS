// src/features/Client/Cart/components/OfferBanner.jsx
import { Flame } from 'lucide-react';

const OfferBanner = ({ offer, applied, onToggle }) => {
  if (!offer) return null;

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all text-left ${
        applied ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}
    >
      <Flame size={14} className={applied ? 'text-orange-500' : 'text-slate-400'} />
      <span>
        {applied
          ? `Applied: ₹${offer.price}/unit from the offer batch (expiring on ${offer.expiryDate})`
          : `Special offer available on specific batches of this product (${offer.availableQty} items available) expiring on ${offer.expiryDate}. Click to apply.`}
      </span>
    </button>
  );
};

export default OfferBanner;