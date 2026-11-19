'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Language, NotificationItem } from '@/types';
import {
  Moon,
  Sun,
  Printer,
  LogOut,
  Globe,
  ShieldCheck,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  CheckCheck,
  X,
  RefreshCw,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { candidates, markNotificationRead, markAllNotificationsRead, refreshStore } = usePortalStore();
  const { language, setLanguage, t } = useLanguage();
  const { showToast } = useToast();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const notifRef = useRef<HTMLDivElement | null>(null);

  // Active candidate notifications
  const currentCandidate = user?.candidateId
    ? candidates.find((c) => c.id === user.candidateId)
    : user && user.role === 'candidate'
    ? candidates.find((c) => c.email.toLowerCase() === user.email.toLowerCase())
    : null;

  const notifications: NotificationItem[] = currentCandidate?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

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

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  const handleSync = async () => {
    setIsSyncing(true);
    await refreshStore();
    setIsSyncing(false);
    showToast('Candidate dossier synced from the private cloud.', 'success');
  };

  const handleMarkAllRead = () => {
    if (currentCandidate) {
      markAllNotificationsRead(currentCandidate.id);
      showToast('All notifications marked as read', 'success');
    }
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    if (currentCandidate && !notif.read) {
      markNotificationRead(currentCandidate.id, notif.id);
    }
  };

  const renderNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    }
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
                PRIVATE RECRUITMENT
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                AGENCY SERVICES
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {user?.role === 'admin' ? t('adminConsole') : t('candidatePortal')}
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <button
              type="button"
              onClick={() => void handleSync()}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              title="Sync live cloud data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Cloud</span>
            </button>
          )}
          {/* User Role Badge */}
          {user && (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-primary dark:text-emerald-400" />
              <span className="font-semibold">{user.name}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {user.role === 'admin' ? 'Coordinator' : 'Candidate'}
              </span>
            </div>
          )}

          {/* Notification Bell (Candidate Portal) */}
          {user && currentCandidate && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[9px] font-extrabold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Official Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-brand-primary dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3 text-left transition-colors cursor-pointer flex items-start gap-2.5 ${
                            notif.read
                              ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              : 'bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          <div className="mt-0.5">{renderNotifIcon(notif.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-xs font-bold truncate ${
                                  notif.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                {notif.title}
                              </span>
                              <span className="text-[10px] text-slate-400 flex-shrink-0">
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
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
