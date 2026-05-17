// MonthlySummary.jsx
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, TrendingUp, Clock, Wallet } from 'lucide-react';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Monthly summary with a calendar‑style year/month picker.
 * @param {Object} props
 * @param {Object} props.summaryData - Data keyed by "YYYY-MM", e.g. { "2025-04": { ordered, prevDue, paid, outstanding } }
 * @param {Object} props.startDate - First order date: { year: 2023, month: 5 } (May 2023)
 * @param {Object} props.currentDate - Today's date (defaults to new Date())
 * @param {Function} props.onMonthChange - Optional callback when month/year changes
 */
const MonthlySummary = ({
  summaryData = {},
  startDate,
  currentDate = new Date(),
  onMonthChange = () => {},
}) => {
  // Derive available year range
  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth(); // 0‑based

  const startYear = startDate?.year ?? currentYear;
  const startMonthIndex = startDate?.month ?? 0; // 0‑based

  const availableYears = useMemo(() => {
    const years = [];
    for (let y = startYear; y <= currentYear; y++) years.push(y);
    return years;
  }, [startYear, currentYear]);

  // Selected year & month state
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIndex);

  // Helper: is a given (year, month) selectable?
  const isMonthSelectable = (year, monthIndex) => {
    if (year === startYear && monthIndex < startMonthIndex) return false;
    if (year === currentYear && monthIndex > currentMonthIndex) return false;
    return true;
  };

  // Change handlers
  const goPrevMonth = () => {
    let newYear = selectedYear;
    let newMonth = selectedMonth - 1;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    if (newYear < startYear) return; // boundary
    if (!isMonthSelectable(newYear, newMonth)) return;
    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
    onMonthChange({ year: newYear, month: newMonth });
  };

  const goNextMonth = () => {
    let newYear = selectedYear;
    let newMonth = selectedMonth + 1;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    if (newYear > currentYear) return;
    if (!isMonthSelectable(newYear, newMonth)) return;
    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
    onMonthChange({ year: newYear, month: newMonth });
  };

  const handleYearChange = (e) => {
    const year = parseInt(e.target.value, 10);
    setSelectedYear(year);
    // Auto‑adjust month if current selection is invalid in the new year
    let newMonth = selectedMonth;
    if (!isMonthSelectable(year, newMonth)) {
      // Default to the first selectable month in that year
      const firstValid = monthNames.findIndex((_, m) => isMonthSelectable(year, m));
      newMonth = firstValid !== -1 ? firstValid : 0;
    }
    setSelectedMonth(newMonth);
    onMonthChange({ year, month: newMonth });
  };

  // Get data for the selected YYYY-MM
  const dataKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const data = summaryData[dataKey] || { ordered: 0, prevDue: 0, paid: 0, outstanding: 0 };

  const isCurrent = selectedYear === currentYear && selectedMonth === currentMonthIndex;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header with year selector + month arrows */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 gap-3">
        <button
          onClick={goPrevMonth}
          className="p-2 rounded-xl bg-slate-100 text-slate-500 disabled:opacity-40 shrink-0"
          disabled={selectedYear === startYear && selectedMonth === startMonthIndex}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            {/* Year selector dropdown */}
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="text-slate-900 font-bold text-base bg-transparent border border-slate-200 rounded-lg px-2 py-1 cursor-pointer focus:outline-none"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span className="text-slate-400 text-sm">•</span>
            <span className="text-slate-900 font-semibold text-base">
              {monthNames[selectedMonth]}
            </span>
          </div>
          {isCurrent && (
            <p className="text-emerald-600 text-[12px] font-bold uppercase tracking-wide">
              Current Month
            </p>
          )}
        </div>

        <button
          onClick={goNextMonth}
          className="p-2 rounded-xl bg-slate-100 text-slate-500 disabled:opacity-40 shrink-0"
          disabled={selectedYear === currentYear && selectedMonth === currentMonthIndex}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Month grid (calendar) */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-100">
        <div className="grid grid-cols-6 gap-1 sm:gap-2">
          {monthNames.map((name, idx) => {
            const selectable = isMonthSelectable(selectedYear, idx);
            const isSelected = selectedYear === selectedYear && selectedMonth === idx;
            return (
              <button
                key={name}
                onClick={() => {
                  if (selectable) {
                    setSelectedMonth(idx);
                    onMonthChange({ year: selectedYear, month: idx });
                  }
                }}
                disabled={!selectable}
                className={`
                  text-sm sm:text-sm font-medium py-1.5 rounded-lg transition-colors
                  ${selectable
                    ? isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'hover:bg-slate-100 text-slate-700'
                    : 'text-slate-300 cursor-not-allowed bg-slate-50'
                  }
                `}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-px bg-slate-100">
        {[
          { label: 'Total Ordered', value: data.ordered, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Amount Paid', value: data.paid, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Previous Due', value: data.prevDue, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Outstanding', value: data.outstanding, icon: Wallet, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white px-4 py-5 justify-center items-center flex flex-col">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2.5`}>
              <Icon size={17} className={color} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>
              ₹{value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
            </p>
            <p className="text-slate-400 text-sm mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlySummary;