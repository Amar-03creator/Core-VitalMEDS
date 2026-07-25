// server/src/helpers/idSequence.js
const Counter = require('../models/Counter');

// 01…09, 0A…0Z, 10…19, 1A…1Z, … — base-36, zero-padded to 2 chars, 1-indexed.
const toBase36Pair = (n) => n.toString(36).toUpperCase().padStart(2, '0');

/**
 * Generates ids shaped PREFIX-CUS-MM-YY-ZZ (e.g. ORD-A1B-07-26-01), per the
 * Admin Orders Page doc's ID format. ZZ is an atomic sequence scoped per
 * (prefix + clientCode + month + year) via a Counter document — this keeps
 * two different clients, or the same client in two different months, from
 * ever fighting over the same counter, and keeps ZZ itself short.
 *
 * clientCode should be the client's own 3-char clientId code (per the doc:
 * "yes 'CUS' will be the clientID 3 digit code").
 */
async function nextFormattedId(prefix, clientCode) {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const counterKey = `${prefix}_${clientCode}_${mm}${yy}`;

  const counter = await Counter.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `${prefix}-${clientCode}-${mm}-${yy}-${toBase36Pair(counter.seq)}`;
}

module.exports = { nextFormattedId };