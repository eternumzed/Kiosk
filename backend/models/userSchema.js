const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  // Phone Authentication
  phoneNumber: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  
  // Optional: Email for password reset
  email: { 
    type: String, 
    trim: true, 
    lowercase: true 
  },
  
  // Account Security
  passwordHash: { type: String },  // Optional, for email+password login
  
  // Phone OTP Verification
  otpCode: { type: String },
  otpExpiresAt: { type: Date },
  isPhoneVerified: { type: Boolean, default: false },
  
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

module.exports = mongoose.model('User', UserSchema);
