import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { authAPI } from '../services/api';
import { colors } from '../theme/colors';

export default function LoginScreen({ navigation, dispatch }) {
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle deep link callback from Google OAuth
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event.url;
      if (url && url.includes('google-auth-callback')) {
        // Parse token from URL
        const params = new URLSearchParams(url.split('?')[1]);
        const token = params.get('token');
        const refreshToken = params.get('refreshToken');
        const userJson = params.get('user');
        
        if (token) {
          try {
            await SecureStore.setItemAsync('userToken', token);
            if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
            const user = userJson ? JSON.parse(decodeURIComponent(userJson)) : null;
            if (user) await AsyncStorage.setItem('user', JSON.stringify(user));
            
            dispatch({
              type: 'LOGIN',
              payload: { user, token },
            });
          } catch (e) {
            Alert.alert('Error', 'Failed to process login');
          }
        }
        setGoogleLoading(false);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription?.remove();
  }, [dispatch]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // Dismiss any existing browser session first
      await WebBrowser.dismissBrowser();
      
      // Open Google OAuth in browser - backend handles the flow
      const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'https://dilemmatical-marvis-unegregiously.ngrok-free.dev';
      // Use Linking.createURL for Expo Go compatibility
      const redirectUrl = Linking.createURL('google-auth-callback');
      
      console.log('Login - Expected redirect URL:', redirectUrl);
      
      const result = await WebBrowser.openAuthSessionAsync(
        `${apiUrl}/api/auth/google/mobile?redirectUrl=${encodeURIComponent(redirectUrl)}`,
        redirectUrl
      );
      
      console.log('Login - WebBrowser result:', result.type);
      console.log('Login - Returned URL:', result.url);
      
      if (result.type === 'success' && result.url) {
        // Parse the callback URL
        const url = result.url;
        const queryStart = url.indexOf('?');
        if (queryStart !== -1) {
          const params = new URLSearchParams(url.substring(queryStart + 1));
          const token = params.get('token');
          const userJson = params.get('user');
          const error = params.get('error');
          
          console.log('Parsed params - token:', !!token, 'user:', !!userJson, 'error:', error);
          
          if (error) {
            Alert.alert('Google Sign In', decodeURIComponent(error));
          } else if (token) {
            await SecureStore.setItemAsync('userToken', token);
            const refreshToken = params.get('refreshToken');
            if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
            const user = userJson ? JSON.parse(decodeURIComponent(userJson)) : null;
            if (user) await AsyncStorage.setItem('user', JSON.stringify(user));
            
            dispatch({
              type: 'LOGIN',
              payload: { user, token },
            });
          } else {
            Alert.alert('Google Sign In', 'No token received');
          }
        } else {
          Alert.alert('Google Sign In', 'Invalid callback URL');
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // User cancelled or dismissed
        console.log('User cancelled/dismissed Google Sign In');
      } else {
        console.log('Unexpected result type:', result.type);
      }
    } catch (error) {
      Alert.alert('Google Sign In', error.message || 'Failed to sign in');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!contact || !password) {
      Alert.alert('Error', 'Please enter phone/email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(contact, password);

      const token = response?.token ?? response?.data?.token;
      const refreshToken = response?.refreshToken ?? response?.data?.refreshToken;
      const user = response?.user ?? response?.data?.user;

      // Store tokens
      if (token) await SecureStore.setItemAsync('userToken', token);
      if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
      if (user) await AsyncStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: 'LOGIN',
        payload: { user, token },
      });
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.error || error.error || 'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🏛️</Text>
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to your Barangay Kiosk account</Text>
      </View>

      <View style={styles.formSection}>
        <TextInput
          style={styles.input}
          placeholder="Phone Number or Email"
          value={contact}
          onChangeText={setContact}
          placeholderTextColor={colors.text.placeholder}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={colors.text.placeholder}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
          activeOpacity={0.8}
        >
          {googleLoading ? (
            <ActivityIndicator color={colors.text.primary} />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerSection: {
    backgroundColor: colors.primary[600],
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.primary[200],
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: colors.text.primary,
  },
  button: {
    backgroundColor: colors.primary[600],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.text.muted,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: 12,
  },
  googleButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  linkBold: {
    color: colors.primary[600],
    fontWeight: '600',
  },
});
