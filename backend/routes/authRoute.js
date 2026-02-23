const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyAccessToken } = require('../middleware/authMiddleware');

// Public routes (no auth required)
router.post('/request-otp', authController.requestOTPEmail);
router.post('/verify-otp', authController.verifyOTPEmail);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/google', authController.googleAuth);

// Mobile Google OAuth flow (for Expo Go)
router.get('/google/mobile', authController.googleMobileInit);
router.get('/google/mobile/callback', authController.googleMobileCallback);

// Protected routes (require access token)
router.get('/profile', verifyAccessToken, authController.getUserProfile);
router.patch('/profile', verifyAccessToken, authController.updateUserProfile);
router.get('/request-history', verifyAccessToken, authController.getRequestHistory);

module.exports = router;
