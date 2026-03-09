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
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { colors } from '../theme/colors';

export default function SignupScreen({ navigation, dispatch }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'details'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      await WebBrowser.dismissBrowser();

      const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'https://api.brgybiluso.me';
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
            Alert.alert(t('signup_google_sign_up'), decodeURIComponent(error));
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
            Alert.alert(t('signup_google_sign_up'), t('login_error_no_token'));
          }
        }
      }
    } catch (error) {
      Alert.alert(t('signup_google_sign_up'), error.message || t('signup_error_failed'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const formatPhoneNumber = (text) => {
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
      setCountdown(60);
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

    setStep('details');
  };

  const handleSignup = async () => {
    if (!fullName || fullName.trim().length < 2) {
      Alert.alert(t('common_error'), t('signup_error_full_name_required'));
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(phoneNumber, otp, fullName.trim(), otpToken);

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
    } catch (error) {
      Alert.alert(t('common_error'), error.response?.data?.error || error.error || t('signup_error_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    await handleRequestOTP();
  };

  const getStepTitle = () => {
    switch (step) {
      case 'phone':
        return t('signup_title_create_account');
      case 'otp':
        return t('signup_title_verify_otp');
      case 'details':
        return t('signup_title_complete_profile');
      default:
        return t('signup_title_sign_up');
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'phone':
        return t('signup_subtitle_phone');
      case 'otp':
        return t('login_subtitle_enter_code', { phoneNumber });
      case 'details':
        return t('signup_subtitle_details');
      default:
        return '';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={[styles.headerSection, { paddingTop: Math.max(insets.top + 16, 60) }]}>
          <Image
            source={require('../../assets/BRGY_BILUSO_SEAL-modified.png')}
            style={styles.backdropSeal}
          />
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step === 'phone' && styles.stepDotActive]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step === 'otp' && styles.stepDotActive]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step === 'details' && styles.stepDotActive]} />
          </View>
          <Text style={styles.title}>{getStepTitle()}</Text>
          <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
        </View>

        <View style={styles.formSection}>
          {step === 'phone' && (
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

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>{t('common_or')}</Text>
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
                    <AntDesign name="google" size={20} color="#4285F4" style={styles.googleIcon} />
                    <Text style={styles.googleButtonText}>{t('login_continue_google')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'otp' && (
            <>
              <Text style={styles.inputLabel}>{t('common_verification_code')}</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="000000"
                value={otp}
                onChangeText={setOtp}
                maxLength={6}
                keyboardType="number-pad"
                placeholderTextColor={colors.text.placeholder}
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
                  <Text style={styles.buttonText}>{t('signup_verify_otp')}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <Text style={styles.resendText}>{t('login_didnt_receive')} </Text>
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={countdown > 0}
                >
                  <Text
                    style={[
                      styles.resendLink,
                      countdown > 0 && styles.resendDisabled,
                    ]}
                  >
                    {countdown > 0 ? t('login_resend_in', { seconds: countdown }) : t('login_resend_otp')}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => { setStep('phone'); setOtp(''); }}>
                <Text style={styles.backLink}>← {t('login_change_phone')}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'details' && (
            <>
              <Text style={styles.inputLabel}>{t('common_full_name')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('signup_full_name_placeholder')}
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor={colors.text.placeholder}
                autoFocus
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
                  <Text style={styles.buttonText}>{t('signup_complete_signup')}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('otp')}>
                <Text style={styles.backLink}>← {t('signup_back_to_otp')}</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>
              {t('signup_already_have_account')} <Text style={styles.linkBold}>{t('signup_login')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
