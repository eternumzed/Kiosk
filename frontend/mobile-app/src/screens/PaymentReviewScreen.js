import React, { useState, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as ExpoLinking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestAPI } from '../services/api';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

export default function PaymentReviewScreen({ navigation, route }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { document, formData, user } = route.params;
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'cash'
  const [photoId, setPhotoId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const getApiErrorMessage = (err, fallbackMessage) => {
    const apiError = err?.response?.data?.error;
    const apiMessage = err?.response?.data?.message;
    if (typeof apiError === 'string' && apiError.trim()) return apiError;
    if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
    return fallbackMessage;
  };

  const normalizeBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === 'yes' || normalized === 'y' || normalized === '1';
    }
    if (typeof value === 'number') return value === 1;
    return false;
  };

  const isWorkPurpose = (value) => {
    const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return /(work|job|employment|trabaho|hanapbuhay|apply|application)/i.test(text);
  };

  const computeFee = () => {
    const docName = (document?.name || '').trim().toLowerCase();
    if (docName === 'barangay indigency certificate') return 0;
    if (docName === 'first time job seeker certificate') return 0;
    if (docName === 'barangay residency certificate') return 50;

    if (docName === 'barangay clearance') {
      const student = normalizeBoolean(formData?.isStudent);
      if (student && !isWorkPurpose(formData?.purpose)) {
        return 0;
      }
      return 50;
    }

    return Number(document?.fee || 0);
  };

  const computedFee = computeFee();
  const isFreeRequest = computedFee === 0;

  // Retrieve photoId from AsyncStorage on mount
  useEffect(() => {
    const loadPhoto = async () => {
      try {
        const storedPhoto = await AsyncStorage.getItem('tempPhotoId');
        if (storedPhoto) {
          setPhotoId(storedPhoto);
          console.log('Photo retrieved from storage (length):', storedPhoto.length);
        }
      } catch (error) {
        console.error('Error loading photo from storage:', error);
      }
    };
    loadPhoto();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const userId = user?._id || user?.id || user?.user?._id || user?.user?.id || null;

      const requestData = {
        ...formData,
        document: document.name,
        amount: computedFee,
        paymentMethod: isFreeRequest ? 'Free' : paymentMethod === 'cash' ? 'Cash' : 'Online',
        userId,  // Link request to authenticated user
        ...(photoId ? { photoId } : {}),  // Include photoId if available
      };

      // Log without photoId to avoid console overload
      const { photoId: _photo, ...logData } = requestData;
      console.log('Submitting request:', logData, _photo ? '(with photo)' : '(no photo)');

      if (!isFreeRequest && paymentMethod === 'online') {
        // Create deep link URL for PayMongo to redirect back to app
        const returnUrl = ExpoLinking.createURL('payment-success');
        const cancelUrl = ExpoLinking.createURL('payment-cancelled');
        
        // Create request and get checkout URL with mobile return URLs
        const response = await requestAPI.createRequest({
          ...requestData,
          returnUrl,
          cancelUrl,
        });
        
        if (response.checkout_url) {
          // Open PayMongo checkout - will redirect back to app via deep link
          const result = await WebBrowser.openAuthSessionAsync(
            response.checkout_url,
            returnUrl
          );
          
          console.log('WebBrowser result:', result);
          
          // Parse the result URL to get reference number
          if (result.type === 'success' && result.url) {
            const url = new URL(result.url);
            const refNum = url.searchParams.get('referenceNumber');
            // Clean up stored photo
            await AsyncStorage.removeItem('tempPhotoId');
            navigation.navigate('RequestSuccess', {
              referenceNumber: refNum || response.reference_number,
              document: document.name,
              paymentMethod: 'Online',
            });
          } else if (result.type === 'cancel' || result.type === 'dismiss') {
            // User cancelled or closed browser
            Alert.alert(
              t('payment_review_payment_status'),
              t('payment_review_payment_status_message'),
              [
                { text: t('payment_review_go_dashboard'), onPress: async () => {
                  await AsyncStorage.removeItem('tempPhotoId');
                  navigation.navigate('Dashboard');
                }},
                { text: t('payment_review_stay_here'), style: 'cancel' },
              ]
            );
          }
        } else {
          Alert.alert(t('common_error'), t('payment_review_error_create_session'));
        }
      } else {
        // Cash or free request - create request without checkout
        const response = await requestAPI.createRequestCash(requestData);
        
        // Clean up stored photo
        await AsyncStorage.removeItem('tempPhotoId');
        navigation.navigate('RequestSuccess', {
          referenceNumber: response.referenceNumber || response.reference_number,
          document: document.name,
          paymentMethod: isFreeRequest ? 'Free' : 'Cash',
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
      const errorMsg = getApiErrorMessage(error, t('payment_review_error_submit'));
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const infoItems = [
    { label: 'Full Name', value: formData.fullName },
    { label: 'Email', value: formData.email },
    { label: 'Contact Number', value: formData.contactNumber },
    { label: 'Address', value: formData.address },
  ];

  // Add document-specific fields (exclude photoId - it's a large base64 string)
  const docFields = Object.entries(formData).filter(
    ([key]) => !['fullName', 'email', 'contactNumber', 'address', 'photoId'].includes(key) && formData[key]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 50) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('payment_review_title')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Error Banner */}
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={20} color="#dc2626" style={styles.errorIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
          <TouchableOpacity onPress={() => setErrorMessage('')}>
            <Feather name="x" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView style={styles.content}>
        {/* Document Info */}
        <View style={styles.documentCard}>
          <Text style={styles.documentName}>{document.name}</Text>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>{t('payment_review_processing_fee')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="currency-php" size={20} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.feeAmount}>{computedFee}</Text>
            </View>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('common_personal_information')}</Text>
          {infoItems.map((item) => (
            <View key={item.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Document-specific fields */}
        {docFields.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('payment_review_additional_info')}</Text>
            {docFields.map(([key, value]) => (
              <View key={key} style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}

        {!isFreeRequest && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('common_payment_method')}</Text>
            
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'online' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('online')}
            >
              <View style={styles.paymentRadio}>
                {paymentMethod === 'online' && <View style={styles.paymentRadioInner} />}
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>{t('payment_review_pay_online')}</Text>
                <Text style={styles.paymentDesc}>
                  {t('payment_review_pay_online_desc')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'cash' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('cash')}
            >
              <View style={styles.paymentRadio}>
                {paymentMethod === 'cash' && <View style={styles.paymentRadioInner} />}
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>{t('payment_review_pay_cash')}</Text>
                <Text style={styles.paymentDesc}>
                  {t('payment_review_pay_cash_desc')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('common_total_amount')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="currency-php" size={20} color={colors.primary[600]} style={{ marginRight: 4 }} />
            <Text style={styles.totalAmount}>{computedFee}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isFreeRequest ? t('payment_review_submit_request') : paymentMethod === 'online' ? t('payment_review_proceed_payment') : t('payment_review_submit_request')}
            </Text>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary[600],
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  documentCard: {
    backgroundColor: colors.primary[600],
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  documentName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  feeAmount: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoLabel: {
    color: colors.text.muted,
    fontSize: 14,
  },
  infoValue: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
    marginBottom: 12,
  },
  paymentOptionActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  paymentRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[600],
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  paymentDesc: {
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 2,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.text.muted,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  submitButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderBottomWidth: 1,
    borderBottomColor: '#fca5a5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
