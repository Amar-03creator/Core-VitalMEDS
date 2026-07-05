import { useState, useEffect, useRef } from 'react';
import { Package, Search, Plus, Filter, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/skeleton'; // Adjust path if needed
import { useSearchParams } from 'react-router-dom';

import { InventoryCard } from '../../features/Admin/InventoryPage/components/InventoryCard';
import { InventoryFilterModal } from '../../features/Admin/InventoryPage/modals/InventoryFilterModal';
import { EditPTRModal } from '../../features/Admin/InventoryPage/modals/EditPTRModal';
import { PurchaseEntryModal } from '../../modals/AddPurchaseBillModal/PurchaseEntryModal';

// Shadcn Skeleton Layout (Matches BaseProductCard exactly)
const InventoryCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 shadow-sm flex items-start gap-4">
    <Skeleton className="w-12 h-12 rounded-xl shrink-0 bg-slate-200" />
    <div className="flex-1 space-y-3 py-1">
      <Skeleton className="h-5 w-3/4 rounded-lg bg-slate-200" />
      <Skeleton className="h-4 w-1/2 rounded-lg bg-slate-200" />
    </div>
    <div className="w-16 flex flex-col items-end gap-2 py-1 shrink-0">
      <Skeleton className="h-7 w-full rounded-lg bg-slate-200" />
      <Skeleton className="h-3 w-3/4 mt-1 rounded-lg bg-slate-200" />
    </div>
  </div>
);

