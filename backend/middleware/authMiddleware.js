const tokenManager = require('../services/auth/tokenManager');

/**
 * Middleware to verify access token from Authorization header
 * Header format: Authorization: Bearer <token>
 */
exports.verifyAccessToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = tokenManager.verifyAccessToken(token);

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ 
      error: 'Invalid or expired token', 
      details: err.message 
    });
  }
};

module.exports = {
  verifyAccessToken: exports.verifyAccessToken,
};
