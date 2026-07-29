/* 
 * ============================================================================
 * 🧠 DYNAMIC HYBRID INVENTORY ROUTER (B2B SPLIT-BATCH SAFE)
 * ============================================================================
 * This system uses a Hybrid routing model to protect B2B trust and invoicing:
 * 
 * 1. NORMAL CATALOG MODE (`isOfferMode = false`):
 *    - Expiry: Dynamically hides short-expiry batches. Defaults to closest "Safe" batch.
 *    - Pricing: Shows the Highest MRP across all SAFE batches to cap client expectation accurately.
 *    - Stock: Checks Global Total Stock (allows ordering 60 units even if Batch A only has 40).
 *    - Cart Payload: Sends NO `batchId`. The warehouse fulfills via standard FIFO.
 * 
 * 2. OFFERS PAGE MODE (`isOfferMode = true`):
 *    - Pricing: Shows the exact MRP of the specific clearance batch.
 *    - Stock: Checks strictly against the specific Offer Batch's remaining stock.
 *    - Cart Payload: Sends the exact `batchId` to lock in the promotional rules and price.
 * 
 * 3. DYNAMIC CRITICAL STOCK WARNINGS:
 *    - Critical Limit = (lowStockThreshold * (criticalStockThresholdPercent / 100)).
 *    - Bypasses generic "Low Stock" tags. If stock dips below the critical limit, 
 *      the UI aggressively flashes red and displays "Only X left!" using the 
 *      contextually appropriate stock number (Global vs Specific Batch).
 * ============================================================================
 */

