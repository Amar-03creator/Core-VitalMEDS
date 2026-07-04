import { Package, Wallet, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MakeInvoiceModal } from '../../../modals/MakeInvoiceModal';
import { PaymentModal } from '../../../components/payments/PaymentModal';
import { PurchaseEntryModal } from '../../../modals/AddPurchaseBillModal/PurchaseEntryModal'; // corrected path
import { PRODUCT_CATALOG } from '../../Admin/BillingPage/utils/constants';
import { api } from '../../../services/api';
import { toast } from 'sonner';

const genId = () => Date.now() + '-' + Math.random().toString(36).substr(2, 5);

export const QuickActions = () => {
  const [showInvoiceModal, setShowInvoiceModal] = useState(() => {
    try {
      return !!sessionStorage.getItem('makeInvoiceState');
    } catch { return false; }
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const [companies, setCompanies] = useState([]); // This will be fetched from the server

  const fetchCompanies = async () => {
    const res = await api.getCompanies();
    setCompanies(res.data.map(c => ({ id: c._id, companyName: c.companyName, billingAddress: c.billingAddress, gstin: c.gstin })));
  };  // We fetch companies when the component mounts, so the purchase entry modal has the latest list

  useEffect(() => { fetchCompanies(); }, []);  // Fetch companies on mount

  const handleCompanyAdded = async (newCompany) => {
    await api.createCompany(newCompany);
    fetchCompanies();
  };

  const [products, setProducts] = useState(PRODUCT_CATALOG);

  const handleProductAdded = (newProduct) => {
    setProducts(prev => [...prev, { ...newProduct, id: genId() }]);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setShowInvoiceModal(true)} className="flex flex-col items-center gap-2 bg-white border border-slate-200 rounded-2xl p-4 active:scale-95 transition-transform">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <FileText size={18} className="text-white" />
          </div>
          <span className="text-slate-700 text-xs font-medium text-center leading-tight">New Invoice</span>
        </button>
        <button onClick={() => setShowPurchaseModal(true)} className="flex flex-col items-center gap-2 bg-white border border-slate-200 rounded-2xl p-4 active:scale-95 transition-transform">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Package size={18} className="text-white" />
          </div>
          <span className="text-slate-700 text-xs font-medium text-center leading-tight">Add Stock</span>
        </button>
        <button onClick={() => setShowPaymentModal(true)} className="flex flex-col items-center gap-2 bg-white border border-slate-200 rounded-2xl p-4 active:scale-95 transition-transform">
          <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center">
            <Wallet size={18} className="text-white" />
          </div>
          <span className="text-slate-700 text-xs font-medium text-center leading-tight">Record Pymt</span>
        </button>
      </div>

      {showInvoiceModal && <MakeInvoiceModal onClose={() => setShowInvoiceModal(false)} />}
      {showPaymentModal && <PaymentModal onClose={() => setShowPaymentModal(false)} />}
      {showPurchaseModal && (
        <PurchaseEntryModal
          onClose={() => setShowPurchaseModal(false)}
          companies={companies}
          products={products}
          onCompanyAdded={handleCompanyAdded}
          onProductAdded={handleProductAdded}
        />
      )}
    </>
  );
};