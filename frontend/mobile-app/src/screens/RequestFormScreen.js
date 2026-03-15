import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../services/api';

// Documents that require a photo
const TEMPLATES_REQUIRING_PHOTO = [
  'Barangay Clearance',
  'Barangay Indigency Certificate',
  'Barangay Residency Certificate',
];

// Document-specific fields (same as kiosk-client)
const documentFields = {
  'Barangay Clearance': [
    { label: 'Citizenship', key: 'citizenship', placeholder: 'e.g., Filipino' },
    { label: 'Civil Status', key: 'civilStatus', placeholder: 'e.g., Single, Married' },
    { label: 'Age', key: 'age', placeholder: 'Enter your age', keyboardType: 'numeric' },
    { label: 'Purpose', key: 'purpose', placeholder: 'Purpose of request' },
    { label: 'Student (Yes/No)', key: 'isStudent', placeholder: 'Yes or No' },
    { label: 'School Name', key: 'schoolName', placeholder: 'Enter school name (if student)' },
    { label: 'Student ID Number', key: 'studentIdNumber', placeholder: 'Enter student ID number (if student)' },
  ],
  'Barangay Indigency Certificate': [
    { label: 'Age', key: 'age', placeholder: 'Enter your age', keyboardType: 'numeric' },
    { label: 'Purpose', key: 'purpose', placeholder: 'Purpose of request' },
  ],
  'First Time Job Seeker Certificate': [
    { label: 'Zone', key: 'zone', placeholder: 'e.g., Zone 1' },
    { label: 'Length of Residency', key: 'lengthOfResidency', placeholder: 'e.g., 5 years' },
  ],
  'Barangay Work Permit': [],
  'Barangay Residency Certificate': [
    { label: 'Zone', key: 'zone', placeholder: 'e.g., Zone 1' },
    { label: 'Purpose', key: 'purpose', placeholder: 'Purpose of request' },
  ],
  'Certificate of Good Moral Character': [
    { label: 'Civil Status', key: 'civilStatus', placeholder: 'e.g., Single, Married' },
  ],
  'Barangay Business Permit': [
    { label: 'Business Name', key: 'businessName', placeholder: 'Enter business name' },
    { label: 'Business Kind', key: 'businessKind', placeholder: 'e.g., Retail, Food' },
    { label: 'Business Address', key: 'businessAddress', placeholder: 'Business address' },
  ],
  'Barangay Building Clearance': [
    { label: 'Age', key: 'age', placeholder: 'Enter your age', keyboardType: 'numeric' },
    { label: 'Sex', key: 'sex', placeholder: 'Male / Female' },
    { label: 'Project Type', key: 'projectType', placeholder: 'e.g., Residential, Commercial' },
  ],
};

// Base personal info fields
const personalInfoFields = [
  { label: 'Full Name', key: 'fullName', placeholder: 'Enter your full name' },
  { label: 'Email', key: 'email', placeholder: 'Enter your email', keyboardType: 'email-address' },
  { label: 'Contact Number', key: 'contactNumber', placeholder: 'Enter contact number', keyboardType: 'phone-pad' },
  { label: 'Address', key: 'address', placeholder: 'Enter your address' },
];

