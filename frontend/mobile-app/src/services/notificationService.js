import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { notificationAPI, API_URL } from './api';

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

function maskPushToken(token) {
  if (typeof token !== 'string' || token.length < 14) {
    return 'invalid-token';
  }

  return `${token.slice(0, 12)}...${token.slice(-4)}`;
}

function buildApiErrorLog(error) {
  const status = error?.response?.status;
  const payload = error?.response?.data;
  const message = error?.message || 'Unknown error';

  return {
    status: status || 'no-response',
    message,
    payload,
    apiUrl: API_URL,
  };
}

class NotificationService {
  static notificationListener = null;
  static responseListener = null;
  static navigationRef = null;
  static pendingRequestParams = null;
  static handledResponseIds = new Set();

  /**
   * Initialize notification service
   * Request permissions and register push token
   */
  static async initialize(navigationRef) {
    try {
      this.navigationRef = navigationRef;

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
        console.log(
          `[push-token/mobile] Queued token ${maskPushToken(token)}: user not authenticated yet`
        );
        return;
      }

      console.log(
        `[push-token/mobile] Registering token ${maskPushToken(token)} with backend ${API_URL}`
      );
      await notificationAPI.registerPushToken(token);
      console.log('[push-token/mobile] Push token registered with backend');
      
      // Clear pending token if any
      await AsyncStorage.removeItem('pendingPushToken');
    } catch (error) {
      console.error('[push-token/mobile] Registration failed:', buildApiErrorLog(error));
      // Save for later registration
      await AsyncStorage.setItem('pendingPushToken', token);
      console.log(
        `[push-token/mobile] Re-queued token ${maskPushToken(token)} after registration failure`
      );
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
        console.log(
          `[push-token/mobile] Attempting pending token registration ${maskPushToken(pendingToken)}`
        );
        await notificationAPI.registerPushToken(pendingToken);
        await AsyncStorage.removeItem('pendingPushToken');
        console.log('[push-token/mobile] Pending push token registered');
        return;
      }

      // If no pending token, try to get a new one and register
      const token = await this.getPushToken();
      if (token) {
        console.log(
          `[push-token/mobile] Attempting fresh token registration ${maskPushToken(token)} after login`
        );
        await notificationAPI.registerPushToken(token);
        console.log('[push-token/mobile] Fresh push token registered after login');
      }
    } catch (error) {
      console.error('[push-token/mobile] Pending registration failed:', buildApiErrorLog(error));

      // Keep token queued for a later retry if registration fails transiently.
      try {
        const fallbackToken = await this.getPushToken();
        if (fallbackToken) {
          await AsyncStorage.setItem('pendingPushToken', fallbackToken);
        }
      } catch (queueError) {
        console.error('[push-token/mobile] Failed to queue pending push token:', queueError);
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
    this.navigationRef = navigationRef;

    // Handle notification taps that launched the app from a killed state.
    this.handleInitialNotificationResponse();

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

        this.handleNotificationResponse(response, 'tap');
      }
    );
  }

  static async handleInitialNotificationResponse() {
    try {
      const response = await Notifications.getLastNotificationResponseAsync();

      if (response) {
        this.handleNotificationResponse(response, 'initial-open');
      }
    } catch (error) {
      console.error('Failed to process initial notification response:', error);
    }
  }

  static handleNotificationResponse(response, source = 'tap') {
    if (!response?.notification?.request) {
      return;
    }

    const responseId = response.notification.request.identifier;
    if (responseId && this.handledResponseIds.has(responseId)) {
      return;
    }

    if (responseId) {
      this.handledResponseIds.add(responseId);
    }

    const data = response.notification.request.content?.data || {};
    const requestId = data.requestId || null;
    const referenceNumber = data.referenceNumber || null;

    if (data.type !== 'request_status' || (!requestId && !referenceNumber)) {
      return;
    }

    const params = {};
    if (requestId) {
      params.requestId = requestId;
    }
    if (referenceNumber) {
      params.referenceNumber = referenceNumber;
    }

    this.navigateToRequestDetail(params, source);
  }

  static navigateToRequestDetail(params, source = 'tap') {
    const nav = this.navigationRef?.current;

    if (!nav) {
      this.pendingRequestParams = params;
      console.log(`Queued notification navigation from ${source} until navigation is ready`);
      return;
    }

    nav.navigate('App', {
      screen: 'Dashboard',
      params: {
        screen: 'RequestDetail',
        params,
      },
    });
  }

  static onNavigationReady() {
    if (!this.pendingRequestParams) {
      return;
    }

    const queuedParams = this.pendingRequestParams;
    this.pendingRequestParams = null;
    this.navigateToRequestDetail(queuedParams, 'queued');
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

    this.navigationRef = null;
    this.pendingRequestParams = null;
    this.handledResponseIds.clear();
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
