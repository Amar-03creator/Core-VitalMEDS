import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';

// ✨ FIX: Import ProductCard directly instead of ProductGrid
import ProductCard from '../ProductsPage/components/ProductCard';
import ProductDrawer from '../ProductsPage/components/ProductDrawer';

const TopSellingProducts = ({
  products = [],
  isClientApproved = false,
  onAddToCart,
  onAddToInquiry,
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);

  const safeProducts = Array.isArray(products) ? products : [];
  
  // Sort the products by units sold (via salesRank)
  const sortedBySales = [...safeProducts].sort((a, b) => {
    const rankA = a.salesRank || 999999;
    const rankB = b.salesRank || 999999;
    return rankA - rankB; 
  });

  const displayProducts = sortedBySales.slice(0, 4);   // top 4 bestsellers

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-xl font-bold text-slate-800">
          <Star size={18} className="text-amber-500" /> Top Selling Products
        </h2>
        <Link
          to="/client-dashboard/products"
          className="flex items-center gap-1 text-base font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          Browse all <ArrowRight size={13} />
        </Link>
      </div>

      {displayProducts.length > 0 ? (
        /* ✨ FIX: We use a strict grid-cols-2 here to force exactly 2 cards per row on all screens! */
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {displayProducts.map((product) => (
            <ProductCard
              key={product.productId || product._id || product.id}
              product={product}
              canOrder={isClientApproved}
              onView={setSelectedProduct}
              onAddToOrder={onAddToCart}
              onAddToInquiry={onAddToInquiry}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl py-8 text-center text-slate-400 text-sm font-medium">
          No products available yet.
        </div>
      )}

      {selectedProduct && (
        <ProductDrawer
          product={selectedProduct}
          canOrder={isClientApproved}
          onClose={() => setSelectedProduct(null)}
          onAddToOrder={onAddToCart}
          onAddToInquiry={onAddToInquiry}
        />
      )}
    </div>
  );
};

export default TopSellingProducts;