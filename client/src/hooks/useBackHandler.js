// src/hooks/useBackHandler.js
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useBackHandler = (isOpen, onClose, customId = null) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use a static ID if provided so it survives F5 reloads
  const trapKey = useRef(customId ? `dismiss_${customId}` : `dismiss_${Math.random().toString(36).substring(7)}`).current;
  const isDismissableOpen = location.state?.[trapKey] === true;
  
  // HYDRATION: If reloaded, instantly start TRAPPED. No double-pushing!
  const status = useRef(isOpen && isDismissableOpen ? 'TRAPPED' : 'IDLE');

  useEffect(() => {
    if (!isOpen) {
      if (status.current === 'TRAPPED' && isDismissableOpen) {
        status.current = 'IDLE';
        navigate(-1);
      }
      return;
    }

    if (status.current === 'IDLE' && !isDismissableOpen) {
      status.current = 'PUSHING';
      navigate(location.pathname + location.search, {
        state: { ...location.state, [trapKey]: true },
        replace: false 
      });
      return;
    }

    if (status.current === 'PUSHING' && isDismissableOpen) {
      status.current = 'TRAPPED';
      return;
    }

    if (status.current === 'TRAPPED' && !isDismissableOpen) {
      status.current = 'IDLE';
      onClose();
    }
  }, [isOpen, isDismissableOpen, navigate, location, onClose, trapKey]);
};

export const useModalTrap = (isOpen, options = {}) => {
  const { disabled = false, onBackClose, warningMessage = "Press back again to close", customId = null } = options;
  const navigate = useNavigate();
  const location = useLocation();

  const trapKey = useRef(customId ? `trap_${customId}` : `trap_${Math.random().toString(36).substring(7)}`).current;
  const trapLevel = location.state?.[trapKey] || 0;

  // HYDRATION: Instantly start TRAPPED_2 if recovering from a reload
  const status = useRef(isOpen && !disabled && trapLevel === 2 ? 'TRAPPED_2' : 'IDLE');
  const timer = useRef(null);

  useEffect(() => {
    if (!isOpen || disabled) {
      if (status.current === 'TRAPPED_2' && trapLevel === 2) {
        status.current = 'IDLE';
        navigate(-2); 
      } else if (status.current === 'TRAPPED_1' && trapLevel === 1) {
        status.current = 'IDLE';
        navigate(-1);
      } else if (status.current === 'PUSHING_2' && trapLevel === 1) {
         status.current = 'IDLE';
         navigate(-1);
      }
      return;
    }

    if (status.current === 'IDLE' && trapLevel === 0) {
      status.current = 'PUSHING_1';
      navigate(location.pathname + location.search, {
        state: { ...location.state, [trapKey]: 1 },
        replace: false
      });
      return;
    }

    if (status.current === 'PUSHING_1' && trapLevel === 1) {
      status.current = 'PUSHING_2';
      navigate(location.pathname + location.search, {
        state: { ...location.state, [trapKey]: 2 },
        replace: false
      });
      return;
    }

    if (status.current === 'PUSHING_2' && trapLevel === 2) {
      status.current = 'TRAPPED_2';
      return;
    }

    if (status.current === 'TRAPPED_2' && trapLevel === 1) {
      status.current = 'TRAPPED_1';
      toast.info(warningMessage);
      timer.current = setTimeout(() => {
        if (status.current === 'TRAPPED_1') {
            status.current = 'PUSHING_2';
            navigate(location.pathname + location.search, {
              state: { ...location.state, [trapKey]: 2 },
              replace: false
            });
        }
      }, 2000);
      return;
    }

    if ((status.current === 'TRAPPED_2' || status.current === 'TRAPPED_1') && trapLevel === 0) {
      clearTimeout(timer.current);
      status.current = 'IDLE';
      if (onBackClose) onBackClose();
      return;
    }
  }, [isOpen, disabled, trapLevel, navigate, location, onBackClose, warningMessage, trapKey]);
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