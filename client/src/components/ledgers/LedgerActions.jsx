import { Printer, Download } from 'lucide-react';

export const LedgerActions = ({ onPrint, onDownload }) => (
  <div className="grid grid-cols-2 gap-2">
    <button
      onClick={onPrint}
      className="w-full flex items-center justify-center gap-1.5 bg-white border border-slate-300 text-slate-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors"
    >
      <Printer size={15} /> Print
    </button>
    <button
      onClick={onDownload}
      className="w-full flex items-center justify-center gap-1.5 bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-800 transition-colors"
    >
      <Download size={15} /> Download PDF
    </button>
  </div>
);