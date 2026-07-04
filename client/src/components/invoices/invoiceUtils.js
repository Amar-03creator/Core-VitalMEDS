// invoiceUtils.js – shared formatting helpers
export const formatCurrency = (val) => {
  const n = Number(val);
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

export const toIndianDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${dt.getFullYear()}`;
};

export const formatDateFromISO = (isoStr) => {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};