import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Heart,
  Sun,
  Moon,
  Globe,
  Film,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  type LanguageCode,
  SUPPORTED_LANGUAGES,
  getTranslations,
} from '../i18n/translations';

interface NavbarProps {
  currentLang: LanguageCode;
}

export const Navbar: React.FC<NavbarProps> = ({ currentLang }) => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = getTranslations(currentLang);
  const currentLangInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) ||
    SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    // Check initial theme from html class or localStorage
    const isDarkMode =
      document.documentElement.classList.contains('dark') ||
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setLangDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sand-200/70 dark:border-studio-border bg-sand-50/90 dark:bg-studio-surface/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Section: Brand Logo & 100% Private Badge */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
          <a
            href={currentLangInfo.path}
            className="group flex items-center gap-2 sm:gap-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            title={t.nav.brandTitle}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-moss-600 to-sage-400 dark:from-sand-300 dark:to-sage-400 p-0.5 shadow-sm">
              <div className="w-full h-full bg-sand-50 dark:bg-studio-surface rounded-[10px] flex items-center justify-center">
                <Film className="w-5 h-5 text-moss-600 dark:text-sand-300 transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-moss-700 dark:text-sand-200">
                  {t.nav.brandTitle}
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sand-300/40 dark:bg-sand-300/20 text-moss-700 dark:text-sand-300">
                  v1.0
                </span>
              </div>
              <span className="hidden sm:inline text-[11px] text-olive-500 dark:text-sage-400 font-medium">
                {t.nav.brandSubtitle}
              </span>
            </div>
          </a>

          {/* 100% Private Badge - Collapses strictly to icon on mobile/tablet */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sage-400/15 dark:bg-sage-400/10 border border-sage-400/30 text-moss-600 dark:text-sage-300"
            title="100% Private • Zero-Server Uploads"
          >
            <ShieldCheck className="w-4 h-4 text-moss-600 dark:text-sage-400 shrink-0" />
            <span className="hidden lg:inline text-xs font-medium tracking-wide">
              {t.nav.privacyBadge}
            </span>
          </div>
        </div>

        {/* Right Section: Language Selector, Theme Switcher, Support CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* 7-Language Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sand-200 dark:border-studio-border bg-white/70 dark:bg-studio-card/80 hover:bg-sand-100 dark:hover:bg-studio-border text-moss-700 dark:text-sand-200 transition-colors text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sage-400/40"
              aria-label={t.nav.selectLanguage}
              aria-expanded={langDropdownOpen}
            >
              <Globe className="w-4 h-4 text-olive-500 dark:text-sand-300 shrink-0" />
              <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-moss-600 text-white dark:bg-sand-300 dark:text-studio-surface">
                {currentLangInfo.badge}
              </span>
              <span className="hidden lg:inline">{currentLangInfo.label}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  langDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-studio-surface border border-sand-200 dark:border-studio-border shadow-luxury-light dark:shadow-luxury-dark py-1.5 z-50 animate-fade-in">
                <div className="px-3 py-1 text-[11px] font-semibold text-olive-500 dark:text-sage-400 border-b border-sand-100 dark:border-studio-border mb-1">
                  {t.nav.selectLanguage}
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isActive = lang.code === currentLang;
                  return (
                    <a
                      key={lang.code}
                      href={lang.path}
                      onClick={() => setLangDropdownOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                        isActive
                          ? 'bg-sand-100/80 dark:bg-studio-card text-moss-700 dark:text-sand-300 font-semibold'
                          : 'text-moss-600 dark:text-sand-100 hover:bg-sand-50 dark:hover:bg-studio-card/50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-olive-500/20 dark:bg-sand-300/20 text-moss-700 dark:text-sand-300">
                          {lang.badge}
                        </span>
                        <span>{lang.label}</span>
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-moss-600 dark:bg-sand-300" />
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Light / Dark Mode Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-sand-200 dark:border-studio-border bg-white/70 dark:bg-studio-card/80 hover:bg-sand-100 dark:hover:bg-studio-border text-moss-700 dark:text-sand-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-400/40"
            aria-label={t.nav.toggleTheme}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-sand-300 animate-fade-in" />
            ) : (
              <Moon className="w-4 h-4 text-olive-500 animate-fade-in" />
            )}
          </button>

          {/* Support Developer CTA Button - Collapses strictly to icon on mobile/tablet */}
          <a
            href="https://ko-fi.com/kishara"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm bg-gradient-to-r from-sand-300 via-sage-400 to-sand-300 dark:from-sand-300 dark:to-sage-400 text-moss-800 dark:text-studio-surface shadow-sm hover:brightness-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-sand-300"
            title="Support the Developer on Ko-fi"
          >
            <Heart className="w-4 h-4 fill-current text-moss-800 dark:text-studio-surface shrink-0" />
            <span className="hidden lg:inline">{t.nav.supportDeveloper}</span>
          </a>
        </div>
      </div>
    </header>
  );
};
