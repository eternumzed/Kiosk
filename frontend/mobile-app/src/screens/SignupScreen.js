import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { authAPI } from '../services/api';
import { colors } from '../theme/colors';

export default function SignupScreen({ navigation, dispatch }) {
  const [step, setStep] = useState('contact'); // 'contact' | 'otp' | 'details'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpToken, setOtpToken] = useState('');

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      // Dismiss any existing browser session first
      await WebBrowser.dismissBrowser();
      
      // Open Google OAuth in browser - backend handles the flow
      const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'https://dilemmatical-marvis-unegregiously.ngrok-free.dev';
      // Use Linking.createURL for Expo Go compatibility
      const redirectUrl = Linking.createURL('google-auth-callback');
      
      console.log('SignUp - Expected redirect URL:', redirectUrl);
      
      const result = await WebBrowser.openAuthSessionAsync(
        `${apiUrl}/api/auth/google/mobile?redirectUrl=${encodeURIComponent(redirectUrl)}`,
        redirectUrl
      );
      
      console.log('SignUp - WebBrowser result:', result.type);
      console.log('SignUp - Returned URL:', result.url);
      
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
            Alert.alert('Google Sign Up', decodeURIComponent(error));
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
            Alert.alert('Google Sign Up', 'No token received');
          }
        } else {
          Alert.alert('Google Sign Up', 'Invalid callback URL');
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // User cancelled or dismissed
        console.log('User cancelled/dismissed Google Sign Up');
      } else {
        console.log('Unexpected result type:', result.type);
      }
    } catch (error) {
      Alert.alert('Google Sign Up', error.message || 'Failed to sign up');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!phoneNumber && !email) {
      Alert.alert('Error', 'Please enter phone number or email');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.requestOTP(phoneNumber || null, email || null);
      setOtpToken(response?.otpToken ?? response?.data?.otpToken);
      setStep('otp');
      Alert.alert('Success', 'OTP sent to your phone/email');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || error.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter valid OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(
        phoneNumber || null,
        email || null,
        otp,
        fullName,
        otpToken
      );
      // Store token
      const token = response?.token ?? response?.data?.token;
      const refreshToken = response?.refreshToken ?? response?.data?.refreshToken;
      if (token) await SecureStore.setItemAsync('userToken', token);
      if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
      setStep('details');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || error.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!fullName) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(
        phoneNumber || null,
        email || null,
        otp,
        fullName
      );
      
      const token = response?.token ?? response?.data?.token;
      const user = response?.user ?? response?.data?.user;
      
      if (user) await AsyncStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: 'LOGIN',
        payload: { user, token },
      });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'contact':
        return 'Create Account';
      case 'otp':
        return 'Verify OTP';
      case 'details':
        return 'Complete Profile';
      default:
        return 'Sign Up';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'contact':
        return 'Enter your phone number or email to get started';
      case 'otp':
        return `Enter the OTP sent to ${phoneNumber || email}`;
      case 'details':
        return 'Tell us your name to complete registration';
      default:
        return '';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerSection}>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step === 'contact' && styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step === 'otp' && styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step === 'details' && styles.stepDotActive]} />
        </View>
        <Text style={styles.title}>{getStepTitle()}</Text>
        <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
      </View>

      <View style={styles.formSection}>
        {step === 'contact' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Phone Number (e.g., +639123456789)"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholderTextColor={colors.text.placeholder}
              keyboardType="phone-pad"
            />
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.text.placeholder}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleRequestOTP}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignup}
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
          </>
        )}

        {step === 'otp' && (
          <>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
              keyboardType="numeric"
              placeholderTextColor={colors.text.placeholder}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleVerifyOTP}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('contact')}>
              <Text style={styles.backLink}>← Back to contact info</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'details' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor={colors.text.placeholder}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    flexGrow: 1,
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepDotActive: {
    backgroundColor: '#fff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
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
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
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
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    marginTop: 16,
    fontSize: 14,
  },
  linkBold: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  backLink: {
    color: colors.primary[600],
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});
