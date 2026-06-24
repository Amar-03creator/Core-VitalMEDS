import { useState, useEffect } from 'react';      // ← added useEffect
import { X, Download } from 'lucide-react';
import { useModalBackHandler } from '../utils/useModalBackHandler';

const STORAGE_KEY = 'gstModalState';

export const GSTModal = ({ onClose }) => {
  useModalBackHandler(true, onClose);

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const gstData = { outputTax: 58420, itc: 31800 };
  const netGST = gstData.outputTax - gstData.itc;

  const load = () => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; }
  };
  const saved = load();
  const [month, setMonth] = useState(saved?.month ?? 4);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ month }));
  }, [month]);

  const handleClose = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">Monthly GST Summary</h3>
          <button onClick={handleClose}> 
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-sm text-slate-500 block mb-1.5 font-medium">Select Month</label>
            <select value={month} onChange={e => setMonth(+e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none">
              {months.slice(0, 5).map((m, i) => <option key={i} value={i}>{m} 2025</option>)}
            </select>
          </div>
          <div className="bg-slate-50 rounded-2xl divide-y divide-slate-200 overflow-hidden border border-slate-200">
            <div className="flex justify-between px-4 py-3">
              <span className="text-sm text-slate-600">Sales Tax Collected (Output)</span>
              <span className="text-sm font-bold text-slate-900">₹{gstData.outputTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-sm text-slate-600">Purchase ITC (Input)</span>
              <span className="text-sm font-bold text-emerald-600">- ₹{gstData.itc.toLocaleString()}</span>
            </div>
            <div className="flex justify-between px-4 py-3 bg-slate-900">
              <span className="text-sm font-bold text-white">Net GST Payable</span>
              <span className="text-sm font-black text-emerald-400">₹{netGST.toLocaleString()}</span>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3 rounded-xl text-sm">
            <Download size={15} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};