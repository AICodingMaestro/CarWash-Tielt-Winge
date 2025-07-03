import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import nl from './nl.json';
import fr from './fr.json';
import en from './en.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (savedLanguage) {
        callback(savedLanguage);
      } else {
        // Default to Dutch for Belgium
        callback('nl');
      }
    } catch (error) {
      console.error('Error reading language from storage:', error);
      callback('nl');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.error('Error saving language to storage:', error);
    }
  },
};

const resources = {
  nl: {
    translation: nl,
  },
  fr: {
    translation: fr,
  },
  en: {
    translation: en,
  },
};

export const initializeI18n = () => {
  i18n
    .use(LANGUAGE_DETECTOR)
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources,
      fallbackLng: 'nl',
      debug: __DEV__,
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    })
    .catch((error) => {
      console.error('i18n initialization failed:', error);
    });
};

export default i18n;