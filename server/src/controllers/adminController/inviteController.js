// server/src/controllers/admin/inviteController.js
const crypto = require('crypto');
const { findSelfAdmin, cognito } = require('./adminUtils');
const Client = require('../../models/Client');

// Send a login invite to the Competent Person, or restore their access if rehired
exports.inviteCompetentPerson = async (req, res) => {
  try {
    const admin = await findSelfAdmin(req);
    
    const cpEmail = admin?.competentPerson?.emails?.[0];
    const cpPhoneRaw = admin?.competentPerson?.phones?.[0]; 

    if (!cpEmail || !cpPhoneRaw) {
      return res.status(400).json({ message: 'Competent Person must have both a primary email and phone number set.' });
    }

    const cpPhone = cpPhoneRaw.startsWith('+91') ? cpPhoneRaw : `+91${cpPhoneRaw.replace(/\D/g, '')}`;

    try {
      // Try to create a brand new user
      await cognito.adminCreateUser({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: cpEmail,
        UserAttributes: [
          { Name: 'email', Value: cpEmail },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'phone_number', Value: cpPhone }, 
          { Name: 'phone_number_verified', Value: 'true' },
          { Name: 'name', Value: admin?.competentPerson?.name || 'Competent Person' }
        ],
        DesiredDeliveryMediums: ['EMAIL']
      }).promise();

      await cognito.adminAddUserToGroup({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: cpEmail,
        GroupName: 'Admin' 
      }).promise();

      res.json({ success: true, message: 'Invite sent! They will receive a temporary password via email.' });

    } catch (cognitoErr) {
      // If they already exist, they might be a rehired employee
      if (cognitoErr.code === 'UsernameExistsException') {
        const user = await cognito.adminGetUser({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: cpEmail
        }).promise();

        // Re-enable their account if they were previously suspended
        if (!user.Enabled) {
          await cognito.adminEnableUser({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: cpEmail
          }).promise();
        }

        // Check if we need to resend the temp password, or if they have a permanent one
        if (user.UserStatus === 'FORCE_CHANGE_PASSWORD') {
          await cognito.adminCreateUser({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: cpEmail,
            MessageAction: 'RESEND'
          }).promise();
          return res.json({ success: true, message: 'Invite resent! Check spam folder.' });
        } else {
          return res.json({ success: true, message: 'Access Restored! CP already has an active account. They can log in with their existing password (or click Forgot Password).' });
        }
      }
      throw cognitoErr;
    }

  } catch (err) {
    console.error('Cognito Invite Error:', err);
    res.status(500).json({ message: err.message || 'Failed to send invite.' });
  }
};

exports.generateInviteCode = async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const code = crypto.randomBytes(5).toString('hex').toUpperCase();

    client.inviteCode = code;
    client.inviteCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await client.save();

    // ✨ FIX: Swapped local IP for the production domain!
    const text = `Hello ${client.establishmentName}, your exclusive invite code for the VitalMEDS portal is: *${code}*.\n\nPlease visit https://corevitalmeds.page/claim-account to claim your profile and view your past invoices. Valid for 24 hours.`;
    
    const waLink = `https://wa.me/?text=${encodeURIComponent(text)}`;

    res.json({ success: true, code, waLink });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};