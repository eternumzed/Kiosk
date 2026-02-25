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

export default function RequestDetailScreen({ route, navigation }) {
  const { requestId, referenceNumber } = route.params;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequestDetails();
  }, []);

  const loadRequestDetails = async () => {
    try {
      let data;
      if (referenceNumber) {
        // Fetch by reference number
        data = await requestAPI.trackRequest(referenceNumber);
        if (Array.isArray(data) && data.length > 0) {
          data = data[0];
        }
      } else if (requestId) {
        data = await requestAPI.getRequestDetails(requestId);
      }
      setRequest(data);
    } catch (error) {
      console.error('Failed to load request:', error);
      Alert.alert('Error', 'Failed to load request details');
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
        Alert.alert('Error', 'Could not open document');
      }
    } else if (request?.pdfDownloadUrl) {
      try {
        await Linking.openURL(request.pdfDownloadUrl);
      } catch (error) {
        Alert.alert('Error', 'Could not download document');
      }
    } else {
      Alert.alert('Not Available', 'Document is not yet available for download');
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
        <Text style={styles.notFoundText}>Request not found</Text>
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
        <Text style={styles.sectionTitle}>Request Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Reference Number</Text>
          <Text style={styles.value}>{request.referenceNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Date Submitted</Text>
          <Text style={styles.value}>
            {new Date(request.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>₱{request.amount}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Payment Status</Text>
          <Text style={[styles.value, { color: request.paymentStatus === 'Paid' ? colors.status.success : colors.status.warning }]}>
            {request.paymentStatus || 'Pending'}
          </Text>
        </View>
        <View style={[styles.infoRow, styles.infoRowLast]}>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.value, { color: getStatusColor(request.status) }]}>
            {request.status}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Full Name</Text>
          <Text style={styles.value}>{request.fullName || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{request.email || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{request.address || 'N/A'}</Text>
        </View>
        <View style={[styles.infoRow, styles.infoRowLast]}>
          <Text style={styles.label}>Contact Number</Text>
          <Text style={styles.value}>{request.contactNumber || 'N/A'}</Text>
        </View>
      </View>

      {request.remarks && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remarks</Text>
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
              <Feather name="download" size={25} color="#0000" /> Download Document</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.section, styles.helpSection]}>
        <Text style={styles.sectionTitle}>Next Steps</Text>
        <View style={styles.helpCard}>
          <Text style={styles.helpIcon}>
            {request.status === 'Pending' ? <Feather name="clock" size={25} color="green"  /> :
              request.status === 'For Pick-up' ? <Feather name="truck" size={25} color="green"  /> :
                request.status === 'Completed' ? <Feather name="check-circle" size={25} color="green" /> : <Feather name="info" size={25} color="green" />}
          </Text>



          <Text style={styles.helpText}>
            {request.status === 'Pending'
              ? 'Your request is being processed. We will notify you once it is ready.'
              : request.status === 'Processing'
                ? 'Your document is currently being prepared.'
                : request.status === 'For Pick-up'
                  ? 'Your document is ready! Visit the barangay hall to collect it.'
                  : request.status === 'Completed'
                    ? 'Your request has been completed. Thank you!'
                    : 'Please check the remarks above or visit the barangay hall for more information.'}
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
});
