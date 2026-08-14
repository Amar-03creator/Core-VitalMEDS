// src/pages/Admin/OffersPage.jsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Search, Tag, Plus, Loader2, ChevronDown, Filter, AlertOctagon, XCircle } from 'lucide-react';
import CreateOfferModal from '../../features/Admin/OffersPage/CreateOfferModal';
import BatchCard from '../../features/Admin/OffersPage/BatchCard';
import { api } from '../../services/api';

export default function OffersPage() {
  // ✨ DEFAULT: Show All Batches expiring in 6 months
  const [offerStatus, setOfferStatus] = useState('all'); 
  const [expiryFilter, setExpiryFilter] = useState('6'); 
  const [offerToDelete, setOfferToDelete] = useState(null);
  
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [prefillBatch, setPrefillBatch] = useState(null);

  const fetchOffersData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getOffersList(offerStatus, expiryFilter);
      setBatches(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch offers data");
    } finally {
      setLoading(false);
    }
  }, [offerStatus, expiryFilter]);

  useEffect(() => {
    fetchOffersData();
    const interval = setInterval(() => { fetchOffersData(); }, 60000); // Polling for scheduled offers
    const onFocus = () => fetchOffersData();
    
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchOffersData]);

  const handleToggleStatus = async (batch) => {
    try {
      const newStatus = !batch.offer.isActive;
      await api.updateBatchOffer(batch.id, { offer: { ...batch.offer, isActive: newStatus } });
      toast.success(newStatus ? "Offer Activated!" : "Offer Paused.");
      fetchOffersData();
    } catch (err) {
      toast.error(err.message || "Failed to update status"); 
    }
  };

  const confirmDeleteOffer = async () => {
    if (!offerToDelete) return;
    try {
      await api.updateBatchOffer(offerToDelete, { action: 'delete' }); 
      toast.success("Offer deleted permanently.");
      setOfferToDelete(null);
      fetchOffersData();
    } catch (err) {
      toast.error("Failed to delete offer");
    }
  };

  const clearFilters = () => {
    setOfferStatus('all');
    setExpiryFilter('6');
    setSearch('');
  };

  const displayBatches = useMemo(() => {
    let filtered = batches;
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter((b) =>
        (b.productName && b.productName.toLowerCase().includes(s)) ||
        (b.companyShortCode && b.companyShortCode.toLowerCase().includes(s)) ||
        (b.batchNumber && b.batchNumber.toLowerCase().includes(s))
      );
    }
    return filtered;
  }, [batches, search]);

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-5 px-3 py-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
              <Tag className="text-emerald-500" size={24} /> Offers & Liquidation
            </h1>
            <p className="mt-1 text-base font-medium text-slate-500">Manage schemes, drafts, and short-expiry liquidations.</p>
          </div>
          <button
            onClick={() => { setPrefillBatch(null); setShowOfferModal(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 text-base shrink-0"
          >
            <Plus size={18} strokeWidth={3} /> Make Custom Offer
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400"/>
              <div className="relative">
                <select 
                  value={offerStatus} 
                  onChange={(e) => setOfferStatus(e.target.value)} 
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-base font-black py-2 pl-3 pr-6 rounded-lg focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {/* ✨ FIX: Disabled if 'Any Date' is selected */}
                  <option value="all" disabled={expiryFilter === 'all'}>All Batches</option>
                  <option value="active">Active Offers</option>
                  <option value="inactive">Inactive / Drafts</option>
                  <option value="no_offer">No Offer</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-400">Expiring:</span>
              <div className="relative">
                <select 
                  value={expiryFilter} 
                  onChange={(e) => setExpiryFilter(e.target.value)} 
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-base font-black py-2 pl-3 pr-6 rounded-lg focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {/* ✨ FIX: Disabled if 'All Batches' is selected */}
                  <option value="all" disabled={offerStatus === 'all'}>Any Date</option>
                  <option value="1">≤ 1 Month</option>
                  <option value="3">≤ 3 Months</option>
                  <option value="6">≤ 6 Months</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Clear Filters Button */}
            {(offerStatus !== 'all' || expiryFilter !== '6' || search) && (
              <button 
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-base font-bold hover:bg-red-100 transition-colors"
              >
                <XCircle size={14} /> Clear
              </button>
            )}
          </div>

          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search batches..."
              className="w-full rounded-xl border border-slate-200 bg-white px-9 py-2 text-base font-semibold outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-5">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 size={28} className="animate-spin text-emerald-500" />
            </div>
          ) : displayBatches.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-slate-500 font-bold text-base">No batches found for this criteria.</p>
            </div>
          ) : (
            displayBatches.map((batch, index) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                index={index}
                onOpenModal={(b) => { setPrefillBatch(b); setShowOfferModal(true); }}
                onToggleStatus={handleToggleStatus}
                onDeleteOffer={(id) => setOfferToDelete(id)}
              />
            ))
          )}
        </div>
      </div>

      {showOfferModal && (
        <CreateOfferModal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          prefillBatch={prefillBatch}
          onSave={fetchOffersData}
        />
      )}

      {offerToDelete && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertOctagon className="text-red-600" size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Delete Offer?</h3>
                <p className="text-sm font-semibold text-slate-500 mt-2">
                  This action will permanently wipe this offer from the database. It cannot be undone.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button onClick={() => setOfferToDelete(null)} className="flex-1 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm">
                Cancel
              </button>
              <button onClick={confirmDeleteOffer} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold shadow-md shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}