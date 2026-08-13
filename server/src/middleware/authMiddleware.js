const { CognitoJwtVerifier } = require('aws-jwt-verify');
const Client = require('../models/Client');
const Admin = require('../models/Admin'); // ✨ FIX: Imported Admin Model for the Bouncer

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
    
    const groups = payload['cognito:groups'] || [];
    const isAdmin = groups.some(g => g && g.toLowerCase().includes('admin'));
    
    let specificRole = 'System Admin';
    let personName = 'Admin';

    // ✨ THE SMART BOUNCER: Figure out exactly who this Admin is!
    if (isAdmin) {
      const loginEmail = payload.email.toLowerCase();
      // Grab the ONE true master document
      const adminDoc = await Admin.findOne({ 
        gstinAdmin: { $exists: true, $ne: '' } 
      }).sort({ updatedAt: -1 });

      if (adminDoc) {
        const isProp = adminDoc.proprietor?.emails?.some(e => e.toLowerCase() === loginEmail);
        const isCP = adminDoc.competentPerson?.emails?.some(e => e.toLowerCase() === loginEmail);

        if (isProp) {
          specificRole = 'Proprietor';
          personName = adminDoc.proprietor.name || 'Proprietor';
        } else if (isCP) {
          if (adminDoc.competentPerson.isSuspended) {
            return res.status(403).json({ error: 'SUSPENDED_CP', message: 'You have been suspended by the proprietor.' });
          }
          specificRole = 'Competent Person';
          personName = adminDoc.competentPerson.name || 'Competent Person';
        }
      }
    }
    
    // Attach user profile data with exact identity
    req.user = {
      cognitold: payload.sub,
      email: payload.email,
      role: isAdmin ? 'admin' : 'client',
      isAdmin: isAdmin,
      adminRole: specificRole, // ✨ NOW WE KNOW THE SEAT
      name: personName,        // ✨ NOW WE KNOW THE NAME
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

const requireActiveClient = async (req, res, next) => {
  try {
    if (req.user?.isAdmin) return next(); 

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