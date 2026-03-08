import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Switch,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI } from '../services/api';
import { colors } from '../theme/colors';
import NotificationService from '../services/notificationService';
import { useTranslation } from 'react-i18next';
import i18n, { saveLanguage } from '../i18n';

export default function ProfileScreen({ navigation, user, dispatch }) {
  const { t } = useTranslation();
  // Compute initial fullName from firstName/lastName if fullName not present
  const initialFullName = user?.fullName || 
    (user?.firstName || user?.lastName 
      ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() 
      : '');
  
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(user?.phoneNumber || user?.phone || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || null);
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  const [barangay, setBarangay] = useState(user?.barangay || 'Biluso');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationEnabled ?? true);
  
  // Original values for comparison
  const originalEmail = user?.email || '';
  const originalPhone = user?.phoneNumber || user?.phone || '';
  
  // OTP verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [verificationType, setVerificationType] = useState(''); // 'email' or 'phone'
  const [pendingValue, setPendingValue] = useState('');

  const handleLanguageChange = async (lang) => {
    if (!lang || i18n.language === lang) return;

    try {
      await i18n.changeLanguage(lang);
      await saveLanguage(lang);
    } catch (error) {
      Alert.alert(t('common_error'), t('profile_error_change_language'));
    }
  };

  const handleNotificationToggle = async (value) => {
    // Check if push notifications are available
    const availability = NotificationService.getPushAvailability();
    if (!availability.available) {
      const runtimeDebug = availability.runtime
        ? `\n\nDebug: env=${availability.runtime.executionEnvironment}, ownership=${availability.runtime.appOwnership}, device=${availability.runtime.isDevice}`
        : '';

      const unavailableMessage =
        availability.reason === 'simulator'
          ? t('profile_notifications_physical_device_required')
          : t('profile_notifications_not_available');

      Alert.alert(
        t('common_not_available'),
        `${unavailableMessage}${runtimeDebug}`,
        [{ text: t('common_ok') }]
      );
      return;
    }
    
    setNotificationsEnabled(value);
    try {
      if (value) {
        // Enable notifications - request permissions and register token
        const hasPermission = await NotificationService.requestPermissions();
        if (!hasPermission) {
          setNotificationsEnabled(false);
          Alert.alert(
            t('profile_permissions_required'),
            t('profile_enable_notifications_settings')
          );
          return;
        }

        const registrationResult = await NotificationService.registerPendingToken();
        if (!registrationResult?.ok) {
          setNotificationsEnabled(false);

          const extra = registrationResult?.error?.status
            ? ` (${registrationResult.error.status})`
            : '';

          const tokenErrorCode = registrationResult?.error?.code
            ? `\nToken Error: ${registrationResult.error.code}`
            : '';

          const tokenErrorMessage = registrationResult?.error?.message
            ? `\nToken Detail: ${registrationResult.error.message}`
            : '';

          const runtimeInfo = NotificationService.getPushAvailability().runtime;
          const debugInfo = runtimeInfo
            ? `\n\nDebug: env=${runtimeInfo.executionEnvironment}, device=${runtimeInfo.isDevice}`
            : '';

          Alert.alert(
            t('common_error'),
            `${t('profile_notification_token_registration_failed')}\n${t('profile_notification_reason')}: ${registrationResult?.code || 'unknown'}${extra}${tokenErrorCode}${tokenErrorMessage}${debugInfo}`
          );
          return;
        }
      } else {
        // Disable notifications - remove token from server
        await NotificationService.removePushToken();
      }
      
      // Update user in backend
      const response = await userAPI.updateProfile({ notificationEnabled: value });
      const updatedUser = response.user || response;
      
      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser,
      });
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      // Revert toggle if update fails
      setNotificationsEnabled(!value);
      Alert.alert(t('common_error'), t('profile_error_notification_settings'));
    }
  };

  // Check if email or phone changed
  const isGoogleAuthUser = user?.authProvider === 'google' || Boolean(user?.googleId);
  const emailChanged = email.trim().toLowerCase() !== originalEmail.toLowerCase();
  const phoneChanged = phone.trim() !== originalPhone;

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      // Split fullName into firstName and lastName
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Check if email changed - require verification
      if (emailChanged) {
        await handleEmailChangeRequest();
        return;
      }
      
      // Check if phone changed - require verification
      if (phoneChanged) {
        await handlePhoneChangeRequest();
        return;
      }
      
      // Only send basic profile fields (not email/phone)
      const updateData = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (address) updateData.address = address;
      if (barangay) updateData.barangay = barangay;
      
      const response = await userAPI.updateProfile(updateData);
      const updatedUser = response.user || response;
      
      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser,
      });
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setEditing(false);
      
      // Update local state from response
      setFullName(`${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim());
      setPhone(updatedUser.phoneNumber || updatedUser.phone || '');
      setEmail(updatedUser.email || '');
      setAddress(updatedUser.address || '');
      setBarangay(updatedUser.barangay || '');
      Alert.alert(t('common_success'), t('profile_updated_success'));
    } catch (error) {
      Alert.alert(t('common_error'), error.response?.data?.error || error.error || t('profile_error_update'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChangeRequest = async () => {
    try {
      const response = await userAPI.requestEmailChange(email.trim());
      setVerificationToken(response.verificationToken);
      setVerificationType('email');
      setPendingValue(email.trim());
      setShowOtpModal(true);
      Alert.alert(t('profile_verification_required'), t('profile_email_otp_sent'));
    } catch (error) {
      Alert.alert(t('common_error'), error.response?.data?.error || error.error || t('profile_error_send_verification_email'));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChangeRequest = async () => {
    try {
      const response = await userAPI.requestPhoneChange(phone.trim());
      setVerificationToken(response.verificationToken);
      setVerificationType('phone');
      setPendingValue(phone.trim());
      setShowOtpModal(true);
      Alert.alert(t('profile_verification_required'), t('profile_phone_otp_sent'));
    } catch (error) {
      Alert.alert(t('common_error'), error.response?.data?.error || error.error || t('profile_error_send_verification_sms'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length !== 6) {
      Alert.alert(t('common_error'), t('profile_error_invalid_otp'));
      return;
    }
    
    setLoading(true);
    try {
      let response;
      if (verificationType === 'email') {
        response = await userAPI.verifyEmailChange(otpValue, verificationToken);
      } else {
        response = await userAPI.verifyPhoneChange(otpValue, verificationToken);
      }
      
      const updatedUser = response.user || response;
      
      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser,
      });
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update local state
      setFullName(`${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim());
      setPhone(updatedUser.phoneNumber || updatedUser.phone || '');
      setEmail(updatedUser.email || '');
      setAddress(updatedUser.address || '');
      setBarangay(updatedUser.barangay || '');
      
      // Reset modal state
      setShowOtpModal(false);
      setOtpValue('');
      setVerificationToken('');
      setVerificationType('');
      setPendingValue('');
      setEditing(false);
      
      Alert.alert(
        t('common_success'),
        verificationType === 'email' ? t('profile_email_updated_success') : t('profile_phone_updated_success')
      );
    } catch (error) {
      Alert.alert(t('common_error'), error.response?.data?.error || error.error || t('profile_error_invalid_otp_server'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(t('profile_logout'), t('profile_logout_confirm'), [
      { text: t('profile_cancel'), style: 'cancel' },
      {
        text: t('profile_logout'),
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('userToken');
          await SecureStore.deleteItemAsync('refreshToken');
          await AsyncStorage.removeItem('user');
          dispatch({ type: 'LOGOUT' });
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {/* Backdrop Seal */}
        <Image
          source={require('../../assets/BRGY_BILUSO_SEAL-modified.png')}
          style={styles.backdropSeal}
        />
        <View style={styles.avatar}>
          {profilePicture ? (
            <Image 
              source={{ uri: profilePicture }} 
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>
              {fullName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          )}
        </View>
        <Text style={styles.nameDisplay}>{fullName}</Text>
        <Text style={styles.emailDisplay}>{email}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile_title_personal')}</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editButton}>{t('profile_edit')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.label}>{t('profile_full_name')}</Text>
        <TextInput
          style={[
            styles.input,
            !editing && { color: colors.text.muted, backgroundColor: colors.gray[100] },
            editing && styles.inputEditing
          ]}
          value={fullName}
          onChangeText={setFullName}
          editable={editing && !loading}
          placeholderTextColor={colors.text.placeholder}
        />


        <Text style={styles.label}>{t('profile_phone')}</Text>
        <TextInput
          style={[styles.input, editing && styles.inputEditing]}
          value={phone}
          onChangeText={setPhone}
          editable={editing && !loading}
          keyboardType="phone-pad"
          placeholderTextColor={colors.text.placeholder}
        />

        <Text style={styles.label}>{t('profile_email')}</Text>
        <TextInput
          style={[
            styles.input,
            (isGoogleAuthUser || !editing) && { color: colors.text.muted, backgroundColor: colors.gray[100] },
            editing && !isGoogleAuthUser && styles.inputEditing
          ]}
          value={email}
          onChangeText={setEmail}
          editable={editing && !loading && !isGoogleAuthUser}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.text.placeholder}
        />
        {editing && isGoogleAuthUser && (
          <Text style={styles.helperText}>
            Google account email is managed by Google and cannot be edited here.
          </Text>
        )}

        <Text style={styles.label}>{t('profile_address')}</Text>
        <TextInput
          style={[
            styles.input,
            !editing && { color: colors.text.muted, backgroundColor: colors.gray[100] },
            editing && styles.inputEditing
          ]}
          value={address}
          onChangeText={setAddress}
          editable={editing && !loading}
          placeholderTextColor={colors.text.placeholder}
        />

        <Text style={styles.label}>{t('profile_barangay')}</Text>
        <TextInput
          style={[
            styles.input,
            !editing && { color: colors.text.muted, backgroundColor: colors.gray[100] },
            editing && styles.inputEditing
          ]}
          value={barangay}
          onChangeText={setBarangay}
          editable={editing && !loading}
          placeholderTextColor={colors.text.placeholder}
        />

        {editing && (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleUpdateProfile}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('profile_save_changes')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setEditing(false);
                setFullName(initialFullName);
                setPhone(user?.phoneNumber || user?.phone || '');
                setEmail(user?.email || '');
                setAddress(user?.address || '');
                setBarangay(user?.barangay || '');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>{t('profile_cancel')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile_title_preferences')}</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>{t('profile_notifications')}</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: '#767577', true: colors.primary[600] }}
            thumbColor={notificationsEnabled ? colors.primary[700] : '#f4f3f4'}
          />
        </View>

        <View style={styles.languageBlock}>
          <Text style={styles.settingText}>{t('profile_language')}</Text>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[styles.languageButton, i18n.language === 'en' && styles.languageButtonActive]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={[styles.languageButtonText, i18n.language === 'en' && styles.languageButtonTextActive]}>
                {t('profile_language_en')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageButton, i18n.language === 'fil' && styles.languageButtonActive]}
              onPress={() => handleLanguageChange('fil')}
            >
              <Text style={[styles.languageButtonText, i18n.language === 'fil' && styles.languageButtonTextActive]}>
                {t('profile_language_fil')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>{t('profile_logout')}</Text>
        </TouchableOpacity>
      </View>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowOtpModal(false);
          setOtpValue('');
          setLoading(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {verificationType === 'email' ? t('profile_verify_email') : t('profile_verify_phone')}
            </Text>
            <Text style={styles.modalSubtitle}>
              {t('profile_enter_otp', { value: pendingValue })}
            </Text>
            
            <TextInput
              style={styles.otpInput}
              value={otpValue}
              onChangeText={setOtpValue}
              placeholder={t('profile_otp_placeholder')}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
            />
         
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { marginRight: 5, paddingHorizontal: 15 }]}
                onPress={() => {
                  setShowOtpModal(false);
                  setOtpValue('');
                  setLoading(false);
                  // Reset the changed value back to original
                  if (verificationType === 'email') {
                    setEmail(originalEmail);
                  } else {
                    setPhone(originalPhone);
                  }
                }}
              >
                <Text style={styles.cancelButtonText}>{t('profile_cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { flex: 1, marginLeft: 10 }]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{t('profile_verify')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    backgroundColor: colors.primary[600],
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  backdropSeal: {
    position: 'absolute',
    right: -60,
    top: 15,
    width: 200,
    height: 200,
    opacity: 0.12,
    resizeMode: 'contain',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  nameDisplay: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emailDisplay: {
    color: colors.primary[200],
    fontSize: 14,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  editButton: {
    color: colors.primary[600],
    fontWeight: '600',
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    color: colors.text.primary,
    backgroundColor: colors.gray[50],
  },
  inputEditing: {
    backgroundColor: '#fff',
    borderColor: colors.primary[600],
  },
  helperText: {
    marginTop: -8,
    marginBottom: 16,
    fontSize: 12,
    color: colors.text.muted,
  },
  buttonGroup: {
    marginTop: 8,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 6,
  },
  saveButton: {
    backgroundColor: colors.primary[600],
  },
  cancelButton: {
    backgroundColor: colors.gray[200],
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  settingText: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '500',
  },
  languageBlock: {
    paddingTop: 16,
  },
  languageButtons: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  languageButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  languageButtonActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },
  languageButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#fff',
  },
  settingArrow: {
    fontSize: 22,
    color: colors.text.muted,
  },
  logoutButton: {
    backgroundColor: colors.status.error,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: colors.primary[600],
    borderRadius: 10,
    padding: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
