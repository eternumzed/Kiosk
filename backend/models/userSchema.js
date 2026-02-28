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
    enum: ['phone', 'google'],  // Only phone OTP and Google OAuth supported
    default: 'phone',
  },
  
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
  barangay: { type: String, trim: true, default: 'Biluso' },
  
  // Account Metadata
  lastLoginAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Preferences
  notificationEnabled: { type: Boolean, default: true },
  
  // Push Notifications
  expoPushToken: { type: String, sparse: true },
  
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
