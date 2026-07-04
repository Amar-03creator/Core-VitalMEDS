import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { DEBIT_NOTE_STATUS_CFG } from '../utils/constants';

export const DebitNoteCard = ({ note, onMarkApplied }) => {
  const [marking, setMarking] = useState(false);
  const { pill, label } = DEBIT_NOTE_STATUS_CFG[note.status] || { pill: 'bg-slate-100', label: note.status };

  const handleMarkApplied = async () => {
    setMarking(true);
    try {
      await onMarkApplied(note._id);
    } finally {
      setMarking(false);
    }
  };

  const toIndianDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono font-bold text-slate-800 text-base">{note.debitNoteNumber}</p>
          <p className="text-slate-500 text-sm">{toIndianDate(note.returnDate)}</p>
        </div>
        <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${pill}`}>{label}</span>
      </div>

      <div className="space-y-1">
        {note.itemsReturned.map((item, idx) => (
          <div key={idx} className="flex justify-between text-base">
            <span className="text-slate-700">
              {item.productName} <span className="text-slate-400 font-mono text-sm">· {item.batchNumber}</span>
            </span>
            <span className="text-slate-600">
              {item.qtyReturned} units · {item.reason}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
        <span className="text-slate-500 text-sm">Refund expected</span>
        <span className="font-bold text-slate-900 text-lg">
          ₹{Math.round(note.totalRefundExpected).toLocaleString('en-IN')}
        </span>
      </div>

      {note.status === 'Pending Adjustment' && (
        <button
          onClick={handleMarkApplied}
          disabled={marking}
          className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-sm py-2.5 rounded-xl disabled:opacity-60"
        >
          <CheckCircle2 size={15} /> {marking ? 'Updating…' : 'Mark as Applied'}
        </button>
      )}
      {note.status === 'Adjusted' && note.adjustedNote && (
        <p className="text-slate-400 text-sm italic">{note.adjustedNote}</p>
      )}
    </div>
  );
};