import { useState } from 'react';
import { BaseProductCard } from '../../../../components/BaseProductCard'; // <-- Make sure path is correct!

export const ProductCard = ({ product, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const categoriesDisplay = product.categories?.length > 0 ? product.categories.join(', ') : 'N/A';

  return (
    <BaseProductCard 
      product={product} 
      expanded={expanded} 
      onToggle={() => setExpanded(!expanded)}
      hideStockInfo={true} // Hide stock info for ProductCard
    >
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 bg-slate-50 space-y-4">
          
          {/* Bumped to text-sm, slightly increased gap-y and pb */}
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

          {/* Bumped to text-sm */}
          <div className="flex justify-between items-start gap-2 text-sm border-b border-slate-200 pb-3 min-w-0">
            <span className="text-slate-500 shrink-0">Composition:</span>
            <span className="text-slate-800 font-medium text-right flex-1 min-w-0 break-words">
              {product.compositions?.join(', ') || 'N/A'}
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {product.description && (
              <div>
                {/* Bumped label to text-xs, paragraph to text-sm */}
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
          </div>

          <button
            onClick={() => onEdit(product)}
            // Bumped to text-sm and py-2.5 for better proportions
            className="w-full mt-3 bg-white border border-slate-300 text-slate-700 text-sm font-bold py-2.5 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
          >
            Edit Master Data
          </button>
        </div>
      )}
    </BaseProductCard>
  );
};