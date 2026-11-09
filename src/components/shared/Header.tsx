'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Language } from '@/types';
import { Moon, Sun, Printer, LogOut, Globe, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { showToast } = useToast();
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    const isDarkMode =
      localStorage.getItem('siri_theme') === 'dark' ||
      (!('siri_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('siri_theme', 'dark');
      showToast(t('darkMode', 'Dark Mode Activated'), 'info');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('siri_theme', 'light');
      showToast(t('lightMode', 'Light Mode Activated'), 'info');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Danish Brand / Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-7 rounded overflow-hidden shadow-sm flex-shrink-0 border border-slate-200 dark:border-slate-700">
            <svg viewBox="0 0 370 280" className="w-full h-full">
              <rect width="370" height="280" fill="#c8102e" />
              <rect x="120" width="40" height="280" fill="#ffffff" />
              <rect y="120" width="370" height="40" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-brand-primary dark:text-emerald-400 tracking-tight">
                SIRI DENMARK
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                OFFICIAL PORTAL
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {user?.role === 'admin' ? t('adminConsole') : t('candidatePortal')}
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Role Badge */}
          {user && (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-primary dark:text-emerald-400" />
              <span className="font-semibold">{user.name}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {user.role === 'admin' ? 'Caseworker' : 'Candidate'}
              </span>
            </div>
          )}

          {/* Language Selector */}
          <div className="relative flex items-center">
            <Globe className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-2.5 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="pl-8 pr-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              aria-label="Language selector"
            >
              <option value="en">English (EN)</option>
              <option value="da">Dansk (DA)</option>
              <option value="ne">नेपाली (NE)</option>
            </select>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            title={isDark ? t('lightMode') : t('darkMode')}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title={t('printDossier')}
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('printDossier')}</span>
          </button>

          {/* Logout Button */}
          {user && (
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/60 dark:hover:bg-red-900/60 dark:text-red-300 border border-red-200 dark:border-red-800 transition-colors"
              title={t('logout')}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
