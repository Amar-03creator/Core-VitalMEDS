// // src/features/Client/ProductsPage/components/ProductBadgesRow.jsx
// import StatusBadge from '../../../../components/StatusBadge';

// const ProductBadgesRow = ({ product, size = 'sm' }) => {
//   const isOutOfStock = product.totalStock === 0;
//   const isLowStock = !isOutOfStock && product.totalStock <= product.lowStockThreshold;

//   if (!isOutOfStock && !isLowStock && !product.isNew && !product.nearExpiry) return null;

//   return (
//     <div className="flex flex-wrap gap-1.5">
//       {isOutOfStock && <StatusBadge label="Out of Stock" color="red" size={size} />}
//       {isLowStock && <StatusBadge label="Low Stock" color="amber" size={size} />}
//       {product.isNew && <StatusBadge label="New" color="blue" size={size} />}
//       {product.nearExpiry && (
//         <StatusBadge
//           label={size === 'sm' ? 'Near Expiry' : `Near Expiry — ${product.offer?.extraOffText || ''}`}
//           color="orange"
//           size={size}
//         />
//       )}
//     </div>
//   );
// };

// export default ProductBadgesRow;

// src/features/Client/ProductsPage/components/ProductBadgesRow.jsx
import StatusBadge from '../../../../components/StatusBadge';

/**
 * Only "Out of Stock" and "Near Expiry" render here now. "Low Stock" and
 * "New" were dropped — getProductsWithBatches doesn't return
 * lowStockThreshold or an isNew flag, and a badge computed against a
 * hardcoded guess would be more misleading than no badge at all.
 */
const ProductBadgesRow = ({ product, size = 'sm' }) => {
  const isOutOfStock = product.totalStock === 0;
  if (!isOutOfStock && !product.nearExpiry) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {isOutOfStock && <StatusBadge label="Out of Stock" color="red" size={size} />}
      {product.nearExpiry && <StatusBadge label="Near Expiry" color="orange" size={size} />}
    </div>
  );
};

export default ProductBadgesRow;