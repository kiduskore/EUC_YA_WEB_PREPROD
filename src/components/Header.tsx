import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export interface HeaderProps {
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  activePillar?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onThemeToggle,
  isDarkMode: initialIsDarkMode,
  activePillar
}) => {
  const { t, language } = useLanguage();
  const [isDark, setIsDark] = useState<boolean>(initialIsDarkMode ?? false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Initialize theme from DOM or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const darkModeActive =
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('color-theme') === 'dark' ||
        (!('color-theme' in localStorage) &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(darkModeActive);
    }
  }, []);

  const handleThemeToggle = () => {
    if (typeof window === 'undefined') return;

    const newDark = !isDark;
    setIsDark(newDark);

    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('color-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('color-theme', 'light');
    }

    if (onThemeToggle) {
      onThemeToggle();
    }
  };

  const langQuery = language !== 'en' ? `?lang=${language}` : '';

  return (
    <>
      <nav
        className="fixed top-0 w-full z-[100] transition-all duration-300 backdrop-blur-xl bg-white/85 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-white/10"
        id="react-navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Identity */}
          <a
            href={`/${langQuery}`}
            className="min-h-[44px] inline-flex items-center gap-2 text-lg font-black tracking-tight text-zinc-900 dark:text-white whitespace-nowrap mr-4 sm:mr-6 group touch-manipulation active:opacity-80"
          >
            <span className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-black text-sm group-hover:scale-105 transition-transform duration-200 shadow-sm flex-shrink-0">
              E
            </span>
            <span className="font-black">{t('nav.title') || 'EUC'}</span>
            <span className="text-zinc-400 dark:text-zinc-500 font-medium text-sm hidden sm:inline">
              {t('nav.subtitle') || 'Young Adults'}
            </span>
          </a>

          {/* Desktop Navigation Dropdowns */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            
            {/* 1. Foundation */}
            <div className="relative group">
              <button
                type="button"
                className={`min-h-[44px] px-3.5 py-2 rounded-xl transition-all text-sm font-semibold flex items-center gap-1.5 focus:outline-none ${
                  activePillar === 'foundation'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
              >
                <span>{t('nav.foundation') || 'Foundation'}</span>
                <svg className="w-3.5 h-3.5 opacity-50 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2 z-50 transform origin-top translate-y-1 group-hover:translate-y-0">
                <a href={`/salvation${langQuery}`} className="min-h-[40px] flex items-center px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors font-medium">
                  {t('nav.foundation.salvation') || 'Salvation'}
                </a>
                <a href={`/water-baptism${langQuery}`} className="min-h-[40px] flex items-center px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors font-medium">
                  {t('nav.foundation.waterBaptism') || 'Water Baptism'}
                </a>
                <a href={`/kingdom${langQuery}`} className="min-h-[40px] flex items-center px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors font-medium">
                  {t('nav.foundation.kingdom') || 'Kingdom'}
                </a>
              </div>
            </div>

            {/* 2. Belong */}
            <div className="relative group">
              <button
                type="button"
                className={`min-h-[44px] px-3.5 py-2 rounded-xl transition-all text-sm font-semibold flex items-center gap-1.5 focus:outline-none ${
                  activePillar === 'belong'
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20'
                    : 'text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
              >
                <span>{t('nav.belong') || 'Belong'}</span>
                <svg className="w-3.5 h-3.5 opacity-50 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2 z-50 transform origin-top translate-y-1 group-hover:translate-y-0">
                <a href={`/membership${langQuery}`} className="min-h-[40px] flex items-center px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors font-medium">
                  {t('nav.belong.membership') || 'Membership'}
                </a>
                <a href={`/community${langQuery}`} className="min-h-[40px] flex items-center px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors font-medium">
                  {t('nav.belong.community') || 'Community'}
                </a>
                <a href={`/mentorship${langQuery}`} className="min-h-[40px] flex items-center px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors font-medium">
                  {t('nav.belong.mentorship') || 'Mentorship'}
                </a>
              </div>
            </div>

            {/* 3. Formation */}
            <div className="relative group">
              <button
                type="button"
                className={`min-h-[44px] px-3.5 py-2 rounded-xl transition-all text-sm font-semibold flex items-center gap-1.5 focus:outline-none ${
                  activePillar === 'formation'
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20'
                    : 'text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
              >
                <span>{t('nav.formation') || 'Formation'}</span>
                <svg className="w-3.5 h-3.5 opacity-50 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2 z-50 transform origin-top translate-y-1 group-hover:translate-y-0">
                <a href={`/scripture-memory${langQuery}`} className="min-h-[40px] flex items-center px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors font-medium">
                  {t('nav.formation.scriptureMemory') || 'Scripture Memory'}
                </a>
                <a href={`/growth${langQuery}`} className="min-h-[40px] flex items-center px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors font-medium">
                  {t('nav.formation.growth') || 'Growth'}
                </a>
                <a href={`/maturity${langQuery}`} className="min-h-[40px] flex items-center px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors font-medium">
                  {t('nav.formation.maturity') || 'Maturity'}
                </a>
                <a href={`/availability${langQuery}`} className="min-h-[40px] flex items-center px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors font-medium">
                  {t('nav.formation.availability') || 'Availability'}
                </a>
              </div>
            </div>

            {/* 4. Mission */}
            <div className="relative group">
              <button
                type="button"
                className={`min-h-[44px] px-3.5 py-2 rounded-xl transition-all text-sm font-semibold flex items-center gap-1.5 focus:outline-none ${
                  activePillar === 'mission'
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/20'
                    : 'text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
              >
                <span>{t('nav.mission') || 'Mission'}</span>
                <svg className="w-3.5 h-3.5 opacity-50 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2 z-50 transform origin-top translate-y-1 group-hover:translate-y-0">
                <a href={`/serving${langQuery}`} className="min-h-[40px] flex items-center px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors font-medium">
                  {t('nav.mission.serving') || 'Serving'}
                </a>
                <a href={`/generosity${langQuery}`} className="min-h-[40px] flex items-center px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors font-medium">
                  {t('nav.mission.generosity') || 'Giving / Generosity'}
                </a>
              </div>
            </div>
          </div>

          {/* Right Header Controls: Language Switcher, Dark/Light Toggle, CTA */}
          <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">
            
            {/* Integrated React 4-Language Switcher */}
            <LanguageSwitcher variant="dropdown" />

            {/* Dark / Light Mode Toggle (Min 44x44px touch target) */}
            <button
              type="button"
              onClick={handleThemeToggle}
              className="min-w-[44px] min-h-[44px] p-2.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 flex items-center justify-center touch-manipulation active:scale-95"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <svg className="w-5 h-5 text-amber-400 transition-transform duration-300 hover:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 transition-transform duration-300 hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Dashboard CTA */}
            <a
              href={`/dashboard${langQuery}`}
              className="hidden sm:inline-flex items-center justify-center min-h-[44px] px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-blue-600 dark:hover:bg-zinc-200 active:scale-95 transition-all duration-200 text-xs md:text-sm font-bold shadow-sm whitespace-nowrap touch-manipulation"
            >
              {t('nav.dashboard') || 'Dashboard'}
            </a>

            {/* Mobile Menu Button (Min 44x44px touch target) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden min-w-[44px] min-h-[44px] p-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 flex items-center justify-center touch-manipulation"
              aria-label="Open mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-20 bg-white/98 dark:bg-zinc-950/98 backdrop-blur-xl z-50 lg:hidden overflow-y-auto border-t border-zinc-200 dark:border-white/10 transition-all duration-300 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
            
            {/* Grid 4-Language Switcher */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10">
              <LanguageSwitcher variant="grid" onLanguageChange={() => setMobileMenuOpen(false)} />
            </div>

            {/* Pillars Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  {t('nav.foundation') || 'Foundation'}
                </h3>
                <div className="flex flex-col space-y-1">
                  <a href={`/salvation${langQuery}`} onClick={() => setMobileMenuOpen(false)} className="min-h-[44px] px-3 py-2.5 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 font-semibold text-sm transition-colors flex items-center justify-between touch-manipulation">
                    <span>{t('nav.foundation.salvation') || 'Salvation'}</span>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </a>
                  <a href={`/water-baptism${langQuery}`} onClick={() => setMobileMenuOpen(false)} className="min-h-[44px] px-3 py-2.5 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 font-semibold text-sm transition-colors flex items-center justify-between touch-manipulation">
                    <span>{t('nav.foundation.waterBaptism') || 'Water Baptism'}</span>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </a>
                  <a href={`/kingdom${langQuery}`} onClick={() => setMobileMenuOpen(false)} className="min-h-[44px] px-3 py-2.5 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 font-semibold text-sm transition-colors flex items-center justify-between touch-manipulation">
                    <span>{t('nav.foundation.kingdom') || 'Kingdom'}</span>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  {t('nav.belong') || 'Belong'}
                </h3>
                <div className="flex flex-col space-y-1">
                  <a href={`/membership${langQuery}`} onClick={() => setMobileMenuOpen(false)} className="min-h-[44px] px-3 py-2.5 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 font-semibold text-sm transition-colors flex items-center justify-between touch-manipulation">
                    <span>{t('nav.belong.membership') || 'Membership'}</span>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </a>
                  <a href={`/community${langQuery}`} onClick={() => setMobileMenuOpen(false)} className="min-h-[44px] px-3 py-2.5 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 font-semibold text-sm transition-colors flex items-center justify-between touch-manipulation">
                    <span>{t('nav.belong.community') || 'Community'}</span>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </a>
                  <a href={`/mentorship${langQuery}`} onClick={() => setMobileMenuOpen(false)} className="min-h-[44px] px-3 py-2.5 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 font-semibold text-sm transition-colors flex items-center justify-between touch-manipulation">
                    <span>{t('nav.belong.mentorship') || 'Mentorship'}</span>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  {t('nav.formation') || 'Formation'}
                </h3>
                <div className="flex flex-col space-y-1">
                  <a href={`/scripture-memory${langQuery}`} onClick={() => setMobileMenuOpen(false)} className="min-h-[44px] px-3 py-2.5 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 font-semibold text-sm transition-colors flex items-center justify-between touch-manipulation">
                    <span>{t('nav.formation.scriptureMemory') || 'Scripture Memory'}</span>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </a>
                  <a href={`/growth${langQuery}`} onClick={() => setMobileMenuOpen(false)} className="min-h-[44px] px-3 py-2.5 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 font-semibold text-sm transition-colors flex items-center justify-between touch-manipulation">
                    <span>{t('nav.formation.growth') || 'Growth'}</span>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </a>
                  <a href={`/maturity${langQuery}`} onClick={() => setMobileMenuOpen(false)} className="min-h-[44px] px-3 py-2.5 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 font-semibold text-sm transition-colors flex items-center justify-between touch-manipulation">
                    <span>{t('nav.formation.maturity') || 'Maturity'}</span>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </a>
                  <a href={`/availability${langQuery}`} onClick={() => setMobileMenuOpen(false)} className="min-h-[44px] px-3 py-2.5 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 font-semibold text-sm transition-colors flex items-center justify-between touch-manipulation">
                    <span>{t('nav.formation.availability') || 'Availability'}</span>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  {t('nav.mission') || 'Mission'}
                </h3>
                <div className="flex flex-col space-y-1">
                  <a href={`/serving${langQuery}`} onClick={() => setMobileMenuOpen(false)} className="min-h-[44px] px-3 py-2.5 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 font-semibold text-sm transition-colors flex items-center justify-between touch-manipulation">
                    <span>{t('nav.mission.serving') || 'Serving'}</span>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </a>
                  <a href={`/generosity${langQuery}`} onClick={() => setMobileMenuOpen(false)} className="min-h-[44px] px-3 py-2.5 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 font-semibold text-sm transition-colors flex items-center justify-between touch-manipulation">
                    <span>{t('nav.mission.generosity') || 'Giving / Generosity'}</span>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-white/10">
              <a
                href={`/dashboard${langQuery}`}
                className="w-full text-center min-h-[48px] flex items-center justify-center px-6 py-3.5 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold transition-all shadow-lg text-sm touch-manipulation active:scale-[0.98]"
              >
                {t('nav.leaderDashboard') || 'Leader Dashboard Access'}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
