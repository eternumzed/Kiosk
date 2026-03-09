import React, { useState, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { requestAPI } from '../services/api';
import { colors } from '../theme/colors';
import { Feather } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';

const STATUS_OPTIONS = ['All', 'Pending', 'Processing', 'For Pick-up', 'Completed', 'Cancelled'];
const SORT_OPTIONS = [
  { value: 'desc' },
  { value: 'asc' },
];

export default function DashboardScreen({ navigation, user, dispatch }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('All');
  const [documentFilter, setDocumentFilter] = useState('All');
  const [dateSort, setDateSort] = useState('desc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [requestTab, setRequestTab] = useState('active');

  // Compute display name from user object
  const displayName = user?.fullName || 
    (user?.firstName || user?.lastName 
      ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() 
      : 'User');
  
  // Get profile picture URL
  const profilePicture = user?.profilePicture;

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await requestAPI.getRequestHistory();
      // Backend returns { success, count, requests } - extract the requests array
      setRequests(data?.requests || data || []);
    } catch (error) {
      console.error('Load requests error:', error);
      Alert.alert(t('common_error'), t('dashboard_error_load_requests'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadRequests();
    }, [])
  );

  // Extract unique document types from requests
  const documentTypes = useMemo(() => {
    const types = new Set(requests.map(r => r.document).filter(Boolean));
    return ['All', ...Array.from(types)];
  }, [requests]);

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    let result = [...requests];
    
    // Filter by status
    if (statusFilter !== 'All') {
      result = result.filter(r => r.status === statusFilter);
    }
    
    // Filter by document type
    if (documentFilter !== 'All') {
      result = result.filter(r => r.document === documentFilter);
    }
    
    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateSort === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    return result;
  }, [requests, statusFilter, documentFilter, dateSort]);

  const activeRequests = useMemo(
    () => filteredRequests.filter((r) => !r.hiddenByUser),
    [filteredRequests]
  );

  const hiddenRequests = useMemo(
    () => filteredRequests.filter((r) => !!r.hiddenByUser),
    [filteredRequests]
  );

  const visibleRequests = useMemo(
    () => (requestTab === 'hidden' ? hiddenRequests : activeRequests),
    [requestTab, activeRequests, hiddenRequests]
  );

  // Check if any filter is active
  const hasActiveFilters = statusFilter !== 'All' || documentFilter !== 'All';
  
  const clearFilters = () => {
    setStatusFilter('All');
    setDocumentFilter('All');
    setDateSort('desc');
  };

  const getStatusLabel = (status) => {
    if (status === 'All') return t('common_all');
    if (status === 'Pending') return t('status_pending');
    if (status === 'Processing') return t('status_processing');
    if (status === 'For Pick-up') return t('status_for_pickup');
    if (status === 'Completed') return t('status_completed');
    if (status === 'Cancelled') return t('status_cancelled');
    return status;
  };

  const getSortLabel = (value) => {
    return value === 'desc' ? t('dashboard_newest_first') : t('dashboard_oldest_first');
  };


  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return colors.status.success;
      case 'pending':
        return colors.status.warning;
      case 'processing':
        return colors.primary[500];
      case 'for pick-up':
        return '#10B981'; // emerald
      case 'cancelled':
        return colors.status.error;
      default:
        return colors.gray[500];
    }
  };

  const renderRequestItem = ({ item, section }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => navigation.navigate('RequestDetail', {
        requestId: item._id,
        referenceNumber: item.referenceNumber,
        hiddenByUser: !!item.hiddenByUser,
      })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.documentType} numberOfLines={1}>{item.document}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status?.toLowerCase()) },
          ]}
        >
          <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.cardDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <Text style={styles.cardRef}>Ref: {item.referenceNumber || item._id?.slice(-8).toUpperCase()}</Text>

    </TouchableOpacity>
  );

  if (loading && requests.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 6, 50) }]}>
        {/* Backdrop Seal */}
        <Image
          source={require('../../assets/BRGY_BILUSO_SEAL-modified.png')}
          style={styles.backdropSeal}
        />
        <View>
          <Text style={styles.greeting}>{t('dashboard_welcome_back')}</Text>
          <Text style={styles.userName}>{displayName}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          {profilePicture ? (
            <Image 
              source={{ uri: profilePicture }} 
              style={styles.profileImage}
            />
          ) : (
            <FontAwesome name="user" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.newRequestButton}
        onPress={() => navigation.navigate('NewRequest', { user })}
        activeOpacity={0.8}
      >
        <Text style={styles.newRequestText}>+ {t('dashboard_new_request')}</Text>
      </TouchableOpacity>

      {/* Filter Section */}
      {requests.length > 0 && (
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>{t('dashboard_my_requests')}</Text>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Feather name="filter" size={18} color={colors.primary[600]} />
              <Text style={styles.filterButtonText}>{t('dashboard_filter')}</Text>
              {hasActiveFilters && <View style={styles.filterBadge} />}
            </TouchableOpacity>
          </View>
          
          {/* Quick Status Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.statusScroll}
            contentContainerStyle={styles.statusScrollContent}
          >
            {STATUS_OPTIONS.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusChip,
                  statusFilter === status && styles.statusChipActive,
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[
                  styles.statusChipText,
                  statusFilter === status && styles.statusChipTextActive,
                ]}>
                  {getStatusLabel(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort Toggle */}
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setDateSort(dateSort === 'desc' ? 'asc' : 'desc')}
          >
            <Feather 
              name={dateSort === 'desc' ? 'arrow-down' : 'arrow-up'} 
              size={14} 
              color={colors.text.secondary} 
            />
            <Text style={styles.sortText}>
              {dateSort === 'desc' ? t('dashboard_newest') : t('dashboard_oldest')} {t('dashboard_first')}
            </Text>
          </TouchableOpacity>

          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tabButton, requestTab === 'active' && styles.tabButtonActive]}
              onPress={() => setRequestTab('active')}
            >
              <Text style={[styles.tabButtonText, requestTab === 'active' && styles.tabButtonTextActive]}>
                {t('dashboard_active')} ({activeRequests.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, requestTab === 'hidden' && styles.tabButtonActive]}
              onPress={() => setRequestTab('hidden')}
            >
              <Text style={[styles.tabButtonText, requestTab === 'hidden' && styles.tabButtonTextActive]}>
                {t('dashboard_hidden')} ({hiddenRequests.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('dashboard_filter_requests')}</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Feather name="x" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Document Type Filter */}
            <Text style={styles.modalSectionTitle}>{t('dashboard_document_type')}</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.modalChipsScroll}
            >
              {documentTypes.map((doc) => (
                <TouchableOpacity
                  key={doc}
                  style={[
                    styles.modalChip,
                    documentFilter === doc && styles.modalChipActive,
                  ]}
                  onPress={() => setDocumentFilter(doc)}
                >
                  <Text style={[
                    styles.modalChipText,
                    documentFilter === doc && styles.modalChipTextActive,
                  ]} numberOfLines={1}>
                    {doc}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Status Filter */}
            <Text style={styles.modalSectionTitle}>{t('common_status')}</Text>
            <View style={styles.modalChipsWrap}>
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.modalChip,
                    statusFilter === status && styles.modalChipActive,
                  ]}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text style={[
                    styles.modalChipText,
                    statusFilter === status && styles.modalChipTextActive,
                  ]}>
                    {getStatusLabel(status)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sort Order */}
            <Text style={styles.modalSectionTitle}>{t('dashboard_sort_by_date')}</Text>
            <View style={styles.sortOptions}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    dateSort === option.value && styles.sortOptionActive,
                  ]}
                  onPress={() => setDateSort(option.value)}
                >
                  <Feather 
                    name={option.value === 'desc' ? 'arrow-down' : 'arrow-up'} 
                    size={16} 
                    color={dateSort === option.value ? '#fff' : colors.text.secondary} 
                  />
                  <Text style={[
                    styles.sortOptionText,
                    dateSort === option.value && styles.sortOptionTextActive,
                  ]}>
                    {getSortLabel(option.value)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>{t('dashboard_clear_all')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>{t('dashboard_apply')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Feather name="clipboard" size={48} color={colors.gray[400]} />
          </View>
          <Text style={styles.emptyText}>{t('dashboard_no_requests')}</Text>
          <Text style={styles.emptySubtext}>{t('dashboard_no_requests_sub')}</Text>
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Feather name="search" size={48} color={colors.gray[400]} />
          </View>
          <Text style={styles.emptyText}>{t('dashboard_no_matching_requests')}</Text>
          <Text style={styles.emptySubtext}>{t('dashboard_adjust_filters')}</Text>
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>{t('dashboard_clear_filters')}</Text>
          </TouchableOpacity>
        </View>
      ) : visibleRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Feather name={requestTab === 'hidden' ? 'archive' : 'inbox'} size={48} color={colors.gray[400]} />
          </View>
          <Text style={styles.emptyText}>
            {requestTab === 'hidden' ? t('dashboard_no_hidden_requests') : t('dashboard_no_active_requests')}
          </Text>
          <Text style={styles.emptySubtext}>
            {requestTab === 'hidden'
              ? t('dashboard_hidden_requests_sub')
              : t('dashboard_no_active_sub')}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary[600]]}
              tintColor={colors.primary[600]}
            />
          }
        >
          {visibleRequests.map((item) => (
            <View key={item._id}>{renderRequestItem({ item })}</View>
          ))}
        </ScrollView>
      )}
    </View>
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
  header: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  backdropSeal: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 200,
    height: 200,
    opacity: 0.12,
    resizeMode: 'contain',
  },
  greeting: {
    color: colors.primary[200],
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profileButtonText: {
    fontSize: 22,
  },
  newRequestButton: {
    backgroundColor: colors.primary[700],
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary[800],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  newRequestText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[600],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabSwitcher: {
    marginTop: 10,
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 10,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary[600],
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  documentType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardDate: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  cardRef: {
    fontSize: 12,
    color: colors.text.muted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary[600],
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Filter Section Styles
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  filterButtonText: {
    marginLeft: 6,
    color: colors.primary[600],
    fontWeight: '600',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.error,
  },
  statusScroll: {
    marginBottom: 8,
  },
  statusScrollContent: {
    paddingRight: 20,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 20,
    marginRight: 8,
  },
  statusChipActive: {
    backgroundColor: colors.primary[600],
  },
  statusChipText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  statusChipTextActive: {
    color: '#fff',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sortText: {
    marginLeft: 6,
    fontSize: 13,
    color: colors.text.secondary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 12,
    marginTop: 8,
  },
  modalChipsScroll: {
    marginBottom: 8,
  },
  modalChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  modalChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  modalChipActive: {
    backgroundColor: colors.primary[600],
  },
  modalChipText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  modalChipTextActive: {
    color: '#fff',
  },
  sortOptions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sortOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 10,
    marginRight: 8,
  },
  sortOptionActive: {
    backgroundColor: colors.primary[600],
  },
  sortOptionText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    marginRight: 8,
  },
  clearButtonText: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: 12,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
