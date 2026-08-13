// src/features/Admin/BillingPage/components/PurchasesTab.jsx
import { useState, useEffect, useMemo } from 'react';
import { Plus, ShoppingCart, Building2, Package, Search, X } from 'lucide-react';
import { AddCompanyModal } from '../../../../modals/AddCompanyModal/index';
import { AddProductModal } from '../../../../modals/AddProductModal/index';
import { PurchaseEntryModal } from "../../../../modals/AddPurchaseBillModal/PurchaseEntryModal";
import { ReplenishmentPanel } from '../modals/ReplenishmentPanel';
import { PurchaseBillCard } from '../../../../components/purchase/PurchaseBillCard';
import { PurchaseBillDetailModal } from '../../../../components/purchase/PurchaseBillDetailModal';
import { api } from '../../../../services/api';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

const STORAGE_KEY = 'purchasesTabState';

export const PurchasesTab = () => {
  const loadModalState = () => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
      return {
        showPurchaseEntry: saved?.showPurchaseEntry ?? false,
        showAddCompany: saved?.showAddCompany ?? false,
        showAddProduct: saved?.showAddProduct ?? false,
      };
    } catch {
      return { showPurchaseEntry: false, showAddCompany: false, showAddProduct: false };
    }
  };

  const [sub, setSub] = useState('bills');
  const [companies, setCompanies] = useState([]);
  const [modalState, setModalState] = useState(loadModalState);
  
  // Real API State for Bills & Payments
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]); 
  const [loadingBills, setLoadingBills] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false); 
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(modalState));
  }, [modalState]);

  const setShowPurchaseEntry = (val) => setModalState(prev => ({ ...prev, showPurchaseEntry: val }));
  const setShowAddCompany = (val) => setModalState(prev => ({ ...prev, showAddCompany: val }));
  const setShowAddProduct = (val) => setModalState(prev => ({ ...prev, showAddProduct: val }));

  const fetchCompanies = async () => {
    try {
      const res = await api.getCompanies();
      setCompanies(res.data.map(c => ({
        id: c._id,
        companyName: c.companyName,
        shortCode: c.shortCode || c.companyName,
        billingAddress: c.billingAddress || '',
        gstin: c.gstin || '',
        city: c.city || '',
        state: c.state || '',
        pincode: c.pincode || '',
      })));
    } catch {
      toast.error('Failed to load suppliers');
    }
  };

  const fetchBills = async () => {
    setLoadingBills(true);
    try {
      const res = await api.getPurchaseBills(); 
      setBills(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load purchase bills');
    } finally {
      setLoadingBills(false);
    }
  };

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await api.getSupplierPayments();
      setPayments(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payment history');
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => { 
    fetchCompanies(); 
    fetchBills();
    fetchPayments(); 
  }, []);

  const handleCompanyAdded = () => { fetchCompanies(); setShowAddCompany(false); };
  const handleProductAdded = () => { fetchCompanies(); setShowAddProduct(false); };
  
  const handlePurchaseEntryClose = () => { 
    setShowPurchaseEntry(false); 
    fetchBills(); 
    fetchPayments();
    fetchCompanies(); // Refresh company ledger balances
  };

  // Search Logic
  const filteredBills = useMemo(() => {
    if (!search) return bills;
    const s = search.toLowerCase();
    return bills.filter(b => 
      b.supplierName?.toLowerCase().includes(s) || 
      b.invoiceNumber?.toLowerCase().includes(s)
    );
  }, [bills, search]);

  const totalOutstanding = useMemo(() => {
    return bills.reduce((sum, b) => sum + (b.dueAmount || 0), 0);
  }, [bills]);

  return (
    <div className="space-y-4">
      {/* Sub‑tab switcher */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {[
            { key: 'bills', label: 'Bills' }, 
            { key: 'payments', label: 'Payments' }, 
            { key: 'returns', label: 'Returns' }, 
            { key: 'reorder', label: 'Reorder' }
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setSub(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${sub === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}>
            {label}
          </button>
        ))}
      </div>

      {sub === 'bills' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setShowPurchaseEntry(true)} className="flex flex-col items-center justify-center gap-1 bg-slate-900 text-white font-semibold py-3 rounded-2xl text-sm transition-transform hover:scale-[1.02]">
              <ShoppingCart size={18} /> Add Bill
            </button>
            <button onClick={() => setShowAddCompany(true)} className="flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 text-slate-700 font-semibold py-3 rounded-2xl text-sm transition-transform hover:scale-[1.02]">
              <Building2 size={18} /> Add Supplier
            </button>
            <button onClick={() => setShowAddProduct(true)} className="flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 text-slate-700 font-semibold py-3 rounded-2xl text-sm transition-transform hover:scale-[1.02]">
              <Package size={18} /> Add Product
            </button>
          </div>

          {/* Quick Stats & Search */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-red-700 text-sm font-bold uppercase tracking-wider">Payable Debt</p>
              <p className="text-2xl font-black text-red-700">₹{Math.round(totalOutstanding).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search supplier or bill number..."
              className="flex-1 text-base text-slate-800 placeholder-slate-400 bg-transparent outline-none"
            />
            {search && <button onClick={() => setSearch('')}><X size={16} className="text-slate-400" /></button>}
          </div>

          {/* Dynamic Bills List */}
          <div className="space-y-3">
            {loadingBills ? (
              <div className="py-12 text-center text-slate-500"><Spinner /> Loading purchase bills...</div>
            ) : filteredBills.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-300">
                <Package className="mx-auto mb-2 opacity-50" size={32} />
                No purchase bills found
              </div>
            ) : (
              filteredBills.map(bill => (
                <PurchaseBillCard key={bill._id} bill={bill} onClick={() => setSelectedBill(bill)} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Payments Tab UI - List Only */}
      {sub === 'payments' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {loadingPayments ? (
               <div className="py-12 text-center text-slate-500"><Spinner /> Loading payment history...</div>
            ) : payments.length === 0 ? (
               <div className="py-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-300">
                 No payments recorded yet
               </div>
            ) : (
               payments.map(payment => (
                 <div key={payment._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start justify-between">
                   <div>
                     {/* Showing Short Code first */}
                     <p className="font-bold text-slate-800 text-lg">
                       {payment.supplierObjectId?.shortCode || payment.supplierObjectId?.companyName || 'Unknown Supplier'}
                     </p>
                     <div className="flex items-center gap-2 mt-1">
                        {/* ✨ FIX: Showing Transaction ID explicitly here instead of SPV */}
                        <span className="text-xs font-bold font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          {payment.referenceNumber ? `Txn: ${payment.referenceNumber}` : 'Cash/No Txn ID'}
                        </span>
                        <span className="text-sm text-slate-500 font-medium">
                          {new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                     </div>
                     {/* Listing specific invoice numbers */}
                     {payment.allocatedBills?.length > 0 && (
                        <p className="text-xs text-slate-500 mt-2 font-medium">
                          Cleared Payment for: <span className="font-bold text-slate-700">{payment.allocatedBills.map(b => b.invoiceNumber).join(', ')}</span>
                        </p>
                     )}
                     {payment.adminRemarks && (
                        <p className="text-xs text-slate-400 mt-1 italic">
                          "{payment.adminRemarks}"
                        </p>
                     )}
                   </div>
                   <div className="text-right flex flex-col items-end">
                     <p className="font-black text-emerald-600 text-xl">₹{payment.totalAmountPaid.toLocaleString('en-IN')}</p>
                     <p className="text-sm text-slate-500 font-bold uppercase mt-0.5">{payment.paymentMode}</p>
                   </div>
                 </div>
               ))
            )}
          </div>
        </div>
      )}

      {sub === 'returns' && (
        <div className="space-y-3">
          <button className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-700 font-semibold py-3 rounded-2xl text-sm">
            <Plus size={15} /> Return to Company
          </button>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
            <p className="text-slate-600 text-sm">No pending returns</p>
          </div>
        </div>
      )}

      {sub === 'reorder' && (
        <ReplenishmentPanel companies={companies} />
      )}

      {/* ── Modals ────────────────────────────────────────────────────── */}
      {selectedBill && (
        <PurchaseBillDetailModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}

      {modalState.showPurchaseEntry && (
        <PurchaseEntryModal
          onClose={handlePurchaseEntryClose}
          companies={companies}
          onCompanyAdded={handleCompanyAdded}
          onProductAdded={handleProductAdded}
          onSave={handlePurchaseEntryClose} 
        />
      )}

      {modalState.showAddCompany && <AddCompanyModal onClose={() => setShowAddCompany(false)} onSave={handleCompanyAdded} />}
      {modalState.showAddProduct && <AddProductModal onClose={() => setShowAddProduct(false)} onSave={handleProductAdded} companies={companies} />}
    </div>
  );
};