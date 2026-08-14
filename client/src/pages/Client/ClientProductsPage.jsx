// src/pages/Client/ClientProductsPage.jsx
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

import { useProductCatalog } from '../../features/Client/ProductsPage/hooks/useProductCatalog';
import {
  filterProducts,
  sortProducts,
  uniqueCompanies,
  SORT_OPTIONS,
} from '../../features/Client/ProductsPage/utils/productHelpers';

import ProductSearchBar from '../../features/Client/ProductsPage/components/ProductSearchBar';
import { FilterDrawer } from '../../features/Client/ProductsPage/components/FilterDrawer';
import ProductGrid from '../../features/Client/ProductsPage/components/ProductGrid';
import ProductDrawer from '../../features/Client/ProductsPage/components/ProductDrawer';
import CartTeaser from '../../features/Client/ProductsPage/components/CartTeaser';

const DEFAULT_FILTERS = { companies: [], gstRates: [], types: [], categories: [] };
const ITEMS_PER_PAGE = 12;

const ClientProductsPage = () => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('Top Selling');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const { addItem, inquiryCount, orderCount } = useCart();
  const { user } = useAuth();
  const isApproved = user?.status === 'Active';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const { products, loading, error } = useProductCatalog();

  const companies = useMemo(() => uniqueCompanies(products), [products]);
  const activeFilterCount = Object.values(filters).reduce(
    (sum, arr) => sum + (arr?.length || 0),
    0
  );

  const openFilters = () => {
    setPendingFilters(filters);
    setFilterOpen(true);
  };
  const applyFilters = () => setFilters(pendingFilters);
  const resetFilters = () => {
    setPendingFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
  };

  // Full filtered & sorted list
  const displayProducts = useMemo(() => {
    const filtered = filterProducts(products, { search, filters });
    return sortProducts(filtered, sortBy);
  }, [products, search, filters, sortBy]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(displayProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return displayProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [displayProducts, page]);

  // Reset page when search/filters/sort changes
  useMemo(() => {
    setPage(1);
    setPageInput('1');
  }, [search, filters, sortBy]);

  // Keep input synced with current page
  useMemo(() => {
    setPageInput(String(page));
  }, [page]);

  // Scroll to top smoothly when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const handlePageSubmit = () => {
    const parsed = parseInt(pageInput, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > totalPages) {
      toast.error(`Please enter a page between 1 and ${totalPages}`);
      setPageInput(String(page));
      return;
    }
    if (parsed !== page) {
      setPage(parsed);
    }
  };

  const handlePageKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePageSubmit();
    }
  };

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
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <h1 className="text-slate-900 text-3xl font-black tracking-tight">
          Product Catalog
        </h1>
        <p className="text-slate-500 text-base font-medium">
          Browse our complete inventory, view live stock, and add items to your
          cart.
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
        <ProductSearchBar
          search={search}
          onSearchChange={setSearch}
          onOpenFilters={openFilters}
          activeFilterCount={activeFilterCount}
        />

        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-sm sm:text-base">
            {displayProducts.length} products
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm sm:text-base font-medium text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <CartTeaser inquiryCount={inquiryCount} orderCount={orderCount} />

        {loading ? (
          <p className="text-slate-400 text-base text-center py-16">
            Loading products…
          </p>
        ) : error ? (
          <p className="text-red-500 text-base text-center py-16">
            Couldn't load products: {error}
          </p>
        ) : (
          <>
            <ProductGrid
              products={paginatedProducts}
              canOrder={isApproved}
              onView={setSelectedProduct}
              onAddToOrder={handleAddToOrder}
              onAddToInquiry={handleAddToInquiry}
            />

            {/* Pagination controls – exactly like admin */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={18} /> Prev
                </button>

                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <input
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={handlePageSubmit}
                    onKeyDown={handlePageKeyDown}
                    className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg py-1.5 text-base focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                  />
                  <span className="text-slate-400">/</span>
                  <span>{totalPages}</span>
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-40 transition-colors"
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
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