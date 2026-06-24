// utils/hooks.js
import { useEffect } from 'react';

export const useModalBackHandler = (isOpen, onClose) => {
  useEffect(() => {
    if (!isOpen) return;

    // Push a dummy state when modal opens
    window.history.pushState({ modalOpen: true }, '');

    const handlePopState = (event) => {
      // When back button is pressed, close the modal
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);
};

export const useScrollLock = (lock) => {
  useEffect(() => {
    if (lock) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = originalStyle; };
    }
  }, [lock]);
};