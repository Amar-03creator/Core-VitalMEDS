import { Package, Wallet, FileText } from 'lucide-react';
import { useState } from 'react';
import { MakeInvoiceModal } from '../../Admin/BillingPage/modals/MakeInvoiceModal';
import { PaymentModal } from '../../Admin/BillingPage/modals/PaymentModal';
import { AddPurchaseBillModal } from '../../Admin/BillingPage/modals/AddPurchaseBillModal';

const STORAGE_KEY = 'makeInvoiceState';

export const QuickActions = () => {
  const [showInvoiceModal, setShowInvoiceModal] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return !!saved;
    } catch (e) {
      return false;
    }
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handleCloseInvoiceModal = () => setShowInvoiceModal(false);
  const handleClosePaymentModal = () => setShowPaymentModal(false);
  const handleClosePurchaseModal = () => setShowPurchaseModal(false);

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setShowInvoiceModal(true)}
          className="flex flex-col items-center gap-2 bg-white border border-slate-200 rounded-2xl p-4 active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <FileText size={18} className="text-white" />
          </div>
          <span className="text-slate-700 text-xs font-medium text-center leading-tight">New Invoice</span>
        </button>

        <button
          onClick={() => setShowPurchaseModal(true)}
          className="flex flex-col items-center gap-2 bg-white border border-slate-200 rounded-2xl p-4 active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Package size={18} className="text-white" />
          </div>
          <span className="text-slate-700 text-xs font-medium text-center leading-tight">Add Stock</span>
        </button>

        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex flex-col items-center gap-2 bg-white border border-slate-200 rounded-2xl p-4 active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center">
            <Wallet size={18} className="text-white" />
          </div>
          <span className="text-slate-700 text-xs font-medium text-center leading-tight">Record Pymt</span>
        </button>
      </div>

      {showInvoiceModal && <MakeInvoiceModal onClose={handleCloseInvoiceModal} />}
      {showPaymentModal && <PaymentModal onClose={handleClosePaymentModal} />}
      {showPurchaseModal && <AddPurchaseBillModal onClose={handleClosePurchaseModal} />}
    </>
  );
};