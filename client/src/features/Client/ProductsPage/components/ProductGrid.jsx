// src/features/Client/ProductsPage/components/ProductGrid.jsx
import { Package } from 'lucide-react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, canOrder, onView, onAddToOrder, onAddToInquiry }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Package className="mx-auto mb-2" size={40} />
        <p className="text-base sm:text-lg">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
      {products.map((p) => (
        <ProductCard
          key={p.productId}
          product={p}
          canOrder={canOrder}
          onView={onView}
          onAddToOrder={onAddToOrder}
          onAddToInquiry={onAddToInquiry}
        />
      ))}
    </div>
  );
};

export default ProductGrid;