import { Check } from 'lucide-react';

const StepProgress = ({ currentStep, steps }) => (
  <div className="bg-white border-b border-slate-200 px-4 py-4">
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const done = currentStep > s.id;
          const active = currentStep === s.id;
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    done ? 'bg-emerald-500' : active ? 'bg-slate-900' : 'bg-slate-100'
                  }`}
                >
                  {done ? (
                    <Check size={16} className="text-white" />
                  ) : (
                    <Icon size={15} className={active ? 'text-white' : 'text-slate-400'} />
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold ${
                    active ? 'text-slate-900' : done ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-4 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`}
                  style={{ width: 28 }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>
    </div>
  </div>
);

export default StepProgress;