import React, { ReactNode } from 'react';
import { LanguageProvider, useLanguage, Translate } from '../context/LanguageContext';
import { Header } from './Header';
import { SupportedLanguage } from '../i18n/types';

export interface MainLayoutProps {
  children: ReactNode;
  initialLanguage?: SupportedLanguage;
  activePillar?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  layout?: 'standard' | 'bento' | 'sidebar' | 'masonry';
  sidebarContent?: ReactNode;
  maxWidth?: string;
  gap?: string;
  showFooter?: boolean;
}

const LayoutContent: React.FC<Omit<MainLayoutProps, 'initialLanguage'>> = ({
  children,
  activePillar,
  title,
  subtitle,
  badge,
  layout = 'standard',
  sidebarContent,
  maxWidth = 'max-w-7xl',
  gap = 'gap-6 lg:gap-8',
  showFooter = true
}) => {
  const { t, language, availableLanguages } = useLanguage();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Dynamic React Header with Language Switcher */}
      <Header activePillar={activePillar} />

      {/* Main Grid-Based Content Container */}
      <main className="flex-1 pt-24 pb-16">
        <div className={`w-full ${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10`}>
          
          {/* Optional Dynamic Page Header */}
          {title && (
            <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-6">
              <div>
                {badge && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-3 border border-blue-200/50 dark:border-blue-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    {badge}
                  </span>
                )}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
                  {title}
                </h1>
              </div>
              {subtitle && (
                <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Dynamic Layout Engine */}
          {layout === 'bento' && (
            <div className={`grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 ${gap} auto-rows-[minmax(180px,auto)]`}>
              {children}
            </div>
          )}

          {layout === 'sidebar' && (
            <div className={`grid grid-cols-1 lg:grid-cols-12 ${gap} items-start`}>
              <aside className="lg:col-span-4 xl:col-span-3 sticky top-28 space-y-6">
                {sidebarContent}
              </aside>
              <section className="lg:col-span-8 xl:col-span-9 space-y-6">
                {children}
              </section>
            </div>
          )}

          {layout === 'masonry' && (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${gap}`}>
              {children}
            </div>
          )}

          {layout === 'standard' && (
            <div className={`grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 ${gap}`}>
              {children}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      {showFooter && (
        <footer className="bg-white dark:bg-zinc-900 pt-16 pb-12 border-t border-zinc-200 dark:border-white/10 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
              
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                  <span className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-black text-xs">
                    E
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {t('footer.title') || 'EUCMD Young Adults'}
                  </h2>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto md:mx-0 text-sm leading-relaxed">
                  {t('footer.motto') || 'Raising up a generation of disciples who make disciples.'}
                </p>
                <a
                  href="https://www.instagram.com/eucmdyoungadult/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-white transition-colors font-semibold"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>{t('footer.followInstagram') || 'Follow us on Instagram @eucmdyoungadult'}</span>
                </a>
              </div>

              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white mb-4 text-xs uppercase tracking-wider">
                  {t('footer.quickLinks') || 'Quick Links'}
                </h3>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="https://eucmaryland.org/" target="_blank" rel="noopener noreferrer" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">{t('footer.mainChurch') || 'Emmanuel United Church of MD'}</a></li>
                  <li><a href={`/dashboard${language !== 'en' ? `?lang=${language}` : ''}`} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors font-semibold">{t('footer.leaderAccess') || 'Leader Dashboard Access'}</a></li>
                  <li><a href={`/#resources`} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">{t('resources.title') || 'Discipleship Resources'}</a></li>
                  <li><a href={`/#contact`} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">{t('contact.title') || 'Connect With Us'}</a></li>
                </ul>
              </div>

              <div className="md:text-right">
                <h3 className="font-bold text-zinc-900 dark:text-white mb-3 text-xs uppercase tracking-wider flex items-center md:justify-end gap-2">
                  <span>🌐</span>
                  <span>{t('nav.selectLanguage') || 'Language Selection'}</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 max-w-xs md:ml-auto">
                  {t('footer.languageNotice') || 'Available in English, አማርኛ, ትግርኛ, and Afaan Oromoo.'}
                </p>
                <div className="inline-flex justify-center md:justify-end gap-1.5 flex-wrap">
                  {availableLanguages.map((l) => (
                    <a
                      key={l.code}
                      href={`/set-language/${l.code}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        language === l.code
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.nativeName}</span>
                    </a>
                  ))}
                </div>
              </div>

            </div>

            <div className="mt-12 pt-6 border-t border-zinc-200 dark:border-white/10 text-center">
              <p className="text-zinc-400 dark:text-zinc-500 text-xs">
                &copy; {new Date().getFullYear()} {t('footer.allRightsReserved') || 'Emmanuel United Church MD Young Adults. All rights reserved.'}
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export const MainLayout: React.FC<MainLayoutProps> = ({
  initialLanguage,
  ...props
}) => {
  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      <LayoutContent {...props} />
    </LanguageProvider>
  );
};

export default MainLayout;
