// server/src/helpers/SequenceHelper.js
const mongoose = require('mongoose');

const lotConsumptionSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  lotId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  qty:     { type: Number, required: true, min: 0 },
}, { _id: false });

const Counter = mongoose.models.Counter || mongoose.model('Counter', new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
}));

const getPageSizes = (totalItems) => {
  if (totalItems <= 12) return [totalItems];
  if (totalItems <= 15) return [12, totalItems - 12];
  const sizes = [];
  let remaining = totalItems;
  while (remaining > 0) {
    if (remaining <= 12) { sizes.push(remaining); remaining = 0; }
    else { sizes.push(15); remaining -= 15; }
  }
  return sizes;
};

const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    let str = '';
    if (n >= 100) { str += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n >= 20) { str += tens[Math.floor(n / 10)] + ' '; n %= 10; }
    else if (n >= 10) { str += teens[n - 10] + ' '; n = 0; }
    if (n > 0) str += ones[n] + ' ';
    return str;
  };

  if (num === 0) return 'Zero';
  let words = '';
  if (num >= 10000000) { words += convertLessThanThousand(Math.floor(num / 10000000)) + 'Crore '; num %= 10000000; }
  if (num >= 100000) { words += convertLessThanThousand(Math.floor(num / 100000)) + 'Lakh '; num %= 100000; }
  if (num >= 1000) { words += convertLessThanThousand(Math.floor(num / 1000)) + 'Thousand '; num %= 1000; }
  words += convertLessThanThousand(num);
  return words.trim() + ' Only';
};

const formatExpiryForBill = (expiryDate) => {
  if (!expiryDate) return '';
  let d;
  if (expiryDate instanceof Date) {
    d = expiryDate;
  } else if (typeof expiryDate === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(expiryDate)) {
      d = new Date(expiryDate);
    } else if (/^\d{2}-\d{2}-\d{4}/.test(expiryDate)) {
      const [dd, mm, yyyy] = expiryDate.split('-');
      d = new Date(`${yyyy}-${mm}-${dd}`);
    } else {
      d = new Date(expiryDate);
    }
  }
  if (!d || isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}-${yy}`;
};

const formatPacking = (packing) => {
  if (!packing) return '';
  if (
    packing.includes("10'S Strip") ||
    packing.includes("10'S Tab") ||
    packing.includes("10'S Cap") ||
    packing.includes("10 Caps")
  ) return "10's";
  return packing;
};

const formatDateIndian = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const toBase36 = (num, length) => {
  return num.toString(36).toUpperCase().padStart(length, '0');
};

const getCurrentMonthYear = () => {
  const date = new Date();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}-${yy}`;
};

const getNextClientCode = async (session = null) => {
  const opts = { new: true, upsert: true };
  if (session) opts.session = session;
  
  const counter = await Counter.findByIdAndUpdate('client_seq', { $inc: { seq: 1 } }, opts);
  return toBase36(counter.seq, 3);
};

const getNextInvoiceNumber = async (session = null) => {
  const period = getCurrentMonthYear();
  const opts = { new: true, upsert: true };
  if (session) opts.session = session;
  
  // Changing the ID key dynamically ensures a fresh counter every month
  const counter = await Counter.findByIdAndUpdate(`invoice_seq_${period}`, { $inc: { seq: 1 } }, opts);
  return `MIL-${period}-${toBase36(counter.seq, 3)}`;
};

const getNextReceiptNumber = async (clientId, session = null) => {
  const period = getCurrentMonthYear();
  const opts = { new: true, upsert: true };
  if (session) opts.session = session;
  
  // Global receipt sequence for the month
  const counter = await Counter.findByIdAndUpdate(`receipt_seq_${period}`, { $inc: { seq: 1 } }, opts);
  return `REC-${clientId}-${period}-${toBase36(counter.seq, 3)}`;
};

/**
 * 4. Order Number: ORD-CUS-MM-YY-ZZ (resets monthly, ZZ = 2-char base-36:
 * 01…09, 0A…0Z, matching the admin doc's example). One global sequence per
 * month shared across all clients — same shape as receipts above, just a
 * shorter counter.
 */
const getNextOrderNumber = async (clientCode, session = null) => {
  const period = getCurrentMonthYear();
  const opts = { new: true, upsert: true };
  if (session) opts.session = session;

  const counter = await Counter.findByIdAndUpdate(`order_seq_${period}`, { $inc: { seq: 1 } }, opts);
  return `ORD-${clientCode}-${period}-${toBase36(counter.seq, 2)}`;
};

/**
 * 5. Inquiry Number: INQ-CUS-MM-YY-ZZ (resets monthly) — mirrors order
 * numbering for visual consistency since both show up side-by-side on the
 * client's "My Orders & Inquiries" page.
 */
const getNextInquiryNumber = async (clientCode, session = null) => {
  const period = getCurrentMonthYear();
  const opts = { new: true, upsert: true };
  if (session) opts.session = session;

  const counter = await Counter.findByIdAndUpdate(`inquiry_seq_${period}`, { $inc: { seq: 1 } }, opts);
  return `INQ-${clientCode}-${period}-${toBase36(counter.seq, 2)}`;
};

module.exports = { 
  getNextClientCode, 
  getNextInvoiceNumber, 
  getNextReceiptNumber, 
  getNextOrderNumber,
  getNextInquiryNumber,
  Counter 
};