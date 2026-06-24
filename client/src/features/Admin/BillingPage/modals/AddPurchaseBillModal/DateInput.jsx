import { useState, useRef } from 'react';

const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

const isValidDay = (d, m, y) => {
  if (!d || !m || !y) return false;
  const day = parseInt(d);
  const month = parseInt(m);
  const year = parseInt(y);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (month < 1 || month > 12) return false;
  const maxDay = daysInMonth(year, month);
  return day >= 1 && day <= maxDay;
};

// Convert a 2-digit year to 4-digit (assume 2000-2099)
const toFullYear = (yearStr) => {
  if (!yearStr) return '';
  const trimmed = yearStr.trim();
  if (trimmed.length === 2) {
    return `20${trimmed}`;
  }
  // If already 4 digits, return as is, else pad with leading zeros (shouldn't happen)
  return trimmed.padStart(4, '0');
};

export const DateInput = ({ value, onChange, label, validate }) => {
  const [open, setOpen] = useState(false);
  const [d, setD] = useState('');
  const [m, setM] = useState('');
  const [y, setY] = useState('');
  const [error, setError] = useState('');

  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  const originalValueRef = useRef(value);

  const openPopup = () => {
    setOpen(true);
    originalValueRef.current = value;
    if (value) {
      const [year, month, day] = value.split('-');
      setD(day);
      setM(month);
      setY(year);
    } else {
      setD('');
      setM('');
      setY('');
    }
    setError('');
  };

  const display = value
    ? `${value.split('-')[2]}/${value.split('-')[1]}/${value.split('-')[0]}`
    : '';

  const apply = () => {
    // Convert year to 4-digit before validation
    const fullYear = toFullYear(y);
    if (!isValidDay(d, m, fullYear)) {
      setError('Invalid date');
      return;
    }
    const dd = d.padStart(2, '0');
    const mm = m.padStart(2, '0');
    const formatted = `${fullYear}-${mm}-${dd}`;

    if (validate) {
      const msg = validate(formatted);
      if (msg) {
        setError(msg);
        return;
      }
    }

    setError('');
    onChange(formatted);
    setOpen(false);
  };

  const cancel = () => {
    const orig = originalValueRef.current;
    if (orig) {
      const [year, month, day] = orig.split('-');
      setD(day);
      setM(month);
      setY(year);
    } else {
      setD('');
      setM('');
      setY('');
    }
    setError('');
    setOpen(false);
  };

  const handleDayChange = (e) => {
    const val = e.target.value.slice(0, 2);
    setD(val);
    if (val.length === 2) monthRef.current?.focus();
  };

  const handleMonthChange = (e) => {
    const val = e.target.value.slice(0, 2);
    setM(val);
    if (val.length === 2) yearRef.current?.focus();
  };

  const handleYearChange = (e) => {
    // Limit to 4 characters
    setY(e.target.value.slice(0, 4));
  };

  return (
    <>
      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">
          {label}
        </label>
        <input
          type="text"
          readOnly
          value={display}
          onClick={openPopup}
          placeholder="DD/MM/YYYY"
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400 cursor-pointer"
        />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-5 w-80 shadow-2xl">
            <h3 className="font-bold text-lg mb-4 text-slate-900">{label}</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div>
                <label className="text-sm font-semibold text-slate-600">Day</label>
                <input
                  ref={dayRef}
                  type="number"
                  placeholder="DD"
                  value={d}
                  onChange={handleDayChange}
                  className="w-full border rounded-xl px-2 py-2 text-center text-lg"
                  max={31}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Month</label>
                <input
                  ref={monthRef}
                  type="number"
                  placeholder="MM"
                  value={m}
                  onChange={handleMonthChange}
                  className="w-full border rounded-xl px-2 py-2 text-center text-lg"
                  max={12}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Year</label>
                <input
                  ref={yearRef}
                  type="number"
                  placeholder="YYYY"
                  value={y}
                  onChange={handleYearChange}
                  className="w-full border rounded-xl px-2 py-2 text-center text-lg"
                  maxLength={4}
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={cancel}
                className="flex-1 bg-slate-100 py-2 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={apply}
                className="flex-1 bg-slate-900 text-white py-2 rounded-xl font-semibold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};