import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const resolveApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/$/, '');
  }
  // Default to production API - update during development as needed
  return 'https://api.brgybiluso.me/api';
};

export const API_URL = resolveApiUrl();

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds for ngrok
});

// Add token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Normalize network errors (no HTTP response)
    if (!error.response) {
      return Promise.reject({
        ...error,
        error: `Network error: cannot reach API at ${API_URL}`,
      });
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');

        // Only attempt refresh if we have a refresh token
        if (!refreshToken) {
          console.log('No refresh token available, skipping refresh');
          await SecureStore.deleteItemAsync('userToken');
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });
        const newToken = response.data.accessToken || response.data.token;
        await SecureStore.setItemAsync('userToken', newToken);
        apiClient.defaults.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        console.error('Token refresh failed:', err);
        // Clear tokens and redirect to login
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Request OTP via SMS (TextBee)
  requestOTP: async (phoneNumber) => {
    return apiClient.post('/auth/request-otp', { phoneNumber });
  },

  // Verify OTP and login/register
  verifyOTP: async (phoneNumber, otp, fullName, otpToken) => {
    return apiClient.post('/auth/verify-otp', {
      phoneNumber,
      otp,
      fullName,
      otpToken,
    });
  },

  // Google OAuth login/signup
  googleLogin: async (googleToken, userInfo) => {
    return apiClient.post('/auth/google', {
      googleToken,
      email: userInfo?.email,
      fullName: userInfo?.name,
      googleId: userInfo?.id,
      profilePicture: userInfo?.picture,
    });
  },

  // Logout
  logout: async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('refreshToken');
  },
};

export const notificationAPI = {
  // Register push token
  registerPushToken: async (expoPushToken, pushDeviceId) => {
    return apiClient.post('/auth/push-token', { expoPushToken, pushDeviceId });
  },

  // Remove push token
  removePushToken: async () => {
    return apiClient.delete('/auth/push-token');
  },
};

export const userAPI = {
  // Get user profile
  getProfile: async () => {
    return apiClient.get('/auth/profile');
  },

  // Update user profile
  updateProfile: async (data) => {
    return apiClient.patch('/auth/profile', data);
  },

  // Request phone number change (sends OTP to new phone)
  requestPhoneChange: async (newPhoneNumber) => {
    return apiClient.post('/auth/profile/request-phone-change', { newPhoneNumber });
  },

  // Verify phone number change with OTP
  verifyPhoneChange: async (otp, verificationToken) => {
    return apiClient.post('/auth/profile/verify-phone-change', { otp, verificationToken });
  },

  // Request email change (sends OTP to new email)
  requestEmailChange: async (newEmail) => {
    return apiClient.post('/auth/profile/request-email-change', { newEmail });
  },

  // Verify email change with OTP
  verifyEmailChange: async (otp, verificationToken) => {
    return apiClient.post('/auth/profile/verify-email-change', { otp, verificationToken });
  },

  // Get user requests/history
  getRequestHistory: async () => {
    return apiClient.get('/auth/request-history');
  },

  // Get single request details
  getRequestDetails: async (requestId) => {
    return apiClient.get(`/request/${requestId}`);
  },
};

export const requestAPI = {
  // Create new request (with PayMongo checkout)
  createRequest: async (data) => {
    return apiClient.post('/request/create-request', data);
  },

  // Create request with cash payment
  createRequestCash: async (data) => {
    return apiClient.post('/payment/create-cash-payment', data);
  },

  // Track request by reference number
  trackRequest: async (referenceNumber) => {
    return apiClient.get(`/request/track-request/${referenceNumber}`);
  },

  // Get request history for authenticated user
  getRequestHistory: async () => {
    return apiClient.get('/auth/request-history');
  },

  // Get single request details
  getRequestDetails: async (requestId) => {
    return apiClient.get(`/request/${requestId}`);
  },

  // Hide request from user's active list (user-side visibility only)
  hideRequest: async (requestId, referenceNumber) => {
    const safeReference = typeof referenceNumber === 'string' ? referenceNumber.trim() : '';
    const safeRequestId = typeof requestId === 'string' ? requestId.trim() : '';

    if (!safeRequestId && !safeReference) {
      throw new Error('Missing request identifier');
    }

    try {
      return await apiClient.patch('/request/hide', {
        requestId: safeRequestId || undefined,
        referenceNumber: safeReference || undefined,
      });
    } catch (err) {
      if (err?.response?.status === 404 && safeRequestId) {
        return apiClient.patch(`/request/hide/${safeRequestId}`, {
          referenceNumber: safeReference || undefined,
        });
      }
      if (err?.response?.status === 404 && safeReference) {
        return apiClient.patch(`/request/hide/ref/${encodeURIComponent(safeReference)}`);
      }
      throw err;
    }
  },

  // Unhide request and move back to active list
  unhideRequest: async (requestId, referenceNumber) => {
    const safeReference = typeof referenceNumber === 'string' ? referenceNumber.trim() : '';
    const safeRequestId = typeof requestId === 'string' ? requestId.trim() : '';

    if (!safeRequestId && !safeReference) {
      throw new Error('Missing request identifier');
    }

    try {
      return await apiClient.patch('/request/unhide', {
        requestId: safeRequestId || undefined,
        referenceNumber: safeReference || undefined,
      });
    } catch (err) {
      if (err?.response?.status === 404 && safeRequestId) {
        return apiClient.patch(`/request/unhide/${safeRequestId}`, {
          referenceNumber: safeReference || undefined,
        });
      }
      if (err?.response?.status === 404 && safeReference) {
        return apiClient.patch(`/request/unhide/ref/${encodeURIComponent(safeReference)}`);
      }
      throw err;
    }
  },
};

export default apiClient;
