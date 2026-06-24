// // components/Admin/Layout/useBackHandler.js
// import { useEffect } from 'react';

// export const useBackHandler = (isOpen, onClose) => {
//   useEffect(() => {
//     if (!isOpen) return;
//     window.history.pushState({ drawerOpen: true }, '');
//     const handlePopState = () => onClose();
//     window.addEventListener('popstate', handlePopState);
//     return () => window.removeEventListener('popstate', handlePopState);
//   }, [isOpen, onClose]);
// };

import { useEffect } from 'react';
import { toast } from 'sonner';

// 1. Normal Back Handler (Closes the component - Keep this for SideDrawer)
export const useBackHandler = (isOpen, onClose) => {
  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ componentOpen: true }, '');
    const handlePopState = () => onClose();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, onClose]);
};

// 2. MODAL TRAP (Prevents back button - Use this for heavy Modals)
export const useModalTrap = (isOpen) => {
  useEffect(() => {
    if (!isOpen) return;

    // Push a buffer state
    window.history.pushState({ modalTrap: true }, '');

    const handlePopState = () => {
      // User pressed back. We immediately push the state again to trap them.
      window.history.pushState({ modalTrap: true }, '');
      toast.warning("Please use the 'X' or 'Cancel' button to close this form so you don't lose data.", { duration: 3000 });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Clean up the trap state when the modal is closed properly via the 'X' button
      if (window.history.state && window.history.state.modalTrap) {
        window.history.back();
      }
    };
  }, [isOpen]);
};

// 3. Scroll Lock
export const useScrollLock = (lock) => {
  useEffect(() => {
    if (lock) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = originalStyle; };
    }
  }, [lock]);
};