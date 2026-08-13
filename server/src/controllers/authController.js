// server/src/controllers/authController.js
const mongoose = require('mongoose');
const Client = require('../models/Client');
const Admin = require('../models/Admin'); // ✨ NEW
const Notification = require('../models/Notification'); // ✨ NEW
const { getNextClientCode } = require('../helpers/SequenceHelper');
const AWS = require('aws-sdk');
const { sendMail } = require('../utils/mailer');

/* ── MASKING & FORMATTING HELPERS ── */
const maskEmail = (email) => {
  if (!email) return null;
  const [name, domain] = email.split('@');
  return `${name.charAt(0)}***@${domain}`;
};

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } 
});
const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);

const maskPhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return null;
  return `+91 ******${cleaned.slice(-4)}`;
};

// ✨ FIX: Helper to sanitize phone numbers before saving to MongoDB
const strip91 = (num) => (num ? num.replace(/^\+91/, '').replace(/\D/g, '') : undefined);


/* ── 1. REGISTRATION: STEP A (Send OTP) ── */
exports.registerInit = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Check if email/phone exists in MongoDB first
    const existingClient = await Client.findOne({
      $or: [{ 'contacts.email': email }, { 'contacts.phone': phone }]
    });

    if (existingClient) {
      return res.status(400).json({ message: 'A client with this email or phone already exists.' });
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    const cognito = new AWS.CognitoIdentityServiceProvider({ region: process.env.AWS_REGION });

    // Use native signUp to trigger AWS Cognito's automated OTP to email/phone
    await cognito.signUp({
      ClientId: process.env.COGNITO_CLIENT_ID, // Use ClientId, NOT UserPoolId here
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'phone_number', Value: formattedPhone }
      ]
    }).promise();

    res.status(200).json({ success: true, message: 'OTP sent successfully. Please check your email.' });
  } catch (error) {
    console.error('Register Init Error:', error);
    
    // ✨ FIX: Handle the Unconfirmed User Deadlock
    if (error.code === 'UsernameExistsException') {
      try {
        const cognito = new AWS.CognitoIdentityServiceProvider({ region: process.env.AWS_REGION });
        await cognito.resendConfirmationCode({
          ClientId: process.env.COGNITO_CLIENT_ID,
          Username: email
        }).promise();
        return res.status(200).json({ success: true, message: 'OTP resent to existing unconfirmed account.' });
      } catch (resendError) {
        return res.status(400).json({ message: 'An account with this email is already fully registered. Please log in.' });
      }
    }
    
    res.status(500).json({ message: error.message || 'Failed to initiate registration.' });
  }
};

