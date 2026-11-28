'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Header } from '@/components/shared/Header';
import { Lock, Mail, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already logged in as admin, redirect to /admin
  useEffect(() => {
    if (user && user.role === 'admin') {
      router.push('/admin');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      showToast('Please enter caseworker credentials.', 'error');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsLoading(true);
    // Explicitly restrict to admin only
    const res = await login(email, password, 'admin');
    setIsLoading(false);

    if (res.success && res.role === 'admin') {
      showToast('Authorized SIRI Caseworker session verified.', 'success');
      router.push('/admin');
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      const err = res.errorReason || 'Access Denied: Invalid administrative credentials.';
      setErrorMessage(err);
      showToast(err, 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Unindexed indicator */}
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>

      <Header hidePrint />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div
          className={`w-full max-w-md bg-slate-800/90 rounded-2xl shadow-2xl border border-slate-700 p-8 backdrop-blur-md transition-all ${
            shake ? 'animate-shake' : ''
          }`}
        >
          {/* Header & Security Badge */}
          <div className="text-center mb-7">
            <div className="w-12 h-12 mx-auto rounded-xl bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center shadow-inner mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/60 uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>Restricted Government Gateway</span>
            </div>
            <h1 className="text-lg font-extrabold text-white">
              SIRI Caseworker Console
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Danish Agency for International Recruitment and Integration &middot; Case Audit &amp; Green Sector Unit
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs font-medium leading-relaxed">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Official Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter staff email"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Security Password / Passkey
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security password"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating Staff...' : 'Access Caseworker Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Return to Candidate Portal Link */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1"
            >
              <span>&larr;</span>
              <span>Candidate or Applicant? Return to Candidate Portal</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-800">
        Strictly confidential &middot; Danish Agency for International Recruitment and Integration (SIRI) Staff Portal
      </footer>
    </div>
  );
}
