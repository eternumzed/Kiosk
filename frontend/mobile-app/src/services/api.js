import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const resolveApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/$/, '');
  }
  return 'http://192.168.0.106:5000/api';
};

const API_URL = resolveApiUrl();

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

export const userAPI = {
  // Get user profile
  getProfile: async () => {
    return apiClient.get('/users/profile');
  },

  // Update user profile
  updateProfile: async (data) => {
    return apiClient.patch('/users/profile', data);
  },

  // Get user requests/history
  getRequestHistory: async () => {
    return apiClient.get('/users/requests');
  },

  // Get single request details
  getRequestDetails: async (requestId) => {
    return apiClient.get(`/users/requests/${requestId}`);
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
};

export default apiClient;
