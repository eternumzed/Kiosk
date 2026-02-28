const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email transporter configuration (using Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

class EmailOTPService {
  // Generate 6-digit OTP
  static generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Send OTP via email
  static async sendOTP(email, fullName = '') {
    try {
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

      // Email content
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Your Barangay Kiosk OTP Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Barangay Kiosk</h1>
            </div>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Hello ${fullName ? fullName : 'User'},</p>
              <p>Your One-Time Password (OTP) for Barangay Kiosk verification is:</p>
              
              <div style="background-color: white; border: 2px solid #2563eb; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #2563eb; letter-spacing: 5px; margin: 0;">${otp}</h2>
              </div>
              
              <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
              <p style="color: #666; font-size: 14px;">If you did not request this code, please ignore this email.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
                <p style="margin: 5px 0;">This is an automated message, please do not reply to this email.</p>
                <p style="margin: 5px 0;">© Barangay Kiosk System</p>
              </div>
            </div>
          </div>
        `,
      };

      // Send email
      await transporter.sendMail(mailOptions);

      return {
        success: true,
        otp, // Return OTP for database storage (don't send directly)
        expiresAt,
      };
    } catch (error) {
      console.error('Email OTP send error:', error);
      throw {
        code: 'EMAIL_SEND_FAILED',
        message: 'Failed to send OTP email. Please check your email address.',
        error: error.message,
      };
    }
  }

  // Verify OTP
  static verifyOTP(userOTP, storedOTP, expiresAt) {
    // Check expiry
    if (new Date() > expiresAt) {
      return {
        valid: false,
        error: 'OTP has expired',
      };
    }

    // Check OTP match
    if (userOTP !== storedOTP) {
      return {
        valid: false,
        error: 'Invalid OTP',
      };
    }

    return {
      valid: true,
    };
  }

  // Clear OTP
  static clearOTP() {
    return {
      otpCode: null,
      otpExpiresAt: null,
    };
  }
}

module.exports = EmailOTPService;
