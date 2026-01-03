const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
const Request = require('../models/requestSchema');
const EmailOTPService = require('../services/auth/emailOTP');
const tokenManager = require('../services/auth/tokenManager');

/**
 * Request OTP via Email
 */
exports.requestOTPEmail = asyncHandler(async (req, res) => {
  const { phoneNumber, email, fullName } = req.body;

  if (!phoneNumber && !email) {
    return res.status(400).json({
      error: 'Phone number or email is required',
    });
  }

  // Find user by phone or email
  const user = await User.findOne({
    $or: [
      phoneNumber ? { phoneNumber } : {},
      email ? { email } : {},
    ].filter((q) => Object.keys(q).length > 0),
  });

  // Generate and send OTP
  const otpResult = await EmailOTPService.sendOTP(
    email || phoneNumber,
    fullName
  );

  if (!otpResult.success) {
    return res.status(500).json({
      error: otpResult.message || 'Failed to send OTP',
    });
  }

  // Store OTP temporarily (expires in 5 minutes)
  const tempToken = jwt.sign(
    {
      phoneNumber: phoneNumber || null,
      email: email || null,
      otp: otpResult.otp,
      expiresAt: otpResult.expiresAt.getTime(),
      fullName: fullName || '',
      isNewUser: !user,
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '5m' }
  );

  res.json({
    success: true,
    message: 'OTP sent successfully',
    contact: phoneNumber || email,
    otpToken: tempToken,
  });
});

/**
 * Verify OTP and create/login user
 */
exports.verifyOTPEmail = asyncHandler(async (req, res) => {
  const { phoneNumber, email, otp, fullName, otpToken } = req.body;

  if (!otp || !otpToken) {
    return res.status(400).json({
      error: 'OTP and OTP token are required',
    });
  }

  // Verify OTP token
  let otpData;
  try {
    otpData = jwt.verify(otpToken, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    return res.status(400).json({
      error: 'OTP token expired or invalid',
    });
  }

  // Verify OTP
  const verification = EmailOTPService.verifyOTP(
    otp,
    otpData.otp,
    new Date(otpData.expiresAt)
  );

  if (!verification.valid) {
    return res.status(400).json({
      error: verification.error,
    });
  }

  // Find or create user
  let user = await User.findOne({
    $or: [
      phoneNumber ? { phoneNumber } : {},
      email ? { email } : {},
    ].filter((q) => Object.keys(q).length > 0),
  });

  if (!user) {
    // Create new user
    user = await User.create({
      phoneNumber: phoneNumber || null,
      email: email || null,
      firstName: fullName?.split(' ')[0] || '',
      lastName: fullName?.split(' ')[1] || '',
      isPhoneVerified: true,
      isActive: true,
      lastLoginAt: new Date(),
    });
  } else {
    // Update verification
    user.isPhoneVerified = true;
    if (email) user.email = email;
    user.lastLoginAt = new Date();
    await user.save();
  }

  // Generate tokens
  const { accessToken, refreshToken } = tokenManager.generateTokens(
    user._id,
    {
      phoneNumber: user.phoneNumber,
      firstName: user.firstName,
      email: user.email,
    }
  );

  res.json({
    success: true,
    message: 'OTP verified successfully',
    token: accessToken,
    refreshToken,
    user: {
      _id: user._id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      phone: user.phoneNumber,
    },
  });
});

/**
 * Refresh access token using refresh token
 */
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ 
      error: 'Refresh token required' 
    });
  }

  try {
    const decoded = tokenManager.verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'User not found or inactive' 
      });
    }

    // Generate new access token
    const { accessToken } = tokenManager.generateTokens(
      user._id,
      { phoneNumber: user.phoneNumber, firstName: user.firstName }
    );

    res.json({
      success: true,
      accessToken,
    });
  } catch (err) {
    console.error('Token refresh error:', err.message);
    res.status(401).json({ 
      error: 'Token refresh failed', 
      details: err.message 
    });
  }
});

/**
 * Logout user
 */
exports.logout = asyncHandler(async (req, res) => {
  // Mobile app will clear tokens from secure storage
  // Backend just acknowledges the logout
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Get user profile
 */
exports.getUserProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch user profile', 
      details: err.message 
    });
  }
});

/**
 * Update user profile
 */
exports.updateUserProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, address, barangay, email } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        address: address || undefined,
        barangay: barangay || undefined,
        email: email || undefined,
        updatedAt: new Date(),
      },
      { new: true }
    ).select('-passwordHash');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to update profile', 
      details: err.message 
    });
  }
});

/**
 * Get user's request history
 */
exports.getRequestHistory = asyncHandler(async (req, res) => {
  try {
    const requests = await Request.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch request history', 
      details: err.message 
    });
  }
});

module.exports = {
  requestOTPEmail: exports.requestOTPEmail,
  verifyOTPEmail: exports.verifyOTPEmail,
  refreshToken: exports.refreshToken,
  logout: exports.logout,
  getUserProfile: exports.getUserProfile,
  updateUserProfile: exports.updateUserProfile,
  getRequestHistory: exports.getRequestHistory,
};
