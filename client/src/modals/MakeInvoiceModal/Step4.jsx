// Step4.jsx
import { CheckCircle2, Download, Printer, PlusCircle, FileText, Edit3 } from 'lucide-react'; // ★ Added Printer icon
import { Link } from 'react-router-dom';

export const Step4 = ({ generatedInvoice, onDownloadPDF, onPrintPDF, onNewInvoice, onEditInvoice, onClose }) => (
  <div className="space-y-5">
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
      <CheckCircle2 size={48} className="text-emerald-600 mx-auto mb-2" />
      <h3 className="text-emerald-800 font-bold text-lg">Invoice Generated Successfully!</h3>
      <p className="text-emerald-600 text-sm">Invoice #{generatedInvoice.id} has been created.</p>
    </div>

    <div className="border rounded-2xl overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 border-b"><p className="font-bold text-slate-800">Invoice Summary</p></div>
      <div className="p-4 space-y-2 text-md">
        <div className="flex justify-between"><span className="text-slate-500">Party:</span><span className="font-medium">{generatedInvoice.client}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Invoice Date:</span><span>{generatedInvoice.date}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Bill Type:</span><span>{generatedInvoice.billType}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Total Amount:</span><span className="font-bold">₹{generatedInvoice.amount.toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Items:</span><span>{generatedInvoice.items}</span></div>
      </div>
    </div>

    <div className="flex flex-col gap-3">
      {/* ★ Side-by-side Print and Download buttons */}
      <div className="flex gap-3">
        <button onClick={onPrintPDF} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-2xl hover:bg-blue-700 transition-colors">
          <Printer size={16} /> Print Invoice
        </button>
        <button onClick={onDownloadPDF} className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 rounded-2xl hover:bg-slate-800 transition-colors">
          <Download size={16} /> Download PDF
        </button>
      </div>

      <button onClick={onEditInvoice} className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-3 rounded-2xl hover:bg-amber-600 transition-colors">
        <Edit3 size={16} /> Edit Invoice
      </button>
      <button onClick={onNewInvoice} className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold py-3 rounded-2xl hover:bg-slate-50 transition-colors">
        <PlusCircle size={16} /> Make Another Invoice
      </button>
      <Link to="/admin-dashboard/billing" onClick={onClose} className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 font-semibold py-3 rounded-2xl hover:bg-emerald-100 transition-colors">
        <FileText size={16} /> See All Invoices
      </Link>
    </div>
  </div>
);