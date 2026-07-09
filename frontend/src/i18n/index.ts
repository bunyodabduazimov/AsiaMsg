import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ru from './locales/ru.json';

const STORAGE_KEY = 'asiamsg_lang';

const savedLang = localStorage.getItem(STORAGE_KEY);
const defaultLang = savedLang === 'ru' || savedLang === 'en' ? savedLang : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru }
    },
    lng: defaultLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export const changeLanguage = (lang: 'en' | 'ru') => {
  localStorage.setItem(STORAGE_KEY, lang);
  return i18n.changeLanguage(lang);
};

export default i18n;
