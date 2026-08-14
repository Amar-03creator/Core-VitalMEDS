// src/services/api/cartApi.js
import { secureFetch } from './apiCore';

async function parseErrorMessage(res, fallback) {
  try {
    const body = await res.json();
    return body?.message || fallback;
  } catch {
    return fallback;
  }
}

export const cartApi = {
  async getCart() {
    const res = await secureFetch('/cart');
    if (!res.ok) throw new Error(await parseErrorMessage(res, 'Failed to fetch cart'));
    return res.json();
  },

  async syncCart(items) {
    // Defense in depth: JSON.stringify({ items: undefined }) silently
    // drops the key, which is exactly how the server ends up seeing a
    // missing `items` field and returning 400. Coerce to [] instead —
    // CartContext already guards against this too, but this keeps the
    // API module itself safe for any other caller.
    const safeItems = Array.isArray(items) ? items : [];

    const res = await secureFetch('/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: safeItems }),
    });
    if (!res.ok) throw new Error(await parseErrorMessage(res, 'Failed to sync cart'));
    return res.json();
  },

  async clearCart() {
    const res = await secureFetch('/cart', { method: 'DELETE' });
    if (!res.ok) throw new Error(await parseErrorMessage(res, 'Failed to clear cart'));
    return res.json();
  },
};