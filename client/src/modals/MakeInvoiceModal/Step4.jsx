// src/modals/MakeInvoiceModal/Step4.jsx
import { CheckCircle2, Download, Printer, PlusCircle, FileText, Edit3, LayoutDashboard } from 'lucide-react';

export const Step4 = ({ 
  generatedInvoice, 
  isPrefilled, 
  isClientProfile,
  onDownloadPDF, 
  onPrintPDF, 
  onNewInvoice, 
  onEditInvoice, 
  onClose,
  onViewAllInvoices,
  onStartPacking

}) => (
  <div className="space-y-5">
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center shadow-sm">
      <CheckCircle2 size={48} className="text-emerald-600 mx-auto mb-2" />
      <h3 className="text-emerald-800 font-bold text-lg">Invoice Generated Successfully!</h3>
      <p className="text-emerald-600 text-sm">Invoice #{generatedInvoice.id} has been created.</p>
    </div>

    <div className="border rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-slate-50 px-4 py-2 border-b"><p className="font-bold text-slate-800">Invoice Summary</p></div>
      <div className="p-4 space-y-2 text-md bg-white">
        {generatedInvoice.orderId && (
          <div className="flex justify-between"><span className="text-slate-500">Order:</span><span className="font-mono font-bold text-slate-800">{generatedInvoice.orderId}</span></div>
        )}
        <div className="flex justify-between"><span className="text-slate-500">Party:</span><span className="font-medium text-slate-800">{generatedInvoice.client}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Invoice Date:</span><span className="text-slate-800">{generatedInvoice.date}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Bill Type:</span><span className="text-slate-800">{generatedInvoice.billType}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Total Amount:</span><span className="font-bold text-emerald-600">₹{generatedInvoice.amount.toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Items:</span><span className="text-slate-800">{generatedInvoice.items}</span></div>
      </div>
    </div>

    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <button onClick={onPrintPDF} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-800 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm">
          <Printer size={16} /> Print
        </button>
        <button onClick={onDownloadPDF} className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
          <Download size={16} /> Download
        </button>
      </div>

      {isPrefilled ? (
        <button onClick={onStartPacking}className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-md">
          Start Packing
        </button>
      ) : (
        <>
          <button onClick={onEditInvoice} className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-3.5 rounded-xl hover:bg-amber-600 transition-colors shadow-sm">
            <Edit3 size={16} /> Edit Invoice
          </button>
          <button onClick={onNewInvoice} className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold py-3.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <PlusCircle size={16} /> Make Another Invoice
          </button>
          
          {/* ✨ FIX: Option 2 Smart Context Button */}
          <button 
            onClick={onViewAllInvoices} 
            className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 font-semibold py-3.5 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            {isClientProfile ? (
              <><FileText size={16} /> View Party's Invoices</>
            ) : (
              <><LayoutDashboard size={16} /> Go to Billing Hub</>
            )}
          </button>
        </>
      )}
    </div>
  </div>
);