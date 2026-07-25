// server/src/middleware/authMiddleware.js
const { CognitoJwtVerifier } = require('aws-jwt-verify');

// Create the verifier
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID, 
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID, 
});

// const authenticate = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader?.startsWith('Bearer ')) {
//       return res.status(401).json({ error: 'No token provided' });
//     }

//     const token = authHeader.split(' ')[1];
    
//     // Verify the token with AWS
//     const payload = await verifier.verify(token);
    
//     // Attach user profile data to the request
//     req.user = {
//       cognitold: payload.sub,
//       email: payload.email,
//       role: payload['cognito:groups']?.[0] || 'client',
//       clientId: payload['custom:clientId'] || null,
//     };
    
//     next();
//   } catch (err) {
//     console.error('Auth error:', err.message);
//     return res.status(401).json({ error: 'Invalid or expired token' });
//   }
// };

// // Role guard factory (Optional, but great for securing specific routes later)
// const authorize = (...roles) => (req, res, next) => {
//   if (!roles.includes(req.user?.role)) {
//     return res.status(403).json({ error: 'Forbidden: insufficient role' });
//   }
//   next();
// };

// // ✨ MUST EXPORT CORRECTLY SO authRoutes.js CAN FIND IT
// module.exports = { authenticate, authorize };

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
      // ✨ FIX: Restored the typo 'cognitold' (with an L) so it perfectly matches your MongoDB Schema!
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

module.exports = { authenticate, authorize, requireAdmin, requireClient };