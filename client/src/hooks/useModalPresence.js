// src/hooks/useModalPresence.js
import { useState } from 'react';
import { getWithTTL } from '../utils/sessionStorageTTL';

/**
 * Fixes the "reload wipeout" bug. Determines whether a modal should be
 * OPEN on first mount by checking for a valid, unexpired draft under `key`.
 *
 * Only meaningful for modals with a STATIC key known before the modal is
 * opened (standalone Add Company / Add Product / Add Customer / Record
 * Payment / Make Invoice). Per-entity keys (`..._client_${id}`) don't need
 * this — the user has to pick that entity again before the modal can even
 * render, so there's no "which one was open" ambiguity on cold start.
 */
export function useModalPresence(key) {
  return useState(() => getWithTTL(key) !== null);
}