/* ── 1. REGISTRATION: STEP B (Verify OTP & Create Record) ── */
/* ── 1. REGISTRATION: STEP B (Verify OTP & Create Record) ── */
exports.registerVerify = async (req, res) => {
  const {
    otp, establishmentName, ownerName, designation, businessType,
    email, phone, billingAddress, shippingAddress, city, district, pincode,
    gstin, aadhaar, pan,
    drugLicenses // ✨ NEW: Expect the array
  } = req.body;

  const cognito = new AWS.CognitoIdentityServiceProvider({ region: process.env.AWS_REGION || 'ap-south-1' });

  // ==========================================
  // PHASE 1: Verify OTP with AWS Cognito
  // ==========================================
  try {
    // 1. Verify the OTP
    await cognito.confirmSignUp({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: otp
    }).promise();

    // 2. Add to Client group
    await cognito.adminAddUserToGroup({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email,
      GroupName: 'client'
    }).promise();
    
  } catch (cognitoError) {
    console.error('Cognito Verify Error:', cognitoError);
    if (cognitoError.code === 'CodeMismatchException' || cognitoError.code === 'ExpiredCodeException') {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
    return res.status(500).json({ message: cognitoError.message || 'Server Error during OTP verification.' });
  }

  // ==========================================
  // PHASE 2: Save to MongoDB with Auto-Rollback
  // ==========================================
  try {
    const uniqueId = await getNextClientCode();

    // ✨ Filter out any empty drug licenses just to be safe
    const cleanDrugLicenses = Array.isArray(drugLicenses) 
        ? drugLicenses.filter(lic => lic && lic.trim() !== '') 
        : [];

    const newClient = new Client({
      establishmentName,
      clientId: uniqueId,
      businessType,
      status: 'Pending',
      documentsUploaded: false,
      billingAddress,
      shippingAddress: shippingAddress || billingAddress, 
      city, district, pincode,
      gstin: gstin || undefined,
      panNumber: pan || undefined,
      aadhaarNumber: aadhaar || undefined,
      drugLicenses: cleanDrugLicenses, // ✨ NEW: Save the array
      contacts: [{
        name: ownerName,
        designation: designation,
        email: email,
        phone: strip91(phone), // ✨ FIX: Sanitize before saving
        isPrimary: true
      }]
    });

    await newClient.save();

    await notifyAllAdmins({
      type: 'registration',
      title: 'New Client Registration',
      message: `${establishmentName} has registered and is pending KYC document upload/approval.`,
      link: `/admin-dashboard/customers/${newClient._id}`
    });
    
    return res.status(201).json({ success: true, message: 'Registration complete! You can now log in.' });

  } catch (dbError) {
    console.error('Database save failed during registration:', dbError);

    // 🚨 THE ROLLBACK: MongoDB failed, so delete the user from Cognito
    try {
      await cognito.adminDeleteUser({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: email
      }).promise();
      console.log(`Rollback successful: Deleted ${email} from Cognito due to DB failure.`);
    } catch (rollbackError) {
      console.error(`CRITICAL: Failed to rollback user ${email} from Cognito:`, rollbackError);
    }

    // Return the appropriate error to the frontend
    if (dbError.code === 11000) {
       return res.status(400).json({ message: 'Database conflict (Duplicate entry). Please check your details and try again.' });
    }
    return res.status(500).json({ message: dbError.message || 'Failed to save profile. Please try again.' });
  }
};

async function notifyAllAdmins({ type, title, message, link }) {
  try {
    const admins = await Admin.find({}, '_id');
    if (!admins.length) return;
    await Notification.insertMany(
      admins.map((a) => ({ recipientId: a._id, recipientRole: 'admin', type, title, message, link }))
    );
  } catch (err) {
    console.error("Failed to notify admins:", err);
  }
}

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
    const contactIndex = client.contacts.findIndex(c => c.email === email);
    if (contactIndex === -1) {
      const primaryIndex = client.contacts.findIndex(c => c.isPrimary);
      if (primaryIndex >= 0) {
        client.contacts[primaryIndex].email = email;
      } else {
        client.contacts.push({ name: 'Owner', email: email, isPrimary: true, designation: 'Owner' });
      }
    }

    // Clear the invite code, mark as claimed, and instantly activate
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

/* ── 4. CUSTOM FORGOT PASSWORD (INITIATE) ── */
exports.forgotPasswordInit = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const searchEmail = email.trim().toLowerCase();

    // 1. Verify the email actually exists in our DB (Check Clients & Admins)
    const isClient = await Client.findOne({ 'contacts.email': new RegExp(`^${searchEmail}$`, 'i') });
    const isAdmin = await Admin.findOne({
      $or: [
        { email: new RegExp(`^${searchEmail}$`, 'i') },
        { 'proprietor.emails': new RegExp(`^${searchEmail}$`, 'i') },
        { 'competentPerson.emails': new RegExp(`^${searchEmail}$`, 'i') }
      ]
    });

    // We return success even if not found to prevent hackers from guessing emails
    if (!isClient && !isAdmin) {
      return res.status(200).json({ success: true, message: 'If an account exists, a recovery code was sent.' });
    }

    // 2. Generate a 6-digit OTP and save it
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.findOneAndUpdate(
      { email: searchEmail }, 
      { otp: otpCode, createdAt: new Date() }, 
      { upsert: true }
    );

    // 3. Send Email using your custom Mailer
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>VitalMEDS Password Reset</h2>
        <p>You requested a password reset. Here is your secure 6-digit verification code:</p>
        <h1 style="background: #f1f5f9; padding: 10px; text-align: center; letter-spacing: 5px; color: #0f172a;">${otpCode}</h1>
        <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;

    try {
      await sendMail(searchEmail, 'VitalMEDS Password Recovery Code', html);
    } catch (mailErr) {
      // Your Mailer's DEV Fallback will trigger here and print to the Node console!
      console.log(`\n🚨 [DEV FALLBACK] OTP FOR ${searchEmail} IS: ${otpCode} 🚨\n`);
    }

    res.status(200).json({ success: true, message: 'Recovery code sent successfully.' });

  } catch (err) {
    console.error('forgotPasswordInit Error:', err);
    res.status(500).json({ message: 'Failed to initiate password reset.' });
  }
};

/* ── 5. CUSTOM FORGOT PASSWORD (CONFIRM) ── */
exports.forgotPasswordConfirm = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const searchEmail = email.trim().toLowerCase();

    // 1. Verify OTP in MongoDB
    const record = await OTP.findOne({ email: searchEmail, otp: otp });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired recovery code.' });
    }

    // 2. Forcefully Overwrite the Password in AWS Cognito
    const cognito = new AWS.CognitoIdentityServiceProvider({ region: process.env.AWS_REGION || 'ap-south-1' });
    
    await cognito.adminSetUserPassword({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: searchEmail,
      Password: newPassword,
      Permanent: true // Instantly makes the password active without forcing another reset
    }).promise();

    // 3. Delete the used OTP
    await OTP.deleteOne({ _id: record._id });

    res.status(200).json({ success: true, message: 'Password updated successfully.' });

  } catch (err) {
    console.error('forgotPasswordConfirm Error:', err);
    res.status(500).json({ message: err.message || 'Failed to securely reset password.' });
  }
};