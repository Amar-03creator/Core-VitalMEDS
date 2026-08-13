import { CheckCircle2, Wallet } from 'lucide-react';

export const PaymentSection = ({
    netPayable,
    availableAdvance,
    applyAdvance, setApplyAdvance,
    paymentAmount, setPaymentAmount,
    paymentMode, setPaymentMode,
    referenceNumber, setReferenceNumber,
    paymentDate, setPaymentDate
}) => {
    
    // Calculate the remaining due amount dynamically
    const advanceToConsume = applyAdvance ? Math.min(availableAdvance, netPayable) : 0;
    const newPayment = parseFloat(paymentAmount) || 0;
    const remainingDue = Math.max(0, netPayable - advanceToConsume - newPayment);
    const newAdvanceGenerated = Math.max(0, newPayment - Math.max(0, netPayable - advanceToConsume));

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-4">
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Wallet size={18} className="text-emerald-400" /> Payment Details
                </h3>
                <span className="text-slate-300 text-sm">Net Payable: ₹{netPayable.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-4 space-y-4">
                {/* ✨ Loophole 3 Fix: The Credit Prompt */}
                {availableAdvance > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <div className="flex items-start gap-3">
                            <input 
                                type="checkbox" 
                                id="useAdvance"
                                checked={applyAdvance}
                                onChange={(e) => setApplyAdvance(e.target.checked)}
                                className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                            <div>
                                <label htmlFor="useAdvance" className="font-bold text-blue-900 cursor-pointer block">
                                    Apply Existing Credit Wallet (₹{availableAdvance.toLocaleString('en-IN')})
                                </label>
                                <p className="text-sm text-blue-700 mt-0.5">
                                    You have unused credit/advance from previous transactions. Do you want to adjust it against this bill?
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* New Payment Inputs */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">New Payment Amount (₹)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base font-bold text-slate-800 outline-none focus:border-emerald-500"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Date</label>
                        <input 
                            type="date" 
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Mode</label>
                        <select 
                            value={paymentMode}
                            onChange={(e) => setPaymentMode(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-500"
                        >
                            <option>UPI</option>
                            <option>NEFT / RTGS</option>
                            <option>Cash</option>
                            <option>Cheque</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Reference / UTR No.</label>
                        <input 
                            type="text" 
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-500"
                            placeholder="Txn ID"
                        />
                    </div>
                </div>

                {/* Dynamic Summary Bar */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-500">Remaining Bill Due</p>
                        <p className={`text-lg font-black ${remainingDue === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ₹{remainingDue.toLocaleString('en-IN')}
                        </p>
                    </div>
                    {newAdvanceGenerated > 0 && (
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-500">New Credit Added to Wallet</p>
                            <p className="text-lg font-black text-blue-600">
                                + ₹{newAdvanceGenerated.toLocaleString('en-IN')}
                            </p>
                        </div>
                    )}
                    {remainingDue === 0 && newAdvanceGenerated === 0 && (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                            <CheckCircle2 size={18} /> Fully Paid
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};