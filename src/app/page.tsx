'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { MOCK_ADMIN_USER, MOCK_ADMIN_PASSWORD } from '@/data/mockUsers';
import { Header } from '@/components/shared/Header';
import { Lock, Mail, ChevronDown, ChevronUp, ArrowRight, Shield, User, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/portal');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in both email and password.', 'error');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      showToast(`Welcome back! Authenticated as ${res.role === 'admin' ? 'SIRI Caseworker' : 'Candidate'}.`, 'success');
      if (res.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/portal');
      }
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      showToast(t('loginError'), 'error');
    }
  };

  const handleAutofillCandidate = async () => {
    setEmail('dk3430143@gmail.com');
    setPassword('Dipak@1983');
    setIsLoading(true);
    const res = await login('dk3430143@gmail.com', 'Dipak@1983');
    setIsLoading(false);
    if (res.success) {
      showToast('Logged in as Dipak Karki (Candidate)', 'success');
      router.push('/portal');
    }
  };

  const handleAutofillAdmin = async () => {
    setEmail(MOCK_ADMIN_USER.email);
    setPassword(MOCK_ADMIN_PASSWORD);
    setIsLoading(true);
    const res = await login(MOCK_ADMIN_USER.email, MOCK_ADMIN_PASSWORD);
    setIsLoading(false);
    if (res.success) {
      showToast('Logged in as Morten Nyborg (SIRI Caseworker)', 'success');
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 transition-colors">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div
          className={`w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 transition-all ${
            shake ? 'animate-shake' : ''
          }`}
        >
          {/* Dannebrog Emblem & Title */}
          <div className="text-center mb-8">
            <div className="w-14 h-10 mx-auto rounded-md overflow-hidden shadow-sm border border-slate-200 mb-3">
              <svg viewBox="0 0 370 280" className="w-full h-full">
                <rect width="370" height="280" fill="#c8102e" />
                <rect x="120" width="40" height="280" fill="#ffffff" />
                <rect y="120" width="370" height="40" fill="#ffffff" />
              </svg>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {t('loginHeading')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              {t('loginSubheading')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('emailLabel')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('passwordLabel')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying...' : t('loginBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Collapsible Demo Drawer */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('demoAccessTitle')}</span>
              </span>
              {showDemo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDemo && (
              <div className="mt-3 space-y-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs animate-slide-up">
                {/* Candidate Demo Box */}
                <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Dipak Karki (Candidate)</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      dk3430143@gmail.com &bull; Dipak@1983
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutofillCandidate}
                    className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded transition-colors whitespace-nowrap"
                  >
                    {t('clickToAutofill')}
                  </button>
                </div>

                {/* Caseworker Admin Box */}
                <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                      <span>Morten Nyborg (SIRI Admin)</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      caseworker@siri.dk &bull; AdminSiri@2026
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutofillAdmin}
                    className="px-2.5 py-1 text-[11px] font-bold bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded transition-colors whitespace-nowrap"
                  >
                    {t('clickToAutofill')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800">
        &copy; {new Date().getFullYear()} Danish Agency for International Recruitment and Integration (SIRI). All rights reserved.
      </footer>
    </div>
  );
}
