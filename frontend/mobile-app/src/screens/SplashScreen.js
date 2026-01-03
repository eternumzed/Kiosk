import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function SplashScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2563eb',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Barangay Kiosk
      </Text>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}
