const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyAccessToken } = require('../middleware/authMiddleware');
const { otpRateLimiter, emailVerificationRateLimiter } = require('../middleware/rateLimiter');

// Public routes (no auth required)
// Phone OTP Authentication (via TextBee SMS) - with rate limiting
router.post('/request-otp', otpRateLimiter, authController.requestOTPPhone);
router.post('/verify-otp', authController.verifyOTPPhone);

// Token management
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Google OAuth
router.post('/google', authController.googleAuth);

// Mobile Google OAuth flow (for Expo Go)
router.get('/google/mobile', authController.googleMobileInit);
router.get('/google/mobile/callback', authController.googleMobileCallback);

// Protected routes (require access token)
router.get('/profile', verifyAccessToken, authController.getUserProfile);
router.patch('/profile', verifyAccessToken, authController.updateUserProfile);
router.get('/request-history', verifyAccessToken, authController.getRequestHistory);

// Profile update with verification (for changing phone/email)
router.post('/profile/request-phone-change', verifyAccessToken, otpRateLimiter, authController.requestPhoneChange);
router.post('/profile/verify-phone-change', verifyAccessToken, authController.verifyPhoneChange);
router.post('/profile/request-email-change', verifyAccessToken, emailVerificationRateLimiter, authController.requestEmailChange);
router.post('/profile/verify-email-change', verifyAccessToken, authController.verifyEmailChange);

// Push notification token management
router.post('/push-token', verifyAccessToken, authController.registerPushToken);
router.delete('/push-token', verifyAccessToken, authController.removePushToken);

module.exports = router;
