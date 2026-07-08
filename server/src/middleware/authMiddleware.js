// server/src/middleware/authMiddleware.js
const { CognitoJwtVerifier } = require('aws-jwt-verify');

// Create the verifier
const verifier = CognitoJwtVerifier.create({
  userPoolId: 'ap-south-1_t7cmqYdPT', // ✨ Hardcoded
  tokenUse: 'id',
  clientId: '2gomoic0dpgtimj3dg8tfjqceu', // ✨ Hardcoded
});

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token with AWS
    const payload = await verifier.verify(token);
    
    // Attach user profile data to the request
    req.user = {
      cognitold: payload.sub,
      email: payload.email,
      role: payload['cognito:groups']?.[0] || 'client',
      clientId: payload['custom:clientId'] || null,
    };
    
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Role guard factory (Optional, but great for securing specific routes later)
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  }
  next();
};

// ✨ MUST EXPORT CORRECTLY SO authRoutes.js CAN FIND IT
module.exports = { authenticate, authorize };