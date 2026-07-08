// src/features/Client/Cart/components/BillPreferenceSelector.jsx

const BillPreferenceSelector = ({ value, onChange, creditDisabled }) => (
  <div>
    <p className="text-slate-600 text-sm sm:text-base font-semibold mb-2">Bill Preference</p>
    <div className="flex w-full rounded-full border-2 border-slate-200 p-1 bg-white">
      {['Cash', 'Credit'].map((type) => {
        const disabled = type === 'Credit' && creditDisabled;
        const selected = value === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => !disabled && onChange(type)}
            disabled={disabled}
            title={disabled ? 'Credit limit exceeded — choose Cash Bill' : undefined}
            className={`flex-1 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-semibold transition-all ${
              disabled
                ? 'text-slate-300 cursor-not-allowed'
                : selected
                ? type === 'Cash'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'
                : 'text-slate-500'
            }`}
          >
            {type === 'Cash' ? 'Cash Bill' : 'Credit Bill'}
          </button>
        );
      })}
    </div>
    {creditDisabled && (
      <p className="text-red-500 text-xs sm:text-sm mt-1.5">Credit Bill is disabled — your credit limit has been exceeded.</p>
    )}
  </div>
);

export default BillPreferenceSelector;