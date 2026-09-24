import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import pt from './locales/pt.json';

export const SUPPORTED_LANGUAGES = ['es', 'pt'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'catalogo-ativos.lang';
const DEFAULT_LANGUAGE: SupportedLanguage = 'es';

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
}

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isSupportedLanguage(stored) ? stored : DEFAULT_LANGUAGE;
}

void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    pt: { translation: pt },
  },
  lng: getInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  if (typeof window === 'undefined' || !isSupportedLanguage(lng)) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // localStorage indisponível (modo privado, cookies bloqueados, etc.)
  }
});

export default i18n;
