// PaymentsTab.jsx
import { useEffect, useState, useMemo } from 'react';
import { Plus, ChevronDown, SlidersHorizontal, Download, Printer, X as XIcon, Pencil, Trash2, Lock } from 'lucide-react';
import { MODE_EMOJI } from '../utils/constants';
import { PaymentModal } from '../modals/Receipt/PaymentModal';
import { PaymentFilterPanel } from '../modals/Receipt/PaymentFilterPanel';
import { api } from '../../../../services/api';
import { toast } from 'sonner';
import { downloadReceiptPDF, printReceiptPDF } from '../pdf/receipt';

const STORAGE_KEY = 'paymentsTabState';
const EDIT_WINDOW_DAYS = 30;

const FILTERABLE_KEYS = ['line', 'city', 'partyId', 'from', 'to'];

const isWithinEditWindow = (receipt) => {
  const refDate = new Date(receipt.paymentDate || receipt.createdAt);
  const daysSince = (Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince <= EDIT_WINDOW_DAYS;
};

export const PaymentsTab = () => {
  const load = () => { try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; } };
  const saved = load();

  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [expanded, setExpanded] = useState(saved?.expanded ?? null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [deletingReceipt, setDeletingReceipt] = useState(null);

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

  const handleDelete = async (receipt) => {
    try {
      await api.deletePaymentReceipt(receipt._id);
      toast.success('Payment deleted and ledger reversed');
      setDeletingReceipt(null);
      fetchReceipts();
    } catch (err) {
      toast.error(err.message);
    }
  };

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
              <div key={r._id}>
                <div className="w-full flex items-center gap-3 px-2 py-2">
                  <button
                    onClick={() => setExpanded(expanded === r._id ? null : r._id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-70"
                  >
                    <span className="text-2xl shrink-0">{MODE_EMOJI[r.paymentMode] || '💰'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-semibold text-md truncate">{r.clientObjectId?.establishmentName || 'Client'}</p>
                      <p className="text-slate-500 text-base">{r.paymentMode} {r.referenceNumber && `· ${r.referenceNumber}`}</p>
                    </div>
                  </button>
                  <div className="text-right shrink-0">
                    <p className="text-emerald-600 font-bold text-lg">+₹{r.totalAmountPaid.toLocaleString('en-IN')}</p>
                    <p className="text-slate-500 text-md">{r.paymentDate?.slice(0, 10)}</p>
                  </div>
                  <button onClick={() => setExpanded(expanded === r._id ? null : r._id)} className="shrink-0 ">
                    <ChevronDown size={20} className={`text-slate-400 transition-transform ${expanded === r._id ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {expanded === r._id && (
                  <div className="px-2 pb-3  bg-slate-50 border-t border-slate-100">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1 mt-2">Applied to invoices</p>
                    
                    {/* ★ FIXED: Logic handles 100% advance, 100% allocated, OR partial allocation + remaining advance! */}
                    {r.allocatedInvoices.length === 0 ? (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-lg text-slate-500">Recorded as advance</span>
                        <span className="text-xl font-semibold text-slate-800">₹{r.totalAmountPaid.toLocaleString('en-IN')}</span>
                      </div>
                    ) : (
                      <>
                        {r.allocatedInvoices.map(a => (
                          <div key={a.invoiceId} className="flex items-center justify-between py-2">
                            <span className="font-mono text-md text-slate-600">{a.invoiceNumber}</span>
                            <span className="text-lg font-semibold text-slate-800">₹{a.amountCleared.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                        {/* If money was leftover after paying invoices, show it here */}
                        {r.unallocatedAmount > 0 && (
                          <div className="flex items-center justify-between py-1 mt-1 border-t border-slate-200">
                            <span className="text-md text-slate-500 italic">Added to advance</span>
                            <span className="text-lg font-semibold text-slate-800 italic">₹{r.unallocatedAmount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-200">
                      <p className="text-base text-slate-400 font-mono">{r.receiptNumber}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadReceiptPDF(r)}
                          className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-base font-semibold px-3 py-2 rounded-xl hover:bg-slate-50"
                        >
                          <Download size={18} /> Download
                        </button>
                        <button
                          onClick={() => printReceiptPDF(r)}
                          className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-base font-semibold px-3 py-2 rounded-xl hover:bg-slate-50"
                        >
                          <Printer size={18} /> Print
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      {editable ? (
                        <>
                          <button
                            onClick={() => setEditingReceipt(r)}
                            className="flex-1 flex items-center justify-center gap-2 bg-amber-50 text-amber-700 text-base font-semibold px-3 py-2.5 rounded-xl hover:bg-amber-100"
                          >
                            <Pencil size={18} /> Edit
                          </button>
                          <button
                            onClick={() => setDeletingReceipt(r)}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-700 text-base font-semibold px-3 py-2.5 rounded-xl hover:bg-red-100"
                          >
                            <Trash2 size={18} /> Delete
                          </button>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-500 text-base font-medium px-3 py-2.5 rounded-xl">
                          <Lock size={16} /> Locked after {EDIT_WINDOW_DAYS} days
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
          onClose={() => setEditingReceipt(null)}
          onSaved={() => { setEditingReceipt(null); fetchReceipts(); }}
        />
      )}
      {deletingReceipt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-5">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-xl text-slate-900 mb-2">Delete this payment?</h3>
            <p className="text-slate-600 text-lg mb-6 leading-relaxed">
              This will reverse the ₹{deletingReceipt.totalAmountPaid.toLocaleString('en-IN')} payment from{' '}
              {deletingReceipt.clientObjectId?.establishmentName}, restoring the original invoice balances. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingReceipt(null)}
                className="flex-1 bg-slate-100 text-slate-700 font-semibold py-3.5 rounded-xl text-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingReceipt)}
                className="flex-1 bg-red-600 text-white font-bold py-3.5 rounded-xl text-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};