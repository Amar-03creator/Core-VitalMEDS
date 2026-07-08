// src/features/Client/ProductsPage/utils/productHelpers.js

export const SORT_OPTIONS = ['Top Selling', 'Price: Low to High', 'Price: High to Low', 'Alphabetical'];

export const filterProducts = (products, { tab, search, filters }) => {
  return products.filter((p) => {
    if (tab === 'near-expiry' && !p.nearExpiry) return false;

    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.company.toLowerCase().includes(q) ||
      (p.compositions || []).some((c) => c.toLowerCase().includes(q));
    if (!matchesSearch) return false;

    if ((filters.companies || []).length && !filters.companies.includes(p.company)) return false;
    if ((filters.gstRates || []).length && !filters.gstRates.includes(String(p.gstRate))) return false;
    // Type/Category intentionally not applied yet — see FilterDrawer.jsx's note.

    return true;
  });
};

export const sortProducts = (products, sortBy) => {
  const copy = [...products];
  if (sortBy === 'Price: Low to High') return copy.sort((a, b) => (a.defaultRate || a.mrp) - (b.defaultRate || b.mrp));
  if (sortBy === 'Price: High to Low') return copy.sort((a, b) => (b.defaultRate || b.mrp) - (a.defaultRate || a.mrp));
  if (sortBy === 'Alphabetical') return copy.sort((a, b) => a.name.localeCompare(b.name));
  return copy.sort((a, b) => b.totalStock - a.totalStock); // "Top Selling" proxy
};

export const uniqueCompanies = (products) => [...new Set(products.map((p) => p.company).filter(Boolean))].sort();