// components/CreditLimitUsage.jsx
import { AlertTriangle } from 'lucide-react';

const getScoreColor = (score) => {
  const hue = Math.max(0, Math.min(120, (score / 100) * 120));
  return `hsl(${hue}, 85%, 45%)`;
};

const CreditLimitUsage = ({ outstanding, creditLimit, creditScore }) => {
  const usedPercent = Math.round((outstanding / creditLimit) * 100);

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 px-4 sm:px-5 py-3 sm:py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <p className="text-slate-600 text-sm font-bold uppercase tracking-wider">
          Credit Limit Usage
        </p>
        <span className={`text-sm font-black px-2.5 sm:px-3 py-1 rounded-lg 
          ${usedPercent > 100 ? 'bg-red-100 text-red-700 border border-red-200' :
            usedPercent > 80 ? 'bg-amber-100 text-amber-700' :
              'bg-emerald-100 text-emerald-700'}`}
        >
          {usedPercent}% USED
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-500 ${
            usedPercent > 100 ? 'bg-red-600' : usedPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(usedPercent, 100)}%` }}
        />
      </div>

      {/* Numbers row */}
      <div className="flex items-end justify-between mt-1">
        <div>
          <p className={`text-lg sm:text-xl font-black leading-none ${
            usedPercent > 100 ? 'text-red-600' : 'text-slate-800'
          }`}>
            ₹{outstanding.toLocaleString()}
          </p>
          <p className="text-slate-400 text-sm font-medium mt-1">
            of ₹{creditLimit.toLocaleString()} limit
          </p>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-0.5">
            Vital Score
          </p>
          <p className="text-xl sm:text-2xl font-black leading-none" style={{ color: getScoreColor(creditScore) }}>
            {creditScore}
          </p>
        </div>
      </div>

      {/* Warning when limit exceeded */}
      {usedPercent > 100 && (
        <div className="mt-2 sm:mt-3 bg-red-50 p-2 sm:p-2.5 rounded-lg flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 font-bold">
            Credit limit exceeded. Please clear dues to resume ordering.
          </p>
        </div>
      )}
    </div>
  );
};

export default CreditLimitUsage;