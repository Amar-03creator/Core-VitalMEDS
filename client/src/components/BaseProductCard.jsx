// src/components/BaseProductCard.jsx
import { ChevronDown } from 'lucide-react';
import ImageCarousel from './ImageCarousel';

export const BaseProductCard = ({
  product,
  expanded,
  onToggle,
  onImageZoom, 
  isImageZoomed, 
  hasNearExpiry = false,
  hideStockInfo = false,
  children
}) => {
  const totalStock = product.totalStock || 0;
  const threshold = product.lowStockThreshold || 0;
  const stockStatus = totalStock === 0 ? 'out' : totalStock <= threshold ? 'low' : 'ok';
  const companyDisplay = product.companyDetails?.[0]?.shortCode || product.companyShortCode || product.company || 'N/A';
  
  // Extract all images
  const rawImages = product.images?.length > 0 ? [...product.images] : [];
  if (rawImages.length === 0 && (product.photoUrl || product.imageUrl || product.photo)) {
    rawImages.push(product.photoUrl || product.imageUrl || product.photo);
  }
  const productImages = rawImages
    .map(img => typeof img === 'object' && img !== null ? (img.secure_url || img.url) : img)
    .filter(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-3 shadow-sm transition-all">
      <button
        onClick={onToggle}
        className="relative w-full text-left hover:bg-slate-50 transition-colors duration-200"
      >
        <div className="flex items-center gap-3 pr-6">

          {/* ✨ THUMBNAIL SLOT */}
          <div className="shrink-0 m-1 w-24 h-24 relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm z-10">
            
            {/* ✨ FIX: We only pass productImages[0] here! This kills the carousel for the thumbnail. */}
            <ImageCarousel 
              images={productImages.length > 0 ? [productImages[0]] : []} 
              alt={product.name || product.productName} 
              rounded="rounded-none"
              autoPlay={false} // Force auto-play off just in case
              onImageClick={expanded && onImageZoom ? onImageZoom : undefined}
              showZoomIcon={expanded && !!onImageZoom}
              isZoomed={isImageZoomed}
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-1 py-0.5 pointer-events-none">
              <p
                className="text-[9px] font-black uppercase tracking-widest text-white text-center truncate"
                title={companyDisplay}
              >
                {companyDisplay}
              </p>
            </div>
          </div>

          {/* ── Middle column ── */}
          <div className="flex-1 min-w-0 py-3 pb-7">
            <p className="text-lg text-slate-900 font-bold truncate">
              {product.name || product.productName}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="px-1 py-0.5 bg-slate-100 text-slate-700 text-sm font-bold uppercase tracking-wider rounded-md border border-slate-200 shadow-sm">
                {product.packing}
              </span>
              <span className="px-1 py-0.5 bg-indigo-50 text-indigo-700 text-sm font-bold uppercase tracking-wider rounded-md border border-indigo-200/70 shadow-sm">
                HSN {product.hsnCode}
              </span>
              <span className="px-1 py-0.5 bg-sky-50 text-sky-700 text-sm font-bold uppercase tracking-wider rounded-md border border-sky-200/70 shadow-sm">
                GST {product.gstRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Chevron */}
        <div className="absolute top-0 right-0 bg-slate-50 border-b border-l border-slate-200 rounded-bl-xl p-1 flex items-center justify-center shadow-sm">
          <div className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={18} className="text-slate-400" />
          </div>
        </div>

        {/* Stock badge */}
{!hideStockInfo && (
  <div className="absolute -bottom-px -right-px flex items-stretch overflow-hidden rounded-tl-xl shadow-sm border-t border-l border-slate-200 bg-white">
    {hasNearExpiry && (
      <span className="text-xs font-bold px-2.5 py-1 bg-orange-100 text-orange-700 flex items-center border-r border-slate-200">
        NEAR EXPIRY
      </span>
    )}
    <div className="px-3 py-1 flex items-baseline gap-1.5 bg-slate-50">
      <span className={`font-black text-lg leading-none ${stockStatus === 'out' ? 'text-red-500' : stockStatus === 'low' ? 'text-amber-500' : 'text-emerald-600'}`}>
        {totalStock}
      </span>
      <span className="text-slate-400 text-sm font-bold uppercase">items</span>
    </div>
  </div>
)}
      </button>

      {children}
    </div>
  );
};