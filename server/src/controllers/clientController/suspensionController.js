// server/src/controllers/clientController/suspensionController.js
const Client = require('../../models/Client');
const crypto = require('crypto');
const { sendMail } = require('../../utils/mailer');
const { findOwnerOf } = require('./clientHelpers');

exports.requestSuspendOtp = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const otp = crypto.randomInt(100000, 999999).toString();

    client.suspendOtp = otp;
    client.suspendOtpExpiry = new Date(Date.now() + 10 * 60000); 
    await client.save();

    const adminEmail = req.admin?.email || 'admin@vitalmeds.com'; 

    const html = `
            <h2>Security Alert: Account Suspension</h2>
            <p>You requested to suspend <b>${client.establishmentName}</b>.</p>
            <p>Your authorization OTP is: <strong style="font-size:24px; color:#ef4444;">${otp}</strong></p>
            <p>Valid for 10 minutes.</p>
        `;

    try {
      await sendMail(adminEmail, `VitalMEDS - Suspend Authorization (${client.clientId})`, html);
    } catch (mailErr) {
      console.log('\n=============================================');
      console.log(`🔒 DEV OTP GENERATED FOR ${client.establishmentName}: ${otp}`);
      console.log('=============================================\n');
    }

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifySuspendOtp = async (req, res) => {
  try {
    const { otp, reason } = req.body;
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    if (!client.suspendOtp || String(client.suspendOtp).trim() !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid or incorrect OTP.' });
    }

    if (new Date() > new Date(client.suspendOtpExpiry)) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    client.status = 'Suspended';
    if (reason) client.documentIssues = [reason];

    client.suspendOtp = undefined;
    client.suspendOtpExpiry = undefined;
    client.updatedBy = req.admin?._id;

    await client.save();
    res.json({ success: true, message: 'Account successfully suspended.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reactivateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    if (client.status !== 'Suspended') {
      return res.status(400).json({ message: 'Only suspended accounts can be reactivated.' });
    }

    const uniqueChecks = [];
    if (client.gstin) uniqueChecks.push(findOwnerOf('gstin', client.gstin, id).then(o => o && `GSTIN is now registered with ${o}.`));
    if (client.pan) uniqueChecks.push(findOwnerOf('pan', client.pan, id).then(o => o && `PAN is now registered with ${o}.`));
    if (client.aadhaar || client.aadhaarNumber) {
      const aadharVal = client.aadhaar || client.aadhaarNumber;
      uniqueChecks.push(findOwnerOf('aadhaar', aadharVal, id).then(o => o && `Aadhaar is now registered with ${o}.`));
    }

    client.contacts.forEach(c => {
      if (c.phone) uniqueChecks.push(findOwnerOf('phone', c.phone, id).then(o => o && `Phone ${c.phone} is now registered with ${o}.`));
    });

    if (client.drugLicenses && Array.isArray(client.drugLicenses)) {
      client.drugLicenses.forEach(lic => {
        const licNum = typeof lic === 'string' ? lic : lic.number;
        if (licNum) uniqueChecks.push(findOwnerOf('drugLicense', licNum, id).then(o => o && `Drug Licence ${licNum} is now registered with ${o}.`));
      });
    }

    const dupeMessages = (await Promise.all(uniqueChecks)).filter(Boolean);
    if (dupeMessages.length > 0) {
      return res.status(409).json({ message: "Cannot reactivate: " + dupeMessages.join(' ') });
    }

    client.status = 'Active';
    client.updatedBy = req.admin?._id;
    await client.save();

    res.status(200).json({ success: true, message: 'Account successfully reactivated.', data: client });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};