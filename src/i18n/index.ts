import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import sr from './sr.json'

export type Language = 'en' | 'sr'

export const languages: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'sr', label: 'Srpski' },
]

const savedLanguage = (() => {
  try {
    const stored = localStorage.getItem('receipto-settings')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.state?.language || 'en'
    }
  } catch {
    // ignore
  }
  return 'en'
})()

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    sr: { translation: sr },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
