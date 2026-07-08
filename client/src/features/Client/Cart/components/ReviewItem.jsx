// src/features/Client/Cart/components/ReviewItem.jsx
import { Trash2, Tag } from 'lucide-react';
import QuantityStepper from '../../../../components/QuantityStepper';
import { getEstimatedUnitPrice, getEstimatedLineTotal } from '../utils/cartMath';

const ReviewItem = ({ item, rateByProductId, onQtyChange, onRemove, onToggleOffer }) => {
  const unitPrice = getEstimatedUnitPrice(item, rateByProductId);
  const lineTotal = getEstimatedLineTotal(item, rateByProductId);
  
  // Safely grab shortCode (now guaranteed by ClientCart's enrichment)
  const shortCode = item.companyShortCode || item.companyDetails?.[0]?.shortCode || item.company;
  const isInputEmpty = item.requestedQty === '';

  // Selected state determines background color to separate it from the page
  const isOfferActive = item.offerApplied && !!item.offer;
  
  // High contrast tile backgrounds
  const tileBg = isOfferActive 
    ? 'bg-amber-50 border-amber-300 shadow-sm' 
    : 'bg-white border-slate-200 shadow-sm';

  // Expiry display
  const expDate = isOfferActive && item.offer
    ? new Date(item.offer.expiryDate || item.offer.expiry).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : 'Standard';

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col gap-4 transition-all ${tileBg}`}>
      
      {/* Top Row: Product Info & Distinct Delete Button */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-xl sm:text-2xl text-slate-900 truncate leading-tight">
            {item.name}
          </h4>
          <p className="text-slate-500 font-bold text-sm sm:text-base mt-1.5 truncate">
            {shortCode} • {item.packing} • Exp: {expDate}
          </p>
        </div>
        <button 
          onClick={onRemove} 
          className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-3 sm:p-3.5 rounded-xl transition-colors shrink-0 border border-red-100 shadow-sm"
        >
          <Trash2 size={22} />
        </button>
      </div>

      {/* Middle Row: Stepper & Pricing */}
      <div className="flex flex-row items-center justify-between gap-4 mt-1">
        <div className="w-36 sm:w-44">
          <QuantityStepper 
            value={item.requestedQty} 
            onChange={onQtyChange} 
            max={isOfferActive ? item.offer.availableQty : 9999}
            size="lg" 
          />
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-slate-900 font-black text-2xl sm:text-3xl leading-none">
            ₹{isInputEmpty ? '0.00' : lineTotal.toFixed(2)}
          </p>
          <p className="text-slate-500 font-bold text-sm sm:text-base mt-1.5">
            ₹{unitPrice.toFixed(2)} / unit
          </p>
        </div>
      </div>

      {/* Offer Sub-Tile (If available but not active) */}
      {item.offer && !item.offerApplied && (
        <button 
          onClick={onToggleOffer}
          className="w-full mt-2 bg-orange-50/50 hover:bg-orange-50 border-2 border-dashed border-orange-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors text-left"
        >
          <div>
             <p className="text-orange-700 text-base sm:text-lg font-bold flex items-center gap-2">
               <Tag size={18}/> Offer: min. 20% more discount
             </p>
             <p className="text-orange-600 text-sm sm:text-base font-bold mt-1">
               Exp: {new Date(item.offer.expiryDate || item.offer.expiry).toLocaleDateString('en-GB', {month:'short', year:'numeric'})} • {item.offer.availableQty} units left
             </p>
          </div>
          <span className="text-white text-base font-bold bg-orange-500 px-5 py-2.5 rounded-lg shadow-sm whitespace-nowrap text-center">
            Click to add
          </span>
        </button>
      )}

      {/* Revert Offer Button */}
      {isOfferActive && (
        <button 
          onClick={onToggleOffer} 
          className="text-amber-700 text-sm sm:text-base font-bold underline text-center w-full mt-2 hover:text-amber-900"
        >
           Remove Offer & Revert to Standard Batch
        </button>
      )}
    </div>
  );
};

export default ReviewItem;