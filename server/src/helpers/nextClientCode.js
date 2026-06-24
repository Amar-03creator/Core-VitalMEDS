const Client = require('../models/Client');

async function getNextClientCode(session) {
  const lastValid = await Client.findOne({
    clientId: { $regex: /^[0-9A-Z]{3}$/ }
  })
    .sort({ clientId: -1 })
    .select('clientId')
    .session(session || null)
    .lean();

  let nextDecimal = 0;
  if (lastValid?.clientId) {
    nextDecimal = parseInt(lastValid.clientId, 36) + 1;
  }

  if (nextDecimal >= 36 ** 3) {
    throw new Error('Client ID pool exhausted (max 36^3 = 46656).');
  }

  return nextDecimal.toString(36).toUpperCase().padStart(3, '0');
}

module.exports = getNextClientCode;