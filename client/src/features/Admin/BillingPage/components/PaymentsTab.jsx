// features/Admin/BillingPage/components/PaymentsTab.jsx
import { useEffect, useState, useMemo } from 'react';
import { Plus, ChevronDown, SlidersHorizontal, Download, Printer, X as XIcon, Pencil, Trash2, Lock } from 'lucide-react';
import { MODE_EMOJI } from '../utils/constants';
import { PaymentModal } from '../../../../components/payments/PaymentModal';
import { PaymentCard } from '@/components/payments/PaymentCard';
import { PaymentFilterPanel } from '../../../../components/payments/PaymentFilterPanel';
import { api } from '../../../../services/api';
import { toast } from 'sonner';
import { downloadReceiptPDF, printReceiptPDF } from '../../../../components/payments/receipt';
import { usePaymentActions } from '@/components/payments/usePaymentActions';
import { DeletePaymentModal } from '@/components/payments/DeletePaymentModal';
import { isWithinEditWindow } from '../../../../components/payments/paymentUtils';
import { useModalPresence } from '../../../../hooks/useModalPresence';

const STORAGE_KEY = 'paymentsTabState';

const FILTERABLE_KEYS = ['line', 'city', 'partyId', 'from', 'to'];



export const PaymentsTab = () => {
  const load = () => { try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; } };
  const saved = load();

  // Replace: const [showModal, setShowModal] = useState(false);
  // With this:
  const [showModal, setShowModal] = useModalPresence('paymentModalState');
  const [showFilter, setShowFilter] = useState(false);
  const [expanded, setExpanded] = useState(saved?.expanded ?? null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [editingReceipt, setEditingReceipt] = useState(null);
  // const [deletingReceipt, setDeletingReceipt] = useState(null);

  const [filters, setFilters] = useState(saved?.filters ?? {});

  const activeFilterCount = FILTERABLE_KEYS.filter(k => filters[k]).length;

  const fetchReceipts = async (filterOverride) => {
    setLoading(true);
    try {
      const res = await api.getPaymentReceipts(filterOverride ?? filters);
      setReceipts(res.data || []);
    } catch {
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  const {
    editingReceipt,
    deletingReceipt,
    handleEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDeleteConfirm,
    handleCancelDelete,
    handleDelete,
  } = usePaymentActions({ onChanged: fetchReceipts });

  useEffect(() => {
    fetchReceipts();
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ expanded, filters }));
  }, [expanded, filters]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    fetchReceipts(newFilters);
  };

  const handleClearFilters = () => {
    const cleared = { sort: filters.sort || 'date_desc' };
    setFilters(cleared);
    fetchReceipts(cleared);
  };

  // const handleDelete = async (receipt) => {
  //   try {
  //     await api.deletePaymentReceipt(receipt._id);
  //     toast.success('Payment deleted and ledger reversed');
  //     setDeletingReceipt(null);
  //     fetchReceipts();
  //   } catch (err) {
  //     toast.error(err.message);
  //   }
  // };

  if (loading && receipts.length === 0) {
    return <div className="py-10 text-center text-slate-500 text-lg">Loading receipts…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setShowModal(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3.5 rounded-2xl text-lg">
          <Plus size={20} /> Record New Payment
        </button>
        <button
          onClick={() => setShowFilter(true)}
          className="relative shrink-0 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-3.5 rounded-2xl text-lg hover:bg-slate-50"
        >
          <SlidersHorizontal size={20} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base text-slate-400">Filtered</span>
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 bg-slate-100 text-slate-600 text-sm font-semibold px-3 py-1.5 rounded-full hover:bg-slate-200"
          >
            Clear all <XIcon size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {receipts.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-lg">No receipts match these filters</div>
        ) : (
          receipts.map(r => {
            const editable = isWithinEditWindow(r);
            return (
              <PaymentCard
                key={r._id}
                receipt={r}
                variant="billing"
                expanded={expanded === r._id}
                onToggle={(id) => setExpanded(expanded === id ? null : id)}
                onDownload={downloadReceiptPDF}
                onPrint={printReceiptPDF}
                onEdit={editable ? () => handleEdit(r) : undefined}
                onDelete={editable ? () => handleDeleteConfirm(r) : undefined}
                editable={editable}
                showActions={true}
              />
            );
          })
        )}
      </div>

      {showModal && <PaymentModal onClose={() => setShowModal(false)} onSaved={fetchReceipts} />}
      {showFilter && (
        <PaymentFilterPanel
          onClose={() => setShowFilter(false)}
          onApply={handleApplyFilters}
          initialFilters={filters}
        />
      )}
      {editingReceipt && (
        <PaymentModal
          editingReceipt={editingReceipt}
          onClose={handleCancelEdit}
          onSaved={handleSaveEdit}
        />
      )}
      {deletingReceipt && (
        <DeletePaymentModal
          receipt={deletingReceipt}
          onClose={handleCancelDelete}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};