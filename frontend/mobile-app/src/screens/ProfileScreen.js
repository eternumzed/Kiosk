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
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI } from '../services/api';
import { colors } from '../theme/colors';

export default function ProfileScreen({ navigation, user, dispatch }) {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  const [barangay, setBarangay] = useState(user?.barangay || '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      // Split fullName into firstName and lastName
      const [firstName, ...rest] = fullName.trim().split(' ');
      const lastName = rest.join(' ');
      const updatedUser = await userAPI.updateProfile({
        firstName,
        lastName,
        address,
        barangay,
        email,
      });
      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser,
      });
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setEditing(false);
      setFullName(`${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim());
      setPhone(updatedUser.phone);
      setEmail(updatedUser.email);
      setAddress(updatedUser.address || '');
      setBarangay(updatedUser.barangay || '');
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {fullName?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.nameDisplay}>{fullName}</Text>
        <Text style={styles.emailDisplay}>{email}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={[styles.input, editing && styles.inputEditing]}
          value={fullName}
          onChangeText={setFullName}
          editable={editing && !loading}
          placeholderTextColor={colors.text.placeholder}
        />


        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={[
            styles.input,
            !editing && { color: colors.text.muted, backgroundColor: colors.gray[100] },
            editing && styles.inputEditing
          ]}
          value={phone}
          onChangeText={setPhone}
          editable={false}
          keyboardType="phone-pad"
          placeholderTextColor={colors.text.placeholder}
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={[styles.input, editing && styles.inputEditing]}
          value={email}
          onChangeText={setEmail}
          editable={editing && !loading}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.text.placeholder}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, editing && styles.inputEditing]}
          value={address}
          onChangeText={setAddress}
          editable={editing && !loading}
          placeholderTextColor={colors.text.placeholder}
        />

        <Text style={styles.label}>Barangay</Text>
        <TextInput
          style={[styles.input, editing && styles.inputEditing]}
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
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setEditing(false);
                setFullName(user?.fullName || '');
                setPhone(user?.phone || '');
                setEmail(user?.email || '');
                setAddress(user?.address || '');
                setBarangay(user?.barangay || '');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {}} // Add change password functionality
        >
          <Text style={styles.settingText}>Change Password</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {}} // Add notification settings
        >
          <Text style={styles.settingText}>Notification Settings</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
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
});
