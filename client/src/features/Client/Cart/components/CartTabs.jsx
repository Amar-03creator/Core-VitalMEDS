import { Lock } from 'lucide-react';
import { toast } from 'sonner';

const CartTabs = ({ activeTab, onChange, canOrder, inquiryCount, orderCount }) => {
  
  // ✨ Custom click handler for the Order tab
  const handleOrderClick = () => {
    if (!canOrder) {
      toast.info('Please wait till the admin approves you to place direct orders.');
      return; // Stop them from actually changing to the Order tab
    }
    onChange('order');
  };

  return (
    <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
      {/* Inquiry Tab - Always active and clickable */}
      <button
        onClick={() => onChange('inquiry')}
        className={`flex-1 py-3 sm:py-4 text-sm sm:text-base font-semibold border-b-2 transition-colors ${
          activeTab === 'inquiry'
            ? 'text-emerald-600 border-emerald-500'
            : 'text-slate-400 border-transparent hover:text-slate-600'
        }`}
      >
        Inquiry (RFQ)
        {inquiryCount > 0 && ` · ${inquiryCount}`}
      </button>

      {/* Order Tab - Faded & shows toast if not approved */}
      <button
        onClick={handleOrderClick}
        className={`flex-1 py-3 sm:py-4 text-sm sm:text-base font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
          !canOrder
            ? 'text-slate-400 border-transparent opacity-60' // ✨ Lightened style for unapproved
            : activeTab === 'order'
            ? 'text-emerald-600 border-emerald-500'
            : 'text-slate-400 border-transparent hover:text-slate-600'
        }`}
      >
        {!canOrder && <Lock size={14} className="shrink-0 mb-0.5" />}
        Order Now
        {orderCount > 0 && ` · ${orderCount}`}
      </button>
    </div>
  );
};

export default CartTabs;