// src/pages/Cart.jsx
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

const clientCart = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart size={32} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Your Cart is Empty</h2>
        <p className="text-slate-500 mb-6">Add items from the products page to get started.</p>
        <Link 
          to="/client-dashboard/products" 
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
};

export default clientCart;