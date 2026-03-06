import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { requestAPI } from '../services/api';
import { colors } from '../theme/colors';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function RequestDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { requestId, referenceNumber } = route.params;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    loadRequestDetails();
  }, []);

  const loadRequestDetails = async () => {
    try {
      let data;
      if (requestId) {
        data = await requestAPI.getRequestDetails(requestId);
        if (Array.isArray(data) && data.length > 0) {
          data = data[0];
        }
        if ((!data || !data.referenceNumber) && referenceNumber) {
          const fallback = await requestAPI.trackRequest(referenceNumber);
          data = Array.isArray(fallback) ? fallback[0] : fallback;
        }
      } else if (referenceNumber) {
        // Fetch by reference number
        data = await requestAPI.trackRequest(referenceNumber);
        if (Array.isArray(data) && data.length > 0) {
          data = data[0];
        }
      }
      setRequest(data);
    } catch (error) {
      console.error('Failed to load request:', error);
      Alert.alert(t('common_error'), t('request_detail_error_load'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (request?.pdfUrl) {
      try {
        await Linking.openURL(request.pdfUrl);
      } catch (error) {
        Alert.alert(t('common_error'), t('request_detail_error_open_document'));
      }
    } else if (request?.pdfDownloadUrl) {
      try {
        await Linking.openURL(request.pdfDownloadUrl);
      } catch (error) {
        Alert.alert(t('common_error'), t('request_detail_error_download_document'));
      }
    } else {
      Alert.alert(t('common_not_available'), t('request_detail_document_not_ready'));
    }
  };

  const handleToggleHidden = async () => {
    if (!request?._id && !request?.referenceNumber) {
      Alert.alert(t('common_error'), t('request_detail_error_identifier_missing'));
      return;
    }

    try {
      setHiding(true);

      if (request.hiddenByUser) {
        await requestAPI.unhideRequest(request._id, request.referenceNumber);
        setRequest((prev) => ({ ...prev, hiddenByUser: false, hiddenAt: null }));
      } else {
        await requestAPI.hideRequest(request._id, request.referenceNumber);
        setRequest((prev) => ({ ...prev, hiddenByUser: true, hiddenAt: new Date().toISOString() }));
      }
    } catch (error) {
      console.error('Toggle hide state failed:', error);
      const apiMessage = error?.response?.data?.error || error?.response?.data?.message;
      Alert.alert(t('common_error'), apiMessage || t('request_detail_error_visibility'));
    } finally {
      setHiding(false);
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'for pick-up':
        return colors.status.success;
      case 'pending':
      case 'processing':
        return colors.status.warning;
      case 'cancelled':
        return colors.status.error;
      default:
        return colors.gray[500];
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notFoundText}>{t('request_detail_not_found')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.documentType}>{request.document}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(request.status) },
          ]}
        >
          <Text style={styles.statusText}>{request.status?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('request_detail_request_information')}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('common_reference_number')}</Text>
          <Text style={styles.value}>{request.referenceNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('request_detail_date_submitted')}</Text>
          <Text style={styles.value}>
            {new Date(request.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('common_amount')}</Text>
          <Text style={styles.value}>₱{request.amount}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('common_payment_status')}</Text>
          <Text style={[styles.value, { color: request.paymentStatus === 'Paid' ? colors.status.success : colors.status.warning }]}>
            {request.paymentStatus || t('status_pending')}
          </Text>
        </View>
        <View style={[styles.infoRow, styles.infoRowLast]}>
          <Text style={styles.label}>{t('common_status')}</Text>
          <Text style={[styles.value, { color: getStatusColor(request.status) }]}>
            {request.status}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('common_personal_information')}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('common_full_name')}</Text>
          <Text style={styles.value}>{request.fullName || t('common_na')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('common_email')}</Text>
          <Text style={styles.value}>{request.email || t('common_na')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('common_address')}</Text>
          <Text style={styles.value}>{request.address || t('common_na')}</Text>
        </View>
        <View style={[styles.infoRow, styles.infoRowLast]}>
          <Text style={styles.label}>{t('common_contact_number')}</Text>
          <Text style={styles.value}>{request.contactNumber || t('common_na')}</Text>
        </View>
      </View>

      {request.remarks && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('common_remarks')}</Text>
          <Text style={styles.remarksText}>{request.remarks}</Text>
        </View>
      )}

      {/* Download Button - only shown when document is ready */}
      {(request.pdfUrl || request.pdfDownloadUrl) && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownload}
            activeOpacity={0.8}
          >
            <Text style={styles.downloadButtonText}>
              <Feather name="download" size={25} color="#0000" /> {t('request_detail_download_document')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.visibilityButton, request.hiddenByUser ? styles.unhideButton : styles.hideButton]}
          onPress={handleToggleHidden}
          disabled={hiding}
          activeOpacity={0.8}
        >
          <Text style={styles.visibilityButtonText}>
            {hiding
              ? t('common_updating')
              : request.hiddenByUser
                ? t('request_detail_unhide')
                : t('request_detail_hide')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, styles.helpSection]}>
        <Text style={styles.sectionTitle}>{t('request_detail_next_steps')}</Text>
        <View style={styles.helpCard}>
          <Text style={styles.helpIcon}>
            {request.status === 'Pending' ? <Feather name="clock" size={25} color="green"  /> :
              request.status === 'For Pick-up' ? <Feather name="truck" size={25} color="green"  /> :
                request.status === 'Completed' ? <Feather name="check-circle" size={25} color="green" /> : <Feather name="info" size={25} color="green" />}
          </Text>



          <Text style={styles.helpText}>
            {request.status === 'Pending'
              ? t('request_detail_help_pending')
              : request.status === 'Processing'
                ? t('request_detail_help_processing')
                : request.status === 'For Pick-up'
                  ? t('request_detail_help_for_pickup')
                  : request.status === 'Completed'
                    ? t('request_detail_help_completed')
                    : t('request_detail_help_default')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary[800],
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  helpSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  remarksText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  helpCard: {
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  helpIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary[800],
    lineHeight: 22,
  },
  downloadButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  visibilityButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  hideButton: {
    backgroundColor: colors.gray[200],
  },
  unhideButton: {
    backgroundColor: colors.primary[100],
  },
  visibilityButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
});
