// utils/ledgerHelpers.js
import { INVOICES, RECEIPTS } from './constants';

export const generateLedgerForParty = (partyName, fromDate, toDate) => {
  const invoices = INVOICES.filter(inv => inv.client === partyName && inv.date >= fromDate && inv.date <= toDate);
  const receipts = RECEIPTS.filter(rec => rec.client === partyName && rec.date >= fromDate && rec.date <= toDate);
  
  const transactions = [
    ...invoices.map(inv => ({
      date: inv.date,
      type: `Sales (${inv.billType} Bill)`,
      voucher: inv.id,
      dr: inv.amount,
      cr: 0,
      days: inv.overdueDays || null,
    })),
    ...receipts.map(rec => ({
      date: rec.date,
      type: `Payment (${rec.mode})`,
      voucher: rec.id,
      dr: 0,
      cr: rec.amount,
      days: null,
    })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  const olderInvoices = INVOICES.filter(inv => inv.client === partyName && inv.date < fromDate);
  const olderReceipts = RECEIPTS.filter(rec => rec.client === partyName && rec.date < fromDate);
  const olderDr = olderInvoices.reduce((sum, inv) => sum + inv.due, 0);
  const olderCr = olderReceipts.reduce((sum, rec) => sum + rec.amount, 0);
  const openingBalance = olderDr - olderCr;

  let balance = openingBalance;
  const rows = [];

  rows.push({
    date: fromDate,
    type: 'Opening Balance',
    voucher: '—',
    dr: openingBalance > 0 ? openingBalance : 0,
    cr: openingBalance < 0 ? -openingBalance : 0,
    balance: openingBalance,
    days: null,
    isOpening: true,
  });

  for (const t of transactions) {
    balance = balance + t.dr - t.cr;
    rows.push({
      date: t.date,
      type: t.type,
      voucher: t.voucher,
      dr: t.dr,
      cr: t.cr,
      balance,
      days: t.days,
    });
  }

  rows.push({
    date: toDate,
    type: 'Closing Balance',
    voucher: '—',
    dr: 0,
    cr: 0,
    balance,
    days: null,
    isClosing: true,
  });

  return rows;
};