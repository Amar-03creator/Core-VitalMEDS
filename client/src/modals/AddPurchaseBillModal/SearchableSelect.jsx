import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const SearchableSelect = ({ value, onChange, options, onSelect, onClear, placeholder, show, setShow }) => {
  const inputRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const updatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom, left: rect.left, width: rect.width });
    }
  }, []);

  useLayoutEffect(() => {
    if (show) updatePosition();
  }, [show, updatePosition]);

  // Update position on scroll / resize while dropdown is open
  useEffect(() => {
    if (!show) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [show, updatePosition]);

  const handleFocus = () => {
    updatePosition();
    setShow(true);
  };

  // Close on blur after a small delay (to allow click on item)
  const handleBlur = () => {
    setTimeout(() => setShow(false), 150);
  };

  const handleSelect = (item) => {
    onSelect(item);
    setShow(false);
  };

  const handleClear = () => {
    onClear();
    setShow(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value === '') {
              handleClear();
            } else {
              setShow(true);
            }
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
        />
        {value && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <X size={16} />
          </button>
        )}
      </div>
      {show && options.length > 0 && createPortal(
        <div
          className="fixed z-[100] bg-white border border-slate-200 rounded-xl shadow-lg max-h-44 overflow-y-auto"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          {options.map((opt) => (
            <button
              key={opt.id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(opt);
              }}
              className="w-full text-left px-3 py-2.5 text-base hover:bg-slate-50 border-b border-slate-100 last:border-0"
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};