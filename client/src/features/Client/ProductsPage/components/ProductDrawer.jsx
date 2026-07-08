import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, ClipboardList, Lock, Tag, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner'; // ✨ Added toast import
import QuantityStepper from '../../../../components/QuantityStepper';
import { useModalTrap, useScrollLock } from '../../../../hooks/useBackHandler';

const ProductDrawer = ({ product, canOrder, onClose, onAddToOrder, onAddToInquiry }) => {
  const [qty, setQty] = useState(1);
  const outOfStock = product?.totalStock <= 0;
  const isInputEmpty = qty === '';

  useEffect(() => { if (product) setQty(1); }, [product]);

  useScrollLock(!!product);
  useModalTrap(!!product, { onBackClose: onClose, disabled: false });

  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchMove = (e) => {
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) setDragY(diff);
  };
  const handleTouchEnd = () => {
    if (dragY > 100) onClose();
    else setDragY(0);
  };

  if (!product) return null; 

  let closestNormalExpiry = 'N/A';
  let nextClosestExpiry = 'N/A';

  if (product.batches?.length > 0) {
    const validBatches = product.batches
      .filter(b => b.expiry || b.expiryDate)
      .map(b => ({ ...b, parsedDate: new Date(b.expiryDate || b.expiry) }))
      .filter(b => !isNaN(b.parsedDate.getTime()))
      .sort((a, b) => a.parsedDate - b.parsedDate);

    if (validBatches.length > 0) {
      closestNormalExpiry = validBatches[0].parsedDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      const nonOfferBatches = validBatches.filter(b => b._id !== product.offer?.batchId && b.batchNumber !== product.offer?.batchId);
      nextClosestExpiry = nonOfferBatches.length > 0 
        ? nonOfferBatches[0].parsedDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) 
        : closestNormalExpiry;
    }
  }

  const hasOffer = !!product.offer;
  const displayExpiry = hasOffer ? nextClosestExpiry : closestNormalExpiry;
  const shortCode = product.companyShortCode || product.companyDetails?.[0]?.shortCode || product.company;
  const highestMrp = product.batches?.length > 0 ? Math.max(...product.batches.map(b => b.mrp || 0)) : (product.mrp || 0);

  const handleAction = (actionFn) => {
    if (isInputEmpty) return;
    actionFn(product, qty);
    onClose();
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={onClose} />

      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden transition-transform duration-200"
        style={{ transform: `translateY(${dragY}px)`, height: '82dvh' }}
      >
        <div
          className="w-full flex justify-center py-4 bg-white cursor-grab shrink-0 z-10"
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        >
          <div className="w-14 h-1.5 bg-slate-300 rounded-full pointer-events-none" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-6">
          <div className="w-full aspect-[5/4] bg-slate-100 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0">
            {product.photoUrl ? (
              <img src={product.photoUrl} alt={product.name} className="w-full h-full object-cover" />
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
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-orange-700 text-base font-bold mb-1">
                <Tag size={18} /> Special Offer Available
              </div>
              <p className="text-orange-600 text-base font-medium">
                {product.offer.availableQty} units left • Expires: {new Date(product.offer.expiryDate || product.offer.expiry).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Composition', value: product.compositions?.join(', ') || 'N/A', inline: false },
              { label: 'Category', value: product.categories?.join(', ') || product.category || 'N/A', inline: false },
              { label: 'Type', value: product.type || 'N/A', inline: true },
              { label: 'GST Rate', value: `${product.gstRate || 0}%`, inline: true },
              { label: 'Expiry Date', value: displayExpiry, inline: true },
              { label: 'Delivery', value: product.deliveryTime || '< 24-48 hrs', inline: true },
            ].map((info, idx) => (
              <div key={idx} className={`bg-slate-50 rounded-xl px-4 ${info.inline ? 'py-3.5 flex flex-wrap items-center' : 'py-4'}`}>
                {info.inline ? (
                  <><span className="text-slate-500 text-sm font-bold uppercase tracking-wider mr-2">{info.label}:</span>
                    <span className="text-slate-900 text-sm font-bold">{info.value}</span></>
                ) : (
                  <><p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{info.label}</p>
                    <p className="text-slate-900 text-base font-bold mt-1 line-clamp-3">{info.value}</p></>
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
            <div className="flex-1">
              {!outOfStock ? (
                <QuantityStepper value={qty} onChange={setQty} size="lg" />
              ) : (
                <div className="py-3 px-1 text-center text-md font-semibold text-slate-400 bg-slate-50 rounded-xl">
                  Out of Stock
                </div>
              )}
            </div>

            <div className="text-right shrink-0">
              <p className="text-slate-500 font-semibold text-sm uppercase tracking-wider mb-0.5">MRP</p>
              {canOrder ? (
                  <p className="text-slate-900 text-xl sm:text-3xl font-black leading-none">₹{highestMrp.toFixed(2)}</p>
              ) : (
                  <p className="text-slate-400 font-medium text-sm italic mt-1">Hidden</p>
              )}
            </div>
          </div>

          {!outOfStock && (
            <div className="flex flex-row gap-2.5">
              {/* ✨ Always visible, but styled faded if unapproved */}
              <button
                onClick={handleCartClick}
                disabled={canOrder && isInputEmpty}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 font-bold py-3 px-1 rounded-xl text-md sm:text-base transition-all ${
                  !canOrder 
                    ? 'bg-slate-100 text-slate-400 opacity-80' // Faded style for unapproved
                    : !isInputEmpty 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {canOrder ? <ShoppingCart size={20} /> : <Lock size={18} />} Add to Cart
              </button>

              <button
                onClick={() => handleAction(onAddToInquiry)}
                disabled={isInputEmpty}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 font-bold py-3 px-1 rounded-xl text-md sm:text-base transition-all ${
                  !isInputEmpty ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ClipboardList size={20} /> Add for Inquiry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDrawer;