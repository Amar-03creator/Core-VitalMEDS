const mongoose = require('mongoose');

// Reuses the same `Counters` collection pattern described in the docs for
// invoice/receipt numbering (findOneAndUpdate + $inc, atomic).
const Counters = mongoose.models.Counters || mongoose.model('Counters', new mongoose.Schema({
    _id: { type: String, required: true }, // e.g. 'debitNote'
    seq: { type: Number, default: 0 },
}));

/**
 * getNextSequence
 * Atomically increments and returns the next sequence number for a given counter key.
 */
const getNextSequence = async (key, session = null) => {
    const opts = { new: true, upsert: true };
    if (session) opts.session = session;
    const counter = await Counters.findByIdAndUpdate(key, { $inc: { seq: 1 } }, opts);
    return counter.seq;
};

module.exports = { getNextSequence, Counters };