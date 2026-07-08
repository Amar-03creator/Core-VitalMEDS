// src/features/Client/Cart/components/SubmitSuccessModal.jsx
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubmitSuccessModal = ({ type, onClose }) => {
  const navigate = useNavigate();

  const handleGoToOrders = () => {
    onClose();
    // Redirects exactly to the route defined in your App.jsx
    navigate('/client-dashboard/orders');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 sm:px-6 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 sm:p-8 text-center w-full max-w-sm shadow-2xl">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        
        <h3 className="text-slate-900 font-black text-2xl sm:text-3xl">
          {type === 'inquiry' ? 'Inquiry Sent!' : 'Order Placed!'}
        </h3>
        
        <p className="text-slate-500 font-bold text-sm sm:text-base mt-3 mb-6 leading-relaxed">
          {type === 'inquiry'
            ? "We've received your inquiry. The distributor will send a quote shortly. You can either accept or reject the pricings."
            : "Your order has been placed. You'll be notified once it's confirmed. You can edit the order at any time for once before it's processed. You can also download the bill once the order is delivered. Thank you for choosing us!"}
        </p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleGoToOrders} 
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 sm:py-4 rounded-xl text-base sm:text-lg transition-colors shadow-md shadow-emerald-200"
          >
            Go to My Orders <ArrowRight size={20} />
          </button>
          
          <button 
            onClick={onClose} 
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 sm:py-4 rounded-xl text-base sm:text-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitSuccessModal;