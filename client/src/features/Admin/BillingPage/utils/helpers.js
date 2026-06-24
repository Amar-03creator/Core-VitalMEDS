import { INVOICES } from './constants';

export const calcFIFO = (clientName, amount) => {
  const clientInvoices = INVOICES
    .filter(inv => inv.client === clientName && inv.due > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  let remaining = parseFloat(amount) || 0;
  const alloc = [];
  for (const inv of clientInvoices) {
    if (remaining <= 0) break;
    const applied = Math.min(inv.due, remaining);
    remaining -= applied;
    alloc.push({ id: inv.id, applied, newDue: inv.due - applied, willPay: applied >= inv.due });
  }
  return { alloc, leftover: remaining };
};

export const calcLineTotal = (item) => {
  const gross = (item.chargeableQty || 0) * (item.rate || 0);
  let discountAmount = 0;
  if (item.discountType === 'percent') {
    discountAmount = (gross * (item.discountValue || 0)) / 100;
  } else {
    discountAmount = (item.discountValue || 0);
  }
  const taxable = gross - discountAmount;
  const gstAmt  = (taxable * (item.gstRate || 0)) / 100;
  const cgst = gstAmt / 2;
  const sgst = gstAmt / 2;
  return { gross, discountAmount, taxable, cgst, sgst, lineTotal: taxable + gstAmt };
};