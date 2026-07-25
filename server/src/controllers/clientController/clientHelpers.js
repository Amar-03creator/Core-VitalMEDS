// server/src/controllers/clientController/clientHelpers.js
const Client = require('../../models/Client');
const Notification = require('../../models/Notification');

exports.notifyClient = async (clientId, payload) => {
  try {
    await Notification.create({ recipientId: clientId, recipientRole: 'client', ...payload });
  } catch (err) {
    console.error('notifyClient error:', err);
  }
};

exports.isValidGSTIN = (v) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{2}[0-9A-Z]{1}$/.test(v);
exports.isValidPAN = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
exports.isValidAadhaar = (v) => /^[2-9][0-9]{11}$/.test(v);
exports.isValidDL = (v) => /^[A-Za-z0-9\/\s\-]{5,40}$/.test(v);
exports.isValidEmail = (v) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
exports.isValidMobile = (v) => /^[6-9]\d{9}$/.test(v);
exports.isValidPincode = (v) => /^[1-9][0-9]{5}$/.test(v);

exports.strip91 = (num) => (num ? num.replace(/^\+91/, '').replace(/\D/g, '') : undefined);

exports.findOwnerOf = async (field, value, excludeId = null) => {
  const query = { [field]: { $regex: `^${value}$`, $options: 'i' } };

  if (field === 'drugLicense') {
    let clientQuery = { 'drugLicenses.number': { $regex: `^${value}$`, $options: 'i' } };
    if (excludeId) clientQuery._id = { $ne: excludeId };
    const client = await Client.findOne(clientQuery);
    return client ? `Client "${client.establishmentName}"` : null;
  }

  if (field === 'phone') {
    const normalised = exports.strip91(value);
    let clientQuery = {
      $or: [{ phone: normalised }, { whatsapp: normalised }, { 'contacts.phone': normalised }]
    };
    if (excludeId) clientQuery._id = { $ne: excludeId };
    const client = await Client.findOne(clientQuery);
    return client ? `Client "${client.establishmentName}"` : null;
  }

  let clientQuery = { ...query };
  if (excludeId) clientQuery._id = { $ne: excludeId };
  const client = await Client.findOne(clientQuery);
  return client ? `Client "${client.establishmentName}"` : null;
};