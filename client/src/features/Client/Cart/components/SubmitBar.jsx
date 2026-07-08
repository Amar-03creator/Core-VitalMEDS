// src/features/Client/Cart/components/SubmitBar.jsx
import { ShoppingBag, Send } from 'lucide-react';

const SubmitBar = ({ tab, onSubmit, disabled }) => (
  <div className="space-y-1.5 pt-1">
    {tab === 'order' ? (
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-2xl text-sm sm:text-base shadow-lg shadow-emerald-200"
      >
        <ShoppingBag size={18} /> Place Order
      </button>
    ) : (
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-2xl text-sm sm:text-base"
      >
        <Send size={18} /> Send Inquiry
      </button>
    )}
    <p className="text-slate-400 text-[10px] sm:text-xs text-center">
      {tab === 'order'
        ? 'Placing a direct order confirms immediate purchase.'
        : 'Sending an inquiry lets you negotiate pricing before you order.'}
    </p>
  </div>
);

export default SubmitBar;