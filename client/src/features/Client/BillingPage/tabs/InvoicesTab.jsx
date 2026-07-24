// src/features/Client/BillingPage/tabs/InvoicesTab.jsx
import { useState } from 'react';
import { FileText } from 'lucide-react';
import { InvoiceDetailModal } from '../../../../components/invoices/InvoiceDetailModal';
import { InvoiceCard } from '../../../../components/invoices/InvoiceCard';
import { useClientInvoices } from '../hooks/useClientInvoices';

const Skeleton = () => (
  <div className="animate-pulse space-y-3 mt-2">
    {[1, 2, 3].map((i) => (
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

// Same normalisation as the admin InvoicesTab, adapted to a single
// logged-in client rather than a per-invoice client lookup.
const normalise = (inv, clientName, clientAddress) => {
  const dateStr = inv.invoiceDate?.split('T')[0] || '';
  const dueDate = inv.dueDate
    ? new Date(inv.dueDate)
    : new Date(dateStr).getTime() ? new Date(new Date(dateStr).getTime() + 21 * 86400000) : null;
  const dueDateStr = dueDate?.toISOString().split('T')[0] || '';

  const overdue = (inv.paymentStatus !== 'PAID' && dueDate)
    ? Math.max(0, Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    id: inv.invoiceNumber,
    client: inv.clientName || clientName || 'You',
    area: inv.clientBillingAddress || clientAddress || '',
    items: inv.items?.length || 0,
    amount: Number(inv.netAmount || inv.totalPayable || 0),
    due: Number(inv.dueAmount || 0),
    date: dateStr,
    status: inv.paymentStatus || inv.status || 'UNPAID',
    overdueDays: overdue,
    billType: inv.billType || 'Credit',

    invoiceNumber: inv.invoiceNumber,
    clientName: inv.clientName || clientName,
    clientBillingAddress: inv.clientBillingAddress || clientAddress || '',
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
  };
};

const InvoicesTab = ({ client }) => {
  const { invoices, loading, error, refetch } = useClientInvoices(client?._id);
  const [selected, setSelected] = useState(null);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-base sm:text-lg">{error}</p>
        <button onClick={refetch} className="text-slate-500 text-sm sm:text-base underline mt-2">Retry</button>
      </div>
    );
  }

  const sorted = [...invoices].sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate));
  const normalisedInvoices = sorted.map((inv) => normalise(inv, client?.establishmentName, client?.billingAddress));

  return (
    <>
      <p className="text-base sm:text-lg font-semibold text-slate-700 mb-4">
        {sorted.length} invoice{sorted.length !== 1 ? 's' : ''}
      </p>

      {normalisedInvoices.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <FileText size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-base sm:text-lg font-medium">No invoices yet</p>
        </div>
      ) : (
        <div className="space-y-3 pb-20">
          {normalisedInvoices.map((inv) => (
            <InvoiceCard key={inv.id} invoice={inv} onClick={() => setSelected(inv)} showClientName={false} />
          ))}
        </div>
      )}

      {selected && <InvoiceDetailModal invoice={selected} onClose={() => setSelected(null)} />}
    </>
  );
};

export default InvoicesTab;