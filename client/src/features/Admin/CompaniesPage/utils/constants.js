// features/Admin/CompaniesPage/utils/constants.js

export const PURCHASE_BILL_STATUS_CFG = {
  UNPAID:          { pill: 'bg-red-100 text-red-700', label: 'Unpaid' },
  PARTIALLY_PAID:  { pill: 'bg-amber-100 text-amber-700', label: 'Partially Paid' },
  PAID:            { pill: 'bg-emerald-100 text-emerald-700', label: 'Paid' },
  ON_HOLD:         { pill: 'bg-slate-100 text-slate-600', label: 'On Hold' },
  DISPUTED:        { pill: 'bg-purple-100 text-purple-700', label: 'Disputed' },
};

export const DEBIT_NOTE_STATUS_CFG = {
  'Pending Adjustment': { pill: 'bg-amber-100 text-amber-700', label: 'Pending Adjustment' },
  Adjusted:              { pill: 'bg-emerald-100 text-emerald-700', label: 'Adjusted' },
};

export const DEBIT_NOTE_REASONS = ['Expired', 'Damaged', 'Wrong Item', 'Other'];

export const REPLENISH_STRATEGIES = [
  'Last 30 Days Velocity',
  'Last 60 Days Velocity',
  'Last 90 Days Velocity',
  'Upcoming Season Average',
];

export const REPLENISH_PRIORITY_CFG = {
  Critical: 'bg-red-100 text-red-700',
  High:     'bg-amber-100 text-amber-700',
  Normal:   'bg-slate-100 text-slate-600',
};

export const PURCHASE_BILL_SORT_OPTIONS = [
  { value: 'newest',         label: 'Newest First' },
  { value: 'highest',        label: 'Highest Due Amount' },
  { value: 'oldest_overdue', label: 'Oldest Overdue' },
];

export const COMPANY_DETAIL_TABS = [
  { key: 'profile',       label: 'Profile' },
  { key: 'bills',         label: 'Purchase Bills' },
  { key: 'debitNotes',    label: 'Debit Notes' },
  { key: 'replenishment', label: 'Replenish' },
];