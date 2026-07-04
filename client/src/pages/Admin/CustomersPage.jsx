// client/src/pages/Admin/CustomersPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useBackHandler } from '../../hooks/useBackHandler';
import { useCustomers } from '../../features/Admin/CustomersPage/hooks/useCustomers';
import { CustomerKPICards } from '../../features/Admin/CustomersPage/components/CustomerKPICards';
import { SearchBar } from '../../features/Admin/CustomersPage/components/SearchBar';
import { FilterDrawer } from '../../features/Admin/CustomersPage/components/FilterDrawer';
import { CustomerList } from '../../features/Admin/CustomersPage/components/CustomerList';
import { AddCustomerModal } from '../../features/Admin/CustomersPage/modals/AddCustomerModal';
import { EditCustomerModal } from '../../features/Admin/CustomersPage/modals/EditCustomerModal';
import { RejectModal } from '../../features/Admin/CustomersPage/modals/RejectModal';
import { SuspendModal } from '../../features/Admin/CustomersPage/modals/SuspendModal';
import { CustomerDetailPage } from '../../features/Admin/CustomersPage/detail/CustomerDetailPage';

const TOP_NAV_FALLBACK = 67;
const BOTTOM_NAV_FALLBACK = 80;

const useNavHeights = () => {
  const [heights, setHeights] = useState({ top: TOP_NAV_FALLBACK, bottom: BOTTOM_NAV_FALLBACK });

  useEffect(() => {
    const topEl = document.querySelector('[data-app-top-nav]');
    const bottomEl = document.querySelector('[data-app-bottom-nav]');
    if (!topEl && !bottomEl) return;

    const measure = () => {
      setHeights({
        top: topEl ? topEl.getBoundingClientRect().height : TOP_NAV_FALLBACK,
        bottom: bottomEl ? bottomEl.getBoundingClientRect().height : BOTTOM_NAV_FALLBACK,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (topEl) ro.observe(topEl);
    if (bottomEl) ro.observe(bottomEl);
    return () => ro.disconnect();
  }, []);

  return heights;
};

const STORAGE_DETAIL_ID = 'custDetailActiveId';

export const CustomersPage = () => {
  const navigate = useNavigate();

  const {
    customers, loading, error,
    search, setSearch,
    filters, pendingFilters, setPendingFilters,
    applyFilters, resetFilters, activeFilterCount,
    kpis, cityOptions, lineOptions,
    refetch,
  } = useCustomers();

  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(() => !!sessionStorage.getItem('addCustomerForm'));
  const [editClient, setEditClient] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);

  // 1. Start instantly in the correct state (No flickering, no delays)
  const [phase, setPhase] = useState(() => sessionStorage.getItem(STORAGE_DETAIL_ID) ? 'detail' : 'list');
  const [detailId, setDetailId] = useState(() => sessionStorage.getItem(STORAGE_DETAIL_ID) || null);
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [cardRect, setCardRect] = useState(null);
  const [expanded, setExpanded] = useState(() => !!sessionStorage.getItem(STORAGE_DETAIL_ID));
  const cardRefMap = useRef(new Map());

  // useEffect(() => {
  //   const savedId = sessionStorage.getItem(STORAGE_DETAIL_ID);
  //   if (savedId) {
  //     // A tiny 50ms delay ensures React Router records this as a NEW history entry
  //     // instead of swallowing it during the initial page hydration.
  //     const timer = setTimeout(() => {
  //       setDetailId(savedId);
  //       setPhase('detail');
  //       setExpanded(true); // Ensures it opens instantly without animation bugs
  //     }, 50);
  //     return () => clearTimeout(timer);
  //   }
  // }, []);



  const { top: topNavH, bottom: bottomNavH } = useNavHeights();

  useEffect(() => {
    if (detailId) sessionStorage.setItem(STORAGE_DETAIL_ID, detailId);
    else sessionStorage.removeItem(STORAGE_DETAIL_ID);
  }, [detailId]);



  useEffect(() => {
    const shouldLock = phase === 'expanding' || phase === 'collapsing';
    document.body.style.overflow = shouldLock ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [phase]);

  const openDetail = useCallback((customer) => {
    const el = cardRefMap.current.get(customer._id);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setCardRect(rect);
    setDetailId(customer._id);
    setDetailCustomer(customer);
    setExpanded(false);
    setPhase('expanding');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setExpanded(true));
    });
  }, []);

  // Triggered either by a real back-press (via the layer's onBackClose,
  // routed through the NavStack) or programmatically (e.g. after a
  // suspend confirmation). Either way, this only drives the visual
  // collapse — the history entry itself is reclaimed by the effect
  // below's cleanup, via pop(), which correctly no-ops if a real back
  // press already consumed the entry.
  // Triggered either by a real back-press or programmatically.
  // Triggered either by a real back-press or programmatically.
  const startCollapse = useCallback(() => {
    let targetRect = cardRect;

    // 1. F5 ANIMATION RECOVERY: If we lost the coordinates due to a reload,
    // grab them dynamically from the DOM right before we shrink!
    if (!targetRect && detailId) {
      const cardElement = cardRefMap.current.get(detailId);
      if (cardElement) {
        targetRect = cardElement.getBoundingClientRect();
        setCardRect(targetRect); // Inject it back into state for the CSS transition
      }
    }

    // 2. FAILSAFE: If the card still isn't in the DOM (e.g., if you have pagination 
    // and they are on a different page), gracefully fallback to instant close.
    if (!targetRect) {
      setPhase('list');
      setDetailId(null);
      setDetailCustomer(null);
      setExpanded(false);
      return;
    }

    // 3. Normal behavior: trigger the CSS shrink animation
    setExpanded(false);
    setPhase('collapsing');
  }, [cardRect, detailId]); // <-- Make sure detailId is in the dependency array!


  // We pass 'custDetail' as the static ID. 
  useBackHandler(phase === 'detail', startCollapse, 'custDetail');

  const onTransitionEnd = useCallback((e) => {
    if (e.target !== e.currentTarget) return;
    if (phase === 'expanding') {
      setPhase('detail');
    } else if (phase === 'collapsing') {
      setPhase('list');
      setDetailId(null);
      setDetailCustomer(null);
      setCardRect(null);
    }
  }, [phase]);

  const overlayStyle = (() => {
    if (expanded || !cardRect) {
      return { top: topNavH, left: 0, right: 0, bottom: bottomNavH, borderRadius: 0 };
    }
    return { top: cardRect.top, left: cardRect.left, width: cardRect.width, height: cardRect.height, borderRadius: '1rem' };
  })();

  const showOverlay = phase !== 'list';

  const handleApprove = async (customer) => {
    try {
      await api.approveClient(customer._id);
      toast.success(`${customer.establishmentName} approved`);
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  const handleRejectConfirm = async (customer, reason) => {
    try {
      await api.rejectClient(customer._id, reason);
      toast.success(`${customer.establishmentName} rejected`);
      setRejectTarget(null);
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  const handleSuspendConfirm = async (customer) => {
    try {
      await api.updateClientStatus(customer._id, 'Suspended');
      toast.success(`${customer.establishmentName} suspended`);
      setSuspendTarget(null);
      startCollapse();
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="relative">
      <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto pb-24" style={{ pointerEvents: showOverlay ? 'none' : 'auto' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-900 text-2xl font-bold">Customers</h1>
            <p className="text-slate-500 text-base mt-0.5">
              {loading ? '…' : `${customers.length} registered pharmacies`}
            </p>
          </div>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 bg-slate-900 text-white text-base font-semibold px-4 py-2.5 rounded-xl">
            <Plus size={16} /> Add
          </button>
        </div>

        <CustomerKPICards kpis={kpis} />
        <SearchBar 
        search={search} 
        onSearchChange={setSearch} 
        onFilterOpen={() => setFilterOpen(true)} activeFilterCount={activeFilterCount} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-base">{error}</p>
            <button onClick={refetch} className="text-red-500 text-base underline mt-1">Retry</button>
          </div>
        )}

        <CustomerList
          customers={customers}
          loading={loading}
          onViewDetail={openDetail}
          onApprove={handleApprove}
          onReject={(c) => setRejectTarget(c)}
          cardRefMap={cardRefMap}
          animatingId={detailId}
        />
      </div>

      {showOverlay && detailId && (
        <div
          className="fixed overflow-hidden bg-white shadow-2xl z-[55]"
          style={{
            ...overlayStyle,
            transition: (phase === 'expanding' || phase === 'collapsing')
              ? ['top 420ms cubic-bezier(0.4,0,0.2,1)', 'left 420ms cubic-bezier(0.4,0,0.2,1)', 'right 420ms cubic-bezier(0.4,0,0.2,1)', 'bottom 420ms cubic-bezier(0.4,0,0.2,1)', 'width 420ms cubic-bezier(0.4,0,0.2,1)', 'height 420ms cubic-bezier(0.4,0,0.2,1)', 'border-radius 420ms cubic-bezier(0.4,0,0.2,1)'].join(', ')
              : 'none',
          }}
          onTransitionEnd={onTransitionEnd}
        >
          <CustomerDetailPage
            clientId={detailId}
            customer={detailCustomer}
            // ✨ Pure and clean: Handles Suspend/Reactivate UI updates and animation closures
            onListChange={() => {
              startCollapse();
              refetch();
            }}
          />
        </div>
      )}

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        pendingFilters={pendingFilters}
        setPendingFilters={setPendingFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        cityOptions={cityOptions}
        lineOptions={lineOptions}
      />

      {addOpen && <AddCustomerModal onClose={() => setAddOpen(false)} onSave={refetch} />}
      {editClient && <EditCustomerModal client={editClient} onClose={() => setEditClient(null)} onSaved={() => { setEditClient(null); refetch(); }} />}
      {rejectTarget && <RejectModal customer={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={handleRejectConfirm} />}
      {suspendTarget && <SuspendModal customer={suspendTarget} onClose={() => setSuspendTarget(null)} onConfirm={handleSuspendConfirm} />}
    </div>
  );
};

export default CustomersPage;