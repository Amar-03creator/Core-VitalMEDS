// server/src/controllers/authController.js
const Client = require('../models/Client');
const { getNextClientCode } = require('../helpers/SequenceHelper');
const AWS = require('aws-sdk');

/* ── MASKING HELPERS ── */
const maskEmail = (email) => {
  if (!email) return null;
  const [name, domain] = email.split('@');
  return `${name.charAt(0)}***@${domain}`;
};

const maskPhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return null;
  return `+91 ******${cleaned.slice(-4)}`;
};

/* ── 1. STANDARD REGISTRATION ── */
exports.registerClient = async (req, res) => {
  try {
    const {
      establishmentName, ownerName, designation, businessType,
      email, phone, password,
      billingAddress, shippingAddress, city, district, pincode,
      gstin, drugLicense20B, drugLicense21B, aadhaar, pan
    } = req.body;

    const existingClient = await Client.findOne({
      $or: [{ 'contacts.email': email }, { 'contacts.phone': phone }]
    });

    if (existingClient) {
      return res.status(400).json({ message: 'A client with this email or phone already exists.' });
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    const cognito = new AWS.CognitoIdentityServiceProvider({
      region: process.env.AWS_REGION || 'ap-south-1'
    });

    await cognito.adminCreateUser({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'phone_number', Value: formattedPhone },
        { Name: 'phone_number_verified', Value: 'true' }
      ],
      MessageAction: 'SUPPRESS' 
    }).promise();

    await cognito.adminSetUserPassword({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true
    }).promise();

    await cognito.adminAddUserToGroup({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email,
      GroupName: 'client'
    }).promise();

    const uniqueId = await getNextClientCode();

    const newClient = new Client({
      establishmentName,
      clientId: uniqueId,
      businessType,
      status: 'Pending',
      billingAddress,
      shippingAddress: shippingAddress || billingAddress, 
      city, district, pincode,
      gstin: gstin || undefined,
      drugLicense20B, drugLicense21B,
      panNumber: pan || undefined,
      aadhaarNumber: aadhaar || undefined,
      contacts: [{
        name: ownerName,
        designation: designation,
        email: email,
        phone: phone,
        isPrimary: true
      }]
    });

    await newClient.save();
    res.status(201).json({ success: true, message: 'Registration complete' });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: error.message || 'Server Error during registration' });
  }
};

/* ── 2. VERIFY INVITE CODE (Old Customer Entry) ── */
exports.verifyInviteCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required.' });

    const client = await Client.findOne({ 
      inviteCode: code.toUpperCase().trim(),
      inviteCodeExpiry: { $gt: new Date() } // Must not be expired
    });

    if (!client) {
      return res.status(404).json({ message: 'Invalid or expired invite code.' });
    }

    if (client.isClaimed) {
      return res.status(400).json({ message: 'This account has already been claimed.' });
    }

    // Extract and mask existing contacts safely
    const suggestedContacts = client.contacts
      .map(c => ({
        originalEmail: c.email,
        originalPhone: c.phone,
        maskedEmail: maskEmail(c.email),
        maskedPhone: maskPhone(c.phone)
      }))
      .filter(c => c.maskedEmail || c.maskedPhone);

    res.json({
      success: true,
      data: {
        establishmentName: client.establishmentName,
        suggestedContacts
      }
    });

  } catch (err) {
    console.error("verifyInviteCode error:", err);
    res.status(500).json({ message: 'Failed to verify code.' });
  }
};

/* ── 3. CLAIM ACCOUNT (Old Customer Registration) ── */
exports.claimAccount = async (req, res) => {
  try {
    const { code, email, password } = req.body;

    // 1. Verify code again to prevent bypasses
    const client = await Client.findOne({ 
      inviteCode: code.toUpperCase().trim(),
      inviteCodeExpiry: { $gt: new Date() },
      isClaimed: false
    });

    if (!client) {
      return res.status(400).json({ message: 'Invalid or expired invite code.' });
    }

    // 2. Check if this specific email is already used in MongoDB by another client
    const emailTaken = await Client.findOne({ 
      _id: { $ne: client._id }, 
      'contacts.email': email 
    });
    if (emailTaken) {
      return res.status(400).json({ message: 'This email is already associated with another pharmacy.' });
    }

    // 3. Provision them in AWS Cognito
    const cognito = new AWS.CognitoIdentityServiceProvider({
      region: process.env.AWS_REGION || 'ap-south-1'
    });

    try {
      await cognito.adminCreateUser({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' }
        ],
        MessageAction: 'SUPPRESS' 
      }).promise();

      await cognito.adminSetUserPassword({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: email,
        Password: password,
        Permanent: true
      }).promise();

      await cognito.adminAddUserToGroup({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: email,
        GroupName: 'client'
      }).promise();
    } catch (awsErr) {
      if (awsErr.code === 'UsernameExistsException') {
        return res.status(400).json({ message: 'An account with this email already exists. Please log in.' });
      }
      throw awsErr;
    }

    // 4. Update MongoDB Client Record
    // Check if the chosen email matches an existing contact. If not, add it.
    const contactIndex = client.contacts.findIndex(c => c.email === email);
    if (contactIndex === -1) {
      // Find the primary contact or just use the first one, and update their email
      const primaryIndex = client.contacts.findIndex(c => c.isPrimary);
      if (primaryIndex >= 0) {
        client.contacts[primaryIndex].email = email;
      } else {
        client.contacts.push({ name: 'Owner', email: email, isPrimary: true, designation: 'Owner' });
      }
    }

    // Clear the invite code, mark as claimed, and instantly activate!
    client.inviteCode = undefined;
    client.inviteCodeExpiry = undefined;
    client.isClaimed = true;
    client.status = 'Active'; 

    await client.save();

    res.json({ success: true, message: 'Account successfully claimed!' });

  } catch (error) {
    console.error('claimAccount error:', error);
    res.status(500).json({ message: error.message || 'Server error while claiming account.' });
  }
};