import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en/translation.json';
import filTranslation from './locales/fil/translation.json';

const LANGUAGE_KEY = 'appLanguage';

const resources = {
  en: { translation: enTranslation },
  fil: { translation: filTranslation },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage && savedLanguage !== i18n.language) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (err) {
    console.error('Failed to load saved language:', err);
  }
};

export const saveLanguage = async (lang) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch (err) {
    console.error('Failed to save language:', err);
  }
};

export default i18n;
