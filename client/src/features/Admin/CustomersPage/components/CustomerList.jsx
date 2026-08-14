import { CustomerCard } from './CustomerCard';

export const CustomerList = ({ 
  customers, 
  loading, 
  selectedId,
  onViewDetail, 
  onApprove, 
  onReject 
}) => {
  
  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 font-medium">
        Loading customers...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="py-20 text-center text-slate-500 font-medium bg-white rounded-2xl border border-slate-200">
        No customers match your filters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {customers.map((customer, index) => (
        <CustomerCard
          key={customer._id}
          customer={customer}
          index={index} 
          invisible={selectedId === customer._id}
          onViewDetail={onViewDetail}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
};