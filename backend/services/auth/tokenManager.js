const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-env';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-env';
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days

/**
 * Generate access and refresh tokens
 * @param {string} userId - MongoDB user ID
 * @param {Object} userData - User data to include in token
 * @returns {Object} { accessToken, refreshToken }
 */
exports.generateTokens = (userId, userData = {}) => {
  const payload = {
    userId,
    phoneNumber: userData.phoneNumber,
    firstName: userData.firstName,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token
 */
exports.verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token
 */
exports.verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    return decoded;
  } catch (err) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Hash password
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {boolean} True if match
 */
exports.comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

module.exports = {
  generateTokens: exports.generateTokens,
  verifyAccessToken: exports.verifyAccessToken,
  verifyRefreshToken: exports.verifyRefreshToken,
  hashPassword: exports.hashPassword,
  comparePassword: exports.comparePassword,
};
