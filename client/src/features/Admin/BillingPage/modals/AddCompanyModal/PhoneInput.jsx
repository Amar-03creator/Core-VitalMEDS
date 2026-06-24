import { useEffect, useRef, useState } from 'react';

// Valid Indian mobile: exactly 10 digits, starts with 6–9
const MOBILE_REGEX = /^[6-9]\d{9}$/;

/**
 * PhoneInput
 *
 * Props:
 *   value        – plain digit string (no +91 prefix)
 *   onChange     – called with plain digit string
 *   onBlur       – called after internal validation (receives raw Event)
 *   error        – external error string (e.g. from duplicate-DB check)
 *   placeholder
 *   maxLength    – 10 for WhatsApp (strict), 11 for rep (allows toll-free)
 *   required     – if true, validates format on blur and locks focus until valid
 *   onTooLong    – called when the user types an 11th digit (rep only)
 *   name         – forwarded to <input> for focus-trap compatibility
 */
export const PhoneInput = ({
  value = '',
  onChange,
  onBlur,
  error,
  placeholder,
  maxLength = 10,
  required = false,
  onTooLong,
  name,
}) => {
  const inputRef = useRef(null);
  const [internalError, setInternalError] = useState(null);
  const [suggestion, setSuggestion] = useState(null);

  /* ── Change ─────────────────────────────────────────────────────────── */
  const handleChange = (e) => {
    let cleaned = e.target.value.replace(/\D/g, '');

    // Fire onTooLong when an 11th digit is typed in rep mode
    if (maxLength === 11 && cleaned.length === 11 && onTooLong) {
      onTooLong();
      // Still allow the 11th digit — the prompt lets the admin decide
    }

    if (cleaned.length > maxLength) {
      cleaned = cleaned.slice(0, maxLength);
    }

    onChange(cleaned);

    // Clear errors while typing
    if (internalError) setInternalError(null);
    if (suggestion) setSuggestion(null);
  };

  /* ── Blur ────────────────────────────────────────────────────────────── */
  const handleBlur = (e) => {
    const num = value;

    if (required) {
      /* WhatsApp: strict 10-digit mobile */
      if (num.length > 0 && num.length !== 10) {
        setInternalError('WhatsApp number must be exactly 10 digits.');
      } else if (num.length === 10 && !MOBILE_REGEX.test(num)) {
        setInternalError('Must be a valid mobile number starting with 6, 7, 8, or 9.');
      } else {
        setInternalError(null);
      }
    } else {
      /* Rep phone: soft suggestion for < 10 digits (non-empty) */
      if (num.length > 0 && num.length < 10) {
        setSuggestion('Please add a 10-digit number if possible.');
      } else {
        setSuggestion(null);
      }
      setInternalError(null);
    }

    if (onBlur) onBlur(e);
  };

  /* ── Focus lock for required field with error ────────────────────────── */
  useEffect(() => {
    if (required && internalError && inputRef.current) {
      inputRef.current.focus();
    }
  }, [internalError, required]);

  const showError = internalError || error;

  return (
    <div>
      <input
        ref={inputRef}
        name={name}
        type="text"
        inputMode="numeric"
        placeholder={placeholder || 'Mobile number'}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full bg-white border ${
          showError ? 'border-red-500' : 'border-slate-300'
        } rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400`}
      />
      {showError && (
        <p className="text-red-500 text-xs mt-1">{showError}</p>
      )}
      {!showError && suggestion && (
        <p className="text-amber-500 text-xs mt-1">{suggestion}</p>
      )}
    </div>
  );
};