// src/utils/sessionStorageTTL.js

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

export const setWithTTL = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  const payload = { value, expiresAt: Date.now() + ttlMs };
  sessionStorage.setItem(key, JSON.stringify(payload));
};

export const getWithTTL = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { value, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      sessionStorage.removeItem(key);
      return null;
    }
    return value;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
};

export const clearTTL = (key) => sessionStorage.removeItem(key);