import { Trash2, Tag } from 'lucide-react';
import QuantityStepper from '../../../../components/QuantityStepper';
import { getEstimatedUnitPrice, getEstimatedLineTotal } from '../utils/cartMath';

const ReviewItem = ({ item, allItems, rateByKey, activeTab, onQtyChange, onRemove, onAddOfferItem }) => {
  const unitPrice = getEstimatedUnitPrice(item, rateByKey);
  const lineTotal = getEstimatedLineTotal(item, rateByKey);

  const shortCode = item.companyShortCode || item.companyDetails?.[0]?.shortCode || item.company;
  const isInputEmpty = item.requestedQty === '';
  const isOfferActive = item.offerApplied && !!item.offer;

  const tileBg = isOfferActive
    ? 'bg-amber-50 border-amber-300 shadow-sm'
    : 'bg-white border-slate-200 shadow-sm';

  let expDate = 'N/A';
  const today = new Date();
  const thresholdDays = item.shortExpiryThreshold || 90;
  const msPerDay = 1000 * 60 * 60 * 24;

  const validBatches = (item.batches || [])
    .filter(b => b.expiry || b.expiryDate)
    .map(b => ({ ...b, parsedDate: new Date(b.expiry || b.expiryDate) }))
    .filter(b => !isNaN(b.parsedDate.getTime()))
    .sort((a, b) => a.parsedDate - b.parsedDate);

  // ✨ FIX 1: Safely grab the expiry date directly from the Batch ID!
  if (item.batchId && validBatches.length > 0) {
    const selectedBatch = validBatches.find(b => String(b._id) === String(item.batchId) || String(b.no) === String(item.batchId));
    if (selectedBatch) {
      expDate = selectedBatch.parsedDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    }
  } else if (validBatches.length > 0) {
    const safeBatch = validBatches.find(b => ((b.parsedDate - today) / msPerDay) > thresholdDays);
    const displayBatch = safeBatch || validBatches[0];
    expDate = displayBatch.parsedDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  }

  const offerBatch = validBatches.find(b => b.offer && (b.offer.isActive || b.offer.description));
  const isOfferAlreadyInCart = allItems.some(i => i.productId === item.productId && String(i.batchId) === String(offerBatch?._id || offerBatch?.no));
  const showOfferBanner = activeTab === 'order' && offerBatch && !item.offerApplied && !isOfferAlreadyInCart;
  return (
    <div className={`rounded-2xl border p-3 sm:p-5 flex flex-col gap-4 transition-all ${tileBg}`}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-xl sm:text-2xl text-slate-900 truncate leading-tight flex items-center flex-wrap gap-2">
            {item.name}
            {isOfferActive && (
              <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                Offer Scheme
              </span>
            )}
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

      <div className="flex flex-row items-center justify-between gap-4 mt-1">
        <div className="w-36 sm:w-44">
          <QuantityStepper
            value={item.requestedQty}
            onChange={onQtyChange}
            max={isOfferActive ? offerBatch?.totalStockQuantity || 9999 : 9999}
            size="lg"
          />
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-slate-900 font-black text-2xl sm:text-3xl leading-none">
            ₹{isInputEmpty ? '0.00' : lineTotal.toFixed(2)}
          </p>
          <div className="flex flex-col items-end mt-1.5">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider">EST. PTR</span>
            <p className="text-slate-500 font-bold text-sm sm:text-base leading-none mt-0.5">
              ₹{unitPrice.toFixed(2)} / unit
            </p>
          </div>
        </div>
      </div>

      {showOfferBanner && (
        <button
          onClick={() => onAddOfferItem(offerBatch)}
          className="w-full mt-1.5 bg-orange-50/70 hover:bg-orange-100 border border-dashed border-orange-300 rounded-xl p-3 flex items-start sm:items-center gap-2.5 transition-colors text-left"
        >
          <Tag size={16} className="text-orange-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-orange-800 text-sm font-medium leading-snug">
            <span className="font-bold">Exclusive Scheme:</span> An offer of "{offerBatch.offer.description}" is available (MRP ₹{offerBatch.mrp.toFixed(2)}) expiring in {offerBatch.parsedDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}. <span className="underline font-bold text-orange-600 ml-1">Click to apply.</span>
          </p>
        </button>
      )}
    </div>
  );
};

export default ReviewItem;