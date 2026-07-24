// src/features/Client/Cart/components/SubmitBar.jsx
import { ShoppingBag, Send } from 'lucide-react';

const SubmitBar = ({ tab, onSubmit, disabled, disabledReason }) => (
  <div className="space-y-1.5 pt-1">
    {tab === 'order' ? (
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 sm:py-4 rounded-2xl text-base sm:text-lg shadow-lg shadow-emerald-200"
      >
        <ShoppingBag size={18} /> Place Order
      </button>
    ) : (
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 sm:py-4 rounded-2xl text-base sm:text-lg"
      >
        <Send size={18} /> Send Inquiry
      </button>
    )}
    <p className={`text-xs sm:text-sm text-center ${disabled && disabledReason ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
      {disabled && disabledReason
        ? disabledReason
        : tab === 'order'
        ? 'Placing a direct order confirms immediate purchase.'
        : 'Sending an inquiry lets you negotiate pricing before you order.'}
    </p>
  </div>
);

export default SubmitBar;