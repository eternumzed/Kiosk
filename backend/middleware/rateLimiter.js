const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for OTP requests
 * Limits to 10 OTP requests per phone number per 10 minutes
 */
const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // limit each phone number to 10 requests per windowMs
  keyGenerator: (req) => {
    // Use phone number or email as key - these are the primary identifiers
    // No IP fallback needed as OTP always requires phone/email
    return req.body.phoneNumber || req.body.email || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many OTP requests. Please try again in 10 minutes.',
      retryAfter: 10 * 60, // seconds
    });
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  validate: { xForwardedForHeader: false },
});

/**
 * Rate limiter for email verification requests
 * Limits to 10 email verification requests per email per 10 minutes
 */
const emailVerificationRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  keyGenerator: (req) => req.body.email || req.body.newEmail || 'unknown',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many email verification requests. Please try again in 10 minutes.',
      retryAfter: 10 * 60,
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

/**
 * General API rate limiter
 * Limits to 100 requests per IP per minute
 */
const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests. Please slow down.',
      retryAfter: 60,
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  otpRateLimiter,
  emailVerificationRateLimiter,
  generalRateLimiter,
};
