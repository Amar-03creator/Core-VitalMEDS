import { CheckCircle2, Download, Printer, PlusCircle, ArrowRight } from 'lucide-react';
import { downloadReceiptPDF, printReceiptPDF } from '../../pdf/receipt';

export const PaymentSuccessModal = ({ receipt, onRecordAnother, onGoToPayments }) => {
  if (!receipt) return null;

  const partyName = receipt.clientObjectId?.establishmentName || receipt.clientName || 'Party';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-5">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        <div className="text-center mb-6">
          <CheckCircle2 size={60} className="text-emerald-600 mx-auto mb-3" />
          <h3 className="font-bold text-2xl text-slate-900">Payment Recorded!</h3>
          <p className="text-slate-600 text-lg mt-2 leading-relaxed">
            ₹{receipt.totalAmountPaid?.toLocaleString('en-IN')} from {partyName}
          </p>
          <p className="text-slate-400 text-base font-mono mt-2">{receipt.receiptNumber}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => downloadReceiptPDF(receipt)}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-4 rounded-2xl text-lg hover:bg-slate-800"
          >
            <Download size={20} /> Download PDF
          </button>
          <button
            onClick={() => printReceiptPDF(receipt)}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 font-bold py-4 rounded-2xl text-lg hover:bg-slate-50"
          >
            <Printer size={20} /> Print Receipt
          </button>
          
          {onRecordAnother && (
            <button
              onClick={onRecordAnother}
              className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 font-bold py-4 rounded-2xl text-lg hover:bg-emerald-100"
            >
              <PlusCircle size={20} /> Record New Payment
            </button>
          )}
          
          <button
            onClick={onGoToPayments}
            className="w-full flex items-center justify-center gap-2 text-slate-500 font-bold py-3 rounded-2xl text-base hover:bg-slate-50 mt-2"
          >
            Go to Payments <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};