const ITEMS_PER_PAGE = 15;

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]); // Full filtered list
  const [stats, setStats] = useState({ total: 0, lowStock: 0, outStock: 0, nearExp: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('All');
  const quickFilterOptions = ['All', 'Low Stock', 'Out of Stock', 'Near Expiry'];
  const [companies, setCompanies] = useState([]);

  // ✨ URL-based Pagination State
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  // A drop-in replacement for setPage that updates the URL instead of local RAM
  const setPage = (updater) => {
    const newPage = typeof updater === 'function' ? updater(page) : updater;
    setSearchParams(prev => {
      if (newPage === 1) prev.delete('page');
      else prev.set('page', newPage);
      return prev;
    });
  };
  const [pageInput, setPageInput] = useState('1');

  // Load Filters from Session Storage
  const [filters, setFilters] = useState(() => {
    try {
      const saved = sessionStorage.getItem('vitalMedsInvFilters');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          companies: Array.isArray(parsed.companies) ? parsed.companies : [],
          categories: Array.isArray(parsed.categories) ? parsed.categories : [],
          types: Array.isArray(parsed.types) ? parsed.types : []
        };
      }
    } catch (e) {
      console.warn("Failed to parse filters from session storage", e);
    }
    return { companies: [], categories: [], types: [] };
  });

  // Modal States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(() => {
    return !!sessionStorage.getItem('purchaseEntryData');
  });
  const [editBatch, setEditBatch] = useState(null);
  const [isEditPTRModalOpen, setIsEditPTRModalOpen] = useState(false);

  // Keep input box synced and auto-scroll to top on page change
  useEffect(() => {
    setPageInput(String(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);


  // Safely track if dependencies ACTUALLY changed to avoid React 18 Strict Mode bugs
  const prevSearch = useRef(search);
  const prevFilters = useRef(filters);
  const prevQuick = useRef(quickFilter);

  useEffect(() => {
    if (prevSearch.current === search && prevFilters.current === filters && prevQuick.current === quickFilter) {
      return;
    }
    prevSearch.current = search;
    prevFilters.current = filters;
    prevQuick.current = quickFilter;

    setPage(1);
  }, [search, filters, quickFilter]);

  // Load Data
  // client/src/pages/Admin/InventoryPage.jsx

  // Find your loadInventory function and update the filtering logic:
  const loadInventory = async () => {
    setLoading(true);
    try {
      const apiParams = {
        search,
        company: filters.companies?.length > 0 ? filters.companies.join(',') : undefined,
        category: filters.categories?.length > 0 ? filters.categories.join(',') : undefined,
        type: filters.types?.length > 0 ? filters.types.join(',') : undefined,
        showAlertsOnly: quickFilter !== 'All' ? 'true' : undefined
      };

      const res = await api.getInventory(apiParams);
      const data = res.data || [];

      // ✨ NEW: Get today's date for dynamic calculations
      const today = new Date();

      // Apply quick filters client-side
      let filteredData = data;
      if (quickFilter === 'Low Stock') {
        filteredData = data.filter(p => p.totalStock > 0 && p.totalStock <= (p.lowStockThreshold || 0));
      } else if (quickFilter === 'Out of Stock') {
        filteredData = data.filter(p => p.totalStock === 0);
      } else if (quickFilter === 'Near Expiry') {
        // ✨ FIX: Calculate dynamically! (Includes already expired items)
        filteredData = data.filter(p => p.batches?.some(b => {
          if (!b.expiryDate) return false;
          const days = (new Date(b.expiryDate) - today) / (1000 * 60 * 60 * 24);
          return days <= (b.shortExpiryThreshold || 90);
        }));
      }

      setInventory(filteredData);

      if (quickFilter === 'All') {
        setStats({
          total: data.length,
          lowStock: data.filter(p => p.totalStock > 0 && p.totalStock <= (p.lowStockThreshold || 0)).length,
          outStock: data.filter(p => p.totalStock === 0).length,
          // ✨ FIX: Dynamic calc for stats too!
          nearExp: data.filter(p => p.batches?.some(b => {
            if (!b.expiryDate) return false;
            const days = (new Date(b.expiryDate) - today) / (1000 * 60 * 60 * 24);
            return days <= (b.shortExpiryThreshold || 90);
          })).length,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await api.getCompanies();
      setCompanies(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load companies');
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('vitalMedsInvFilters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => loadInventory(), 300);
    return () => clearTimeout(timer);
  }, [search, filters, quickFilter]);

  const clearFilters = () => {
    setFilters({ companies: [], categories: [], types: [] });
    setSearch('');
    setQuickFilter('All');
  };

  const openEditPTR = (batch) => {
    setEditBatch(batch);
    setIsEditPTRModalOpen(true);
  };

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(inventory.length / ITEMS_PER_PAGE));
  const currentItems = inventory.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Pagination Input Handlers
  const handlePageSubmit = () => {
    const parsed = parseInt(pageInput, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > totalPages) {
      toast.error(`Please enter a valid page between 1 and ${totalPages}`);
      setPageInput(String(page));
      return;
    }
    if (parsed !== page) setPage(parsed);
  };

  const handlePageKeyDown = (e) => {
    if (e.key === 'Enter') handlePageSubmit();
  };

  const activeFilterCount =
    (filters.companies?.length || 0) +
    (filters.categories?.length || 0) +
    (filters.types?.length || 0);

  return (
    <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto bg-slate-50 min-h-screen pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-3xl font-black tracking-tight">Inventory</h1>
          <p className="text-slate-500 text-md font-medium">Stock Ledger & FIFO Tracking</p>
        </div>
        <button
          onClick={() => setIsPurchaseModalOpen(true)}
          className="flex items-center gap-1.5 bg-slate-900 text-white text-lg font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-800 transition-colors"
        >
          <Plus size={18} /> Add Bill
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Products', value: stats.total, bg: 'bg-white', text: 'text-slate-800', border: 'border-slate-200' },
          { label: 'Low Stock', value: stats.lowStock, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
          { label: 'Out of Stock', value: stats.outStock, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
          { label: 'Short-Expiry', value: stats.nearExp, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
        ].map(({ label, value, bg, text, border }) => (
          <div key={label} className={`rounded-2xl p-3 border ${bg} ${border} text-center shadow-sm`}>
            <p className={`text-xl font-black ${text}`}>{value}</p>
            <p className={`text-sm font-bold ${text} uppercase tracking-tight`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-2 shadow-sm">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product, company..."
              className="flex-1 text-lg text-slate-800 placeholder-slate-400 bg-transparent outline-none font-medium"
            />
          </div>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="relative px-2 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm flex items-center hover:bg-slate-50"
          >
            <Filter size={20} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Toggles */}
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
          {quickFilterOptions.map(f => (
            <button
              key={f}
              onClick={() => setQuickFilter(f)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-md font-bold border transition-all shadow-sm
                ${quickFilter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Bar */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between bg-slate-200/50 rounded-xl px-3 py-2 flex-wrap gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">Filters:</span>
            {filters.companies?.length > 0 && (
              <span className="text-sm bg-white px-2 py-1 rounded-lg border border-slate-200">
                🏢 {filters.companies.join(', ')}
              </span>
            )}
            {filters.categories?.length > 0 && (
              <span className="text-sm bg-white px-2 py-1 rounded-lg border border-slate-200">
                📂 {filters.categories.join(', ')}
              </span>
            )}
            {filters.types?.length > 0 && (
              <span className="text-sm bg-white px-2 py-1 rounded-lg border border-slate-200">
                📦 {filters.types.join(', ')}
              </span>
            )}
          </div>
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-red-600 transition-colors"
          >
            <XCircle size={14} /> Clear
          </button>
        </div>
      )}

      {/* Inventory List & Pagination */}
      <div className="space-y-3 pt-2">
        {loading ? (
          <>
            <InventoryCardSkeleton />
            <InventoryCardSkeleton />
            <InventoryCardSkeleton />
            <InventoryCardSkeleton />
          </>
        ) : inventory.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Package className="mx-auto mb-3 opacity-50 text-slate-300" size={48} />
            <p className="text-sm font-bold text-slate-500">No inventory matches found.</p>
            <p className="text-sm font-medium mt-1">Adjust your filters or add a new purchase bill.</p>
          </div>
        ) : (
          /* ✨ Wrapped in an animated div keyed to the current page */
          <div className="space-y-3">
            {currentItems.map((p, index) => (
              /* ✨ Animate each card individually with a staggered delay */
              <div
                key={p._id || p.id}
                className="animate-fadeSlideUp"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <InventoryCard product={p} onEditPTR={openEditPTR} />
              </div>
            ))}
          </div>
        )}

        {/* New Pagination Control Bar */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={18} /> Prev
            </button>

            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <input
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageSubmit}
                onKeyDown={handlePageKeyDown}
                className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg py-1.5 text-base focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
              />
              <span className="text-slate-400">/</span>
              <span>{totalPages}</span>
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Animation Style */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeSlideUp {
          animation: fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* Modals */}
      <InventoryFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        setFilters={setFilters}
      />

      <EditPTRModal
        isOpen={isEditPTRModalOpen}
        onClose={() => setIsEditPTRModalOpen(false)}
        batch={editBatch}
        onSave={loadInventory}
      />

      {isPurchaseModalOpen && (
        <PurchaseEntryModal
          onClose={() => setIsPurchaseModalOpen(false)}
          companies={companies}
          onCompanyAdded={loadCompanies}
          onSave={() => {
            setIsPurchaseModalOpen(false);
            loadInventory();
          }}
        />
      )}
    </div>
  );
};

export default InventoryPage;