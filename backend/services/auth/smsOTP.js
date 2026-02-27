const axios = require('axios');
const crypto = require('crypto');

/**
 * TextBee SMS OTP Service
 * Uses textbee.dev API to send SMS OTP messages
 * 
 * Required environment variables:
 * - TEXTBEE_API_KEY: Your TextBee API key
 * - TEXTBEE_DEVICE_ID: Your registered device ID
 */

const TEXTBEE_API_URL = 'https://api.textbee.dev/api/v1';

class SMSOTPService {
  /**
   * Generate 6-digit OTP
   */
  static generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Format phone number for SMS
   * Ensures number is in international format
   */
  static formatPhoneNumber(phoneNumber) {
    // Remove spaces, dashes, and other characters
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // If starts with 0, assume Philippine number and add +63
    if (cleaned.startsWith('0')) {
      cleaned = '+63' + cleaned.substring(1);
    }
    
    // If doesn't have + prefix, add it
    if (!cleaned.startsWith('+')) {
      // Assume Philippine number if 10 digits
      if (cleaned.length === 10) {
        cleaned = '+63' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
    
    return cleaned;
  }

  /**
   * Send OTP via SMS using TextBee
   */
  static async sendOTP(phoneNumber, fullName = '') {
    try {
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Validate environment variables
      if (!process.env.TEXTBEE_API_KEY) {
        throw new Error('TEXTBEE_API_KEY is not configured');
      }
      if (!process.env.TEXTBEE_DEVICE_ID) {
        throw new Error('TEXTBEE_DEVICE_ID is not configured');
      }

      // SMS message content
      const message = `Your Barangay Kiosk verification code is: ${otp}\n\nThis code expires in 5 minutes. Do not share this code with anyone.`;

      // Send SMS via TextBee API
      const response = await axios.post(
        `${TEXTBEE_API_URL}/gateway/devices/${process.env.TEXTBEE_DEVICE_ID}/sendSMS`,
        {
          recipients: [formattedPhone],
          message: message,
        },
        {
          headers: {
            'x-api-key': process.env.TEXTBEE_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('TextBee SMS response:', response.data);

      // Check if SMS was sent successfully
      // TextBee wraps response in { data: { success: true, ... } }
      const textbeeData = response.data?.data || response.data;
      if (textbeeData?.success || response.status === 200) {
        return {
          success: true,
          otp,
          expiresAt,
          messageId: textbeeData?.smsBatchId || textbeeData?.id,
        };
      } else {
        throw new Error(textbeeData?.message || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('SMS OTP send error:', error.response?.data || error.message);
      
      // In development, allow fallback to console logging
      if (process.env.NODE_ENV === 'development' && process.env.SMS_DEV_BYPASS === 'true') {
        const otp = this.generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        console.log(`[DEV MODE] OTP for ${phoneNumber}: ${otp}`);
        return {
          success: true,
          otp,
          expiresAt,
          devMode: true,
        };
      }

      throw {
        code: 'SMS_SEND_FAILED',
        message: 'Failed to send OTP SMS. Please check your phone number.',
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Verify OTP
   */
  static verifyOTP(userOTP, storedOTP, expiresAt) {
    // Check expiry
    if (new Date() > new Date(expiresAt)) {
      return {
        valid: false,
        error: 'OTP has expired. Please request a new one.',
      };
    }

    // Check OTP match
    if (userOTP !== storedOTP) {
      return {
        valid: false,
        error: 'Invalid OTP. Please try again.',
      };
    }

    return {
      valid: true,
    };
  }

  /**
   * Check TextBee account status and credits
   */
  static async checkAccountStatus() {
    try {
      const response = await axios.get(
        `${TEXTBEE_API_URL}/gateway/devices/${process.env.TEXTBEE_DEVICE_ID}`,
        {
          headers: {
            'x-api-key': process.env.TEXTBEE_API_KEY,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('TextBee status check error:', error.response?.data || error.message);
      return null;
    }
  }
}

module.exports = SMSOTPService;
