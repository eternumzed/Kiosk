const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

exports.user_register_post = [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
    body('contactNumber').optional().isLength({ min: 11, max: 11 }).withMessage('Must be 11 digits'),

    async (req, res) => {
        console.log(req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { firstName, lastName, email, password, contactNumber, address } = req.body;

        try {
            const user = new User({
                firstName,
                lastName,
                email,
                password,
                contactNumber,
                address
            });

            await user.save();

            res.status(201).json({ message: 'User registered successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
];


// controllers/userController.js
 
// Login route
exports.user_login_post = [
  // 1️⃣ Validation
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  // 2️⃣ Controller
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Convert email to lowercase to match schema
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user || !user.password) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Compare password
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = user.generateToken();

      // Set HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,      // true in production (HTTPS)
        sameSite: 'Strict', // CSRF protection
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      // Send success response
      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.firstName,
          role: user.role
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
];
