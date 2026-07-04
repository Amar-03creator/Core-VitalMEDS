import { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { useScrollLock, useModalTrap } from '../../../../hooks/useBackHandler';

export const ExportModal = ({ isOpen, onClose, onExport, availableCompanies, actionType }) => {
  const [selected, setSelected] = useState([]);

  useScrollLock(isOpen);
  useModalTrap(isOpen, { onBackClose: onClose });
  useEffect(() => {
    if (isOpen) setSelected(availableCompanies);
  }, [isOpen, availableCompanies]);

  if (!isOpen) return null;

  const toggleCompany = (comp) => {
    if (selected.includes(comp)) setSelected(selected.filter(c => c !== comp));
    else setSelected([...selected, comp]);
  };

  const toggleAll = () => {
    if (selected.length === availableCompanies.length) setSelected([]);
    else setSelected(availableCompanies);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="w-full sm:w-96 bg-white rounded-t-2xl sm:rounded-2xl px-5 py-4 space-y-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center border-b pb-3 shrink-0">
          <h3 className="font-bold text-lg text-slate-900">
            {actionType === 'print' ? 'Print Price List' : 'Download PDF'}
          </h3>
          <button onClick={onClose}><XCircle size={24} className="text-slate-400" /></button>
        </div>

        <div className="flex justify-between items-center shrink-0">
          <span className="text-sm font-semibold text-slate-700">Select Companies</span>
          <button onClick={toggleAll} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
            {selected.length === availableCompanies.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-2 pr-2">
          {availableCompanies.map(comp => (
            <label key={comp} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(comp)}
                onChange={() => toggleCompany(comp)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-slate-800">{comp}</span>
            </label>
          ))}
          {availableCompanies.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No companies found.</p>
          )}
        </div>

        <button
          disabled={selected.length === 0}
          onClick={() => { onExport(selected, actionType); onClose(); }}
          className="w-full bg-slate-900 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl mt-2 shrink-0"
        >
          {actionType === 'print' ? 'Proceed to Print' : 'Generate PDF'}
        </button>
      </div>
    </div>
  );
};