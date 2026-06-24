import { useState, useRef, useEffect } from 'react';
import {
  Search, Trash2, ChevronLeft, ChevronRight, Package,
  X, ArrowLeft, ArrowRight, Pencil, AlertCircle
} from 'lucide-react';

const parse = (v, def = 0) => {
  const n = parseFloat(v);
  return isNaN(n) ? def : n;
};

// ★ FIXED: Calculate discount BEFORE applying GST
const calcItem = (item) => {
  const gross = (item.chargeableQty || 0) * (item.rate || 0);

  // 1. Calculate discount first
  let disc = 0;
  if (item.discountValue > 0) {
    disc = item.discountType === 'percent'
        ? (gross * item.discountValue) / 100
        : item.discountValue;
  }

  // 2. Subtract discount to get Taxable, THEN calculate GST
  const taxable = gross - disc;
  const cgst = taxable * (item.gstRate / 2) / 100;
  const sgst = taxable * (item.gstRate / 2) / 100;
  const subtotal = taxable + cgst + sgst;

  return { gross, cgst, sgst, subtotal, disc, lineTotal: subtotal };
};

// =========================================================================
// Product card (with PTR edit modal)
// =========================================================================
const ProductCardContent = ({
  item,
  index,
  isDeleting,
  isNewlyAdded,
  onDelete,
  onBatchChange,
  onUpdateItem,
}) => {
  const itemCalc = calcItem(item);

  // Rate‑edit modal state
  const [showRateModal, setShowRateModal] = useState(false);
  const [ptrInput, setPtrInput] = useState('');
  const [ptrError, setPtrError] = useState('');

  // The locked rate (20 % below MRP) – used for validation
  const lockedRate = Math.round((item.mrp || 0) * 0.8 * 100) / 100;

  const openRateModal = () => {
    setPtrInput(String(item.rate));
    setPtrError('');
    setShowRateModal(true);
  };

  const handleApplyPtr = () => {
    const ptr = parseFloat(ptrInput);
    if (isNaN(ptr) || ptr <= 0) {
      setPtrError('PTR must be a positive number');
      return;
    }
    if (ptr > lockedRate) {
      setPtrError(`PTR cannot exceed locked rate ₹${lockedRate.toFixed(2)}`);
      return;
    }
    onUpdateItem(index, 'rate', ptr);
    setShowRateModal(false);
  };

  return (
    <>
      <div
        className={`bg-white border border-slate-200 rounded-xl p-2 space-y-2 h-full flex flex-col overflow-hidden shadow-sm ${isDeleting ? 'transition-all duration-200 scale-0 opacity-0' : 'scale-100 opacity-100'
          } ${isNewlyAdded ? 'animate-scaleIn' : ''}`}
      >
        {/* Header */}
        <div className="flex justify-between items-start bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-2 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xl truncate text-slate-900">
              #{index + 1} {item.productName}
            </p>
            <p className="text-md text-slate-700 truncate">
              {item.company} · {item.packing} · HSN {item.hsn}
            </p>
          </div>
          <button
            onClick={onDelete}
            className="text-red-600 p-2 opacity-90 bg-red-50 border border-red-100 rounded-full hover:bg-red-100 transition-colors active:scale-90 shrink-0"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-w-0">
          {/* Batch */}
          <div>
            <label className="text-lg font-semibold text-slate-600">Batch</label>
            <select
              value={item.batchNumber}
              onChange={e => onBatchChange(index, e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-md font-mono text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
            >
              {(item.availableBatches || []).map(b => (
                <option key={b.no} value={b.no}>
                  {b.no} (Exp : {b.expiry} • Stock: {b.stock})
                </option>
              ))}
            </select>
          </div>

          {/* MRP / Chargeable / Free */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-md font-semibold text-slate-600 text-center block">MRP (₹)</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-base font-bold text-center text-slate-700">
                {item.mrp ?? '—'}
              </div>
            </div>
            <div>
              <label className="text-md font-semibold text-slate-600 text-center block">Chargeable</label>
              <input
                type="text"
                value={item.chargeableQty}
                onChange={e => onUpdateItem(index, 'chargeableQty', parse(e.target.value))}
                inputMode="decimal"
                className="w-full text-center bg-blue-50 border border-blue-100 rounded-lg px-2 py-2 text-base font-bold text-slate-900 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-md font-semibold text-slate-600 text-center block">Free</label>
              <input
                type="text"
                value={item.freeQty}
                onChange={e => onUpdateItem(index, 'freeQty', parse(e.target.value))}
                inputMode="decimal"
                className="w-full text-center bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-2 text-base font-bold text-emerald-700 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Rate & Discount in a 2‑column grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* Rate (locked) */}
            <div>
              <label className="text-md font-semibold text-slate-600 inline-flex items-center gap-1">
                Rate (₹)
                <button
                  onClick={openRateModal}
                  className="p-0.5 pl-4 rounded hover:bg-slate-200 transition-colors"
                  title="Edit PTR"
                >
                  <Pencil size={18} className="text-blue-700" />
                </button>
              </label>
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-2 py-2 text-base font-bold text-slate-900">
                ₹{item.rate.toFixed(2)}
              </div>
            </div>

            {/* Discount (takes the remaining 2 columns) */}
            <div className="col-span-2">
              <label className="text-md font-semibold text-slate-600 block text-left">Discount</label>
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="text"
                  value={item.discountValue}
                  onChange={e => onUpdateItem(index, 'discountValue', parse(e.target.value))}
                  placeholder="0"
                  inputMode="decimal"
                  className="flex-1 min-w-0 bg-amber-50 border border-amber-100 rounded-lg px-2 py-2 text-base text-center font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white transition-all"
                />
                <button
                  onClick={() =>
                    onUpdateItem(index, 'discountType', item.discountType === 'percent' ? 'amount' : 'percent')
                  }
                  className="shrink-0 px-3 py-2 bg-white border border-slate-200 rounded-lg text-base font-bold w-20 shadow-sm hover:bg-slate-50 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {item.discountType === 'percent' ? '%' : '₹'}
                </button>
              </div>
            </div>
          </div>

          {/* Summary box */}
          <div className="bg-slate-800 rounded-lg py-2 px-0.5 text-white">
            <div className="grid grid-cols-5 gap-1 text-center text-sm font-medium text-slate-400 mb-1">
              <span>Gross</span>
              <span>CGST({item.gstRate / 2}%)</span>
              <span>SGST({item.gstRate / 2}%)</span>
              <span>Discount</span>
              <span>Total</span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-center text-sm font-mono font-bold">
              <span>₹{itemCalc.gross.toFixed(2)}</span>
              <span>₹{itemCalc.cgst.toFixed(2)}</span>
              <span>₹{itemCalc.sgst.toFixed(2)}</span>
              <span className="text-amber-300">−₹{itemCalc.disc.toFixed(2)}</span>
              <span className="text-emerald-300">₹{itemCalc.lineTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Edit Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md bg-white rounded-t-2xl p-5 animate-slideUp">
            <h3 className="font-bold text-lg mb-4">Edit PTR</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-slate-600">MRP</label>
                <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-base font-bold">
                  ₹{item.mrp.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Rate (locked, 20 % below MRP)
                </label>
                <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-base font-bold">
                  ₹{lockedRate.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">PTR (≤ Rate)</label>
                <input
                  type="text"
                  value={ptrInput}
                  onChange={e => {
                    setPtrInput(e.target.value);
                    setPtrError('');
                  }}
                  inputMode="decimal"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base font-bold focus:outline-none focus:border-blue-400"
                />
                {ptrError && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {ptrError}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowRateModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 py-2 rounded-lg font-semibold text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyPtr}
                disabled={!!ptrError || ptrInput === ''}
                className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 text-white py-2 rounded-lg font-semibold text-base"
              >
                Apply PTR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ----------------------------------------------------------------------
// Step2 component
// ----------------------------------------------------------------------
export const Step2 = ({
  productSearch, setProductSearch, showProductDrop, setShowProductDrop,
  filteredProducts, addProduct, items, removeItem, updateItem, handleBatchChange,
  globalDiscountType, setGlobalDiscountType, globalDiscountValue, setGlobalDiscountValue,
  finalDiscount, canProceed2, onBack, onNext
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transition, setTransition] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [addingHighlight, setAddingHighlight] = useState(false);
  const [addedIndex, setAddedIndex] = useState(null);
  const [cardHeight, setCardHeight] = useState(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const touchMoved = useRef(false);

  const searchRef = useRef(null);
  const pendingAddedRef = useRef(false);
  const activeCardRef = useRef(null);

  const ANIM_MS = 360;
  const DELETE_MS = 200;

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowProductDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setShowProductDrop]);

  useEffect(() => {
    if (items.length === 0) {
      setCurrentIndex(0);
      return;
    }
    setCurrentIndex(prev => Math.min(prev, items.length - 1));
    if (pendingAddedRef.current && items.length > 0) {
      const newIndex = items.length - 1;
      setCurrentIndex(newIndex);
      setAddedIndex(newIndex);
      pendingAddedRef.current = false;
      setTimeout(() => setAddedIndex(null), 300);
    }
  }, [items.length]);

  useEffect(() => {
    if (!transition || transition.phase !== 'anim') return;
    const timer = setTimeout(() => {
      setCurrentIndex(transition.to);
      setTransition(null);
      setCardHeight(null);
    }, ANIM_MS);
    return () => clearTimeout(timer);
  }, [transition]);

  const currentItem = items[currentIndex];
  const totalItems = items.length;

  const startSlide = (newIndex, dir) => {
    if (transition) return;
    if (newIndex < 0 || newIndex >= items.length) return;
    if (newIndex === currentIndex) return;

    if (activeCardRef.current) {
      setCardHeight(activeCardRef.current.getBoundingClientRect().height);
    }

    setTransition({ from: currentIndex, to: newIndex, dir, phase: 'prep' });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransition(prev => (prev ? { ...prev, phase: 'anim' } : prev));
      });
    });
  };

  const goPrev = () => { if (currentIndex > 0) startSlide(currentIndex - 1, 'right'); };
  const goNext = () => { if (currentIndex < totalItems - 1) startSlide(currentIndex + 1, 'left'); };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchMoved.current = false;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
    touchMoved.current = true;
  };
  const handleTouchEnd = () => {
    if (!touchMoved.current) return;
    const dx = touchStartX.current - touchEndX.current;
    const dy = touchStartY.current - touchEndY.current;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goNext();
      else goPrev();
    }
    touchMoved.current = false;
  };

  const handleDelete = () => {
    if (deletingIndex !== null || currentIndex < 0 || currentIndex >= items.length) return;
    setDeletingIndex(currentIndex);
    setTimeout(() => {
      removeItem(currentIndex);
      setDeletingIndex(null);
    }, DELETE_MS);
  };

  const handleAddProduct = (product) => {
    addProduct(product);
    setProductSearch('');
    setShowProductDrop(false);
    setAddingHighlight(true);
    pendingAddedRef.current = true;
    setTimeout(() => {
      setAddingHighlight(false);
      pendingAddedRef.current = false;
    }, 500);
  };

  const getSlideTransform = (role) => {
    if (!transition) return 'translate3d(0,0,0)';
    const enteringFrom = transition.dir === 'left' ? 'translate3d(100%,0,0)' : 'translate3d(-100%,0,0)';
    const exitingTo = transition.dir === 'left' ? 'translate3d(-100%,0,0)' : 'translate3d(100%,0,0)';
    if (role === 'outgoing') return transition.phase === 'prep' ? 'translate3d(0,0,0)' : exitingTo;
    if (role === 'incoming') return transition.phase === 'prep' ? enteringFrom : 'translate3d(0,0,0)';
    return 'translate3d(0,0,0)';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search box unchanged */}
      <div ref={searchRef} className="relative mb-2 shrink-0 z-20">
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-1">
          <Search size={18} className="text-slate-400" />
          <input
            value={productSearch}
            onChange={e => { setProductSearch(e.target.value); setShowProductDrop(true); }}
            onFocus={() => setShowProductDrop(true)}
            placeholder="Search medicine..."
            className="flex-1 text-lg outline-none bg-transparent"
          />
          {productSearch && (
            <button onClick={() => { setProductSearch(''); setShowProductDrop(false); }}>
              <X size={14} className="text-slate-400" />
            </button>
          )}
        </div>
        {showProductDrop && filteredProducts.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-1 shadow-lg max-h-52 overflow-y-auto z-30">
            {filteredProducts.map(p => (
              <button key={p.id} onClick={() => handleAddProduct(p)}
                className="w-full flex justify-between px-3 py-2 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                <div>
                  <p className="font-medium text-md">{p.name}</p>
                  <p className="text-sm text-slate-500">{p.company} · {p.packing} · HSN {p.hsn}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-600 font-bold text-md">₹{p.defaultRate}</p>
                  <p className="text-sm text-slate-400">MRP ₹{p.batches[0]?.mrp}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <Package size={40} className="text-slate-300 mb-2" />
          <p className="text-slate-600 text-md">No medicines added yet</p>
          <p className="text-slate-400 text-sm">Search above to add ☝️</p>
        </div>
      ) : (
        <>
          {/* Navigation pills */}
          <div className="flex items-center gap-1 mb-2 shrink-0">
            <button onClick={goPrev} disabled={currentIndex === 0 || !!transition}
              className="p-1.5 rounded-full disabled:opacity-30 transition-transform active:scale-100">
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1 overflow-x-auto flex gap-1.5 scrollbar-none py-1">
              {items.map((item, i) => (
                <button key={i} onClick={() => startSlide(i, i > currentIndex ? 'left' : 'right')}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-md font-medium whitespace-nowrap transition-all duration-200
                    ${i === currentIndex ? 'bg-slate-800 text-white scale-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-300'}
                    ${addingHighlight && i === items.length - 1 ? 'animate-pulse bg-emerald-100 text-emerald-700' : ''}`}>
                  #{i + 1} {item.productName}
                </button>
              ))}
            </div>
            <button onClick={goNext} disabled={currentIndex === items.length - 1 || !!transition}
              className="p-1.5 rounded-full disabled:opacity-30 transition-transform active:scale-100">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Card container */}
          <div
            className="relative overflow-hidden shrink-0"
            style={transition ? { height: cardHeight || 'auto' } : { height: 'auto' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {!transition && items[currentIndex] && (
              <div ref={activeCardRef} className="h-min">
                <ProductCardContent
                  item={items[currentIndex]}
                  index={currentIndex}
                  isDeleting={deletingIndex === currentIndex}
                  isNewlyAdded={addedIndex === currentIndex}
                  onDelete={handleDelete}
                  onBatchChange={handleBatchChange}
                  onUpdateItem={updateItem}
                />
              </div>
            )}

            {transition && (
              <>
                {items[transition.from] && (
                  <div
                    className="absolute inset-0 transform-gpu transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] z-20"
                    style={{
                      transform: getSlideTransform('outgoing'),
                      transitionDuration: `${ANIM_MS}ms`,
                      willChange: 'transform',
                    }}
                  >
                    <ProductCardContent
                      item={items[transition.from]}
                      index={transition.from}
                      isDeleting={deletingIndex === transition.from}
                      isNewlyAdded={false}
                      onDelete={handleDelete}
                      onBatchChange={handleBatchChange}
                      onUpdateItem={updateItem}
                    />
                  </div>
                )}
                {items[transition.to] && (
                  <div
                    className="absolute inset-0 transform-gpu transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] z-30"
                    style={{
                      transform: getSlideTransform('incoming'),
                      transitionDuration: `${ANIM_MS}ms`,
                      willChange: 'transform',
                    }}
                  >
                    <ProductCardContent
                      item={items[transition.to]}
                      index={transition.to}
                      isDeleting={false}
                      isNewlyAdded={false}
                      onDelete={handleDelete}
                      onBatchChange={handleBatchChange}
                      onUpdateItem={updateItem}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bill Discount */}
          {totalItems > 0 && (
            <div className="mt-3 shrink-0">
              <div className="bg-amber-50 rounded-lg px-3 py-2 flex items-center justify-between gap-3 text-base">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-800">Bill Discount</span>
                  <button
                    onClick={() => setGlobalDiscountType(t => (t === 'percent' ? 'amount' : 'percent'))}
                    className="bg-white border border-slate-300 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    {globalDiscountType === 'percent' ? '%' : '₹'}
                  </button>
                </div>
                <input
                  type="text"
                  value={globalDiscountValue}
                  onChange={e => setGlobalDiscountValue(parse(e.target.value))}
                  inputMode="decimal"
                  className="w-24 border border-slate-300 rounded-md px-2 py-1 text-center text-base"
                />
                {finalDiscount > 0 && (
                  <span className="text-amber-700 font-semibold text-base">−₹{finalDiscount.toFixed(2)}</span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer buttons */}
      <div className="flex gap-2 pt-3 mt-2 border-t border-slate-100 shrink-0">
        <button onClick={onBack}
          className="flex-1 bg-slate-100 py-2 rounded-lg text-md font-semibold transition-all hover:bg-slate-200 active:scale-95 inline-flex items-center justify-center gap-1">
          <ArrowLeft size={18} /> Back
        </button>
        <button onClick={onNext} disabled={!canProceed2}
          className="flex-1 bg-slate-800 disabled:bg-slate-200 text-white font-bold py-2 rounded-lg text-md transition-all hover:bg-slate-700 active:scale-95 inline-flex items-center justify-center gap-1">
          Review Invoice <ArrowRight size={18} />
        </button>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleIn { animation: scaleIn 0.24s ease-out; }
        @keyframes pulse {
          0%, 100% { background-color: #f3f4f6; }
          50% { background-color: #a7f3d0; }
        }
        .animate-pulse { animation: pulse 0.5s ease-in-out; }
      `}</style>
    </div>
  );
};

export default Step2;