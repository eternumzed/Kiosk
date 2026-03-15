import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { notificationAPI, API_URL } from './api';

// Configure how notifications appear when app is in foreground
// Skip in Expo Go (SDK 53+) — remote push notifications are unsupported there.
if (Constants.executionEnvironment !== 'expo' && Constants.executionEnvironment !== 'storeClient') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Check if running in Expo Go
 * Push notifications are not supported in Expo Go since SDK 53
 */
const FALLBACK_EAS_PROJECT_ID = 'e02fd29e-11c2-4cf1-aec5-0e561f14651e';

function getRuntimeInfo() {
  return {
    executionEnvironment: Constants.executionEnvironment || 'undefined',
    appOwnership: Constants.appOwnership || 'undefined',
    isDevice: Device.isDevice,
    platform: Platform.OS,
  };
}

function isRunningInExpoGo() {
  const executionEnvironment = Constants.executionEnvironment;

  // Only block known Expo Go environments
  // 'expo' = Expo Go dev client
  // 'storeClient' = Expo Go from App Store/Play Store
  // Anything else (standalone, bare, undefined) should be allowed
  return executionEnvironment === 'expo' || executionEnvironment === 'storeClient';
}

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

function buildResult(ok, code, details = {}) {
  return {
    ok,
    code,
    ...details,
  };
}

function normalizeNativeError(error) {
  const message = error?.message || String(error || 'Unknown error');
  const code = error?.code || error?.name || 'unknown';

  return { code, message };
}

function classifyPushTokenFailure(message) {
  const safeMessage = typeof message === 'string' ? message : '';

  const missingFcmPatterns = [
    /default\s+firebaseapp\s+is\s+not\s+initialized/i,
    /firebaseapp\s+with\s+name\s+\[default\]\s+doesn't\s+exist/i,
    /failed\s+to\s+get\s+fcm\s+token/i,
    /fcm/i,
  ];

  if (missingFcmPatterns.some((pattern) => pattern.test(safeMessage))) {
    return 'android-fcm-not-configured';
  }

  return 'expo-token-failed';
}

function isValidExpoPushToken(token) {
  return typeof token === 'string' && /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(token);
}

class NotificationService {
  static notificationListener = null;
  static responseListener = null;
  static navigationRef = null;
  static pendingRequestParams = null;
  static handledResponseIds = new Set();
  static pushDeviceId = null;

  static async getOrCreatePushDeviceId() {
    if (this.pushDeviceId) {
      return this.pushDeviceId;
    }

    const storageKey = 'pushDeviceInstallId';
    let id = await AsyncStorage.getItem(storageKey);

    if (!id) {
      id = Crypto.randomUUID();
      await AsyncStorage.setItem(storageKey, id);
    }

    this.pushDeviceId = id;
    return id;
  }

