const express = require('express');
const router = express.Router();
const { 
  registerInit, 
  registerVerify, 
  verifyInviteCode, 
  claimAccount,
  forgotPasswordInit,    
  forgotPasswordConfirm  
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const Admin = require('../models/Admin');
const Client = require('../models/Client');

// ── Registration ────────────────────────────────────────────────────────
router.post('/register-init', registerInit);     // ✨ STEP A: Sends OTP
router.post('/register-verify', registerVerify); // ✨ STEP B: Checks OTP & Saves
router.post('/verify-invite', verifyInviteCode);
router.post('/claim-account', claimAccount);
router.post('/forgot-password-init', forgotPasswordInit);
router.post('/forgot-password-confirm', forgotPasswordConfirm);

// ── Verify Token (JIT Provisioning & Login) ─────────────────────────────
router.post('/verify-token', authenticate, async (req, res) => {
  try {
    const { cognitold, email } = req.user;
    if (!email) throw new Error("No email found in token payload");

    // ✨ NO HARDCODING: We trust the role AWS Cognito attached to the token
    const role = req.user.role || 'client'; 

    // Admin Flow
    if (role === 'admin') {
      let admin = await Admin.findOne({ cognitold });
      if (!admin) {
        admin = new Admin({
          cognitold,
          email,
          name: 'Master Admin',
          businessName: 'Mila Agencies'
        });
        await admin.save();
      }
      return res.json({ role: 'admin', profile: admin });
    }

    // Client Flow (Case-insensitive search)
    const client = await Client.findOne({ 'contacts.email': new RegExp(`^${email}$`, 'i') }).select('-__v');
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found in Database' });
    }
    
    return res.json({ 
      role: 'client', 
      profile: client, 
      status: client.status 
    });

  } catch (err) {
    console.error("verify-token error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Check Existing Customer (Auto-fill) ─────────────────────────────────
router.get('/check-existing-customer', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || name.trim().length < 3) return res.json({ found: false });

    const client = await Client.findOne({
      establishmentName: { $regex: name.trim(), $options: 'i' },
      status: { $in: ['Pending', 'Active', 'Static'] }
    }).select('establishmentName city businessType gstin drugLicenses contacts');

    if (!client) return res.json({ found: false });

    return res.json({
      found: true,
      preFill: {
        establishmentName: client.establishmentName,
        ownerName: client.contacts?.[0]?.name || '',
        city: client.city,
        businessType: client.businessType,
        gstin: client.gstin,
        drugLicense20B: client.drugLicenses?.[0]?.number || '',
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;