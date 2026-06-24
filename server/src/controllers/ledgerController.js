const Client = require('../models/Client');
const SalesInvoice = require('../models/SalesInvoice');
const PaymentReceipt = require('../models/PaymentReceipt');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function buildLedgerRows(invoices, receipts, fromDate, toDate) {
  const olderInvoices = invoices.filter(i => new Date(i.invoiceDate) < fromDate);
  const olderReceipts = receipts.filter(r => new Date(r.paymentDate) < fromDate);
  const openingBalance =
    olderInvoices.reduce((s, i) => s + i.totalPayable, 0) -
    olderReceipts.reduce((s, r) => s + r.totalAmountPaid, 0);

  const inRange = [
    ...invoices
      .filter(i => new Date(i.invoiceDate) >= fromDate && new Date(i.invoiceDate) <= toDate)
      .map(i => ({
        date: i.invoiceDate,
        type: `Sales (${i.billType})`,
        voucher: i.invoiceNumber,
        dr: i.totalPayable,
        cr: 0,
        days: Math.max(0, Math.floor((toDate - new Date(i.invoiceDate)) / MS_PER_DAY)),
      })),
    ...receipts
      .filter(r => new Date(r.paymentDate) >= fromDate && new Date(r.paymentDate) <= toDate)
      .map(r => ({
        date: r.paymentDate,
        type: `Payment (${r.paymentMode})`,
        voucher: r.receiptNumber,
        dr: 0,
        cr: r.totalAmountPaid,
        days: null,
      })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  let balance = openingBalance;
  const rows = [{
    date: fromDate,
    type: 'Opening Balance',
    voucher: '—',
    dr: openingBalance > 0 ? openingBalance : 0,
    cr: openingBalance < 0 ? -openingBalance : 0,
    balance: openingBalance,
    days: null,
    isOpening: true,
  }];

  for (const t of inRange) {
    balance += t.dr - t.cr;
    rows.push({ ...t, balance });
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
}

exports.getLedger = async (req, res) => {
  try {
    const { scope = 'party', partyId, line, city, from, to } = req.query;
    if (!from || !to) return res.status(400).json({ message: 'from and to dates are required' });

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    let clients;
    if (scope === 'party') {
      if (!partyId) return res.status(400).json({ message: 'partyId is required' });
      clients = await Client.find({ _id: partyId });
    } else if (scope === 'line') {
      if (!line) return res.status(400).json({ message: 'line is required' });
      clients = await Client.find({ line });
    } else if (scope === 'city') { // ★ FIXED: scope is now city
      if (!city) return res.status(400).json({ message: 'city is required' });
      clients = await Client.find({ city });
    } else {
      clients = await Client.find({});
    }

    if (clients.length === 0) return res.status(200).json({ success: true, data: [] });

    const clientIds = clients.map(c => c._id);

    const [invoices, receipts] = await Promise.all([
      SalesInvoice.find({ clientObjectId: { $in: clientIds } })
        .select('clientObjectId invoiceDate invoiceNumber billType totalPayable')
        .lean(),
      PaymentReceipt.find({ clientObjectId: { $in: clientIds } })
        .select('clientObjectId paymentDate paymentMode receiptNumber totalAmountPaid')
        .lean(),
    ]);

    const invoicesByClient = {};
    invoices.forEach(i => { (invoicesByClient[i.clientObjectId.toString()] ||= []).push(i); });
    
    const receiptsByClient = {};
    receipts.forEach(r => { (receiptsByClient[r.clientObjectId.toString()] ||= []).push(r); });

    const data = clients.map(client => {
      const key = client._id.toString();
      return {
        partyId: client._id,
        party: client.establishmentName,
        line: client.line,
        city: client.city, // ★ FIXED: passing city to frontend
        rows: buildLedgerRows(invoicesByClient[key] || [], receiptsByClient[key] || [], fromDate, toDate),
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('getLedger error:', error);
    res.status(500).json({ message: error.message });
  }
};