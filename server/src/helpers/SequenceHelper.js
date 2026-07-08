// const mongoose = require('mongoose');

// // Reuses the same `Counters` collection pattern described in the docs for
// // invoice/receipt numbering (findOneAndUpdate + $inc, atomic).
// const Counters = mongoose.models.Counters || mongoose.model('Counters', new mongoose.Schema({
//     _id: { type: String, required: true }, // e.g. 'debitNote'
//     seq: { type: Number, default: 0 },
// }));

// /**
//  * getNextSequence
//  * Atomically increments and returns the next sequence number for a given counter key.
//  */
// const getNextSequence = async (key, session = null) => {
//     const opts = { new: true, upsert: true };
//     if (session) opts.session = session;
//     const counter = await Counters.findByIdAndUpdate(key, { $inc: { seq: 1 } }, opts);
//     return counter.seq;
// };

// module.exports = { getNextSequence, Counters };

const mongoose = require('mongoose');

const Counters = mongoose.models.Counters || mongoose.model('Counters', new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
}));

// Converts a number to Base-36 Alphanumeric and pads it with zeroes
const toBase36 = (num, padLength = 3) => {
    return num.toString(36).toUpperCase().padStart(padLength, '0');
};

// Gets the current MM-YY string (e.g., '05-26')
const getCurrentMonthYear = () => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    return `${mm}-${yy}`;
};

/** 1. Client Code: 001 to ZZZ (No reset) */
const getNextClientCode = async (session = null) => {
    const opts = { new: true, upsert: true };
    if (session) opts.session = session;
    
    const counter = await Counters.findByIdAndUpdate('client_seq', { $inc: { seq: 1 } }, opts);
    return toBase36(counter.seq, 3);
};

/** 2. Invoice Number: MIL-MM-YY-XXX (Resets monthly) */
const getNextInvoiceNumber = async (session = null) => {
    const period = getCurrentMonthYear();
    const opts = { new: true, upsert: true };
    if (session) opts.session = session;
    
    // Changing the ID key dynamically ensures a fresh counter every month
    const counter = await Counters.findByIdAndUpdate(`invoice_seq_${period}`, { $inc: { seq: 1 } }, opts);
    return `MIL-${period}-${toBase36(counter.seq, 3)}`;
};

/** 3. Receipt Number: REC-CUS-MM-YY-XXX (Resets monthly) */
const getNextReceiptNumber = async (clientId, session = null) => {
    const period = getCurrentMonthYear();
    const opts = { new: true, upsert: true };
    if (session) opts.session = session;
    
    // Global receipt sequence for the month
    const counter = await Counters.findByIdAndUpdate(`receipt_seq_${period}`, { $inc: { seq: 1 } }, opts);
    return `REC-${clientId}-${period}-${toBase36(counter.seq, 3)}`;
};

module.exports = { 
    getNextClientCode, 
    getNextInvoiceNumber, 
    getNextReceiptNumber, 
    Counters 
};