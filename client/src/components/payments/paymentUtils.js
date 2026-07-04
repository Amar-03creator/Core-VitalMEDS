// existing helpers
export const toIndianDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${dt.getFullYear()}`;
};

export const formatCurrency = (val) => {
  const n = Number(val);
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

// ── New: edit‑window logic ────────────────────────────────────
export const EDIT_WINDOW_DAYS = 30;

export const isWithinEditWindow = (receipt) => {
  const refDate = new Date(receipt.paymentDate || receipt.createdAt);
  const daysSince = (Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince <= EDIT_WINDOW_DAYS;
};