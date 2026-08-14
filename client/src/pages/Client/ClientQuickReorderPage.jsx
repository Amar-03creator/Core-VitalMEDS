// pages/Client/ClientQuickReorderPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, CheckCircle2, ArrowRight, PackageOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useCurrentClient } from '../../hooks/useCurrentClient';
import { useProductCatalog } from '../../features/Client/ProductsPage/hooks/useProductCatalog';
import { useReorderSuggestions } from '../../features/Client/Reorder/hooks/useReorderSuggestions';

import ReorderProductCard from '../../features/Client/Reorder/components/ReorderProductCard';
import ReorderStagingTray from '../../features/Client/Reorder/components/ReorderStagingTray';

const ClientQuickReorderPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  const { authAxios } = useAuth();
  
  // ✨ Added `itemsFor` to read what is already in the cart
  const { addItem, updateQty, itemsFor } = useCart(); 
  
  const { isApproved, clientId } = useCurrentClient();
  const { products } = useProductCatalog();
  const { suggestions, loading, error } = useReorderSuggestions(clientId, authAxios, products);

  const [qtys, setQtys] = useState({}); 
  const [staged, setStaged] = useState({}); 
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(null); 

  const qtyFor = (product) => (qtys[product.productId] !== undefined ? qtys[product.productId] : product.suggestedQty);
  const setQty = (productId, value) => setQtys((q) => ({ ...q, [productId]: value }));

  const handleAdd = (product) => setStaged((s) => ({ ...s, [product.productId]: true }));

  const handleRemoveStaged = (productId) =>
    setStaged((s) => {
      const next = { ...s };
      delete next[productId];
      return next;
    });

  const stagedProducts = suggestions.filter((p) => staged[p.productId]);
  const stagedList = stagedProducts.map((p) => ({ productId: p.productId, name: p.name, qty: qtyFor(p) }));

  const targetTab = isApproved ? 'order' : 'inquiry';
  
  // ✨ NEW: Create a blazing fast lookup Set of Product IDs currently in the user's cart
  const currentCartItems = itemsFor(targetTab) || [];
  const itemsAlreadyInCart = new Set(currentCartItems.map(item => item.productId));

  const handleAddToCart = async () => {
    setCommitting(true);
    try {
      stagedProducts.forEach((p) => {
        addItem(targetTab, p);
        updateQty(targetTab, p.productId, qtyFor(p));
      });
      setCommitted({ count: stagedProducts.length, tab: targetTab });
      setStaged({});
    } catch (err) {
      toast.error('Could not add items to cart. Please try again.');
    } finally {
      setCommitting(false);
    }
  };

  if (committed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={30} className="text-emerald-600" />
          </div>
          <div className="space-y-1.5">
            <p className="text-slate-900 font-bold text-lg sm:text-xl">
              {committed.count} item{committed.count > 1 ? 's' : ''} added to your {committed.tab === 'order' ? 'Order' : 'Inquiry'} cart
            </p>
            <p className="text-slate-500 text-sm">Review quantities and submit whenever you're ready.</p>
          </div>
          <button
            onClick={() => navigate('/client-dashboard/cart')}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
          >
            Go to Cart <ArrowRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  const hasStaged = stagedList.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-10 pb-32 lg:pb-10">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 lg:mb-8">
          <div className="w-18 h-18 lg:w-11 lg:h-11 bg-violet-500 rounded-2xl flex items-center justify-center shrink-0 shadow-sm shadow-violet-200">
            <Zap size={30} className="text-white" />
          </div>
          <div>
            <h1 className="text-slate-900 text-3xl font-black tracking-tight">Quick Reorder</h1>
            <p className="text-slate-500 text-base font-medium">Suggested quantities from your last 5 orders</p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-slate-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 py-0.5">
                    <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-9 bg-slate-100 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 max-w-lg">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
              <PackageOpen size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm max-w-xs">No recent orders to base suggestions on yet.</p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && suggestions.length > 0 && (
          <div className={hasStaged ? 'lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 xl:gap-8 lg:items-start' : ''}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              {suggestions.map((product) => (
                <ReorderProductCard
                  key={product.productId}
                  product={product}
                  qty={qtyFor(product)}
                  onQtyChange={(val) => setQty(product.productId, val)}
                  staged={!!staged[product.productId]}
                  onAdd={() => handleAdd(product)}
                  
                  // ✨ NEW: Pass the boolean down to the card
                  isAlreadyInCart={itemsAlreadyInCart.has(product.productId)}
                />
              ))}
            </div>

            {hasStaged && (
              <div className="hidden lg:block lg:sticky lg:top-6">
                <ReorderStagingTray
                  variant="panel"
                  items={stagedList}
                  onRemove={handleRemoveStaged}
                  onAddToCart={handleAddToCart}
                  adding={committing}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="lg:hidden">
        <ReorderStagingTray
          variant="sheet"
          items={stagedList}
          onRemove={handleRemoveStaged}
          onAddToCart={handleAddToCart}
          adding={committing}
        />
      </div>
    </div>
  );
};

export default ClientQuickReorderPage;