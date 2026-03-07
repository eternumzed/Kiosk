import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { notificationAPI } from './api';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Check if running in Expo Go
 * Push notifications are not supported in Expo Go since SDK 53
 */
const isExpoGo = Constants.executionEnvironment === 'expo';
const FALLBACK_EAS_PROJECT_ID = 'e02fd29e-11c2-4cf1-aec5-0e561f14651e';

function resolveProjectId() {
  return (
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants?.manifest2?.extra?.eas?.projectId ||
    FALLBACK_EAS_PROJECT_ID
  );
}

class NotificationService {
  static notificationListener = null;
  static responseListener = null;

  /**
   * Initialize notification service
   * Request permissions and register push token
   */
  static async initialize(navigationRef) {
    try {
      // Check if running in Expo Go - push notifications not supported
      if (isExpoGo) {
        console.warn(
          'Push notifications are not supported in Expo Go (SDK 53+). ' +
          'Use a development build for full notification support.'
        );
        // Still setup listeners for local notifications
        this.setupListeners(navigationRef);
        return null;
      }

      // Request permissions
      const hasPermission = await this.requestPermissions();
      
      if (!hasPermission) {
        console.log('Notification permissions not granted');
        return null;
      }

      // Get push token
      const token = await this.getPushToken();
      
      if (token) {
        // Register token with backend
        await this.registerTokenWithBackend(token);
      }

      // Setup notification listeners
      this.setupListeners(navigationRef);

      return token;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions() {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563eb',
      });
    }

    return true;
  }

  /**
   * Get Expo push token
   */
  static async getPushToken() {
    try {
      // Push tokens not available in Expo Go
      if (isExpoGo) {
        console.warn('Push tokens are not available in Expo Go. Use a development build.');
        return null;
      }

      // Use multiple sources because some production builds don't expose expoConfig.
      const projectId = resolveProjectId();
      
      if (!projectId) {
        console.error(
          'No EAS projectId found. Set EXPO_PUBLIC_EAS_PROJECT_ID or add projectId to app.json extra.eas.projectId'
        );
        return null;
      }
      
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      console.log('Expo push token:', tokenData.data);
      return tokenData.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  static async registerTokenWithBackend(token) {
    try {
      // Check if we have a user token (logged in)
      const userToken = await SecureStore.getItemAsync('userToken');
      if (!userToken) {
        // Save token locally, will register when user logs in
        await AsyncStorage.setItem('pendingPushToken', token);
        console.log('Queued push token: user not authenticated yet');
        return;
      }

      console.log('Registering push token with backend...');
      await notificationAPI.registerPushToken(token);
      console.log('Push token registered with backend');
      
      // Clear pending token if any
      await AsyncStorage.removeItem('pendingPushToken');
    } catch (error) {
      console.error('Error registering push token:', error);
      // Save for later registration
      await AsyncStorage.setItem('pendingPushToken', token);
      console.log('Queued push token for retry after registration failure');
    }
  }

  /**
   * Register any pending push token (call after login)
   */
  static async registerPendingToken() {
    try {
      // Skip in Expo Go - no push tokens available
      if (isExpoGo) {
        return;
      }

      const userToken = await SecureStore.getItemAsync('userToken');
      if (!userToken) {
        console.log('Skipping push token registration: no auth token found');
        return;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Skipping push token registration: notification permission not granted');
        return;
      }

      // Check if we already have a token pending
      const pendingToken = await AsyncStorage.getItem('pendingPushToken');
      if (pendingToken) {
        console.log('Attempting to register pending push token...');
        await notificationAPI.registerPushToken(pendingToken);
        await AsyncStorage.removeItem('pendingPushToken');
        console.log('Pending push token registered');
        return;
      }

      // If no pending token, try to get a new one and register
      const token = await this.getPushToken();
      if (token) {
        console.log('Attempting to register fresh push token after login...');
        await notificationAPI.registerPushToken(token);
        console.log('Push token registered after login');
      }
    } catch (error) {
      console.error('Error registering pending token:', error);

      // Keep token queued for a later retry if registration fails transiently.
      try {
        const fallbackToken = await this.getPushToken();
        if (fallbackToken) {
          await AsyncStorage.setItem('pendingPushToken', fallbackToken);
        }
      } catch (queueError) {
        console.error('Failed to queue pending push token:', queueError);
      }
    }
  }

  /**
   * Check if push notifications are available
   * Returns false in Expo Go or if not a physical device
   */
  static isPushNotificationAvailable() {
    return !isExpoGo && Device.isDevice;
  }

  /**
   * Setup notification listeners
   */
  static setupListeners(navigationRef) {
    // Listen for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Listen for user interaction with notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        
        const data = response.notification.request.content.data;
        
        // Handle navigation based on notification type
        if (data?.type === 'request_status' && data?.referenceNumber) {
          // Navigate to request details
          if (navigationRef?.current) {
            navigationRef.current.navigate('App', {
              screen: 'Dashboard',
              params: {
                screen: 'RequestDetail',
                params: { referenceNumber: data.referenceNumber },
              },
            });
          }
        }
      }
    );
  }

  /**
   * Cleanup listeners
   */
  static cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Remove push token from backend (for logout or disabling notifications)
   */
  static async removePushToken() {
    try {
      await notificationAPI.removePushToken();
      console.log('Push token removed from backend');
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  static async areNotificationsEnabled() {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Schedule a local notification (for testing)
   */
  static async scheduleLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: { seconds: 1 },
    });
  }
}

export default NotificationService;
