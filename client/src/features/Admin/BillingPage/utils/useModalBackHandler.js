import { useModalTrap, useScrollLock } from '../../../../hooks/useBackHandler';

export const useModalBackHandler = (isOpen, onClose, options = {}) => {
  useModalTrap(isOpen, { ...options, onBackClose: onClose });
};

export { useModalTrap, useScrollLock };