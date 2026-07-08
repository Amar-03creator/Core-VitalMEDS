// src/components/StatusBadge.jsx

const COLOR_MAP = {
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  orange: 'bg-orange-100 text-orange-700',
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  slate: 'bg-slate-100 text-slate-600',
  purple: 'bg-purple-100 text-purple-700',
};

const StatusBadge = ({ label, color = 'slate', size = 'sm', icon: Icon }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded ${sizeClasses} ${COLOR_MAP[color] || COLOR_MAP.slate}`}
    >
      {Icon && <Icon size={size === 'sm' ? 9 : 11} />}
      {label}
    </span>
  );
};

export default StatusBadge;