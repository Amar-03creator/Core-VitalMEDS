// client/src/features/Admin/ProductsPage/components/ProductCard.jsx
import { useState } from 'react';
import { X } from 'lucide-react'; 
import { BaseProductCard } from '../../../../components/BaseProductCard';
import ImageCarousel from '../../../../components/ImageCarousel';

export const ProductCard = ({ product, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [isImageLarge, setIsImageLarge] = useState(false); 

  const categoriesDisplay = product.categories?.length > 0 ? product.categories.join(', ') : 'N/A';

  // Extract images
  const rawImages = product.images?.length > 0 ? [...product.images] : [];
  
  if (rawImages.length === 0 && (product.photoUrl || product.imageUrl || product.photo)) {
    rawImages.push(product.photoUrl || product.imageUrl || product.photo);
  }
  const productImages = rawImages
    .map(img => typeof img === 'object' && img !== null ? (img.secure_url || img.url) : img)
    .filter(Boolean);

  const handleToggle = () => {
    if (expanded) setIsImageLarge(false);
    setExpanded(!expanded);
  };

  return (
    <BaseProductCard 
      product={product} 
      expanded={expanded} 
      onToggle={handleToggle}
      hideStockInfo={true}
      onImageZoom={() => setIsImageLarge(!isImageLarge)} 
      isImageZoomed={isImageLarge}
    >
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 bg-slate-50 space-y-4">
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm border-b border-slate-200 pb-4">
            <div className="flex justify-between items-start gap-2 min-w-0">
              <span className="text-slate-500 shrink-0">Name:</span>
              <span className="text-slate-800 font-medium text-right flex-1 min-w-0 break-words">{product.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-start gap-2 min-w-0">
              <span className="text-slate-500 shrink-0">Type:</span>
              <span className="text-slate-800 font-medium text-right flex-1 min-w-0 break-words">{product.type || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-start gap-2 min-w-0">
              <span className="text-slate-500 shrink-0">Category:</span>
              <span className="text-slate-800 font-medium text-right flex-1 min-w-0 break-words" title={categoriesDisplay}>
                {categoriesDisplay}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2 min-w-0">
              <span className="text-slate-500 shrink-0">HSN Code:</span>
              <span className="text-slate-800 font-mono font-semibold text-right flex-1 min-w-0 break-words">{product.hsnCode}</span>
            </div>
            <div className="flex justify-between items-start gap-2 min-w-0">
              <span className="text-slate-500 shrink-0">Stock Alert Level:</span>
              <span className="text-slate-800 font-medium text-right flex-1 min-w-0 break-words">{product.lowStockThreshold || 0} unit(s)</span>
            </div>
            <div className="flex justify-between items-start gap-2 min-w-0">
              <span className="text-slate-500 shrink-0">Short Exp:</span>
              <span className="text-slate-800 font-medium text-right flex-1 min-w-0 break-words">{product.shortExpiryThreshold || 0} days</span>
            </div>
          </div>

          <div className="flex justify-between items-start gap-2 text-sm border-b border-slate-200 pb-3 min-w-0">
            <span className="text-slate-500 shrink-0">Composition:</span>
            <span className="text-slate-800 font-medium text-right flex-1 min-w-0 break-words">
              {product.compositions?.join(', ') || 'N/A'}
            </span>
          </div>

          {/* ✨ CONDITIONAL RENDER: Show Large Image OR Text Descriptions */}
          {isImageLarge && productImages.length > 0 ? (
            /* ✨ FIX: Changed to w-60 h-60 mx-auto for a centered perfect square */
            <div className="relative w-75 h-75 mx-auto rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 flex items-center justify-center">
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageLarge(false);
                }}
                className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/80 p-1.5 rounded-full z-30 transition-colors shadow-sm"
                title="Close Image"
              >
                <X size={20} />
              </button>

              <ImageCarousel 
                images={productImages} 
                alt={product.name} 
                rounded="rounded-none" 
                objectFit="object-cover" 
                autoPlay={false} // ✨ FIX: Disable auto-play in the detail view
              />
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {product.description && (
                <div>
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wide">Description</span>
                  <p className="text-md text-slate-700 leading-relaxed mt-0.5">{product.description}</p>
                </div>
              )}
              {product.usageTips && (
                <div className="pt-2">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wide">Usage Tips</span>
                  <p className="text-md text-slate-700 leading-relaxed mt-0.5">{product.usageTips}</p>
                </div>
              )}
              {!product.description && !product.usageTips && (
                 <p className="text-sm text-slate-400 italic">No description available.</p>
              )}
            </div>
          )}

          <button
            onClick={() => onEdit(product)}
            className="w-full mt-3 bg-white border border-slate-300 text-slate-700 text-sm font-bold py-2.5 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
          >
            Edit Master Data
          </button>
        </div>
      )}
    </BaseProductCard>
  );
};