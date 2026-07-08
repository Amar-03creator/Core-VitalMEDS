const express = require('express');
const router = express.Router();
const { registerClient } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const Admin = require('../models/Admin');
const Client = require('../models/Client');

// ── Registration ────────────────────────────────────────────────────────
router.post('/register', registerClient);

// ── Verify Token (JIT Provisioning & Login) ─────────────────────────────
router.post('/verify-token', authenticate, async (req, res) => {
  try {
    console.log("=== RAW AWS PAYLOAD ===", req.user);
    const { cognitold, email } = req.user;
    let role = req.user.role; // Make this a let variable so we can override it

    // ✨ THE BULLETPROOF FAILSAFE: Hardcode your master email
    const masterEmails = ['456amarnath@gmail.com'];
    if (masterEmails.includes(email.toLowerCase())) {
      role = 'admin';
    }

    // Admin Flow: Auto-create the Admin profile if it doesn't exist
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

    // Client Flow
    const client = await Client.findOne({ 'contacts.email': email }).select('-__v');
    if (!client) return res.status(404).json({ error: 'Client not found' });
    
    return res.json({
      role: 'client',
      profile: client,
      status: client.status
    });

  } catch (err) {
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