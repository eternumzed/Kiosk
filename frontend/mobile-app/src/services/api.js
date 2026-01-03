import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.0.106:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });
        const { token } = response.data;
        await SecureStore.setItemAsync('userToken', token);
        apiClient.defaults.headers.Authorization = `Bearer ${token}`;
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
  // Request OTP
  requestOTP: async (phoneNumber, email) => {
    return apiClient.post('/auth/request-otp', { phoneNumber, email });
  },

  // Verify OTP and register
  verifyOTP: async (phoneNumber, email, otp, fullName) => {
    return apiClient.post('/auth/verify-otp', {
      phoneNumber,
      email,
      otp,
      fullName,
    });
  },

  // Login
  login: async (phoneNumber, email, password) => {
    return apiClient.post('/auth/login', { phoneNumber, email, password });
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
  // Create new request
  createRequest: async (data) => {
    return apiClient.post('/request/create-request', data);
  },

  // Track request
  trackRequest: async (referenceNumber) => {
    return apiClient.get(`/request/track/${referenceNumber}`);
  },
};

export default apiClient;
