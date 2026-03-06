import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

export default function SplashScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      {/* Backdrop Seal */}
      <Image
        source={require('../../assets/BRGY_BILUSO_SEAL-modified.png')}
        style={styles.backdropSeal}
      />
      {/* Logo */}
      <Image
        source={require('../../assets/BRGY_BILUSO_SEAL-modified.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>{t('splash_title')}</Text>
      <Text style={styles.subtitle}>{t('splash_subtitle')}</Text>
      <ActivityIndicator size="large" color="#fff" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    overflow: 'hidden',
  },
  backdropSeal: {
    position: 'absolute',
    width: 400,
    height: 400,
    opacity: 0.08,
    resizeMode: 'contain',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.primary[200],
    fontSize: 14,
    marginBottom: 30,
  },
  loader: {
    marginTop: 10,
  },
});
