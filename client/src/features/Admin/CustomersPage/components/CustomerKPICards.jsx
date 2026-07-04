// customers/components/CustomerKPICards.jsx
export const CustomerKPICards = ({ kpis }) => {
  const cards = [
    { value: kpis.active,      label: 'Active customers',  valueClass: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { value: `₹${(kpis.outstanding/1000).toFixed(0)}K`, label: 'Total outstanding', valueClass: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
    { value: kpis.pending,     label: 'Pending approval',  valueClass: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
    { value: kpis.concerned,   label: 'Concerned parties', valueClass: 'text-slate-700',   bg: 'bg-slate-50 border-slate-200' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(({ value, label, valueClass, bg }) => (
        <div key={label} className={`rounded-2xl border p-4 ${bg}`}>
          <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
          <p className="text-sm font-medium mt-1 text-slate-500">{label}</p>
        </div>
      ))}
    </div>
  );
};
