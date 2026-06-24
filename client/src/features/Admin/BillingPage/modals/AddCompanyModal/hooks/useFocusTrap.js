import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useFocusTrap
 * Keeps focus physically locked on `trapElement` while the trap is active.
 * The trap is released only when the error for that field is cleared.
 *
 * engageTrap(element)  – lock focus on element
 * releaseTrap()        – free focus
 * isActive             – boolean; used to render a click-blocking overlay
 */
export const useFocusTrap = (errors, formRef) => {
  const [trapElement, setTrapElement] = useState(null);
  const trapActive = useRef(false);
  const [isActive, setIsActive] = useState(false);

  const engageTrap = useCallback((element) => {
    trapActive.current = true;
    setTrapElement(element);
    setIsActive(true);
    // Focus immediately so the user sees the cursor land back
    setTimeout(() => element?.focus(), 0);
  }, []);

  const releaseTrap = useCallback(() => {
    trapActive.current = false;
    setTrapElement(null);
    setIsActive(false);
  }, []);

  // Keep focus physically on the trapped element every 50 ms
  useEffect(() => {
    if (!trapElement) return;
    const interval = setInterval(() => {
      if (trapActive.current && document.activeElement !== trapElement) {
        trapElement.focus();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [trapElement]);

  // Auto-release when the error for the trapped field is cleared
  useEffect(() => {
    if (!trapElement) return;
    const fieldName = trapElement.name || trapElement.dataset?.name;
    if (fieldName && !errors[fieldName]) {
      releaseTrap();
    }
  }, [errors, trapElement, releaseTrap]);

  return { engageTrap, releaseTrap, isActive };
};