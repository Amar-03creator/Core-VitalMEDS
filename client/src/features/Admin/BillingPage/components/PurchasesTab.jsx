// PurchasesTab.jsx
import { useState, useEffect } from 'react';
import { Plus, ShoppingCart, Building2, Package } from 'lucide-react';
import { PURCHASE_BILLS, STATUS_CFG } from '../utils/constants';
import { AddCompanyModal } from '../../../../modals/AddCompanyModal/index';
import { AddProductModal } from '../../../../modals/AddProductModal/index';
import { PurchaseEntryModal } from '../../../../modals/AddPurchaseBillModal/PurchaseEntryModal';
import { api } from '../../../../services/api';
import { toast } from 'sonner';

const STORAGE_KEY = 'purchasesTabState';

export const PurchasesTab = () => {
  const [sub, setSub] = useState('bills');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Modal visibility flags ────────────────────────────────
  // Restore from sessionStorage on mount
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

  const [modalState, setModalState] = useState(loadModalState);

  // Persist flags whenever they change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(modalState));
  }, [modalState]);

  const setShowPurchaseEntry = (val) =>
    setModalState(prev => ({ ...prev, showPurchaseEntry: val }));
  const setShowAddCompany = (val) =>
    setModalState(prev => ({ ...prev, showAddCompany: val }));
  const setShowAddProduct = (val) =>
    setModalState(prev => ({ ...prev, showAddProduct: val }));

  // ── Data fetching ─────────────────────────────────────────
  const fetchCompanies = async () => {
    try {
      const res = await api.getCompanies();
      setCompanies(res.data.map(c => ({
        id: c._id,
        companyName: c.companyName,
        billingAddress: c.billingAddress || '',
        gstin: c.gstin || '',
        city: c.city || '',
        state: c.state || '',
        pincode: c.pincode || '',
      })));
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  // ── Callbacks after modals save ───────────────────────────
  const handleCompanyAdded = () => {
    fetchCompanies();
    setShowAddCompany(false);
  };

  const handleProductAdded = () => {
    // Refresh companies list (may affect product dropdowns in other places)
    fetchCompanies();
    setShowAddProduct(false);
  };

  const handlePurchaseEntryClose = () => {
    setShowPurchaseEntry(false);
  };

  return (
    <div className="space-y-4">
      {/* sub‑tab switcher */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {[{ key: 'bills', label: 'Bills' }, { key: 'returns', label: 'Returns' }, { key: 'reorder', label: 'Reorder' }].map(({ key, label }) => (
          <button key={key} onClick={() => setSub(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${sub === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {sub === 'bills' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setShowPurchaseEntry(true)}
              className="flex flex-col items-center justify-center gap-1 bg-slate-900 text-white font-semibold py-3 rounded-2xl text-sm">
              <ShoppingCart size={18} /> Purchase Entry
            </button>
            <button onClick={() => setShowAddCompany(true)}
              className="flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 text-slate-700 font-semibold py-3 rounded-2xl text-sm">
              <Building2 size={18} /> Add Company
            </button>
            <button onClick={() => setShowAddProduct(true)}
              className="flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 text-slate-700 font-semibold py-3 rounded-2xl text-sm">
              <Package size={18} /> Add Product
            </button>
          </div>

          {/* bills list – unchanged */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {PURCHASE_BILLS.map(b => {
              const { pill, label } = STATUS_CFG[b.status];
              return (
                <div key={b.id} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-500 font-mono text-xs">{b.id}</p>
                    <p className="text-slate-900 font-semibold text-base">{b.supplier}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-500 text-sm">{b.items} items · {b.date}</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${pill}`}>{label}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-900 font-bold text-base">₹{b.amount.toLocaleString()}</p>
                    <button className="text-emerald-600 text-sm font-semibold">View</button>
                  </div>
                </div>
              );
            })}
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
        <div className="space-y-3">
          {[
            { label: 'Target Supplier', opts: ['All Registered Companies', 'Cipla Ltd', 'Mankind Pharma'] },
            { label: 'Forecast Strategy', opts: ['Last 30 Days Velocity', 'Last 60 Days Velocity', 'Seasonal Average'] },
          ].map(({ label, opts }) => (
            <div key={label}>
              <p className="text-sm font-semibold text-slate-600 mb-1.5">{label}</p>
              <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none">
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <button className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-base">
            ⚙️ Generate Master Suggestion List
          </button>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────── */}
      {modalState.showPurchaseEntry && (
        <PurchaseEntryModal
          onClose={handlePurchaseEntryClose}
          companies={companies}
          onCompanyAdded={handleCompanyAdded}
          onProductAdded={handleProductAdded}
        />
      )}
      {modalState.showAddCompany && (
        <AddCompanyModal
          onClose={() => setShowAddCompany(false)}
          onSave={handleCompanyAdded}
        />
      )}
      {modalState.showAddProduct && (
        <AddProductModal
          onClose={() => setShowAddProduct(false)}
          onSave={handleProductAdded}
          companies={companies}
        />
      )}
    </div>
  );
};