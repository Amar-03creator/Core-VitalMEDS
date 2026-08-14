// server/src/controllers/admin/adminUtils.js
const Admin = require('../../models/Admin');
const AWS = require('aws-sdk');

exports.cognito = new AWS.CognitoIdentityServiceProvider({ region: process.env.AWS_REGION || 'ap-south-1' });

exports.GRACE_PERIOD_MS = 72 * 60 * 60 * 1000;

exports.findSelfAdmin = async (req) => {
  const loginEmail = req.user.email.trim();
  const sharedEstablishment = await Admin.findOne({
    $or: [
      { 'proprietor.emails': new RegExp(`^${loginEmail}$`, 'i') },
      { 'competentPerson.emails': new RegExp(`^${loginEmail}$`, 'i') }
    ]
  });
  if (sharedEstablishment) return sharedEstablishment; 
  return Admin.findOne({ cognitold: req.user.cognitold });
};

exports.isWithinGracePeriod = (timestamp) => {
  if (!timestamp) return true;
  return (Date.now() - new Date(timestamp).getTime()) <= exports.GRACE_PERIOD_MS;
};