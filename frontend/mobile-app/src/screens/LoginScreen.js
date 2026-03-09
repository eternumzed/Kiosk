import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { AntDesign } from '@expo/vector-icons';
import { authAPI } from '../services/api';
import NotificationService from '../services/notificationService';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

export default function LoginScreen({ navigation, dispatch }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle deep link callback from Google OAuth
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event.url;
      if (url && url.includes('google-auth-callback')) {
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

            await NotificationService.registerPendingToken();
          } catch (e) {
            Alert.alert(t('common_error'), t('login_error_process'));
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
      await WebBrowser.dismissBrowser();
      
      // Use the env URL (or fallback) and only remove a trailing '/api' (and optional slash).
      // This avoids removing 'api' occurrences from subdomains or other parts of the URL.
      const apiUrl = (process.env.EXPO_PUBLIC_API_URL?.trim() ?? 'https://api.brgybiluso.me').replace(/\/api\/?$/i, '');
      const redirectUrl = Linking.createURL('google-auth-callback');
      
      const result = await WebBrowser.openAuthSessionAsync(
        `${apiUrl}/api/auth/google/mobile?redirectUrl=${encodeURIComponent(redirectUrl)}`,
        redirectUrl
      );
      
      if (result.type === 'success' && result.url) {
        const url = result.url;
        const queryStart = url.indexOf('?');
        if (queryStart !== -1) {
          const params = new URLSearchParams(url.substring(queryStart + 1));
          const token = params.get('token');
          const userJson = params.get('user');
          const error = params.get('error');
          
          if (error) {
            Alert.alert(t('login_google_sign_in'), decodeURIComponent(error));
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

            await NotificationService.registerPendingToken();
          } else {
            Alert.alert(t('login_google_sign_in'), t('login_error_no_token'));
          }
        }
      }
    } catch (error) {
      Alert.alert(t('login_google_sign_in'), error.message || t('login_error_signin_failed'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const formatPhoneNumber = (text) => {
    // Remove non-numeric characters except +
    const cleaned = text.replace(/[^\d+]/g, '');
    setPhoneNumber(cleaned);
  };

  const handleRequestOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert(t('common_error'), t('login_error_invalid_phone'));
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.requestOTP(phoneNumber);
      setOtpToken(response?.otpToken ?? response?.data?.otpToken);
      setStep('otp');
      setCountdown(60); // 60 second cooldown for resend
      Alert.alert(t('login_otp_sent_title'), t('login_otp_sent_message'));
    } catch (error) {
      Alert.alert(t('common_error'), error.response?.data?.error || error.error || t('login_error_send_otp'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert(t('common_error'), t('login_error_invalid_otp'));
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(phoneNumber, otp, null, otpToken);
      
      const token = response?.token ?? response?.data?.token;
      const refreshToken = response?.refreshToken ?? response?.data?.refreshToken;
      const user = response?.user ?? response?.data?.user;

      if (token) await SecureStore.setItemAsync('userToken', token);
      if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
      if (user) await AsyncStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: 'LOGIN',
        payload: { user, token },
      });

      await NotificationService.registerPendingToken();
    } catch (error) {
      Alert.alert(t('common_error'), error.response?.data?.error || error.error || t('login_error_invalid_otp_server'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    await handleRequestOTP();
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setOtpToken('');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={[styles.headerSection, { paddingTop: Math.max(insets.top + 16, 60) }]}>
        {/* Backdrop Seal */}
        <Image
          source={require('../../assets/BRGY_BILUSO_SEAL-modified.png')}
          style={styles.backdropSeal}
        />
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/BRGY_BILUSO_SEAL-modified.png')}
            style={{ width: 100, height: 100, resizeMode: 'contain' }}
          />
        </View>
        <Text style={styles.title}>
          {step === 'phone' ? t('login_title_welcome_back') : t('login_title_enter_otp')}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'phone' 
            ? t('login_subtitle_phone')
            : t('login_subtitle_enter_code', { phoneNumber })}
        </Text>
      </View>

      <View style={styles.formSection}>
        {step === 'phone' ? (
          <>
            <Text style={styles.inputLabel}>{t('common_mobile_number')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('login_phone_placeholder')}
              value={phoneNumber}
              onChangeText={formatPhoneNumber}
              placeholderTextColor={colors.text.placeholder}
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={15}
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
                <Text style={styles.buttonText}>{t('common_send_otp')}</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.inputLabel}>{t('common_verification_code')}</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="000000"
              value={otp}
              onChangeText={setOtp}
              placeholderTextColor={colors.text.placeholder}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
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
                <Text style={styles.buttonText}>{t('login_verify_and_login')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>{t('login_didnt_receive')} </Text>
              <TouchableOpacity 
                onPress={handleResendOTP} 
                disabled={countdown > 0}
              >
                <Text style={[
                  styles.resendLink, 
                  countdown > 0 && styles.resendDisabled
                ]}>
                  {countdown > 0 ? t('login_resend_in', { seconds: countdown }) : t('login_resend_otp')}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backText}>← {t('login_change_phone')}</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>{t('common_or')}</Text>
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
              <AntDesign name="google" size={20} color="#4285F4" style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>{t('login_continue_google')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerSection: {
    backgroundColor: colors.primary[600],
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  backdropSeal: {
    position: 'absolute',
    right: -60,
    top: -20,
    width: 280,
    height: 280,
    opacity: 0.12,
    resizeMode: 'contain',
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
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
    fontWeight: 'bold',
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
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resendText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  resendLink: {
    color: colors.primary[600],
    fontWeight: '600',
    fontSize: 14,
  },
  resendDisabled: {
    color: colors.text.muted,
  },
  backButton: {
    alignItems: 'center',
    marginBottom: 8,
  },
  backText: {
    color: colors.text.secondary,
    fontSize: 14,
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
