'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useLanguage } from '@/context/LanguageContext';
import { Header } from '@/components/shared/Header';
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  User,
  Building2,
  Calendar,
  LogOut,
  RefreshCw,
  Mail,
  CheckCircle2,
} from 'lucide-react';

export default function PendingApprovalPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { candidates } = usePortalStore();
  const { t } = useLanguage();

  // Find candidate record
  const candidate = user?.candidateId
    ? candidates.find((c) => c.id === user.candidateId)
    : user
    ? candidates.find((c) => c.email.toLowerCase() === user.email.toLowerCase())
    : null;

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    if (user.role === 'admin') {
      router.push('/admin');
      return;
    }
    // If approved, redirect to candidate portal
    if (candidate && candidate.accountStatus === 'approved') {
      router.push('/portal');
    }
  }, [user, candidate, router]);

  if (!user || !candidate) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-primary" />
          <span className="text-sm font-semibold">Loading applicant verification status...</span>
        </div>
      </div>
    );
  }

  const isRejected = candidate.accountStatus === 'rejected';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col transition-colors">
      <Header hidePrint />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Main Status Hero Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  isRejected
                    ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                }`}
              >
                {isRejected ? <AlertTriangle className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                    {isRejected ? 'Application Registration Action Required' : 'Application Under Official Review'}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Applicant: <strong>{candidate.name}</strong> &middot; Passport: <span className="font-mono">{candidate.passportNumber}</span>
                </p>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto uppercase tracking-wider ${
                isRejected
                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}
            >
              {isRejected ? 'Feedback Issued' : 'Caseworker Queue'}
            </span>
          </div>

          {/* Status Message & Instructions */}
          <div className="mt-6 space-y-4">
            {isRejected ? (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-red-900 dark:text-red-200 uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Caseworker Rejection / Modification Reason</span>
                </div>
                <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                  {candidate.accountRejectionReason ||
                    'Your registration could not be verified with the Danish SIRI Registry. Please check your passport details or contact your assigned case coordinator.'}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>SIRI Green Sector Compliance Review</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                  Thank you for registering with the <strong>Danish Agency for International Recruitment and Integration (SIRI)</strong>. Your candidate dossier has entered the administrative vetting queue. An authorized caseworker will verify your initial passport scan, cross-reference employer sponsorship credentials, and activate your personal portal.
                </p>
              </div>
            )}

            {/* Application Data Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                Submitted Application Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Full Legal Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {candidate.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Passport Number</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {candidate.passportNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Registered Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {candidate.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Selected Visa Scheme</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {candidate.jobTitle || 'Danish Employment Scheme'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Nationality</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {candidate.nationality || 'Nepal'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Assigned Case Reference</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {candidate.siriCaseOrder?.caseOrderId || 'PENDING-ALLOCATION'}
                  </span>
                </div>
              </div>
            </div>

            {/* Step Timeline */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Vetting Stage Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Step 1: Self-Registration &amp; Passport Upload
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
                      Completed &middot; Encrypted in Local Store
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isRejected
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 animate-pulse'
                    }`}
                  >
                    2
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Step 2: SIRI Caseworker Verification &amp; Dossier Endorsement
                    </span>
                    <span
                      className={`text-[11px] block ${
                        isRejected
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isRejected ? 'Needs correction by candidate' : 'In Progress (Caseworker Review Desk)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-60">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Step 3: Portal Dossier Unlock &amp; Document Signing
                    </span>
                    <span className="text-[11px] text-slate-500 block">Pending Caseworker Approval</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Verification Status</span>
                </button>
                <a
                  href="mailto:verification@denmarkscheme.com?subject=SIRI%20Application%20Inquiry"
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  <span>Contact Help Desk</span>
                </a>
              </div>

              <button
                type="button"
                onClick={logout}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-lg bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/60 dark:hover:bg-red-900/60 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of Session</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
