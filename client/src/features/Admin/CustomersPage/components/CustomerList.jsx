import { Users } from 'lucide-react';
import { CustomerCard } from './CustomerCard';

const Skeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse space-y-3">
    <div className="flex gap-3">
      <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 bg-slate-100 rounded w-2/3" />
        <div className="h-3.5 bg-slate-100 rounded w-1/3" />
        <div className="h-6 bg-slate-100 rounded w-1/4 mt-1" />
      </div>
    </div>
  </div>
);

export const CustomerList = ({
  customers,
  loading,
  onViewDetail,
  onApprove,
  onReject,
  cardRefMap,
  animatingId,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} />)}
      </div>
    );
  }

  if (!customers.length) {
    return (
      <div className="text-center py-20 text-slate-400">
        <Users size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-base font-medium">No customers found</p>
        <p className="text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {customers.map(c => (
        <CustomerCard
          key={c._id || c.clientId}
          customer={c}
          onViewDetail={onViewDetail}
          onApprove={onApprove}
          onReject={onReject}
          cardRefCallback={(node) => {
            if (node) cardRefMap.current.set(c._id, node);
            else cardRefMap.current.delete(c._id);
          }}
          invisible={animatingId === c._id}
        />
      ))}
    </div>
  );
};