  /**
   * Initialize notification service
   * Request permissions and register push token
   */
  static async initialize(navigationRef) {
    try {
      this.navigationRef = navigationRef;
      const availability = this.getPushAvailability();

      console.log('[push-token/mobile] Runtime:', {
        executionEnvironment: Constants.executionEnvironment || 'unknown',
        appOwnership: Constants.appOwnership || 'unknown',
        isDevice: Device.isDevice,
        apiUrl: API_URL,
      });

      // Check if running in Expo Go - push notifications not supported
      if (!availability.available) {
        if (availability.reason === 'expo-go') {
          console.warn(
            'Push notifications are not supported in Expo Go (SDK 53+). ' +
            'Use a development build for full notification support.'
          );
        } else {
          console.warn('Push notifications require a physical device. Emulator/simulator detected.');
        }

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
      const tokenResult = await this.getPushToken();
      const token = tokenResult?.token || null;

      if (isValidExpoPushToken(token)) {
        // Register token with backend
        await this.registerTokenWithBackend(token);
      } else if (tokenResult?.error) {
        console.warn('[push-token/mobile] Initialization token fetch failed:', tokenResult.error);
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
      if (isRunningInExpoGo()) {
        console.warn('Push tokens are not available in Expo Go. Use a development build.');
        return { token: null, error: { code: 'expo-go', message: 'Running inside Expo Go' } };
      }

      // Use multiple sources because some production builds don't expose expoConfig.
      const projectId = resolveProjectId();
      
      if (!projectId) {
        console.error(
          'No EAS projectId found. Set EXPO_PUBLIC_EAS_PROJECT_ID or add projectId to app.json extra.eas.projectId'
        );
        return {
          token: null,
          error: {
            code: 'missing-project-id',
            message: 'No EAS projectId found at runtime',
          },
        };
      }

      // First attempt: explicit projectId (recommended for EAS builds)
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        if (tokenData?.data) {
          console.log('Expo push token:', tokenData.data);
          return { token: tokenData.data, error: null };
        }
      } catch (primaryError) {
        const primary = normalizeNativeError(primaryError);
        console.error('[push-token/mobile] Primary token fetch failed:', primary);

        // Fallback attempt for some bare/dev-client runtime edge cases.
        try {
          const fallbackData = await Notifications.getExpoPushTokenAsync();
          if (fallbackData?.data) {
            console.log('Expo push token (fallback):', fallbackData.data);
            return { token: fallbackData.data, error: null };
          }

          return {
            token: null,
            error: {
              code: 'empty-token-fallback',
              message: 'Fallback token request returned empty token',
            },
          };
        } catch (fallbackError) {
          const fallback = normalizeNativeError(fallbackError);
          const combinedMessage = `Primary: ${primary.message}; Fallback: ${fallback.message}`;
          return {
            token: null,
            error: {
              code: classifyPushTokenFailure(combinedMessage),
              message: combinedMessage,
            },
          };
        }
      }

      return {
        token: null,
        error: {
          code: 'empty-token',
          message: 'Expo token API returned no token data',
        },
      };
    } catch (error) {
      console.error('Error getting push token:', error);
      const normalized = normalizeNativeError(error);
      return {
        token: null,
        error: {
          code: normalized.code,
          message: normalized.message,
        },
      };
    }
  }

  /**
   * Register push token with backend
   */
  static async registerTokenWithBackend(token) {
    try {
      if (!isValidExpoPushToken(token)) {
        return buildResult(false, 'invalid-token-format-client', {
          tokenMasked: maskPushToken(token),
        });
      }

      // Check if we have a user token (logged in)
      const userToken = await SecureStore.getItemAsync('userToken');
      if (!userToken) {
        // Save token locally, will register when user logs in
        await AsyncStorage.setItem('pendingPushToken', token);
        console.log(
          `[push-token/mobile] Queued token ${maskPushToken(token)}: user not authenticated yet`
        );
        return buildResult(false, 'queued-no-auth', {
          tokenMasked: maskPushToken(token),
        });
      }

      console.log(
        `[push-token/mobile] Registering token ${maskPushToken(token)} with backend ${API_URL}`
      );
      const pushDeviceId = await this.getOrCreatePushDeviceId();
      await notificationAPI.registerPushToken(token, pushDeviceId);
      console.log('[push-token/mobile] Push token registered with backend');
      
      // Clear pending token if any
      await AsyncStorage.removeItem('pendingPushToken');
      return buildResult(true, 'registered', {
        tokenMasked: maskPushToken(token),
      });
    } catch (error) {
      console.error('[push-token/mobile] Registration failed:', buildApiErrorLog(error));
      // Save for later registration
      await AsyncStorage.setItem('pendingPushToken', token);
      console.log(
        `[push-token/mobile] Re-queued token ${maskPushToken(token)} after registration failure`
      );
      return buildResult(false, 'queued-after-error', {
        tokenMasked: maskPushToken(token),
        error: buildApiErrorLog(error),
      });
    }
  }

  /**
   * Register any pending push token (call after login)
   */
  static async registerPendingToken() {
    try {
      // Skip in Expo Go - no push tokens available
      if (isRunningInExpoGo()) {
        return buildResult(false, 'expo-go');
      }

      const userToken = await SecureStore.getItemAsync('userToken');
      if (!userToken) {
        console.log('Skipping push token registration: no auth token found');
        return buildResult(false, 'no-auth-token');
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Skipping push token registration: notification permission not granted');
        return buildResult(false, 'permission-denied');
      }

      // Check if we already have a token pending
      const pendingToken = await AsyncStorage.getItem('pendingPushToken');
      if (pendingToken) {
        if (!isValidExpoPushToken(pendingToken)) {
          await AsyncStorage.removeItem('pendingPushToken');
          console.warn('[push-token/mobile] Removed invalid pending push token from storage');
        } else {
        console.log(
          `[push-token/mobile] Attempting pending token registration ${maskPushToken(pendingToken)}`
        );
        const pushDeviceId = await this.getOrCreatePushDeviceId();
        await notificationAPI.registerPushToken(pendingToken, pushDeviceId);
        await AsyncStorage.removeItem('pendingPushToken');
        console.log('[push-token/mobile] Pending push token registered');
        return buildResult(true, 'registered-pending', {
          tokenMasked: maskPushToken(pendingToken),
        });
        }
      }

      // If no pending token, try to get a new one and register
      const tokenResult = await this.getPushToken();
      const token = tokenResult?.token || null;

      if (token) {
        console.log(
          `[push-token/mobile] Attempting fresh token registration ${maskPushToken(token)} after login`
        );
        const pushDeviceId = await this.getOrCreatePushDeviceId();
        await notificationAPI.registerPushToken(token, pushDeviceId);
        console.log('[push-token/mobile] Fresh push token registered after login');
        return buildResult(true, 'registered-fresh', {
          tokenMasked: maskPushToken(token),
        });
      }

      return buildResult(false, 'no-push-token-generated', {
        error: tokenResult?.error || {
          code: 'unknown-token-error',
          message: 'Token generation returned null without explicit error',
        },
      });
    } catch (error) {
      console.error('[push-token/mobile] Pending registration failed:', buildApiErrorLog(error));

      // Keep token queued for a later retry if registration fails transiently.
      try {
        const fallbackTokenResult = await this.getPushToken();
        const fallbackToken = fallbackTokenResult?.token || null;
        if (fallbackToken) {
          await AsyncStorage.setItem('pendingPushToken', fallbackToken);
        }
      } catch (queueError) {
        console.error('[push-token/mobile] Failed to queue pending push token:', queueError);
      }

      return buildResult(false, 'registration-error', {
        error: buildApiErrorLog(error),
      });
    }
  }

  /**
   * Check if push notifications are available
   * Returns false in Expo Go or if not a physical device
   */
  static isPushNotificationAvailable() {
    return this.getPushAvailability().available;
  }

  static getPushAvailability() {
    const runtime = getRuntimeInfo();

    if (!Device.isDevice) {
      return { available: false, reason: 'simulator', runtime };
    }

    if (isRunningInExpoGo()) {
      return { available: false, reason: 'expo-go', runtime };
    }

    return { available: true, reason: 'supported', runtime };
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
