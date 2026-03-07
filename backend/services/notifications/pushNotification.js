const axios = require('axios');
const User = require('../../models/userSchema');

/**
 * Expo Push Notification Service
 * Sends push notifications to mobile app users via Expo Push API
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const EXPO_PUSH_TOKEN_PATTERN = /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/;

function isValidExpoPushToken(token) {
  return typeof token === 'string' && EXPO_PUSH_TOKEN_PATTERN.test(token);
}

class PushNotificationService {
  /**
   * Send push notification to a single user
   * @param {string} userId - User ID to send notification to
   * @param {string} title - Notification title
   * @param {string} body - Notification body text
   * @param {object} data - Additional data to send with notification
   */
  static async sendToUser(userId, title, body, data = {}) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        console.log(`User ${userId} not found`);
        return { success: false, error: 'User not found' };
      }

      if (!user.expoPushToken) {
        console.log(`User ${userId} has no push token`);
        return { success: false, error: 'No push token' };
      }

      if (!user.notificationEnabled) {
        console.log(`User ${userId} has notifications disabled`);
        return { success: false, error: 'Notifications disabled' };
      }

      return await this.sendNotification(user.expoPushToken, title, body, data);
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification directly to a push token
   * @param {string} pushToken - Expo push token
   * @param {string} title - Notification title
   * @param {string} body - Notification body text
   * @param {object} data - Additional data to send with notification
   */
  static async sendNotification(pushToken, title, body, data = {}) {
    try {
      // Validate push token format
      if (!isValidExpoPushToken(pushToken)) {
        console.log('Invalid push token format:', pushToken);
        return { success: false, error: 'Invalid push token format' };
      }

      const message = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
        channelId: 'default',
      };

      const response = await axios.post(EXPO_PUSH_URL, message, {
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });

      console.log('Push notification sent:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error sending push notification:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notifications to multiple users
   * @param {string[]} userIds - Array of user IDs
   * @param {string} title - Notification title
   * @param {string} body - Notification body text
   * @param {object} data - Additional data
   */
  static async sendToMultipleUsers(userIds, title, body, data = {}) {
    try {
      const users = await User.find({
        _id: { $in: userIds },
        expoPushToken: { $exists: true, $ne: null },
        notificationEnabled: true,
      });

      const tokens = users
        .map((u) => u.expoPushToken)
        .filter((token) => isValidExpoPushToken(token));
      
      if (tokens.length === 0) {
        return { success: false, error: 'No valid push tokens found' };
      }

      const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
        channelId: 'default',
      }));

      const response = await axios.post(EXPO_PUSH_URL, messages, {
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });

      console.log('Batch push notifications sent:', response.data);
      return { success: true, data: response.data, count: tokens.length };
    } catch (error) {
      console.error('Error sending batch notifications:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification for request status change
   * @param {string} userId - User ID
   * @param {string} referenceNumber - Request reference number
   * @param {string} documentType - Type of document
   * @param {string} newStatus - New status of the request
   */
  static async sendRequestStatusNotification(userId, referenceNumber, documentType, newStatus) {
    const statusMessages = {
      'pending': {
        title: 'Request Received',
        body: `Your ${documentType} request (${referenceNumber}) has been received and is pending review.`,
      },
      'processing': {
        title: 'Request Processing',
        body: `Your ${documentType} request (${referenceNumber}) is now being processed.`,
      },
      'approved': {
        title: 'Request Approved',
        body: `Your ${documentType} request (${referenceNumber}) has been approved.`,
      },
      'ready': {
        title: 'Ready for Pickup',
        body: `Your ${documentType} (${referenceNumber}) is ready for pickup at the barangay hall.`,
      },
      'for pickup': {
        title: 'Ready for Pickup',
        body: `Your ${documentType} (${referenceNumber}) is ready for pickup at the barangay hall.`,
      },
      'for pick-up': {
        title: 'Ready for Pickup',
        body: `Your ${documentType} (${referenceNumber}) is ready for pickup at the barangay hall.`,
      },
      'completed': {
        title: 'Request Completed',
        body: `Your ${documentType} request (${referenceNumber}) has been completed. Thank you!`,
      },
      'rejected': {
        title: 'Request Rejected',
        body: `Your ${documentType} request (${referenceNumber}) has been rejected. Please check the app for details.`,
      },
      'cancelled': {
        title: 'Request Cancelled',
        body: `Your ${documentType} request (${referenceNumber}) has been cancelled.`,
      },
    };

    const statusKey = newStatus.toLowerCase();
    const message = statusMessages[statusKey] || {
      title: 'Request Update',
      body: `Your ${documentType} request (${referenceNumber}) status has been updated to: ${newStatus}`,
    };

    return await this.sendToUser(userId, message.title, message.body, {
      type: 'request_status',
      referenceNumber,
      status: newStatus,
    });
  }
}

module.exports = PushNotificationService;
