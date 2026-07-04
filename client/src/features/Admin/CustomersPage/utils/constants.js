// customers/utils/constants.js

export const STATUS_CFG = {
  Active:         { pill: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  Pending:        { pill: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400'   },
  'Credit Alert': { pill: 'bg-red-100 text-red-700',         dot: 'bg-red-500'     },
  Suspended:      { pill: 'bg-slate-100 text-slate-500',     dot: 'bg-slate-400'   },
  Static:         { pill: 'bg-slate-100 text-slate-500',     dot: 'bg-slate-300'   },
};

export const TIER_CFG = {
  Diamond:  { cls: 'bg-cyan-50 text-cyan-700 border border-cyan-200',     icon: '💎' },
  Platinum: { cls: 'bg-slate-100 text-slate-600 border border-slate-300', icon: '🪙' },
  Gold:     { cls: 'bg-amber-50 text-amber-700 border border-amber-200',  icon: '🥇' },
  Silver:   { cls: 'bg-gray-100 text-gray-500 border border-gray-200',    icon: '🥈' },
};

export const RISK_CFG = {
  Green:  { bar: 'bg-emerald-500', text: 'text-emerald-600', dot: '🟢' },
  Yellow: { bar: 'bg-amber-400',   text: 'text-amber-600',   dot: '🟡' },
  Red:    { bar: 'bg-red-500',     text: 'text-red-600',     dot: '🔴' },
};

export const SCORE_COLOR = (score) => {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
};

// Filter shape — arrays for multi-select, 'All' strings for single-select
export const INITIAL_FILTER_STATE = {
  status:       [],       // multi-select strings
  businessType: [],       // multi-select strings
  tier:         [],       // multi-select strings
  scoreRange:   'All',    // single-select string
  riskTier:     [],       // multi-select strings
  cities:       [],       // multi-select strings
  lines:        [],       // multi-select strings
};

// Options lists (the 'All' variant is handled internally by FilterDrawer)
export const STATUS_OPTIONS    = ['All', 'Active', 'Pending', 'Credit Alert', 'Static', 'Suspended'];
export const TYPE_OPTIONS      = ['All', 'Retail', 'Hospital', 'Clinic'];
export const TIER_OPTIONS      = ['Diamond', 'Platinum', 'Gold', 'Silver'];
export const SCORE_OPTIONS     = ['All', '0–25', '26–50', '51–75', '76–100'];
export const RISK_OPTIONS      = ['Green', 'Yellow', 'Red'];
