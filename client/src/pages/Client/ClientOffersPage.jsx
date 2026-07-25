/* 
 * ============================================================================
 * 🎁 OFFERS PAGE LOGIC
 * ============================================================================
 * - This page bypasses normal catalog rules. Unapproved/Pending clients are strictly locked out.
 * - The backend specifically serves batches where `offer.isActive === true`.
 * - Because the ProductCard is rendered with `isOfferMode={true}`:
 *    1. The "Add to Inquiry" button is completely hidden.
 *    2. The stepper is replaced by the Offer Description.
 *    3. The Critical Stock logic strictly evaluates the specific Offer Batch's remaining stock,
 *       ensuring users know exactly how many clearance items are left.
 * ============================================================================
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Tag, Search, Loader2, Sparkles, Lock } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext'; // ✨ IMPORTED CART CONTEXT
import ProductCard from '../../features/Client/ProductsPage/components/ProductCard';
import ProductDrawer from '../../features/Client/ProductsPage/components/ProductDrawer';
import { toast } from 'sonner';

export default function ClientOffersPage() {
  const { user } = useAuth();
  const { addItem } = useCart(); // ✨ EXTRACTED ADD FUNCTION
  
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Checks exact DB status from AuthContext (Added your new regex logic conceptually)
  const isApproved = ['approved', 'active', 'static', 'credit alert'].includes(user?.status?.toLowerCase());

  const fetchOffersData = useCallback(async () => {
    if (!isApproved) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getOffersList('active', 'all');
      setBatches(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch offers data");
    } finally {
      setLoading(false);
    }
  }, [isApproved]);

  useEffect(() => {
    fetchOffersData();
  }, [fetchOffersData]);

  const displayProducts = useMemo(() => {
    let filtered = batches;
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter((b) =>
        (b.productName && b.productName.toLowerCase().includes(s)) ||
        (b.company && b.company.toLowerCase().includes(s)) ||
        (b.companyShortCode && b.companyShortCode.toLowerCase().includes(s))
      );
    }

    return filtered.map(b => ({
      _id: b.productId, 
      productId: b.productId, // ✨ CRITICAL: CartContext specifically looks for this key!
      name: b.productName,
      company: b.company,
      companyShortCode: b.companyShortCode,
      packing: b.packing, 
      totalStock: b.remainingUnits,
      mrp: b.mrp,
      offer: b.offer,
      photoUrl: b.photoUrl,
      categories: b.categories, 
      type: b.type,
      hsnCode: b.hsnCode,
      gstRate: b.gstRate,
      compositions: b.compositions,
      description: b.description,
      usageTips: b.usageTips,
      batches: [b] 
    }));
  }, [batches, search]);

  // ✨ REPLACED TODOS WITH ACTUAL CART ACTIONS
  const handleAddToCart = (product, qty) => {
    addItem('order', product, qty);
    toast.success(`${product.name} added to cart!`);
  };

  const handleAddToInquiry = (product, qty) => {
    addItem('inquiry', product, qty);
    toast.success(`${product.name} added to inquiry!`);
  };

  if (!isApproved && !loading) {
    return (
      <div className="mx-auto max-w-7xl px-3 py-16 sm:px-6 flex flex-col items-center justify-center">
        <div className="bg-slate-100 p-6 rounded-full mb-4">
          <Lock size={48} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Offers are Locked</h2>
        <p className="text-slate-500 text-center max-w-md">
          Your account is currently under review. You will gain access to exclusive schemes once approved.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6 px-3 py-6 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={26} /> Special Schemes
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Exclusive deals, active schemes, and clearance offers.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex items-center">
          <div className="relative w-full">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search offers by medicine or company..."
              className="w-full rounded-xl bg-slate-50 px-10 py-3 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all border border-transparent"
            />
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 size={32} className="animate-spin text-emerald-500" />
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <Tag className="mx-auto mb-3 text-slate-300" size={48} />
              <p className="text-lg font-black text-slate-700">No active offers found.</p>
              <p className="text-sm font-semibold text-slate-400 mt-1">Check back later for new schemes!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
              {displayProducts.map((product, idx) => (
                <ProductCard
                  key={`${product._id}-${idx}`}
                  product={product}
                  canOrder={isApproved} 
                  onView={setSelectedProduct}
                  onAddToOrder={handleAddToCart}
                  onAddToInquiry={handleAddToInquiry}
                  isOfferMode={true} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProduct && (
        <ProductDrawer
          product={selectedProduct}
          canOrder={isApproved} 
          onClose={() => setSelectedProduct(null)}
          onAddToOrder={handleAddToCart}
          onAddToInquiry={handleAddToInquiry}
          isOfferMode={true} 
        />
      )}
    </>
  );
}