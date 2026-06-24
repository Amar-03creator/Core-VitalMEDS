import { useMemo } from 'react';

export const BillSummary = ({ items, purchaseType, billDiscountValue, billDiscountType }) => {
  const totals = useMemo(() => {
    let gross = 0, totalTaxable = 0, totalCGST = 0, totalSGST = 0, totalIGST = 0;
    const slabMap = {};

    items.forEach(item => {
      const qty = item.chargeableQty || 0;
      const rate = item.purchaseRate || 0;
      const grossLine = rate * qty;
      let disc = 0;
      if (item.discountValue && parseFloat(item.discountValue) > 0) {
        if (item.discountType === 'percent') {
          disc = (grossLine * parseFloat(item.discountValue)) / 100;
        } else {
          disc = parseFloat(item.discountValue);
        }
      }
      const taxable = grossLine - disc;
      const cgstRate = parseFloat(item.cgstRate) || 0;
      const sgstRate = parseFloat(item.sgstRate) || 0;
      const igstRate = parseFloat(item.igstRate) || 0;

      gross += grossLine;
      totalTaxable += taxable;

      if (purchaseType === 'intrastate') {
        const cgst = taxable * cgstRate / 100;
        const sgst = taxable * sgstRate / 100;
        totalCGST += cgst;
        totalSGST += sgst;
        const rateKey = `CGST+SGST ${(cgstRate + sgstRate).toFixed(1)}%`;
        if (!slabMap[rateKey]) slabMap[rateKey] = { taxable: 0, cgst: 0, sgst: 0 };
        slabMap[rateKey].taxable += taxable;
        slabMap[rateKey].cgst += cgst;
        slabMap[rateKey].sgst += sgst;
      } else {
        const igst = taxable * igstRate / 100;
        totalIGST += igst;
        const rateKey = `IGST ${igstRate.toFixed(1)}%`;
        if (!slabMap[rateKey]) slabMap[rateKey] = { taxable: 0, igst: 0 };
        slabMap[rateKey].taxable += taxable;
        slabMap[rateKey].igst = (slabMap[rateKey].igst || 0) + igst;
      }
    });

    const totalGST = totalCGST + totalSGST + totalIGST;
    let netBeforeBillDisc = totalTaxable + totalGST;

    let billDiscAmt = 0;
    if (billDiscountValue && parseFloat(billDiscountValue) > 0) {
      if (billDiscountType === 'percent') {
        billDiscAmt = (netBeforeBillDisc * parseFloat(billDiscountValue)) / 100;
      } else {
        billDiscAmt = parseFloat(billDiscountValue);
      }
    }
    const afterDisc = netBeforeBillDisc - billDiscAmt;
    const rounded = Math.round(afterDisc);
    const roundOff = parseFloat((rounded - afterDisc).toFixed(2));

    return { gross, totalTaxable, totalCGST, totalSGST, totalIGST, totalGST, netBeforeBillDisc, billDiscAmt, rounded, roundOff, slabMap };
  }, [items, purchaseType, billDiscountValue, billDiscountType]);

  if (items.length === 0) return null;

  return (
    <div className="bg-slate-50 rounded-2xl divide-y divide-slate-200 overflow-hidden border border-slate-200">
      <div className="px-4 py-3 space-y-2">
        <div className="flex justify-between text-base">
          <span className="text-slate-600">Gross Amount</span>
          <span className="text-slate-800 font-medium">₹{totals.gross.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base">
          <span className="text-slate-600">Total Taxable</span>
          <span className="text-slate-800 font-medium">₹{totals.totalTaxable.toFixed(2)}</span>
        </div>

        {Object.entries(totals.slabMap).map(([key, val]) => (
          <div key={key} className="flex justify-between text-sm text-slate-500 pl-4">
            <span>{key}</span>
            <span>
              {purchaseType === 'intrastate'
                ? `CGST ₹${val.cgst.toFixed(2)}  SGST ₹${val.sgst.toFixed(2)}`
                : `IGST ₹${val.igst.toFixed(2)}`}
            </span>
          </div>
        ))}

        <div className="flex justify-between text-base font-semibold">
          <span>Total GST</span>
          <span>₹{totals.totalGST.toFixed(2)}</span>
        </div>
      </div>

      {totals.billDiscAmt > 0 && (
        <div className="flex justify-between px-4 py-3 text-base text-amber-700 bg-amber-50">
          <span>Bill Discount</span>
          <span className="font-semibold">- ₹{totals.billDiscAmt.toFixed(2)}</span>
        </div>
      )}

      <div className="flex justify-between px-4 py-3 text-base">
        <span>Round Off</span>
        <span>{totals.roundOff >= 0 ? '+' : ''}₹{totals.roundOff.toFixed(2)}</span>
      </div>

      <div className="flex justify-between px-4 py-4 bg-slate-900">
        <span className="text-white font-bold text-lg">Net Amount</span>
        <span className="text-emerald-400 font-black text-xl">₹{totals.rounded.toLocaleString()}</span>
      </div>
    </div>
  );
};