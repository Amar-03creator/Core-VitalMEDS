const Client = require('../models/Client');
const { getNextClientCode } = require('../helpers/SequenceHelper');
const AWS = require('aws-sdk');

exports.registerClient = async (req, res) => {
  try {
    const {
      establishmentName, ownerName, designation, businessType,
      email, phone, password, // ✨ NOW WE RECEIVE THEIR TYPED PASSWORD
      billingAddress, shippingAddress, city, district, pincode,
      gstin, drugLicense20B, drugLicense21B, aadhaar, pan
    } = req.body;

    // 1. Check if email or phone already exists
    const existingClient = await Client.findOne({
      $or: [{ 'contacts.email': email }, { 'contacts.phone': phone }]
    });

    if (existingClient) {
      return res.status(400).json({ message: 'A client with this email or phone already exists.' });
    }

    // 2. Format the phone number for AWS (+91 format)
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    // ─── ✨ INSTANT AWS PROVISIONING ✨ ───
    const cognito = new AWS.CognitoIdentityServiceProvider({
      region: process.env.AWS_REGION || 'ap-south-1'
    });

    // A. Create the user silently (SUPPRESS stops the welcome email)
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

    // B. Set their typed password permanently
    await cognito.adminSetUserPassword({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true // They will never see the "Update Password" screen!
    }).promise();

    // C. Add them to the Client group
    await cognito.adminAddUserToGroup({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email,
      GroupName: 'client'
    }).promise();
    // ────────────────────────────────────────

    // 3. Safely get the next sequence ID
    const uniqueId = await getNextClientCode();

    // 4. Create the new Pending Client in MongoDB
    const newClient = new Client({
      establishmentName,
      clientId: uniqueId,
      businessType,
      status: 'Pending', // ✨ They are in the DB, but their status is restricted
      billingAddress,
      shippingAddress: shippingAddress || billingAddress, 
      city,
      district,
      pincode,
      gstin: gstin || undefined,
      drugLicense20B,
      drugLicense21B,
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