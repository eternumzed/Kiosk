const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const User = require('../models/userSchema');
const Request = require('../models/requestSchema');
const EmailOTPService = require('../services/auth/emailOTP');
const tokenManager = require('../services/auth/tokenManager');

/**
 * Load Google OAuth credentials from env or oauth_credentials.json
 */
function getGoogleOAuthCredentials() {
  // First try environment variables
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  // Fallback to oauth_credentials.json
  try {
    const credentialsPath = path.join(__dirname, '..', 'oauth_credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    if (credentials.web) {
      return {
        clientId: credentials.web.client_id,
        clientSecret: credentials.web.client_secret,
      };
    }
  } catch (err) {
    console.error('Failed to load oauth_credentials.json:', err.message);
  }

  return null;
}

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

/**
 * Google OAuth login/signup
 * Creates a new user if they don't exist, or logs in existing user
 */
exports.googleAuth = asyncHandler(async (req, res) => {
  const { googleToken, email, fullName, googleId, profilePicture } = req.body;

  if (!googleToken || !email) {
    return res.status(400).json({
      error: 'Google token and email are required',
    });
  }

  try {
    // Verify the Google token by fetching user info
    const googleResponse = await fetch(
      'https://www.googleapis.com/userinfo/v2/me',
      { headers: { Authorization: `Bearer ${googleToken}` } }
    );

    if (!googleResponse.ok) {
      return res.status(401).json({
        error: 'Invalid Google token',
      });
    }

    const googleUser = await googleResponse.json();

    // Verify email matches
    if (googleUser.email !== email) {
      return res.status(401).json({
        error: 'Email mismatch',
      });
    }

    // Find or create user
    let user = await User.findOne({
      $or: [
        { email },
        { googleId: googleId || googleUser.id },
      ],
    });

    if (!user) {
      // Create new user from Google data
      const nameParts = (fullName || googleUser.name || '').split(' ');
      user = await User.create({
        email,
        googleId: googleId || googleUser.id,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        profilePicture: profilePicture || googleUser.picture,
        isEmailVerified: googleUser.verified_email || true,
        isActive: true,
        authProvider: 'google',
        lastLoginAt: new Date(),
      });
    } else {
      // Update user with Google info if not already set
      if (!user.googleId) user.googleId = googleId || googleUser.id;
      if (!user.profilePicture && (profilePicture || googleUser.picture)) {
        user.profilePicture = profilePicture || googleUser.picture;
      }
      user.isEmailVerified = true;
      user.lastLoginAt = new Date();
      await user.save();
    }

    // Generate tokens
    const { accessToken, refreshToken } = tokenManager.generateTokens(
      user._id,
      {
        email: user.email,
        firstName: user.firstName,
        googleId: user.googleId,
      }
    );

    res.json({
      success: true,
      message: 'Google authentication successful',
      token: accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        phone: user.phoneNumber,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({
      error: 'Google authentication failed',
      details: err.message,
    });
  }
});

/**
 * Mobile Google OAuth - Initiate flow
 * Redirects to Google OAuth consent screen
 */
exports.googleMobileInit = asyncHandler(async (req, res) => {
  const credentials = getGoogleOAuthCredentials();
  
  if (!credentials) {
    return res.status(500).json({
      error: 'Google OAuth not configured on server',
    });
  }

  // Get the mobile app's redirect URL from query params
  const mobileRedirectUrl = req.query.redirectUrl || 'kiosk-mobile-app://google-auth-callback';

  // Build the callback URL (backend handles the callback)
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers.host;
  const callbackUrl = `${protocol}://${host}/api/auth/google/mobile/callback`;

  // Encode state with the mobile redirect URL so we can use it in callback
  const state = Buffer.from(JSON.stringify({ redirectUrl: mobileRedirectUrl })).toString('base64');

  // Build Google OAuth URL
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', credentials.clientId);
  googleAuthUrl.searchParams.set('redirect_uri', callbackUrl);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('state', state);

  // Redirect to Google
  res.redirect(googleAuthUrl.toString());
});

/**
 * Mobile Google OAuth - Handle callback
 * Exchanges code for tokens, creates/finds user, redirects to mobile app
 */
exports.googleMobileCallback = asyncHandler(async (req, res) => {
  const { code, error, state } = req.query;
  
  // Parse state to get mobile redirect URL
  let mobileRedirectUrl = 'kiosk-mobile-app://google-auth-callback';
  if (state) {
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      mobileRedirectUrl = stateData.redirectUrl || mobileRedirectUrl;
    } catch (e) {
      console.error('Failed to parse state:', e);
    }
  }

  // Helper to build redirect URL with params
  const buildRedirect = (params) => {
    const url = new URL(mobileRedirectUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  };

  if (error) {
    return res.redirect(buildRedirect({ error }));
  }

  if (!code) {
    return res.redirect(buildRedirect({ error: 'no_code' }));
  }

  const credentials = getGoogleOAuthCredentials();
  if (!credentials) {
    return res.redirect(buildRedirect({ error: 'oauth_not_configured' }));
  }

  try {
    // Build callback URL for token exchange
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers.host;
    const callbackUrl = `${protocol}://${host}/api/auth/google/mobile/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return res.redirect(buildRedirect({ error: tokenData.error || 'token_exchange_failed' }));
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return res.redirect(buildRedirect({ error: 'failed_to_get_user_info' }));
    }

    const googleUser = await userInfoResponse.json();

    // Find or create user
    let user = await User.findOne({
      $or: [
        { email: googleUser.email },
        { googleId: googleUser.id },
      ],
    });

    if (!user) {
      // Create new user from Google data
      const nameParts = (googleUser.name || '').split(' ');
      user = await User.create({
        email: googleUser.email,
        googleId: googleUser.id,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        profilePicture: googleUser.picture,
        isEmailVerified: googleUser.verified_email || true,
        isActive: true,
        authProvider: 'google',
        lastLoginAt: new Date(),
      });
    } else {
      // Update user with Google info if not already set
      if (!user.googleId) user.googleId = googleUser.id;
      if (!user.profilePicture && googleUser.picture) {
        user.profilePicture = googleUser.picture;
      }
      user.isEmailVerified = true;
      user.lastLoginAt = new Date();
      await user.save();
    }

    // Generate tokens
    const { accessToken, refreshToken } = tokenManager.generateTokens(
      user._id,
      {
        email: user.email,
        firstName: user.firstName,
        googleId: user.googleId,
      }
    );

    // Prepare user data for mobile app
    const userData = {
      _id: user._id,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      phone: user.phoneNumber,
      profilePicture: user.profilePicture,
    };

    // Redirect to mobile app with tokens and user data
    res.redirect(buildRedirect({
      token: accessToken,
      refreshToken: refreshToken,
      user: JSON.stringify(userData),
    }));
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect(buildRedirect({ error: err.message || 'unknown_error' }));
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
  googleAuth: exports.googleAuth,
  googleMobileInit: exports.googleMobileInit,
  googleMobileCallback: exports.googleMobileCallback,
};
