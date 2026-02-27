const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyAccessToken } = require('../middleware/authMiddleware');

// Public routes (no auth required)
// Phone OTP Authentication (via TextBee SMS)
router.post('/request-otp', authController.requestOTPPhone);
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

module.exports = router;
