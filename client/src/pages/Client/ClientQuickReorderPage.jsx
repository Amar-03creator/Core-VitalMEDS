// pages/Client/ClientQuickReorderPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, CheckCircle2, ArrowRight } from 'lucide-react';
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
  const { authAxios } = useAuth();
  const { addItem, updateQty } = useCart();
  const { isApproved, clientId } = useCurrentClient();
  const { products } = useProductCatalog();
  const { suggestions, loading, error } = useReorderSuggestions(clientId, authAxios, products);

  const [qtys, setQtys] = useState({}); // productId -> client-overridden qty
  const [staged, setStaged] = useState({}); // productId -> true
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(null); // { count, tab } | null

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

  // Pending (non-approved) clients only ever have the Inquiry tab — same
  // gating CartTabs.jsx already applies on the Cart page itself.
  const targetTab = isApproved ? 'order' : 'inquiry';

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
      <div className="px-4 py-16 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-slate-900 font-bold text-lg">
            {committed.count} item{committed.count > 1 ? 's' : ''} added to your {committed.tab === 'order' ? 'Order' : 'Inquiry'} cart
          </p>
          <p className="text-slate-500 text-sm mt-1">Review quantities and submit whenever you're ready.</p>
        </div>
        <button
          onClick={() => navigate('/client-dashboard/cart')}
          className="inline-flex items-center gap-1.5 bg-emerald-500 text-white font-bold text-sm px-5 py-3 rounded-2xl"
        >
          Go to Cart <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-32 space-y-4 max-w-2xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-slate-900 text-lg font-bold">Quick Reorder</h1>
          <div className="w-7 h-7 bg-violet-500 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
        </div>
        <p className="text-slate-500 text-sm">Suggested quantities from your last 5 orders</p>
      </div>

      {loading && <p className="text-slate-400 text-sm text-center py-10">Loading your recent orders…</p>}
      {!loading && error && <p className="text-red-500 text-sm text-center py-10">{error}</p>}
      {!loading && !error && suggestions.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-10">No recent orders to base suggestions on yet.</p>
      )}

      <div className="space-y-3">
        {suggestions.map((product) => (
          <ReorderProductCard
            key={product.productId}
            product={product}
            qty={qtyFor(product)}
            onQtyChange={(val) => setQty(product.productId, val)}
            staged={!!staged[product.productId]}
            onAdd={() => handleAdd(product)}
          />
        ))}
      </div>

      <ReorderStagingTray items={stagedList} onRemove={handleRemoveStaged} onAddToCart={handleAddToCart} adding={committing} />
    </div>
  );
};

export default ClientQuickReorderPage;