import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

export default function SignupScreen({ navigation }) {
  const [step, setStep] = useState('contact'); // 'contact' | 'otp' | 'details'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpToken, setOtpToken] = useState('');

  const handleRequestOTP = async () => {
    if (!phoneNumber && !email) {
      Alert.alert('Error', 'Please enter phone number or email');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.requestOTP(phoneNumber || null, email || null);
      setOtpToken(response.data?.otpToken || response.otpToken);
      setStep('otp');
      Alert.alert('Success', 'OTP sent to your phone/email');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || error.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter valid OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(
        phoneNumber || null,
        email || null,
        otp,
        fullName,
        otpToken
      );
      // Store token
      await SecureStore.setItemAsync('userToken', response.data?.token || response.token);
      await SecureStore.setItemAsync('refreshToken', response.data?.refreshToken || response.refreshToken);
      setStep('details');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || error.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!fullName) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(
        phoneNumber || null,
        email || null,
        otp,
        fullName
      );
      // Navigate to app after successful signup
      navigation.replace('App');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {step === 'contact' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Phone Number (e.g., +639123456789)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholderTextColor="#999"
          />
          <Text style={styles.orText}>OR</Text>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleRequestOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {step === 'otp' && (
        <>
          <Text style={styles.subtitle}>
            Enter the OTP sent to {phoneNumber || email}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChangeText={setOtp}
            maxLength={6}
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {step === 'details' && (
        <>
          <Text style={styles.subtitle}>Complete your profile</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#999',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#2563eb',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '500',
  },
});
