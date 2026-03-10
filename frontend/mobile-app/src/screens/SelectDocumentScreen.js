import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

const documents = [
  { name: 'Barangay Clearance', fee: 50, category: 'Clearance' },
  { name: 'Barangay Indigency Certificate', fee: 0, category: 'Certification' },
  { name: 'First Time Job Seeker Certificate', fee: 0, category: 'Certification' },
  { name: 'Barangay Work Permit', fee: 100, category: 'Permit' },
  { name: 'Barangay Residency Certificate', fee: 50, category: 'Certification' },
  { name: 'Certificate of Good Moral Character', fee: 50, category: 'Certification' },
  { name: 'Barangay Business Permit', fee: 300, category: 'Permit' },
  { name: 'Barangay Building Clearance', fee: 300, category: 'Permit' },
];

const categories = ['All', 'Clearance', 'Certification', 'Permit'];

export default function SelectDocumentScreen({ navigation, route }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const user = route.params?.user;

  const getDocumentLabel = (name) => {
    const keyMap = {
      'Barangay Clearance': 'doc_barangay_clearance',
      'Barangay Indigency Certificate': 'doc_barangay_indigency',
      'First Time Job Seeker Certificate': 'doc_first_time_job_seeker',
      'Barangay Work Permit': 'doc_barangay_work_permit',
      'Barangay Residency Certificate': 'doc_barangay_residency',
      'Certificate of Good Moral Character': 'doc_good_moral',
      'Barangay Business Permit': 'doc_barangay_business_permit',
      'Barangay Building Clearance': 'doc_barangay_building_clearance',
    };
    const key = keyMap[name];
    return key ? t(key) : name;
  };

  const getCategoryLabel = (category) => {
    if (category === 'All') return t('common_all');
    if (category === 'Clearance') return t('category_clearance');
    if (category === 'Certification') return t('category_certification');
    if (category === 'Permit') return t('category_permit');
    return category;
  };

  const filteredDocuments = selectedCategory === 'All'
    ? documents
    : documents.filter((doc) => doc.category === selectedCategory);

  const handleSelectDocument = (document) => {
    navigation.navigate('RequestForm', {
      document,
      user,
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 50) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('select_document_title')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {getCategoryLabel(category)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Document List */}
      <ScrollView
        style={styles.documentList}
        contentContainerStyle={styles.documentListContent}
      >
        {filteredDocuments.map((doc) => (
          <TouchableOpacity
            key={doc.name}
            style={styles.documentCard}
            onPress={() => handleSelectDocument(doc)}
            activeOpacity={0.7}
          >
            <View style={styles.documentInfo}>
              <Text style={styles.documentName}>{getDocumentLabel(doc.name)}</Text>
              <Text style={styles.documentCategory}>{getCategoryLabel(doc.category)}</Text>
            </View>
            <View style={styles.documentFee}>
              <Text style={styles.feeLabel}>{t('common_fee')}</Text>
              <Text style={styles.feeAmount}>₱{doc.fee}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  categoryScroll: {
    maxHeight: 60,
    backgroundColor: '#fff',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary[600],
  },
  categoryText: {
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#fff',
  },
  documentList: {
    flex: 1,
  },
  documentListContent: {
    padding: 16,
    gap: 12,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
    marginRight: 16,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  documentCategory: {
    fontSize: 13,
    color: colors.text.muted,
  },
  documentFee: {
    alignItems: 'flex-end',
  },
  feeLabel: {
    fontSize: 12,
    color: colors.text.muted,
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
});
