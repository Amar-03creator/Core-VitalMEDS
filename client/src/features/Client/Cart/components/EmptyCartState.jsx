// src/features/Client/Cart/components/EmptyCartState.jsx
import { ShoppingBag } from 'lucide-react';

const EmptyCartState = ({ tab }) => (
  <div className="text-center py-16 text-slate-400">
    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <ShoppingBag size={28} className="text-slate-300" />
    </div>
    <p className="text-slate-600 font-semibold text-base sm:text-lg">
      No items in {tab === 'order' ? 'Order Now' : 'Inquiry'} yet
    </p>
    <p className="text-slate-400 text-sm mt-1">Search and add medicines above to get started</p>
  </div>
);

export default EmptyCartState;