import { ShoppingCart, ClipboardList, Tag, Lock, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '../../../../context/CartContext';

const ProductCard = ({ product, canOrder, onView, onAddToOrder, onAddToInquiry, isOfferMode = false }) => {
  const { orderItems, inquiryItems } = useCart();

  const today = new Date();
  const thresholdDays = product.shortExpiryThreshold || 90;
  const msPerDay = 1000 * 60 * 60 * 24;

  const validBatches = (product.batches || [])
    .filter(b => b.expiry || b.expiryDate)
    .map(b => ({ ...b, parsedDate: new Date(b.expiry || b.expiryDate) }))
    .filter(b => !isNaN(b.parsedDate.getTime()))
    .sort((a, b) => a.parsedDate - b.parsedDate);

  // ✨ Group the safe batches together
  const safeBatches = validBatches.filter(b => ((b.parsedDate - today) / msPerDay) > thresholdDays);

  let displayBatch = null;
  if (validBatches.length > 0) {
    displayBatch = safeBatches.length > 0 ? safeBatches[0] : validBatches[0];
  }

  // ✨ Dynamic Fenced Stock Logic
  let batchStock = 0;
  if (isOfferMode && displayBatch) {
    // Offer Mode: Strictly use the offer batch's stock
    batchStock = displayBatch.stock ?? displayBatch.remainingUnits ?? 0;
  } else {
    // Normal Mode: Global Stock MINUS Fenced Offer Stock
    let offerStockToExclude = 0;
    validBatches.forEach(b => {
      // If a batch has an active offer, its stock is reserved!
      if (b.offer && (b.offer.isActive || b.offer.description)) {
        offerStockToExclude += (b.stock ?? b.remainingUnits ?? 0);
      }
    });
    // Calculate available normal stock (minimum 0)
    batchStock = Math.max(0, (product.totalStock || 0) - offerStockToExclude);
  }

  const outOfStock = batchStock <= 0;

  const lowStockThreshold = product.lowStockThreshold || 50;
  const criticalPercent = product.criticalStockThresholdPercent || 50;
  const criticalLimit = Math.floor(lowStockThreshold * (criticalPercent / 100));

  const isCriticalStock = batchStock > 0 && batchStock <= criticalLimit;

  // ✨ Calculate Highest MRP strictly from Safe Batches!
  const mrpSourceBatches = safeBatches.length > 0 ? safeBatches : validBatches;
  const highestMrp = mrpSourceBatches.length > 0 ? Math.max(...mrpSourceBatches.map(b => b.mrp || 0)) : (product.mrp || 0);

  const displayMrp = isOfferMode && displayBatch ? displayBatch.mrp : highestMrp;

  const shortCode = product.companyShortCode || product.companyDetails?.[0]?.shortCode || product.company;
  const hasOffer = !!product.offer;

  const identifier = product.productId || product._id || product.id;
  const isAlreadyInCart = orderItems.some(item => item.productId === identifier);
  const isAlreadyInInquiry = inquiryItems.some(item => item.productId === identifier);

  // Only pass the batchId if we are on the Offers page, keeping the normal cart open for FIFO routing
  const payloadToCart = {
    ...product,
    productId: identifier,
    mrp: displayMrp,
    batchId: isOfferMode ? (displayBatch?._id || displayBatch?.id) : undefined
  };

  const handleCartClick = (e) => {
    e.stopPropagation();
    if (!canOrder) {
      toast.info('Please wait till the admin approves you to place direct orders.');
      return;
    }
    if (isAlreadyInCart) return;
    onAddToOrder(payloadToCart, 1);
  };

  const handleInquiryClick = (e) => {
    e.stopPropagation();
    if (isAlreadyInInquiry) return;
    onAddToInquiry(payloadToCart, 1);
  };

  // // ✨ FIX: Extract Cloudinary Image URL safely
  // const rawImages = product.images?.length > 0 ? [...product.images] : [];
  // if (rawImages.length === 0 && (product.photoUrl || product.imageUrl || product.photo)) {
  //   rawImages.push(product.photoUrl || product.imageUrl || product.photo);
  // }
  // const productImages = rawImages
  //   .map(img => typeof img === 'object' && img !== null ? (img.secure_url || img.url) : img)
  //   .filter(Boolean);
  // const displayImageUrl = productImages.length > 0 ? productImages[0] : null;


  // ✨ BULLETPROOF IMAGE EXTRACTION
  const rawImages = product?.images?.length > 0 ? [...product.images] : [];
  if (rawImages.length === 0 && (product?.photoUrl || product?.imageUrl || product?.photo)) {
    rawImages.push(product.photoUrl || product.imageUrl || product.photo);
  }
  const productImages = rawImages
    .map(img => {
      if (!img) return null;
      if (typeof img === 'string') return img;
      // If a custom hook accidentally double-nested the URL object, dive inside it!
      const target = typeof img.url === 'object' && img.url !== null ? img.url : img;
      return target.secure_url || target.url || target.photoUrl || null;
    })
    .filter(Boolean);
  const displayImageUrl = productImages.length > 0 ? productImages[0] : null;

  const cardThemeClasses = isCriticalStock && !outOfStock
    ? 'bg-red-50/40 border-red-200'
    : 'bg-white border-slate-200';

  return (
    <div className={`rounded-2xl border overflow-hidden flex flex-col transition-colors ${cardThemeClasses} ${outOfStock ? 'opacity-70' : ''}`}>
      <button onClick={() => onView(product)} className="block w-full relative">
        <div className="aspect-[5/4] bg-slate-100 flex items-center justify-center relative overflow-hidden">

          {displayImageUrl ? (
            <img src={displayImageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={40} className="text-slate-300" />
          )}

          <div className="absolute top-0 right-0 z-10 bg-slate-900/85 backdrop-blur-sm text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-bl-2xl">
            {product.packing}
          </div>

          {hasOffer && (
            <span className="absolute top-2 left-2 z-10 text-xs font-bold px-2.5 py-1 bg-orange-500 text-white rounded-lg flex items-center gap-1 shadow-sm">
              <Tag size={12} /> ON OFFER
            </span>
          )}

          <div className="absolute bottom-0 left-0 right-0 w-full bg-slate-600 backdrop-blur-sm py-1 px-2 flex items-center">
            <p className="text-white font-bold text-base sm:text-lg leading-tight line-clamp-1 sm:line-clamp-2 text-left">{product.name}</p>
          </div>
        </div>
      </button>

      <div className="p-2 flex flex-col flex-1">
        <div className="flex items-center justify-between text-md sm:text-base mb-2">
          <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 text-sm font-bold uppercase tracking-wider rounded-md border border-sky-200/70 shadow-sm bg-white">
            {shortCode}
          </span>
          {canOrder ? (
            <span className="text-slate-900 font-black shrink-0">₹{displayMrp.toFixed(2)}</span>
          ) : (
            <span className="text-slate-400 font-medium text-sm italic shrink-0 mt-0.5">Hidden</span>
          )}
        </div>

        <div className="mt-auto space-y-3">
          {isOfferMode && hasOffer && !outOfStock && (
            <div className="py-2 px-1 flex items-center justify-center min-h-[38px] text-center bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-sm font-black shadow-sm leading-tight">
              {product.offer.description}
            </div>
          )}

          {!outOfStock && isCriticalStock && (
            <div className="py-1.5 flex items-center justify-center gap-1.5 text-center text-sm font-bold rounded-xl min-h-[38px] shadow-sm leading-tight bg-red-100 text-red-700 border border-red-200">
              <AlertCircle size={14} strokeWidth={2.5} />
              Only {batchStock} available!
            </div>
          )}

          {outOfStock && (
            <div className="py-1.5 text-center text-md font-semibold text-slate-400 bg-slate-50 rounded-xl min-h-[38px] flex items-center justify-center">
              Out of Stock
            </div>
          )}

          {!outOfStock && (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCartClick}
                disabled={!canOrder || isAlreadyInCart}
                className={`w-full flex items-center justify-center gap-2 text-md sm:text-base font-bold py-1.5 rounded-xl transition-colors ${!canOrder
                    ? 'bg-slate-100 text-slate-400 opacity-80 cursor-not-allowed'
                    : isAlreadyInCart
                      ? 'bg-emerald-100 text-emerald-700 cursor-default border border-emerald-200'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                  }`}
              >
                {!canOrder ? <Lock size={14} /> : isAlreadyInCart ? <Check size={16} /> : <ShoppingCart size={16} />}
                {isAlreadyInCart ? 'Added to Cart' : 'Add to Cart'}
              </button>

              {!isOfferMode && (
                <button
                  onClick={handleInquiryClick}
                  disabled={isAlreadyInInquiry}
                  className={`w-full flex items-center justify-center gap-2 text-md sm:text-base font-bold py-1.5 rounded-xl transition-colors ${isAlreadyInInquiry ? 'bg-slate-200 text-slate-700 cursor-default' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                    }`}
                >
                  {isAlreadyInInquiry ? <Check size={16} /> : <ClipboardList size={16} />}
                  {isAlreadyInInquiry ? 'Added for Inquiry' : 'Add for Inquiry'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;