export default function RequestFormScreen({ navigation, route }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { document } = route.params;
  const inputRef = useRef(null);
  const docSpecificFields = useMemo(() => documentFields[document.name] || [], [document.name]);
  const requiresPhoto = useMemo(() => TEMPLATES_REQUIRING_PHOTO.includes(document.name), [document.name]);

  // Fetch latest user info for autofill
  const [user, setUser] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const latestUser = await userAPI.getProfile();
        const normalizedUser = latestUser?.user || latestUser;
        setUser(normalizedUser || null);
      } catch (e) {
        setUser(route.params.user || null);
      }
    })();
  }, []);

  // Pre-fill from user data if available
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    address: '',
    ...docSpecificFields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {}),
    ...(requiresPhoto ? { photoId: '' } : {}),
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || '',
        email: user.email || '',
        contactNumber: user.phoneNumber || user.phone || '',
        address: user.address || '',
      }));
    }
  }, [user]);

  const [currentStep, setCurrentStep] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);
  
  // Add photo step at the end if required
  const allFields = useMemo(
    () => [
      ...personalInfoFields,
      ...docSpecificFields,
      ...(requiresPhoto ? [{ label: 'Photo ID', key: 'photoId', type: 'photo' }] : []),
    ],
    [docSpecificFields, requiresPhoto]
  );
  const isStudentYes = String(formData.isStudent).toLowerCase() === 'yes' || formData.isStudent === true;
  const isStudentDetailField = (key) => key === 'schoolName' || key === 'studentIdNumber';
  const visibleFields = useMemo(
    () =>
      allFields.filter((field) => {
        if (field.type === 'photo') return true;
        if (!isStudentDetailField(field.key)) return true;
        return isStudentYes;
      }),
    [allFields, isStudentYes]
  );
  const totalSteps = visibleFields.length;
  const currentField = visibleFields[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isPhotoStep = currentField?.type === 'photo';

  useEffect(() => {
    if (!currentField || isPhotoStep || currentField.key === 'isStudent') return;

    // Delay focus until UI interactions settle to keep keyboard opening responsive.
    const task = InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    });

    return () => task.cancel();
  }, [currentField, isPhotoStep]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (currentStep > totalSteps - 1) {
      setCurrentStep(Math.max(totalSteps - 1, 0));
    }
  }, [currentStep, totalSteps]);

  const pickImage = async (useCamera = false) => {
    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('common_permission_required'), t('request_form_camera_permission_required'));
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('common_permission_required'), t('request_form_media_permission_required'));
          return;
        }
      }

      setImageLoading(true);

      const options = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for ID photo
        quality: 0.5, // Lower quality to reduce size
        base64: true,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        handleChange('photoId', base64Image);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(t('common_error'), t('request_form_error_pick_image'));
    } finally {
      setImageLoading(false);
    }
  };

  const handleNext = () => {
    // Validate current field
    if (isPhotoStep) {
      if (!formData.photoId) {
        Alert.alert(t('common_required'), t('request_form_required_photo'));
        return;
      }
    } else if (currentField.key === 'isStudent') {
      if (formData.isStudent === undefined || formData.isStudent === null || formData.isStudent === '') {
        Alert.alert(t('common_required'), t('request_form_required_field', { field: currentField.label }));
        return;
      }
    } else if ((currentField.key === 'schoolName' || currentField.key === 'studentIdNumber')) {
      const isStudent = String(formData.isStudent).toLowerCase() === 'yes' || formData.isStudent === true;
      if (isStudent && !formData[currentField.key]?.trim()) {
        Alert.alert(t('common_required'), t('request_form_required_field', { field: currentField.label }));
        return;
      }
    } else if (!formData[currentField.key]?.trim()) {
      Alert.alert(t('common_required'), t('request_form_required_field', { field: currentField.label }));
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // All fields complete, go to review/payment
      navigateToPayment();
    }
  };

  const navigateToPayment = async () => {
    // Store photo in AsyncStorage to avoid passing large base64 through navigation
    const { photoId, ...formDataWithoutPhoto } = formData;
    if (photoId) {
      await AsyncStorage.setItem('tempPhotoId', photoId);
    } else {
      await AsyncStorage.removeItem('tempPhotoId');
    }
    
    navigation.navigate('PaymentReview', {
      document,
      formData: formDataWithoutPhoto,
      user,
      hasPhoto: requiresPhoto && !!photoId,
    });
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleReview = () => {
    // Check if all fields are filled
    const emptyFields = visibleFields.filter((field) => {
      if (field.type === 'photo') {
        return !formData.photoId;
      }
      return !formData[field.key]?.trim();
    });
    if (emptyFields.length > 0) {
      Alert.alert(t('request_form_incomplete_title'), t('request_form_incomplete_message', { fields: emptyFields.map(f => f.label).join(', ') }));
      return;
    }
    
    navigateToPayment();
  };

  // Render photo picker UI
  const renderPhotoStep = () => (
    <View style={styles.photoContainer}>
      {formData.photoId ? (
        <View style={styles.photoPreviewContainer}>
          <Image
            source={{ uri: formData.photoId }}
            style={styles.photoPreview}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => handleChange('photoId', '')}
          >
            <Text style={styles.retakeButtonText}>{t('request_form_remove_photo')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoPlaceholder}>
          <Feather name="camera" size={40} color={colors.gray[400]} />
          <Text style={styles.photoPlaceholderText}>{t('request_form_photo_required')}</Text>
        </View>
      )}

      {imageLoading ? (
        <ActivityIndicator size="large" color={colors.primary[600]} style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.photoButtonsContainer}>
          <TouchableOpacity
            style={[styles.photoButton, styles.cameraButton]}
            onPress={() => pickImage(true)}
          >
            <Feather name="camera" size={20} color="#fff" />
            <Text style={[styles.photoButtonText, styles.cameraButtonText]}>{t('request_form_take_photo')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.photoButton, styles.galleryButton]}
            onPress={() => pickImage(false)}
          >
            <Feather name="image" size={20} color={colors.primary[600]} />
            <Text style={[styles.photoButtonText, styles.galleryButtonText]}>{t('request_form_choose_gallery')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 50) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handlePrevious}
        >
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{document.name}</Text>
          <Text style={styles.headerSubtitle}>{t('request_form_step_of', { current: currentStep + 1, total: totalSteps })}</Text>
        </View>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleReview}
        >
          <Text style={styles.skipButtonText}>{t('common_review')}</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Form Content */}
      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.fieldLabel}>{currentField.label}</Text>
        
        {isPhotoStep ? (
          renderPhotoStep()
        ) : currentField.key === 'isStudent' ? (
          <View style={styles.checkboxRow}>
            <TouchableOpacity
              style={[styles.checkboxOption, formData.isStudent === 'yes' && styles.checkboxOptionActive]}
              onPress={() => handleChange('isStudent', 'yes')}
            >
              <View style={[styles.checkbox, formData.isStudent === 'yes' && styles.checkboxChecked]} />
              <Text style={[styles.checkboxLabel, formData.isStudent === 'yes' && styles.checkboxLabelActive]}>{t('common_yes')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.checkboxOption, formData.isStudent === 'no' && styles.checkboxOptionActive]}
              onPress={() => handleChange('isStudent', 'no')}
            >
              <View style={[styles.checkbox, formData.isStudent === 'no' && styles.checkboxChecked]} />
              <Text style={[styles.checkboxLabel, formData.isStudent === 'no' && styles.checkboxLabelActive]}>{t('common_no')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput
              ref={inputRef}
              key={currentField.key}
              style={styles.input}
              placeholder={currentField.placeholder}
              placeholderTextColor={colors.text.muted}
              value={formData[currentField.key]}
              onChangeText={(text) => handleChange(currentField.key, text)}
              keyboardType={currentField.keyboardType || 'default'}
              autoCapitalize={currentField.key === 'email' ? 'none' : 'words'}
              autoComplete="off"
              importantForAutofill="no"
              returnKeyType={currentStep < totalSteps - 1 ? 'next' : 'done'}
              onSubmitEditing={handleNext}
            />

            {/* Quick fill hint for pre-filled fields */}
            {user && currentField.key === 'fullName' && user.fullName && (
              <TouchableOpacity
                style={styles.quickFill}
                onPress={() => handleChange('fullName', user.fullName)}
              >
                <Text style={styles.quickFillText}>{t('request_form_use_value', { value: user.fullName })}</Text>
              </TouchableOpacity>
            )}
            {user && currentField.key === 'email' && user.email && (
              <TouchableOpacity
                style={styles.quickFill}
                onPress={() => handleChange('email', user.email)}
              >
                <Text style={styles.quickFillText}>{t('request_form_use_value', { value: user.email })}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentStep < totalSteps - 1 ? t('common_next') : t('request_form_review_pay')}
          </Text>
        </TouchableOpacity>

        {/* Progress dots */}
        <View style={styles.dotsContainer}>
          {visibleFields.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
                index < currentStep && styles.dotCompleted,
              ]}
            />
          ))}
        </View>
      </View>
    </KeyboardAvoidingView>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    height: 4,
    backgroundColor: colors.gray[200],
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 24,
    paddingTop: 40,
  },
  fieldLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: colors.text.primary,
  },
  quickFill: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  quickFillText: {
    color: colors.primary[700],
    fontSize: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: 12,
  },
  checkboxOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    backgroundColor: '#fff',
  },
  checkboxOptionActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray[400],
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  checkboxLabelActive: {
    color: colors.primary[700],
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  nextButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[300],
  },
  dotActive: {
    backgroundColor: colors.primary[600],
    width: 24,
  },
  dotCompleted: {
    backgroundColor: colors.primary[400],
  },
  // Photo styles
  photoContainer: {
    alignItems: 'center',
  },
  photoPreviewContainer: {
    alignItems: 'center',
  },
  photoPreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.primary[500],
  },
  retakeButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.gray[200],
    borderRadius: 8,
  },
  retakeButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  photoPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gray[400],
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 8,
  },
  photoButtonsContainer: {
    marginTop: 24,
    width: '100%',
    gap: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  cameraButton: {
    backgroundColor: colors.primary[600],
  },
  galleryButton: {
    backgroundColor: colors.primary[100],
    borderWidth: 2,
    borderColor: colors.primary[600],
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cameraButtonText: {
    color: '#fff',
  },
  galleryButtonText: {
    color: colors.primary[700],
  },
});
