import { Request, Response, NextFunction } from 'express';
import { SupportedLanguage, SUPPORTED_LANGUAGES, LanguageInfo } from './types';
import { en } from './locales/en';
import { am } from './locales/am';
import { ti } from './locales/ti';
import { om } from './locales/om';

export * from './types';
export * from '../context/LanguageContext';

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  en,
  am,
  ti,
  om
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export function isSupportedLanguage(lang: any): lang is SupportedLanguage {
  return typeof lang === 'string' && ['en', 'am', 'ti', 'om'].includes(lang.toLowerCase());
}

export function translate(key: string, lang: SupportedLanguage = DEFAULT_LANGUAGE, params?: Record<string, string>): string {
  const normalizedLang = isSupportedLanguage(lang) ? (lang.toLowerCase() as SupportedLanguage) : DEFAULT_LANGUAGE;
  const langDict = translations[normalizedLang] || translations[DEFAULT_LANGUAGE];
  let text = langDict[key] || translations[DEFAULT_LANGUAGE][key] || key;

  if (params) {
    Object.keys(params).forEach(paramKey => {
      text = text.replace(new RegExp(`{${paramKey}}`, 'g'), params[paramKey]);
    });
  }

  return text;
}

export function getLanguageInfo(lang: string = DEFAULT_LANGUAGE): LanguageInfo {
  const code = isSupportedLanguage(lang) ? (lang.toLowerCase() as SupportedLanguage) : DEFAULT_LANGUAGE;
  return SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES.en;
}

export function i18nMiddleware(req: Request, res: Response, next: NextFunction) {
  let lang: SupportedLanguage = DEFAULT_LANGUAGE;

  // 1. Query parameter (?lang=am)
  const queryLang = req.query.lang as string;
  if (queryLang && isSupportedLanguage(queryLang)) {
    lang = queryLang.toLowerCase() as SupportedLanguage;
    res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000, path: '/', sameSite: 'lax' });
    if (req.session) {
      (req.session as any).lang = lang;
    }
  } 
  // 2. Cookie
  else if (req.cookies?.lang && isSupportedLanguage(req.cookies.lang)) {
    lang = req.cookies.lang.toLowerCase() as SupportedLanguage;
    if (req.session) {
      (req.session as any).lang = lang;
    }
  }
  // 3. Session
  else if ((req.session as any)?.lang && isSupportedLanguage((req.session as any).lang)) {
    lang = (req.session as any).lang.toLowerCase() as SupportedLanguage;
    res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000, path: '/', sameSite: 'lax' });
  }
  // 4. Accept-Language header matching
  else if (req.headers['accept-language']) {
    const acceptHeader = req.headers['accept-language'].toLowerCase();
    if (acceptHeader.includes('am')) lang = 'am';
    else if (acceptHeader.includes('ti')) lang = 'ti';
    else if (acceptHeader.includes('om')) lang = 'om';
    else lang = 'en';
  }

  const langInfo = getLanguageInfo(lang);
  const langQuery = (lang && lang !== 'en') ? `?lang=${lang}` : '';
  const langParam = (lang && lang !== 'en') ? `&lang=${lang}` : '';

  const linkWithLang = (urlPath: string) => {
    if (!lang || lang === 'en') return urlPath;
    if (!urlPath) return urlPath;
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://') || urlPath.startsWith('mailto:') || urlPath.startsWith('tel:') || urlPath.startsWith('#')) {
      return urlPath;
    }
    const separator = urlPath.includes('?') ? '&' : '?';
    return `${urlPath}${separator}lang=${lang}`;
  };

  // Bind to res.locals for EJS templates
  res.locals.lang = lang;
  res.locals.currentLang = langInfo;
  res.locals.languages = Object.values(SUPPORTED_LANGUAGES);
  res.locals.isEthiopic = langInfo.script === 'ethiopic';
  res.locals.t = (key: string, params?: Record<string, string>) => translate(key, lang, params);
  res.locals.translate = translate;
  res.locals.allTranslations = translations;
  res.locals.langQuery = langQuery;
  res.locals.langParam = langParam;
  res.locals.linkWithLang = linkWithLang;

  next();
}
