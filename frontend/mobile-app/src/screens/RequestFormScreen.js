import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';

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
  const { document } = route.params;
  const docSpecificFields = documentFields[document.name] || [];
  const requiresPhoto = TEMPLATES_REQUIRING_PHOTO.includes(document.name);

  // Fetch latest user info for autofill
  const [user, setUser] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const latestUser = await userAPI.getProfile();
        setUser(latestUser);
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
        contactNumber: user.phone || '',
        address: user.address || '',
      }));
    }
  }, [user]);

  const [currentStep, setCurrentStep] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);
  
  // Add photo step at the end if required
  const allFields = [
    ...personalInfoFields,
    ...docSpecificFields,
    ...(requiresPhoto ? [{ label: 'Photo ID', key: 'photoId', type: 'photo' }] : []),
  ];
  const totalSteps = allFields.length;
  const currentField = allFields[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isPhotoStep = currentField?.type === 'photo';

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const pickImage = async (useCamera = false) => {
    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to take a photo.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Media library permission is needed to select a photo.');
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
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setImageLoading(false);
    }
  };

  const handleNext = () => {
    // Validate current field
    if (isPhotoStep) {
      if (!formData.photoId) {
        Alert.alert('Required', 'Please take or select a photo');
        return;
      }
    } else if (!formData[currentField.key]?.trim()) {
      Alert.alert('Required', `Please enter ${currentField.label}`);
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
    const emptyFields = allFields.filter((field) => {
      if (field.type === 'photo') {
        return !formData.photoId;
      }
      return !formData[field.key]?.trim();
    });
    if (emptyFields.length > 0) {
      Alert.alert('Incomplete', `Please fill all fields. Missing: ${emptyFields.map(f => f.label).join(', ')}`);
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
            <Text style={styles.retakeButtonText}>Remove Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderIcon}>📷</Text>
          <Text style={styles.photoPlaceholderText}>ID Photo Required</Text>
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
            <Text style={styles.photoButtonIcon}>📸</Text>
            <Text style={[styles.photoButtonText, styles.cameraButtonText]}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.photoButton, styles.galleryButton]}
            onPress={() => pickImage(false)}
          >
            <Text style={styles.photoButtonIcon}>🖼️</Text>
            <Text style={[styles.photoButtonText, styles.galleryButtonText]}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handlePrevious}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{document.name}</Text>
          <Text style={styles.headerSubtitle}>Step {currentStep + 1} of {totalSteps}</Text>
        </View>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleReview}
        >
          <Text style={styles.skipButtonText}>Review</Text>
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
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder={currentField.placeholder}
              placeholderTextColor={colors.text.muted}
              value={formData[currentField.key]}
              onChangeText={(text) => handleChange(currentField.key, text)}
              keyboardType={currentField.keyboardType || 'default'}
              autoCapitalize={currentField.key === 'email' ? 'none' : 'words'}
              autoFocus
              returnKeyType={currentStep < totalSteps - 1 ? 'next' : 'done'}
              onSubmitEditing={handleNext}
            />

            {/* Quick fill hint for pre-filled fields */}
            {user && currentField.key === 'fullName' && user.fullName && (
              <TouchableOpacity
                style={styles.quickFill}
                onPress={() => handleChange('fullName', user.fullName)}
              >
                <Text style={styles.quickFillText}>Use: {user.fullName}</Text>
              </TouchableOpacity>
            )}
            {user && currentField.key === 'email' && user.email && (
              <TouchableOpacity
                style={styles.quickFill}
                onPress={() => handleChange('email', user.email)}
              >
                <Text style={styles.quickFillText}>Use: {user.email}</Text>
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
            {currentStep < totalSteps - 1 ? 'Next' : 'Review & Pay'}
          </Text>
        </TouchableOpacity>

        {/* Progress dots */}
        <View style={styles.dotsContainer}>
          {allFields.map((_, index) => (
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
  photoPlaceholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  photoPlaceholderText: {
    color: colors.text.secondary,
    fontSize: 14,
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
  photoButtonIcon: {
    fontSize: 20,
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
