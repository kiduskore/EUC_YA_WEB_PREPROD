import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, LanguageInfo } from '../i18n/types';
import { translations, DEFAULT_LANGUAGE, isSupportedLanguage, translate } from '../i18n';

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string>) => string;
  languageInfo: LanguageInfo;
  availableLanguages: LanguageInfo[];
  isEthiopic: boolean;
  direction: 'ltr';
  allTranslations: Record<SupportedLanguage, Record<string, string>>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: SupportedLanguage;
  syncWithUrl?: boolean;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  initialLanguage,
  syncWithUrl = true
}) => {
  // Initialize language from props, URL query parameter, localStorage, cookies, or browser language
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (initialLanguage && isSupportedLanguage(initialLanguage)) {
      return initialLanguage;
    }

    if (typeof window !== 'undefined') {
      // 1. Check URL query param (?lang=am)
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && isSupportedLanguage(urlLang)) {
          return urlLang as SupportedLanguage;
        }
      } catch (e) {
        // URL parsing fallback
      }

      // 2. Check localStorage
      try {
        const storedLang = localStorage.getItem('preferred_language') || localStorage.getItem('lang');
        if (storedLang && isSupportedLanguage(storedLang)) {
          return storedLang as SupportedLanguage;
        }
      } catch (e) {
        // localStorage fallback
      }

      // 3. Check document cookie
      try {
        const match = document.cookie.match(/(?:^|; )\s*lang=([^;]+)/);
        if (match && isSupportedLanguage(match[1])) {
          return match[1] as SupportedLanguage;
        }
      } catch (e) {
        // Cookie parsing fallback
      }

      // 4. Check HTML element lang attribute
      const htmlLang = document.documentElement.getAttribute('lang');
      if (htmlLang && isSupportedLanguage(htmlLang)) {
        return htmlLang as SupportedLanguage;
      }
    }

    return DEFAULT_LANGUAGE;
  });

  // Switcher callback that updates state, localStorage, cookies, DOM attributes and optional URL sync
  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    if (!isSupportedLanguage(newLang)) return;

    setLanguageState(newLang);

    if (typeof window !== 'undefined') {
      // 1. Save to localStorage
      try {
        localStorage.setItem('preferred_language', newLang);
        localStorage.setItem('lang', newLang);
      } catch (e) {
        console.warn('Could not save language to localStorage', e);
      }

      // 2. Save to Cookies (365 days)
      try {
        document.cookie = `lang=${newLang};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
      } catch (e) {
        console.warn('Could not set language cookie', e);
      }

      // 3. Update HTML root attributes and fonts
      document.documentElement.setAttribute('lang', newLang);
      if (newLang === 'am' || newLang === 'ti') {
        document.documentElement.classList.add('font-ethiopic');
      } else {
        document.documentElement.classList.remove('font-ethiopic');
      }

      // 4. Dispatch global custom event for non-React listeners
      window.dispatchEvent(
        new CustomEvent('languagechange', {
          detail: { language: newLang, info: SUPPORTED_LANGUAGES[newLang] }
        })
      );

      // 5. Optionally update URL query param without triggering full page reload
      if (syncWithUrl && window.history && window.history.replaceState) {
        try {
          const url = new URL(window.location.href);
          if (newLang === DEFAULT_LANGUAGE) {
            url.searchParams.delete('lang');
          } else {
            url.searchParams.set('lang', newLang);
          }
          window.history.replaceState({}, '', url.toString());
        } catch (e) {
          // URL replace fallback
        }
      }
    }
  }, [syncWithUrl]);

  // Synchronize on mount and listen to window events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Apply document lang and fonts
    document.documentElement.setAttribute('lang', language);
    if (language === 'am' || language === 'ti') {
      document.documentElement.classList.add('font-ethiopic');
    } else {
      document.documentElement.classList.remove('font-ethiopic');
    }

    // Listen to popstate (back/forward navigation)
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      if (urlLang && isSupportedLanguage(urlLang) && urlLang !== language) {
        setLanguageState(urlLang as SupportedLanguage);
      }
    };

    // Listen to storage events from other tabs
    const handleStorage = (event: StorageEvent) => {
      if ((event.key === 'preferred_language' || event.key === 'lang') && event.newValue) {
        if (isSupportedLanguage(event.newValue) && event.newValue !== language) {
          setLanguageState(event.newValue as SupportedLanguage);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('storage', handleStorage);
    };
  }, [language]);

  // Translation helper function bounded to current language state
  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      return translate(key, language, params);
    },
    [language]
  );

  const languageInfo = useMemo(() => {
    return SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.en;
  }, [language]);

  const availableLanguages = useMemo(() => {
    return Object.values(SUPPORTED_LANGUAGES);
  }, []);

  const isEthiopic = useMemo(() => {
    return languageInfo.script === 'ethiopic';
  }, [languageInfo]);

  const value = useMemo<LanguageContextType>(() => ({
    language,
    setLanguage,
    t,
    languageInfo,
    availableLanguages,
    isEthiopic,
    direction: 'ltr',
    allTranslations: translations
  }), [language, setLanguage, t, languageInfo, availableLanguages, isEthiopic]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to consume the language context
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Convenient alias for translation hook
export function useTranslation() {
  const { t, language, setLanguage, languageInfo, availableLanguages, isEthiopic } = useLanguage();
  return { t, language, setLanguage, languageInfo, availableLanguages, isEthiopic };
}

// Declarative JSX Translate Component
export interface TranslateProps {
  i18nKey: string;
  params?: Record<string, string>;
  fallback?: string;
  className?: string;
  as?: React.ElementType;
}

export const Translate: React.FC<TranslateProps> = ({
  i18nKey,
  params,
  fallback,
  className,
  as: Component = 'span'
}) => {
  const { t } = useLanguage();
  const text = t(i18nKey, params);
  const displayText = (text === i18nKey && fallback) ? fallback : text;

  return <Component className={className}>{displayText}</Component>;
};

export default LanguageContext;
