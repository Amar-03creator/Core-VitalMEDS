import { Phone, Mail, Star } from 'lucide-react';

/**
 * RepCard
 * Read-only display of one representative, with call/email quick actions
 * and a "Main" tag indicator (per spec: "a tag of main to one of them").
 *
 * In view mode (editable=false): pure display.
 * In edit mode (editable=true): shows editable inputs + a radio-style
 * "Set as Main" button instead of the static star badge.
 */
export const RepCard = ({ rep, isMain, editable = false, onChange, onSetMain, onRemove }) => {
  if (!editable) {
    return (
      <div className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-slate-800 text-base font-semibold">{rep.name}</p>
              {isMain && (
                <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                  <Star size={10} className="fill-amber-500 text-amber-500" /> Main
                </span>
              )}
            </div>
            {rep.role && <p className="text-slate-500 text-sm">{rep.role}</p>}
          </div>
          <div className="flex gap-2">
            {rep.phone && (
              <a
                href={`tel:${rep.phone}`}
                className="w-9 h-9 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center justify-center"
              >
                <Phone size={15} />
              </a>
            )}
            {rep.email && (
              <a
                href={`mailto:${rep.email}`}
                className="w-9 h-9 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-center justify-center"
              >
                <Mail size={15} />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-300 rounded-xl p-3 space-y-2">
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onSetMain}
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            isMain ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <Star size={11} className={isMain ? 'fill-amber-500 text-amber-500' : ''} />
          {isMain ? 'Main Contact' : 'Set as Main'}
        </button>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-red-500 text-sm font-semibold">
            Remove
          </button>
        )}
      </div>
      <input
        placeholder="Name *"
        value={rep.name}
        onChange={(e) => onChange('name', e.target.value)}
        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400"
      />
      <input
        placeholder="Role"
        value={rep.role || ''}
        onChange={(e) => onChange('role', e.target.value)}
        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="Phone"
          value={rep.phone || ''}
          onChange={(e) => onChange('phone', e.target.value.replace(/\D/g, '').slice(0, 11))}
          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400"
        />
        <input
          placeholder="Email"
          value={rep.email || ''}
          onChange={(e) => onChange('email', e.target.value.toLowerCase())}
          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400"
        />
      </div>
    </div>
  );
};