// server/src/middleware/authMiddleware.js
const { CognitoJwtVerifier } = require('aws-jwt-verify');
const Client = require('../models/Client'); // ✨ FIX: Imported Client Model

// Create the verifier
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID, 
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID, 
});

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifier.verify(token);
    
    // Safely check for admin (handles 'Admin', 'admins', 'SuperAdmin', etc.)
    const groups = payload['cognito:groups'] || [];
    const isAdmin = groups.some(g => g && g.toLowerCase().includes('admin'));
    
    // Attach user profile data
    req.user = {
      cognitold: payload.sub,
      email: payload.email,
      role: isAdmin ? 'admin' : 'client',
      isAdmin: isAdmin,
      clientId: payload['custom:clientId'] || null,
    };

    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Route Guards
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireClient = (req, res, next) => {
  if (req.user?.isAdmin) {
    return res.status(403).json({ error: 'Client access required' });
  }
  next();
};

// ✨ NEW: Enforces the Zero-Trust Jail at the API level
const requireActiveClient = async (req, res, next) => {
  try {
    if (req.user?.isAdmin) return next(); // Admins bypass this

    // Fetch the client's current status from MongoDB
    const client = await Client.findOne({ 'contacts.email': new RegExp(`^${req.user.email}$`, 'i') });
    
    if (!client) {
      return res.status(404).json({ error: 'Client profile not found.' });
    }

    if (!client.documentsUploaded) {
      return res.status(403).json({ error: 'Action blocked: KYC documents not uploaded.' });
    }
    
    if (client.status !== 'Active') {
      return res.status(403).json({ error: 'Action blocked: Account is pending admin approval or suspended.' });
    }

    next();
  } catch (err) {
    console.error('requireActiveClient error:', err);
    res.status(500).json({ error: 'Server error verifying account status.' });
  }
};

module.exports = { authenticate, authorize, requireAdmin, requireClient, requireActiveClient };