import { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext'; 

// ✨ IMPORT YOUR EXISTING CATALOG HOOK
import { useProductCatalog } from '../../features/Client/ProductsPage/hooks/useProductCatalog';
import { filterProducts, sortProducts, uniqueCompanies, SORT_OPTIONS } from '../../features/Client/ProductsPage/utils/productHelpers';

import ProductsTabBar from '../../features/Client/ProductsPage/components/ProductsTabBar';
import NearExpiryBanner from '../../features/Client/ProductsPage/components/NearExpiryBanner';
import ProductSearchBar from '../../features/Client/ProductsPage/components/ProductSearchBar';
import { FilterDrawer } from '../../features/Client/ProductsPage/components/FilterDrawer';
import ProductGrid from '../../features/Client/ProductsPage/components/ProductGrid';
import ProductDrawer from '../../features/Client/ProductsPage/components/ProductDrawer';
import CartTeaser from '../../features/Client/ProductsPage/components/CartTeaser';

const DEFAULT_FILTERS = { companies: [], gstRates: [], types: [], categories: [] };

const ClientProductsPage = () => {
  const [tab, setTab] = useState('all'); 
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('Top Selling');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const { addItem, inquiryCount, orderCount } = useCart();
  
  // REAL AUTH CHECK
  const { user } = useAuth();
  const isApproved = user?.status === 'Active';

  // ✨ USE YOUR HOOK TO FETCH & MAP THE DATA PROPERLY
  const { products, loading, error } = useProductCatalog();

  const companies = useMemo(() => uniqueCompanies(products), [products]);
  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  const openFilters = () => { setPendingFilters(filters); setFilterOpen(true); };
  const applyFilters = () => setFilters(pendingFilters);
  const resetFilters = () => { setPendingFilters(DEFAULT_FILTERS); setFilters(DEFAULT_FILTERS); };

  const displayProducts = useMemo(() => {
    const filtered = filterProducts(products, { tab, search, filters });
    return sortProducts(filtered, sortBy);
  }, [products, tab, search, filters, sortBy]);

  const handleAddToOrder = (product, qty) => {
    addItem('order', product, qty);
    toast.success(`Added ${qty} × ${product.name} to Cart`);
  };

  const handleAddToInquiry = (product, qty) => {
    addItem('inquiry', product, qty);
    toast.success(`Added ${qty} × ${product.name} for Inquiry`);
  };

  return (
    <div className="max-w-2xl sm:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto">
      <ProductsTabBar tab={tab} onChange={setTab} />

      {tab === 'near-expiry' && <NearExpiryBanner />}

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {tab === 'all' && (
          <ProductSearchBar
            search={search}
            onSearchChange={setSearch}
            onOpenFilters={openFilters}
            activeFilterCount={activeFilterCount}
          />
        )}

        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-sm sm:text-base">{displayProducts.length} products</p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm sm:text-base font-medium text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none"
          >
            {SORT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <CartTeaser inquiryCount={inquiryCount} orderCount={orderCount} />

        {/* ✨ SAFELY HANDLE LOADING AND ERRORS */}
        {loading ? (
          <p className="text-slate-400 text-base text-center py-16">Loading products…</p>
        ) : error ? (
          <p className="text-red-500 text-base text-center py-16">Couldn't load products: {error}</p>
        ) : (
          <ProductGrid
            products={displayProducts}
            canOrder={isApproved}
            onView={setSelectedProduct}
            onAddToOrder={handleAddToOrder}
            onAddToInquiry={handleAddToInquiry}
          />
        )}
      </div>

      {selectedProduct && (
        <ProductDrawer
          product={selectedProduct}
          canOrder={isApproved}
          onClose={() => setSelectedProduct(null)}
          onAddToOrder={handleAddToOrder}
          onAddToInquiry={handleAddToInquiry}
        />
      )}

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        pendingFilters={pendingFilters}
        setPendingFilters={setPendingFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        companyOptions={companies}
      />
    </div>
  );
};

export default ClientProductsPage;