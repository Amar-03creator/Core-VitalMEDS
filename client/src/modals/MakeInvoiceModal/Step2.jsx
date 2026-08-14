// src/modals/MakeInvoiceModal/Step2.jsx
import { useState, useRef, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Package, X, ArrowLeft, ArrowRight } from 'lucide-react';
import ProductCard from './components/ProductCard';
import { toast } from 'sonner';
import { useGridNavigation } from '../../hooks/useGridNavigation';

export const Step2 = ({
  hasOrder, // ✨ NEW
  productSearch, setProductSearch, showProductDrop, setShowProductDrop,
  filteredProducts, addProduct, cloneProductForNewBatch, items, removeItem, updateItem, handleBatchChange,
  canProceed2, onBack, onNext
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [addingHighlight, setAddingHighlight] = useState(false);
  const [transition, setTransition] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [addedIndex, setAddedIndex] = useState(null);
  const [cardHeight, setCardHeight] = useState(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const touchMoved = useRef(false);
  const wrapperRef = useRef(null);

  const searchRef = useRef(null);
  const pendingAddedIndexRef = useRef(null);
  const activeCardRef = useRef(null);

  const ANIM_MS = 360;
  const DELETE_MS = 200;

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowProductDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setShowProductDrop]);

  useEffect(() => {
    if (items.length === 0) {
      setCurrentIndex(0);
      return;
    }

    if (pendingAddedIndexRef.current !== null) {
      const newIndex = pendingAddedIndexRef.current;
      setCurrentIndex(newIndex);
      setAddedIndex(newIndex);
      pendingAddedIndexRef.current = null;
      setTimeout(() => setAddedIndex(null), 300);
    } else {
      setCurrentIndex(prev => Math.min(prev, items.length - 1));
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

  useGridNavigation(wrapperRef, '.nav-input');

  const totalItems = items.length;

  const startSlide = (newIndex, dir) => {
    document.activeElement?.blur();
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
      document.activeElement?.blur();
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
    addProduct(product, (newIndex) => {
      pendingAddedIndexRef.current = newIndex;
      setAddingHighlight(true);
      setTimeout(() => setAddingHighlight(false), 500);
    });
    setProductSearch('');
    setShowProductDrop(false);
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
    <div className="w-full flex flex-col" ref={wrapperRef}>
      <div ref={searchRef} className="relative mb-4 z-20 shrink-0">
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-1 shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input
            value={productSearch}
            onChange={e => { setProductSearch(e.target.value); setShowProductDrop(true); }}
            onFocus={() => setShowProductDrop(true)}
            placeholder="Search medicine..."
            className="flex-1 text-lg py-1.5 outline-none bg-transparent"
          />
          {productSearch && (
            <button onClick={() => { setProductSearch(''); setShowProductDrop(false); }}>
              <X size={16} className="text-slate-400" />
            </button>
          )}
        </div>
        {showProductDrop && filteredProducts.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-1 shadow-xl max-h-52 overflow-y-auto z-50">
            {filteredProducts.map(p => {
              // ✨ FIX: Calculate total stock across all available batches
              const totalStock = p.batches?.reduce((sum, b) => sum + (b.stock || 0), 0) || 0;
              const isOutOfStock = totalStock <= 0;

              return (
                <button
                  key={p.id}
                  onClick={() => !isOutOfStock && handleAddProduct(p)}
                  disabled={isOutOfStock}
                  className={`w-full flex justify-between px-3 py-2 text-left border-b border-slate-100 last:border-0 transition-colors 
                    ${isOutOfStock ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50'}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-md text-slate-900">{p.name}</p>
                      {isOutOfStock && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Out of Stock</span>}
                    </div>
                    <p className="text-sm text-slate-500">{p.companyShortCode || p.company} · {p.packing} · HSN {p.hsn}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-600 font-bold text-md">₹{p.defaultRate}</p>
                    <p className="text-sm text-slate-400">MRP ₹{p.batches[0]?.mrp}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Package size={44} className="text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium text-lg">No medicines added yet</p>
        </div>
      ) : (
        <div className="w-full flex flex-col">
          <div className="flex items-center gap-1 mb-4 shrink-0">
            <button onClick={goPrev} disabled={currentIndex === 0 || !!transition}
              className="p-1.5 rounded-full disabled:opacity-30 transition-transform active:scale-100">
              <ChevronLeft size={22} className="text-slate-700" />
            </button>
            <div className="flex-1 overflow-x-auto flex gap-2 scrollbar-none py-1 px-1">
              {items.map((item, i) => (
                <button key={i} onClick={() => startSlide(i, i > currentIndex ? 'left' : 'right')}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200
                    ${i === currentIndex ? 'bg-slate-800 text-white shadow-md' : item.clientEdited ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'}
                    ${addingHighlight && i === currentIndex ? 'animate-pulse bg-emerald-100 text-emerald-700 border-emerald-300' : ''}`}>
                  #{i + 1} {item.productName}
                </button>
              ))}
            </div>
            <button onClick={goNext} disabled={currentIndex === totalItems - 1 || !!transition}
              className="p-1.5 rounded-full disabled:opacity-30 transition-transform active:scale-100">
              <ChevronRight size={22} className="text-slate-700" />
            </button>
          </div>

          <div
            className="relative w-full overflow-x-hidden pb-2"
            style={transition ? { minHeight: cardHeight || 'auto' } : {}}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {!transition && items[currentIndex] && (
              <div ref={activeCardRef} className="h-min pb-2">
                <ProductCard
                  hasOrder={hasOrder} // ✨ PASS DOWN
                  item={items[currentIndex]}
                  index={currentIndex}
                  isDeleting={deletingIndex === currentIndex}
                  isNewlyAdded={addedIndex === currentIndex}
                  onDelete={handleDelete}
                  onBatchChange={handleBatchChange}
                  onUpdateItem={updateItem}
                  usedBatchNos={items.filter((_, idx) => idx !== currentIndex && items[idx].productId === items[currentIndex].productId).map(i => i.batchNumber)}
                  onCloneForNewBatch={() => cloneProductForNewBatch(currentIndex, (newIndex) => {
                    pendingAddedIndexRef.current = newIndex;
                    setAddingHighlight(true);
                    setTimeout(() => setAddingHighlight(false), 500);
                  })}
                />
              </div>
            )}

            {transition && (
              <>
                {items[transition.from] && (
                  <div
                    className="absolute inset-x-0 top-0 transform-gpu transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] z-20 pb-2"
                    style={{
                      transform: getSlideTransform('outgoing'),
                      transitionDuration: `${ANIM_MS}ms`,
                      willChange: 'transform',
                    }}
                  >
                    <ProductCard
                      hasOrder={hasOrder} // ✨ PASS DOWN
                      item={items[transition.from]}
                      index={transition.from}
                      isDeleting={deletingIndex === transition.from}
                      isNewlyAdded={false}
                      onDelete={handleDelete}
                      onBatchChange={handleBatchChange}
                      onUpdateItem={updateItem}
                      usedBatchNos={items.filter((_, idx) => idx !== transition.from && items[idx].productId === items[transition.from].productId).map(i => i.batchNumber)}
                      onCloneForNewBatch={() => cloneProductForNewBatch(transition.from, (newIndex) => {
                        pendingAddedIndexRef.current = newIndex;
                        setAddingHighlight(true);
                        setTimeout(() => setAddingHighlight(false), 500);
                      })}
                    />
                  </div>
                )}
                {items[transition.to] && (
                  <div
                    className="absolute inset-x-0 top-0 transform-gpu transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] z-30 pb-2"
                    style={{
                      transform: getSlideTransform('incoming'),
                      transitionDuration: `${ANIM_MS}ms`,
                      willChange: 'transform',
                    }}
                  >
                    <ProductCard
                      hasOrder={hasOrder} // ✨ PASS DOWN
                      item={items[transition.to]}
                      index={transition.to}
                      isDeleting={false}
                      isNewlyAdded={false}
                      onDelete={handleDelete}
                      onBatchChange={handleBatchChange}
                      onUpdateItem={updateItem}
                      usedBatchNos={items.filter((_, idx) => idx !== transition.to && items[idx].productId === items[transition.to].productId).map(i => i.batchNumber)}
                      onCloneForNewBatch={() => cloneProductForNewBatch(transition.to, (newIndex) => {
                        pendingAddedIndexRef.current = newIndex;
                        setAddingHighlight(true);
                        setTimeout(() => setAddingHighlight(false), 500);
                      })}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4 mt-2 border-t border-slate-100 bg-white z-10 shrink-0">
        <button onClick={onBack} className="flex-1 bg-slate-100 py-3 rounded-xl text-lg font-bold text-slate-700 hover:bg-slate-200 inline-flex items-center justify-center gap-2 transition-colors">
          <ArrowLeft size={20} /> Back
        </button>
        <button
          onClick={() => {
            document.activeElement?.blur();
            const emptySplitIndexes = items.reduce((acc, item, idx) => {
              if (item.chargeableQty === 0 && item.freeQty === 0) acc.push(idx);
              return acc;
            }, []);

            if (emptySplitIndexes.length > 0) {
              emptySplitIndexes.reverse().forEach(idx => removeItem(idx));
              toast.info("Removed empty batch allocations automatically.");
            }
            onNext();
          }}
          disabled={!canProceed2}
          className="flex-[2] bg-slate-900 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl text-lg hover:bg-slate-800 inline-flex items-center justify-center gap-2 transition-colors shadow-md"
        >
          Review Invoice <ArrowRight size={20} />
        </button>
      </div>

      <style>{`
        @keyframes scaleIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scaleIn { animation: scaleIn 0.24s ease-out; }
        
        @keyframes slideInRight { 
          from { transform: translateX(100%); opacity: 0; } 
          to { transform: translateX(0); opacity: 1; } 
        }
        @keyframes slideInLeft { 
          from { transform: translateX(-100%); opacity: 0; } 
          to { transform: translateX(0); opacity: 1; } 
        }
        .animate-slideInRight { animation: slideInRight 0.36s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        .animate-slideInLeft { animation: slideInLeft 0.36s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        
        @keyframes pulse { 0%, 100% { background-color: #f3f4f6; } 50% { background-color: #a7f3d0; } }
        .animate-pulse { animation: pulse 0.5s ease-in-out; }
      `}</style>
    </div>
  );
};