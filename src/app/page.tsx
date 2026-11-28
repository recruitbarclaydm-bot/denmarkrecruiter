'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Header } from '@/components/shared/Header';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function CandidateLoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const portalStore = usePortalStore();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already logged in
  useEffect(() => {
    if (!portalStore.isInitialized) return;
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        const candidateRecord = portalStore.candidates.find((c) => c.id === user.candidateId);
        if (candidateRecord?.accountStatus === 'pending_approval' || candidateRecord?.accountStatus === 'rejected') {
          router.push('/pending-approval');
        } else {
          router.push('/portal');
        }
      }
    }
  }, [user, portalStore.candidates, portalStore.isInitialized, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      showToast('Please fill in both email and password.', 'error');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsLoading(true);
    // Explicitly restrict this public form to candidates only
    const res = await login(email, password, 'candidate');
    setIsLoading(false);

    if (res.success && res.role === 'candidate') {
      if (res.accountStatus === 'pending_approval' || res.accountStatus === 'rejected') {
        showToast('Registration is under caseworker review.', 'info');
        router.push('/pending-approval');
      } else {
        showToast('Authenticated as Candidate. Redirecting to dossier...', 'success');
        router.push('/portal');
      }
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      const err = res.errorReason || t('loginError');
      setErrorMessage(err);
      showToast(err, 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 transition-colors">
      <Header hidePrint />

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

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-medium leading-relaxed">
              {errorMessage}
            </div>
          )}

          {/* Candidate Form */}
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

          {/* New Applicant Self-Registration & Status Lookup Links */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-center">
            <div>
              <Link
                href="/register"
                className="text-xs font-bold text-brand-primary dark:text-emerald-400 hover:text-brand-secondary hover:underline inline-flex items-center gap-1.5 transition-colors"
              >
                <span>New Applicant? Register for Visa Portal &rarr;</span>
              </Link>
            </div>
            <div>
              <Link
                href="/track"
                className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1 transition-colors"
              >
                <span>🔍 Track Application Status (No Login Required) &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <div>
          <Link href="/track" className="hover:text-slate-600 dark:hover:text-slate-300 underline mr-3">
            Track Application Status
          </Link>
          &middot;
          <Link href="/register" className="hover:text-slate-600 dark:hover:text-slate-300 underline ml-3">
            Register New Applicant
          </Link>
        </div>
        <div>
          &copy; {new Date().getFullYear()} Danish Immigration &amp; Candidate Portal · Private Recruitment Agency Desk.
        </div>
      </footer>
    </div>
  );
}
