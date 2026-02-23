import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
} from 'react-native';
import { requestAPI } from '../services/api';
import { colors } from '../theme/colors';

export default function RequestSuccessScreen({ navigation, route }) {
  const { referenceNumber, document, paymentMethod } = route.params;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (referenceNumber) {
      loadRequestDetails();
    } else {
      setLoading(false);
    }
  }, [referenceNumber]);

  const loadRequestDetails = async () => {
    try {
      const data = await requestAPI.trackRequest(referenceNumber);
      if (Array.isArray(data) && data.length > 0) {
        setRequest(data[0]);
      } else if (data && !Array.isArray(data)) {
        setRequest(data);
      }
    } catch (error) {
      console.error('Failed to load request details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My document request has been submitted!\n\nReference Number: ${referenceNumber}\nDocument: ${document}\n\nYou can use this reference number to track your request status.`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleGoHome = () => {
    // Reset navigation to Dashboard
    navigation.reset({
      index: 0,
      routes: [{ name: 'DashboardList' }],
    });
  };

  const handleTrackRequest = () => {
    navigation.navigate('RequestDetail', { 
      requestId: request?._id,
      referenceNumber,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading your request...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.successIcon}>✓</Text>
        </View>

        <Text style={styles.title}>Request Submitted!</Text>
        
        {paymentMethod === 'Cash' ? (
          <Text style={styles.subtitle}>
            Please visit the barangay hall to complete your payment and claim your document.
          </Text>
        ) : (
          <Text style={styles.subtitle}>
            Your payment was successful. Your document will be ready for pickup after validation.
          </Text>
        )}

        {/* Reference Number Card */}
        <View style={styles.referenceCard}>
          <Text style={styles.referenceLabel}>Reference Number</Text>
          <Text style={styles.referenceNumber}>{referenceNumber}</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>📤 Share</Text>
          </TouchableOpacity>
        </View>

        {/* Request Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Document</Text>
            <Text style={styles.detailValue}>{document}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{paymentMethod}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {paymentMethod === 'Cash' ? 'AWAITING PAYMENT' : 'PROCESSING'}
              </Text>
            </View>
          </View>
          {request?.fullName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{request.fullName}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleTrackRequest}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Track Request</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGoHome}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Go to Home</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.muted,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    paddingTop: 60,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.status.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  referenceCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  referenceLabel: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600',
    marginBottom: 8,
  },
  referenceNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary[700],
    letterSpacing: 1,
    marginBottom: 12,
  },
  shareButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: colors.primary[600],
    borderRadius: 20,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.muted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  statusBadge: {
    backgroundColor: colors.status.warning,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: colors.gray[100],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
