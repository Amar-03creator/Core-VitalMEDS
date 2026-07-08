// features/Client/Dashboard/TopProducts.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';

import ProductGrid from '../ProductsPage/components/ProductGrid';
import ProductDrawer from '../ProductsPage/components/ProductDrawer';

const TopProducts = ({
  products = [],
  isClientApproved = false,
  onAddToCart,
  onAddToInquiry,
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);

  const safeProducts = Array.isArray(products) ? products : [];
  const displayProducts = safeProducts.slice(0, 4);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-xl font-bold text-slate-800">
          <Star size={18} className="text-amber-500" /> Top Products
        </h2>

        <Link
          to="/client-dashboard/products"
          className="flex items-center gap-1 text-base font-semibold text-emerald-600"
        >
          Browse all <ArrowRight size={13} />
        </Link>
      </div>

      <ProductGrid
        products={displayProducts}
        canOrder={isClientApproved}
        onView={setSelectedProduct}
        onAddToOrder={onAddToCart}
        onAddToInquiry={onAddToInquiry}
      />

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

export default TopProducts;