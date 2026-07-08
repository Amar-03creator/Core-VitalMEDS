import { useState } from 'react';
import { ShoppingCart, ClipboardList, Tag, Lock, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner'; // ✨ Added toast import
import QuantityStepper from '../../../../components/QuantityStepper';

const ProductCard = ({ product, canOrder, onView, onAddToOrder, onAddToInquiry }) => {
  const [qty, setQty] = useState(1);
  const outOfStock = product.totalStock <= 0;

  const highestMrp = product.batches?.length > 0
    ? Math.max(...product.batches.map(b => b.mrp || 0))
    : (product.mrp || 0);

  const shortCode = product.companyShortCode || product.companyDetails?.[0]?.shortCode || product.company;
  const hasOffer = !!product.offer;
  const isInputEmpty = qty === '';

  const handleAction = (actionFn) => {
    if (isInputEmpty) return;
    actionFn(product, qty);
    setQty(1);
  };

  // ✨ Added Custom Cart Click Handler
  const handleCartClick = () => {
    if (!canOrder) {
      toast.info('Please wait till the admin approves you to place direct orders.');
      return;
    }
    handleAction(onAddToOrder);
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col ${outOfStock ? 'opacity-70' : ''}`}>
      <button onClick={() => onView(product)} className="block w-full relative">
        <div className="aspect-[5/4] bg-slate-100 flex items-center justify-center relative overflow-hidden">
          {product.photoUrl ? (
            <img src={product.photoUrl} alt={product.name} className="w-full h-full object-cover" />
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
          <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 text-sm font-bold uppercase tracking-wider rounded-md border border-sky-200/70 shadow-sm">
            {shortCode}
          </span>
          {canOrder ? (
              <span className="text-slate-900 font-black shrink-0">₹{highestMrp.toFixed(2)}</span>
          ) : (
              <span className="text-slate-400 font-medium text-sm italic shrink-0 mt-0.5">Hidden</span>
          )}
        </div>

        <div className="mt-auto space-y-3">
          {!outOfStock ? (
            <QuantityStepper value={qty} onChange={setQty} size="sm" />
          ) : (
            <div className="py-1.5 text-center text-md font-semibold text-slate-400 bg-slate-50 rounded-xl">
              Out of Stock
            </div>
          )}

          {!outOfStock && (
            <div className="flex flex-col gap-2">
              {/* ✨ Always visible, but styled faded if unapproved */}
              <button
                onClick={handleCartClick}
                disabled={canOrder && isInputEmpty}
                className={`w-full flex items-center justify-center gap-2 text-md sm:text-base font-bold py-1.5 rounded-xl transition-colors ${
                  !canOrder 
                    ? 'bg-slate-100 text-slate-400 opacity-80' // Faded style for unapproved
                    : !isInputEmpty 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {canOrder ? <ShoppingCart size={16} /> : <Lock size={14} />} Add to Cart
              </button>

              <button
                onClick={() => handleAction(onAddToInquiry)}
                disabled={isInputEmpty}
                className={`w-full flex items-center justify-center gap-2 text-md sm:text-base font-bold py-1.5 rounded-xl transition-colors ${!isInputEmpty ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              >
                <ClipboardList size={16} /> Add for Inquiry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;