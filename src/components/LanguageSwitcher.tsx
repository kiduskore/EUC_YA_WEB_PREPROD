import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../i18n/types';

export interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'grid' | 'pill';
  className?: string;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  className = '',
  onLanguageChange
}) => {
  const { language, setLanguage, languageInfo, availableLanguages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectLanguage = (langCode: SupportedLanguage) => {
    setLanguage(langCode);
    setIsOpen(false);
    if (onLanguageChange) {
      onLanguageChange(langCode);
    }
  };

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 ${className}`}>
        {availableLanguages.map((l) => {
          const isActive = language === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => handleSelectLanguage(l.code)}
              className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 touch-manipulation active:scale-95 ${
                isActive
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              aria-pressed={isActive}
            >
              <span className="select-none">{l.flag}</span>
              <span>{l.code.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`w-full ${className}`}>
        <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">
          {t('nav.selectLanguage') || 'Language'} (4)
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {availableLanguages.map((l) => {
            const isActive = language === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelectLanguage(l.code)}
                className={`min-h-[48px] flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold border transition-all text-left touch-manipulation active:scale-[0.98] ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:bg-zinc-100 dark:active:bg-zinc-600'
                }`}
                aria-pressed={isActive}
              >
                <span className="text-lg select-none">{l.flag}</span>
                <div className="truncate min-w-0">
                  <div className={`leading-tight font-semibold ${l.script === 'ethiopic' ? 'font-ethiopic' : ''}`}>
                    {l.nativeName}
                  </div>
                  <div className="text-[10px] opacity-75">{l.name}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Default Dropdown
  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="min-h-[44px] inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-white/10 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 touch-manipulation"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t('nav.selectLanguage') || 'Select Language'}
      >
        <span className="text-base sm:text-lg leading-none select-none">{languageInfo.flag}</span>
        <span className="font-bold tracking-tight hidden sm:inline">{languageInfo.nativeName}</span>
        <svg
          className={`w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-xl p-2 z-[120] transition-all duration-150 origin-top-right focus:outline-none animate-in fade-in zoom-in-95"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-3 py-2 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-white/5 mb-1">
            {t('nav.selectLanguage') || 'Select Language'} (4)
          </div>
          <div className="space-y-1">
            {availableLanguages.map((l) => {
              const isActive = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelectLanguage(l.code)}
                  className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left touch-manipulation ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/50 dark:border-blue-500/20'
                      : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 active:bg-zinc-200 dark:active:bg-white/20 font-medium'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl leading-none select-none">{l.flag}</span>
                    <div className="truncate min-w-0">
                      <div className={`leading-tight font-semibold ${l.script === 'ethiopic' ? 'font-ethiopic' : ''}`}>
                        {l.nativeName}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{l.name}</div>
                    </div>
                  </div>
                  {isActive && (
                    <svg
                      className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
