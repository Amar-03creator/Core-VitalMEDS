// components/Admin/Layout/useBackHandler.js
import { useEffect } from 'react';

export const useBackHandler = (isOpen, onClose) => {
  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ drawerOpen: true }, '');
    const handlePopState = () => onClose();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, onClose]);
};