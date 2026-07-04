// src/hooks/usePersistentModal.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { getWithTTL, setWithTTL, clearTTL } from '../utils/sessionStorageTTL';
import { useModalTrap, useScrollLock } from './useBackHandler';

/**
 * Universal modal state hook — combines storage, the back-button trap, and
 * scroll lock into one call so every modal gets identical guarantees.
 *
 * WHY WHOLE-OBJECT STORAGE: the entire form state is persisted as ONE JSON
 * blob, not field-by-field. A selected client/company/product is stored
 * and restored as a complete object — never re-derived by re-fetching a
 * list and matching an ID after the fact. That re-derivation step is what
 * caused the "Party Name" bug: it depended on network timing and on a
 * `saved` reference that could go stale between renders.
 *
 * WHY skipPersist EXISTS: editing an existing record (editingReceipt,
 * productToEdit, etc.) should never write a draft to the SAME storage key
 * used for "create new" — otherwise an in-progress edit can clobber, or be
 * clobbered by, an unrelated create-mode draft in the same session.
 *
 * hardClose() vs softClose(): only hardClose() clears storage. softClose()
 * (wired automatically as the back-trap's second-press handler) hides the
 * modal but deliberately leaves storage intact — that's what makes an F5
 * reload or a later reopen come back with data.
 */
export function usePersistentModal({
  key,
  initialState,
  isOpen = true,
  onClose,
  skipPersist = false,
  disableBackTrap = false,
  ttlMs,
  lockScroll = true,
  warningMessage,
}) {
  const wasRestoredRef = useRef(false);

  const [state, setState] = useState(() => {
    if (skipPersist) return initialState;
    const restored = getWithTTL(key);
    if (restored) {
      wasRestoredRef.current = true;
      // Shallow-merge over defaults so a field added to initialState after
      // a code change doesn't come back `undefined` for an old draft.
      return { ...initialState, ...restored };
    }
    return initialState;
  });

  useEffect(() => {
    if (skipPersist) return;
    setWithTTL(key, state, ttlMs);
  }, [key, state, skipPersist, ttlMs]);

  const patch = useCallback((partial) => {
    setState(prev => ({
      ...prev,
      ...(typeof partial === 'function' ? partial(prev) : partial),
    }));
  }, []);

  const clear = useCallback(() => clearTTL(key), [key]);

  // X button / successful save — the two conditions that must wipe storage.
  const hardClose = useCallback(() => {
    clear();
    onClose?.();
  }, [clear, onClose]);

  // Back button, second press — hide the modal, KEEP the draft.
  const softClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useModalTrap(isOpen, { disabled: disableBackTrap, onBackClose: softClose, warningMessage });
  useScrollLock(lockScroll && isOpen);

  return { state, setState, patch, clear, hardClose, softClose, wasRestored: wasRestoredRef.current };
}