import { useRef, useEffect } from 'react';

export const useMandatoryField = () => {
  const ref = useRef(null);
  const lockRef = useRef(false);

  const lock = () => { lockRef.current = true; ref.current?.focus(); };
  const unlock = () => { lockRef.current = false; };

  useEffect(() => {
    const interval = setInterval(() => {
      if (lockRef.current && document.activeElement !== ref.current) {
        ref.current?.focus();
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const onBlur = (e) => {
    if (!e.target.value.trim()) {
      lock();
    } else {
      unlock();
    }
  };

  return { ref, onBlur, lock, unlock };
};