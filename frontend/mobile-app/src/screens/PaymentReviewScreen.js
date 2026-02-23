import React, { useState } from 'react';
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
import * as WebBrowser from 'expo-web-browser';
import * as ExpoLinking from 'expo-linking';
import { requestAPI } from '../services/api';
import { colors } from '../theme/colors';

export default function PaymentReviewScreen({ navigation, route }) {
  const { document, formData, user } = route.params;
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'cash'

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const requestData = {
        ...formData,
        document: document.name,
        amount: document.fee,
        paymentMethod: paymentMethod === 'cash' ? 'Cash' : 'Online',
        userId: user?._id,  // Link request to authenticated user
      };

      // Log without photoId to avoid console overload
      const { photoId, ...logData } = requestData;
      console.log('Submitting request:', logData, photoId ? '(with photo)' : '(no photo)');

      if (paymentMethod === 'online') {
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
            navigation.navigate('RequestSuccess', {
              referenceNumber: refNum || response.reference_number,
              document: document.name,
              paymentMethod: 'Online',
            });
          } else if (result.type === 'cancel' || result.type === 'dismiss') {
            // User cancelled or closed browser
            Alert.alert(
              'Payment Status',
              'If you completed your payment, your request has been submitted. You can check your request history for status updates.',
              [
                { text: 'Go to Dashboard', onPress: () => navigation.navigate('Dashboard') },
                { text: 'Stay Here', style: 'cancel' },
              ]
            );
          }
        } else {
          Alert.alert('Error', 'Could not create payment session');
        }
      } else {
        // Cash payment - create request without checkout
        const response = await requestAPI.createRequestCash(requestData);
        
        navigation.navigate('RequestSuccess', {
          referenceNumber: response.referenceNumber || response.reference_number,
          document: document.name,
          paymentMethod: 'Cash',
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || error.message || 'Failed to submit request'
      );
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Pay</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Document Info */}
        <View style={styles.documentCard}>
          <Text style={styles.documentName}>{document.name}</Text>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Processing Fee</Text>
            <Text style={styles.feeAmount}>₱{document.fee}</Text>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
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
            <Text style={styles.sectionTitle}>Additional Information</Text>
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

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
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
              <Text style={styles.paymentTitle}>Pay Online</Text>
              <Text style={styles.paymentDesc}>
                Pay securely via GCash, Maya, or Card
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
              <Text style={styles.paymentTitle}>Pay in Cash</Text>
              <Text style={styles.paymentDesc}>
                Pay at the barangay hall when you pick up
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>₱{document.fee}</Text>
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
              {paymentMethod === 'online' ? 'Proceed to Payment' : 'Submit Request'}
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
    paddingTop: 50,
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
});
