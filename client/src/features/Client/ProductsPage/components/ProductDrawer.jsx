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

// src/features/Client/ProductsPage/components/ProductDrawer.jsx

import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, ClipboardList, Lock, Tag, Image as ImageIcon, Check, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner'; 
import { useModalTrap, useScrollLock } from '../../../../hooks/useBackHandler';
import { useCart } from '../../../../context/CartContext';

const ProductDrawer = ({ product, canOrder, onClose, onAddToOrder, onAddToInquiry, isOfferMode = false }) => {
  const { orderItems, inquiryItems } = useCart();

  const today = new Date();
  const thresholdDays = product?.shortExpiryThreshold || 90;
  const msPerDay = 1000 * 60 * 60 * 24;

  const validBatches = (product?.batches || [])
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
      if (b.offer && (b.offer.isActive || b.offer.description)) {
        offerStockToExclude += (b.stock ?? b.remainingUnits ?? 0);
      }
    });
    // Calculate available normal stock (minimum 0)
    batchStock = Math.max(0, (product?.totalStock || 0) - offerStockToExclude);
  }

  const outOfStock = batchStock <= 0;
  
  const lowStockThreshold = product?.lowStockThreshold || 50;
  const criticalPercent = product?.criticalStockThresholdPercent || 50;
  const criticalLimit = Math.floor(lowStockThreshold * (criticalPercent / 100));

  const isCriticalStock = batchStock > 0 && batchStock <= criticalLimit;

  // ✨ Calculate Highest MRP strictly from Safe Batches!
  const mrpSourceBatches = safeBatches.length > 0 ? safeBatches : validBatches;
  const highestMrp = mrpSourceBatches.length > 0 ? Math.max(...mrpSourceBatches.map(b => b.mrp || 0)) : (product?.mrp || 0);
  
  const displayMrp = isOfferMode && displayBatch ? displayBatch.mrp : highestMrp;
  const displayExpiry = displayBatch ? displayBatch.parsedDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A';

  useScrollLock(!!product);
  useModalTrap(!!product, { onBackClose: onClose, disabled: false });

  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(0);

  const handleTouchStartDrag = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchMoveDrag = (e) => {
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) setDragY(diff);
  };
  const handleTouchEndDrag = () => {
    if (dragY > 100) onClose();
    else setDragY(0);
  };

  // ✨ Safe Image Extraction
  // const rawImages = product?.images?.length > 0 ? [...product.images] : [];
  // if (rawImages.length === 0 && (product?.photoUrl || product?.imageUrl || product?.photo)) {
  //   rawImages.push(product.photoUrl || product.imageUrl || product.photo);
  // }
  // const productImages = rawImages
  //   .map(img => typeof img === 'object' && img !== null ? (img.secure_url || img.url) : img)
  //   .filter(Boolean);


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


  // ✨ Carousel State & Logic
  const [imgIndex, setImgIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (productImages.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setImgIndex(prev => (prev + 1) % productImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [productImages.length, isPaused]);

  const nextImage = (e) => {
    e.preventDefault(); e.stopPropagation();
    setImgIndex((i) => (i + 1) % productImages.length);
  };

  const prevImage = (e) => {
    e.preventDefault(); e.stopPropagation();
    setImgIndex((i) => (i - 1 + productImages.length) % productImages.length);
  };

  if (!product) return null; 

  const hasOffer = !!product.offer;
  const shortCode = product.companyShortCode || product.companyDetails?.[0]?.shortCode || product.company;
  const identifier = product.productId || product._id || product.id;
  const isAlreadyInCart = orderItems.some(item => item.productId === identifier);
  const isAlreadyInInquiry = inquiryItems.some(item => item.productId === identifier);

  const payloadToCart = {
    ...product,
    productId: identifier,
    mrp: displayMrp, 
    batchId: isOfferMode ? (displayBatch?._id || displayBatch?.id) : undefined
  };

  const handleCartClick = () => {
    if (!canOrder) {
      toast.info('Please wait till the admin approves you to place direct orders.');
      return;
    }
    if (isAlreadyInCart) return;
    onAddToOrder(payloadToCart, 1); 
    setTimeout(() => { onClose(); }, 800); 
  };

  const handleInquiryClick = () => {
    if (isAlreadyInInquiry) return;
    onAddToInquiry(payloadToCart, 1); 
    setTimeout(() => { onClose(); }, 800);
  };

  const headerTheme = isCriticalStock && !outOfStock ? 'bg-red-50' : 'bg-slate-100';

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={onClose} />

      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden transition-transform duration-200 shadow-2xl"
        style={{ transform: `translateY(${dragY}px)`, height: '82dvh' }}
      >
        <div
          className="w-full flex justify-center py-4 bg-white cursor-grab shrink-0 z-10"
          onTouchStart={handleTouchStartDrag} onTouchMove={handleTouchMoveDrag} onTouchEnd={handleTouchEndDrag}
        >
          <div className="w-14 h-1.5 bg-slate-300 rounded-full pointer-events-none" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-6">
          
          {/* ✨ Carousel Container with Pause Handlers and Arrows */}
          <div 
            className={`w-full aspect-[4/4] rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0 transition-colors ${headerTheme} group`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            onTouchCancel={() => setIsPaused(false)}
          >
            {productImages.length > 0 ? (
              <>
                <img 
                  src={productImages[imgIndex]} 
                  alt={product.name} 
                  className="w-full h-full object-cover mix-blend-multiply transition-opacity duration-300" 
                  draggable={false}
                />
                
                {productImages.length > 1 && (
                  <>
                    {/* Manual Navigation Arrows */}
                    <button 
                      onClick={prevImage} 
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/70 z-20 transition-all opacity-0 group-hover:opacity-100 sm:opacity-100"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={nextImage} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/70 z-20 transition-all opacity-0 group-hover:opacity-100 sm:opacity-100"
                    >
                      <ChevronRight size={20} />
                    </button>

                    {/* Navigation Dots */}
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
                      {productImages.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIndex ? 'bg-slate-800' : 'bg-slate-300/80'}`} />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <ImageIcon size={56} className="text-slate-300" />
            )}
          </div>

          <div>
            <h4 className="text-slate-900 text-2xl font-bold leading-tight">{product.name}</h4>
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 text-sm font-bold uppercase tracking-wider rounded-md border border-sky-200/70 shadow-sm">
                {shortCode}
              </span>
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-sm font-bold uppercase tracking-wider rounded-md border border-slate-200 shadow-sm">
                {product.packing}
              </span>
              {product.hsn && (
                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-sm font-bold uppercase tracking-wider rounded-md border border-indigo-200/70 shadow-sm">
                    HSN {product.hsn || product.hsnCode}
                  </span>
              )}
            </div>
          </div>

          {hasOffer && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-orange-700 text-base font-black mb-1.5">
                <Tag size={18} /> Scheme Applied
              </div>
              <p className="text-orange-900 text-lg font-bold leading-tight">
                {product.offer.description}
              </p>
            </div>
          )}

          
          {/* ✨ Stacked Full-Width Grid Layout for Composition and Category */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Composition', value: product.compositions?.join(', ') || 'N/A', fullWidth: true },
              { label: 'Category', value: product.categories?.join(', ') || product.category || 'N/A', fullWidth: true },
              { label: 'Type', value: product.type || 'N/A', inline: true },
              { label: 'GST Rate', value: `${product.gstRate || 0}%`, inline: true },
              { label: 'Expiry Date', value: displayExpiry, inline: true },
              { label: 'Delivery', value: product.deliveryTime || '< 24-48 hrs', inline: true },
            ].map((info, idx) => (
              <div key={idx} className={`bg-slate-100 rounded-xl px-3 ${info.fullWidth ? 'col-span-2 py-3' : info.inline ? 'py-3 flex flex-wrap items-center' : 'py-3'}`}>
                {info.inline ? (
                  <><span className="text-slate-500 text-sm font-bold uppercase tracking-wider mr-2">{info.label}:</span>
                    <span className="text-slate-900 text-sm font-bold">{info.value}</span></>
                ) : (
                  <>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{info.label}</p>
                    <p className="text-slate-900 text-base font-bold mt-1">{info.value}</p>
                  </>
                )}
              </div>
            ))}
          </div>

          {product.description && (
            <div>
              <h4 className="text-slate-900 font-bold text-base mb-1.5">Description</h4>
              <p className="text-slate-600 text-base leading-relaxed">{product.description}</p>
            </div>
          )}
          {product.usageTips && (
            <div>
              <h4 className="text-slate-900 font-bold text-base mb-1.5">Usage Tips</h4>
              <p className="text-slate-600 text-base leading-relaxed">{product.usageTips}</p>
            </div>
          )}
        </div>

        <div className="shrink-0 bg-white border-t border-slate-100 px-5 py-4 pb-6 sm:pb-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-left shrink-0">
              <p className="text-slate-500 font-semibold text-sm uppercase tracking-wider mb-0.5">MRP</p>
              {canOrder ? (
                  <p className="text-slate-900 text-xl sm:text-3xl font-black leading-none">₹{displayMrp.toFixed(2)}</p>
              ) : (
                  <p className="text-slate-400 font-medium text-sm italic mt-1">Hidden</p>
              )}
            </div>
            
            <div className="flex flex-col items-end">
              {!outOfStock && isCriticalStock && (
                <div className="py-1.5 px-3 flex items-center justify-center gap-1.5 text-center text-sm font-bold rounded-xl shadow-sm bg-red-100 text-red-700 border border-red-200">
                  <AlertCircle size={14} strokeWidth={2.5} />
                  Only {batchStock} available!
                </div>
              )}
              {outOfStock && (
                <div className="py-2 px-4 text-center text-md font-semibold text-slate-400 bg-slate-50 rounded-xl">
                  Out of Stock
                </div>
              )}
            </div>
          </div>

          {!outOfStock && (
            <div className="flex flex-row gap-2.5">
              <button
                onClick={handleCartClick}
                disabled={!canOrder || isAlreadyInCart}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 font-bold py-3 px-1 rounded-xl text-md sm:text-base transition-all ${
                  !canOrder 
                    ? 'bg-slate-100 text-slate-400 opacity-80 cursor-not-allowed' 
                    : isAlreadyInCart
                      ? 'bg-emerald-100 text-emerald-700 cursor-default border border-emerald-200'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                }`}
              >
                {!canOrder ? <Lock size={18} /> : isAlreadyInCart ? <Check size={20} /> : <ShoppingCart size={20} />} 
                {isAlreadyInCart ? 'Added to Cart' : 'Add to Cart'}
              </button>

              {!isOfferMode && (
                <button
                  onClick={handleInquiryClick}
                  disabled={isAlreadyInInquiry}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 font-bold py-3 px-1 rounded-xl text-md sm:text-base transition-all ${
                    isAlreadyInInquiry ? 'bg-slate-200 text-slate-700 cursor-default' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                  }`}
                >
                  {isAlreadyInInquiry ? <Check size={20} /> : <ClipboardList size={20} />} 
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

export default ProductDrawer;