// src/features/Admin/CompaniesPage/tabs/PurchaseBillsTab.jsx

import { useState, useEffect, useMemo } from 'react';
import { Search, X, Package, ShoppingCart } from 'lucide-react';
import { api } from '../../../../services/api';
import { toast } from 'sonner';
import { PurchaseBillCard } from '../../../../components/purchase/PurchaseBillCard';
import { PurchaseBillDetailModal } from '../../../../components/purchase/PurchaseBillDetailModal';

export const PurchaseBillsTab = ({ company, onAddBill, refreshKey }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await api.getPurchaseBillsBySupplier(company._id);
      setBills(res.data || []);
    } catch {
      toast.error('Failed to load purchase bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [company._id, refreshKey]);

  const filteredBills = useMemo(() => {
    if (!search) return bills;
    const s = search.toLowerCase();
    return bills.filter(
      b =>
        b.supplierName?.toLowerCase().includes(s) ||
        b.invoiceNumber?.toLowerCase().includes(s)
    );
  }, [bills, search]);

  return (
    <div className="space-y-4">
      {/* Add Bill button */}
      <button
        onClick={onAddBill}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3 rounded-xl text-base"
      >
        <ShoppingCart size={18} /> Add Purchase Bill
      </button>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
        <Search size={18} className="text-slate-400 shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search bill number..."
          className="flex-1 text-base text-slate-800 placeholder-slate-400 bg-transparent outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')}>
            <X size={16} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Bills list */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading purchase bills…</div>
        ) : filteredBills.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-300">
            <Package className="mx-auto mb-2 opacity-50" size={32} />
            No purchase bills found
          </div>
        ) : (
          filteredBills.map(bill => (
            <PurchaseBillCard
              key={bill._id}
              bill={bill}
              onClick={() => setSelectedBill(bill)}
            />
          ))
        )}
      </div>

      {/* Detail modal */}
      {selectedBill && (
        <PurchaseBillDetailModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}
    </div>
  );
};