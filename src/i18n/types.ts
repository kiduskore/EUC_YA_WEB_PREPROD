export type SupportedLanguage = 'en' | 'am' | 'ti' | 'om';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  script: 'latin' | 'ethiopic';
  direction: 'ltr';
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    script: 'latin',
    direction: 'ltr'
  },
  am: {
    code: 'am',
    name: 'Amharic',
    nativeName: 'አማርኛ',
    flag: '🇪🇹',
    script: 'ethiopic',
    direction: 'ltr'
  },
  ti: {
    code: 'ti',
    name: 'Tigrinya',
    nativeName: 'ትግርኛ',
    flag: '🇪🇷',
    script: 'ethiopic',
    direction: 'ltr'
  },
  om: {
    code: 'om',
    name: 'Afaan Oromoo',
    nativeName: 'Afaan Oromoo',
    flag: '🌳',
    script: 'latin',
    direction: 'ltr'
  }
};
