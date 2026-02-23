const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  // Phone Authentication
  phoneNumber: { 
    type: String, 
    sparse: true,  // Allow null for Google-only users
    unique: true,
    trim: true 
  },
  
  // Email Authentication
  email: { 
    type: String, 
    trim: true, 
    lowercase: true,
    sparse: true,
    unique: true,
  },
  
  // Google OAuth
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  profilePicture: { type: String },
  authProvider: { 
    type: String, 
    enum: ['phone', 'email', 'google'],
    default: 'phone',
  },
  
  // Account Security
  passwordHash: { type: String },  // Optional, for email+password login
  
  // Phone OTP Verification
  otpCode: { type: String },
  otpExpiresAt: { type: Date },
  isPhoneVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  
  // Account Status
  isActive: { type: Boolean, default: true },
  
  // User Profile
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  address: { type: String, trim: true },
  barangay: { type: String, trim: true },
  
  // Account Metadata
  lastLoginAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Preferences
  notificationEnabled: { type: Boolean, default: true },
  
}, { timestamps: true });

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });

module.exports = mongoose.model('User', UserSchema);
