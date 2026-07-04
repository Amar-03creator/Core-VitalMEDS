// src/features/Admin/CustomersPage/detail/tabs/InvoicesTab.jsx
import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { InvoiceDetailModal } from '../../../../../components/invoices/InvoiceDetailModal';
import { MakeInvoiceModal } from '../../../../../modals/MakeInvoiceModal/index';  // alias
import { InvoiceCard } from '@/components/invoices/InvoiceCard';
import { toast } from 'sonner';

const Skeleton = () => (
  <div className="animate-pulse space-y-3 mt-2">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between">
        <div className="space-y-2.5 flex-1">
          <div className="h-4 bg-slate-100 rounded w-36" />
          <div className="h-3.5 bg-slate-100 rounded w-24" />
          <div className="h-3 bg-slate-100 rounded w-40" />
        </div>
        <div className="space-y-2.5 text-right ml-4">
          <div className="h-5 bg-slate-100 rounded w-20" />
          <div className="h-6 bg-slate-100 rounded w-16 ml-auto" />
        </div>
      </div>
    ))}
  </div>
);

export const InvoicesTab = ({ invoices, client, onInvoiceCreated, isSuspended }) => {
  const [selected, setSelected] = useState(null);
  const [makeInvoice, setMakeInvoice] = useState(false);
  console.log('MakeInvoiceModal is', MakeInvoiceModal);

  if (!invoices) return <Skeleton />;

  const sorted = [...invoices].sort(
    (a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate)
  );

  /**
   * Normalise a raw invoice into a shape compatible with
   * - InvoiceCard (needs id, client, area, items, amount, due, date, status, overdueDays, billType)
   * - InvoiceDetailModal (needs all the above + original fields like invoiceNumber, clientName, items, etc.)
   */
  const normalise = (inv) => {
    const dateStr = inv.invoiceDate?.split('T')[0] || '';
    const dueDate = inv.dueDate
      ? new Date(inv.dueDate)
      : new Date(dateStr).getTime() ? new Date(new Date(dateStr).getTime() + 21 * 86400000) : null;
    const dueDateStr = dueDate?.toISOString().split('T')[0] || '';

    const overdue = (inv.paymentStatus !== 'PAID' && dueDate)
      ? Math.max(0, Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      // For InvoiceCard
      id: inv.invoiceNumber,
      client: inv.clientName || client?.name || 'Unknown',
      area: inv.clientBillingAddress || client?.billingAddress || '',
      items: inv.items?.length || 0,
      amount: Number(inv.netAmount || inv.totalPayable || 0),
      due: Number(inv.dueAmount || 0),
      date: dateStr,
      status: inv.paymentStatus || inv.status || 'UNPAID',   // 👈 modal uses .status
      overdueDays: overdue,
      billType: inv.billType || 'Credit',

      // Extra fields needed by InvoiceDetailModal
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.clientName || client?.name,
      clientBillingAddress: inv.clientBillingAddress || '',
      invoiceDate: inv.invoiceDate,
      dueDate: dueDateStr,
      paymentStatus: inv.paymentStatus,
      netAmount: inv.netAmount,
      dueAmount: inv.dueAmount,
      globalDiscountAmount: inv.globalDiscountAmount || 0,
      globalDiscountPercent: inv.globalDiscountPercent || 0,
      items: inv.items || [],
      clientGSTIN: inv.clientGSTIN || '',
      clientDrugLicense: inv.clientDrugLicense || '',
      previousOutstanding: inv.previousOutstanding || 0,
      previousOutstandingDate: inv.previousOutstandingDate || null,
      // add any other fields the modal might use from the raw invoice
    };
  };

  const normalisedInvoices = sorted.map(normalise);

  if (!MakeInvoiceModal) {
    console.error('MakeInvoiceModal is undefined – check the import path!');
  }

  console.log('Rendering InvoicesTab — makeInvoice:', makeInvoice, 'client:', client);
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-semibold text-slate-700">
          {sorted.length} invoice{sorted.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => {
            if (isSuspended) return toast.error("Cannot create invoices for a suspended account.");
            setMakeInvoice(true);
          }}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors ${
            isSuspended ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <Plus size={15} /> New Invoice
        </button>
      </div>

      {normalisedInvoices.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <FileText size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-base font-medium">No invoices yet</p>
          <p className="text-sm mt-1">Tap &quot;New Invoice&quot; to create the first one</p>
        </div>
      ) : (
        <div className="space-y-3 pb-20">
          {normalisedInvoices.map((inv) => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              onClick={() => setSelected(inv)}   // pass the normalised object directly
              showClientName={false}  // already showing client name in the tab header
            />
          ))}
        </div>
      )}

      {/* Detail Modal – now receives a fully normalised object */}
      {selected && (
        <InvoiceDetailModal
          invoice={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Make Invoice Modal */}
      {makeInvoice && client && (
        <MakeInvoiceModal
          prefillClient={client}
          lockClient={true}
          onClose={() => setMakeInvoice(false)}
          onSaved={() => { setMakeInvoice(false); onInvoiceCreated?.(); }}
        />
      )}
    </>
  );
};