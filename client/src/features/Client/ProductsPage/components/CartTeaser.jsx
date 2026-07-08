// src/features/Client/ProductsPage/components/CartTeaser.jsx
import { Link } from 'react-router-dom';

const CartTeaser = ({ inquiryCount, orderCount }) => {
  const total = inquiryCount + orderCount;
  if (total === 0) return null;

  const label = [
    orderCount > 0 && `${orderCount} in Order`,
    inquiryCount > 0 && `${inquiryCount} in Inquiry`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="bg-emerald-500 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
      <p className="text-white font-semibold text-sm sm:text-base">{label}</p>
      <Link
        to="/client-dashboard/cart"
        className="bg-white text-emerald-600 font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl"
      >
        Review →
      </Link>
    </div>
  );
};

export default CartTeaser;