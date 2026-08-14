import { useEffect } from 'react';

export const useGridNavigation = (containerRef, selector = '.nav-input') => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      
      // Only run if the currently focused element has our special class
      if (!activeEl || !activeEl.matches(selector)) return;
      if (activeEl.tagName === 'TEXTAREA') return;

      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];
      if (!keys.includes(e.key)) return;

      // UX FIX: Let users use Left/Right arrows to edit their text!
      if (activeEl.tagName === 'INPUT') {
        if (activeEl.type === 'text' || activeEl.type === 'number') {
          // Only jump to the next field if the cursor is at the extreme edge of the text.
          if (e.key === 'ArrowLeft' && activeEl.selectionStart > 0) return;
          if (e.key === 'ArrowRight' && activeEl.selectionEnd < activeEl.value.length) return;
        }
        
        // ✨ NEW: Allow native date segment navigation (day <-> month <-> year)
        if (activeEl.type === 'date') {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') return;
        }
      }

      e.preventDefault(); 
      const elements = Array.from(container.querySelectorAll(selector));
      const currentIndex = elements.indexOf(activeEl);
      const currentRect = activeEl.getBoundingClientRect();

      let targetEl = null;

      // Left / Right / Enter just go to the next/prev logical field in the DOM
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        targetEl = elements[currentIndex + 1];
      } else if (e.key === 'ArrowLeft') {
        targetEl = elements[currentIndex - 1];
      } 
      // Up / Down uses SPATIAL tracking to find the input physically above/below it!
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        let bestDist = Infinity;
        
        elements.forEach((el, i) => {
          if (i === currentIndex) return;
          const rect = el.getBoundingClientRect();
          
          // Check if this element is roughly in the same vertical column
          const isSameColumn = Math.abs(rect.left - currentRect.left) < 50; 

          if (isSameColumn) {
            if (e.key === 'ArrowDown' && rect.top > currentRect.bottom - 10) {
              const dist = rect.top - currentRect.bottom;
              if (dist < bestDist) { bestDist = dist; targetEl = el; }
            } else if (e.key === 'ArrowUp' && rect.bottom < currentRect.top + 10) {
              const dist = currentRect.top - rect.bottom;
              if (dist < bestDist) { bestDist = dist; targetEl = el; }
            }
          }
        });
      }

      if (targetEl) {
        targetEl.focus();
        // Automatically select the text so they can overwrite it instantly (Tally style!)
        if (targetEl.tagName === 'INPUT' && targetEl.type !== 'date') {
          setTimeout(() => targetEl.select(), 10);
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, selector]);
};