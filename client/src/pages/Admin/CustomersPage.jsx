// client/src/pages/Admin/CustomersPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(() => !!sessionStorage.getItem('addCustomerForm'));
  const [editClient, setEditClient] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState(() => sessionStorage.getItem(STORAGE_DETAIL_ID) || null);
  const [initialCustomer, setInitialCustomer] = useState(null);

  useEffect(() => {
    if (selectedCustomerId) sessionStorage.setItem(STORAGE_DETAIL_ID, selectedCustomerId);
    else sessionStorage.removeItem(STORAGE_DETAIL_ID);
  }, [selectedCustomerId]);

  // ✨ FIX 1: Restored your old body-scroll lock so the background doesn't move when detail is open
  useEffect(() => {
    document.body.style.overflow = selectedCustomerId ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedCustomerId]);

  const closeDetail = useCallback(() => {
    setSelectedCustomerId(null);
    setInitialCustomer(null);
  }, []);

  useBackHandler(
    !!selectedCustomerId,
    closeDetail,
    'custDetailView'
  );

  const handleApprove = async (customer) => {
    try {
      await api.approveClient(customer._id);
      toast.success(`Successfully approved ${customer.establishmentName}! Credentials emailed.`);
      if (selectedCustomerId === customer._id) closeDetail();
      refetch();
    } catch (error) {
      toast.error(error.message || 'Failed to approve customer.');
    }
  };

  const handleRejectConfirm = async (customer, reason) => {
    try {
      await api.rejectClient(customer._id, reason);
      toast.success(`${customer.establishmentName} rejected`);
      setRejectTarget(null);
      if (selectedCustomerId === customer._id) closeDetail();
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSuspendConfirm = async (customer) => {
    try {
      await api.updateClientStatus(customer._id, 'Suspended');
      toast.success(`${customer.establishmentName} suspended`);
      setSuspendTarget(null);
      if (selectedCustomerId === customer._id) closeDetail();
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50">
      
      {/* ✨ FIX 2: The List is ALWAYS rendered now, preserving scroll state perfectly. 
          Pointer events are disabled when the detail page is covering it. */}
      <div 
        className="px-4 py-5 space-y-4 max-w-2xl mx-auto pb-24"
        style={{ pointerEvents: selectedCustomerId ? 'none' : 'auto' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-900 text-3xl font-black tracking-tight">Customers</h1>
            <p className="text-slate-500 text-base font-medium">
              {loading ? '…' : `${customers.length} registered pharmacies`}
            </p>
          </div>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 bg-slate-900 text-white text-base font-semibold px-4 py-2.5 rounded-xl transition-transform active:scale-95 shadow-sm">
            <Plus size={16} /> Add
          </button>
        </div>

        <CustomerKPICards kpis={kpis} />
        <SearchBar 
          search={search} 
          onSearchChange={setSearch} 
          onFilterOpen={() => setFilterOpen(true)} 
          activeFilterCount={activeFilterCount} 
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-base">{error}</p>
            <button onClick={refetch} className="text-red-500 text-base underline mt-1">Retry</button>
          </div>
        )}

        <CustomerList
          customers={customers}
          loading={loading}
          selectedId={selectedCustomerId}
          onViewDetail={(c) => {
            setInitialCustomer(c);
            setSelectedCustomerId(c._id);
          }}
          onApprove={handleApprove}
          onReject={(c) => setRejectTarget(c)}
        />
      </div>

      {/* ✨ Detail Page renders visually ON TOP of the list */}
      <AnimatePresence>
        {selectedCustomerId && (
          <CustomerDetailPage
            key="detail"
            clientId={selectedCustomerId}
            initialCustomer={initialCustomer}
            onApprove={handleApprove}
            onReject={(c) => setRejectTarget(c)}
            onListChange={() => {
              closeDetail();
              refetch();
            }}
          />
        )}
      </AnimatePresence>

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