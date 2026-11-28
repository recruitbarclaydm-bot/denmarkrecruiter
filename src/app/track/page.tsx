'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { supabase } from '@/lib/supabase';
import { INITIAL_CANDIDATES } from '@/data/mockUsers';
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  FileCheck,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface TrackingResult {
  maskedName: string;
  caseOrderId: string;
  passportMasked: string;
  jobTitle: string;
  employerName: string;
  stageNumber: number;
  stageTitle: string;
  kycStatus: string;
  accountStatus: string;
  verifiedDocsCount: number;
  totalDocsCount: number;
  scheduledInterview?: string;
  scheduledAppointment?: string;
  lastUpdated: string;
}

const STAGE_TITLES: Record<number, string> = {
  1: 'Initial Registration & Security Clearance',
  2: 'Danish Employer Job Offer & Contract Alignment',
  3: 'Mandatory Identity KYC & Document Dossier Audit',
  4: 'Danish Agency (SIRI) Facial Verification & Case Order ID',
  5: 'Biometrics & Embassy / VFS Consular Appointment',
  6: 'Final Residence & Work Permit Grant Issuance',
};

const maskName = (name: string): string => {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 2) return word[0] + '*';
      return word[0] + '*'.repeat(Math.max(1, word.length - 2)) + word[word.length - 1];
    })
    .join(' ');
};

export default function TrackApplicationPage() {
  const [caseOrderId, setCaseOrderId] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCase = caseOrderId.trim();
    const cleanPassport = passportNumber.trim().toUpperCase();

    if (!cleanCase || !cleanPassport) {
      setErrorMsg('Please enter both your Case Order ID and Passport Number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);
    setHasSearched(true);

    try {
      // 1. Query Supabase candidates table
      const { data: candidateRow, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .ilike('passport_number', cleanPassport)
        .maybeSingle();

      let targetCandidate = candidateRow;

      // 2. Fallback to mock data if offline or local demo records
      if (!targetCandidate) {
        const mockMatch = INITIAL_CANDIDATES.find(
          (c) =>
            c.passportNumber.toUpperCase() === cleanPassport &&
            (c.siriCaseOrder?.caseOrderId?.toLowerCase() === cleanCase.toLowerCase() ||
              c.siriCaseOrder?.caseOrderId?.toLowerCase().includes(cleanCase.toLowerCase()) ||
              cleanCase.toLowerCase().includes(c.siriCaseOrder?.caseOrderId?.toLowerCase()))
        );

        if (mockMatch) {
          targetCandidate = {
            id: mockMatch.id,
            full_name: mockMatch.name,
            passport_number: mockMatch.passportNumber,
            case_order_id: mockMatch.siriCaseOrder?.caseOrderId,
            current_stage: mockMatch.currentStage,
            kyc_status: mockMatch.kycStatus,
            account_status: mockMatch.accountStatus,
            employer_name: mockMatch.employer.name,
            job_title: mockMatch.jobTitle,
            kyc_note: JSON.stringify({
              process: mockMatch.processMeta || {},
            }),
            updated_at: new Date().toISOString(),
          };
        }
      }

      if (!targetCandidate) {
        setErrorMsg('No application found matching that Passport Number and Case Order ID. Please check the spelling and try again.');
        return;
      }

      // Verify Case Order ID match if recorded
      const dbCase = String(targetCandidate.case_order_id || '').trim().toLowerCase();
      if (dbCase && !dbCase.includes(cleanCase.toLowerCase()) && !cleanCase.toLowerCase().includes(dbCase)) {
        setErrorMsg('Passport Number found, but the Case Order ID does not match our security records. Please verify your reference number.');
        return;
      }

      // Count verified documents
      let verifiedDocs = 4;
      let totalDocs = 6;
      try {
        const { count: verifiedCount } = await supabase
          .from('dossier_documents')
          .select('id', { count: 'exact', head: true })
          .eq('candidate_id', targetCandidate.id)
          .eq('status', 'verified');

        const { count: allCount } = await supabase
          .from('dossier_documents')
          .select('id', { count: 'exact', head: true })
          .eq('candidate_id', targetCandidate.id);

        if (verifiedCount !== null) verifiedDocs = verifiedCount;
        if (allCount !== null && allCount > 0) totalDocs = allCount;
      } catch {
        // Fallback default
      }

      // Parse appointment data from kyc_note
      let scheduledInterview: string | undefined;
      let scheduledAppointment: string | undefined;
      try {
        if (targetCandidate.kyc_note) {
          const parsed = JSON.parse(targetCandidate.kyc_note);
          const process = parsed?.process || {};
          if (process.videoInterview?.scheduledAt) {
            scheduledInterview = new Date(process.videoInterview.scheduledAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
          }
          if (process.applicationCenter?.scheduledAt) {
            scheduledAppointment = `${new Date(process.applicationCenter.scheduledAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })} (${process.applicationCenter.location || 'VFS Center'})`;
          }
        }
      } catch {
        // Safe fallback
      }

      const stage = Number(targetCandidate.current_stage) || 1;

      setResult({
        maskedName: maskName(targetCandidate.full_name || 'Applicant'),
        caseOrderId: targetCandidate.case_order_id || cleanCase,
        passportMasked: `••••${cleanPassport.slice(-4)}`,
        jobTitle: targetCandidate.job_title || 'Agricultural Specialist / Green Scheme Worker',
        employerName: targetCandidate.employer_name || 'AgroNord A/S & Partner Holdings',
        stageNumber: stage,
        stageTitle: STAGE_TITLES[stage] || `Stage ${stage} Assessment`,
        kycStatus: targetCandidate.kyc_status || 'submitted',
        accountStatus: targetCandidate.account_status || 'approved',
        verifiedDocsCount: verifiedDocs,
        totalDocsCount: totalDocs,
        scheduledInterview,
        scheduledAppointment,
        lastUpdated: new Date(targetCandidate.updated_at || Date.now()).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to query application status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Search className="w-3.5 h-3.5" />
            <span>Public Application Status Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Track Your Danish Visa &amp; Work Permit
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Check your current SIRI stage, KYC verification status, and appointment dates securely without logging in.
          </p>
        </div>

        {/* Lookup Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  SIRI Case Order ID / Reference *
                </label>
                <input
                  type="text"
                  value={caseOrderId}
                  onChange={(e) => setCaseOrderId(e.target.value)}
                  placeholder="e.g. SB6-948123-2026"
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Passport Number *
                </label>
                <input
                  type="text"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  placeholder="e.g. PA4635786"
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono uppercase"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl border border-red-300 bg-red-50 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{isLoading ? 'Verifying Reference...' : 'Track Application Status'}</span>
            </button>
          </form>

          {/* Quick Demo Pill Helper */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
            <span>Demo Test Lookups:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCaseOrderId('SB6-948123-2026');
                  setPassportNumber('PA4635786');
                }}
                className="hover:underline font-mono text-emerald-700 dark:text-emerald-400"
              >
                Dipak Karki
              </button>
              <span>&middot;</span>
              <button
                type="button"
                onClick={() => {
                  setCaseOrderId('DEN-AGRI-944135-2026');
                  setPassportNumber('PA3880717');
                }}
                className="hover:underline font-mono text-emerald-700 dark:text-emerald-400"
              >
                Nokha Nath Adhikari
              </button>
            </div>
          </div>
        </div>

        {/* Results Card */}
        {result && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Application Holder</div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {result.maskedName}
                </h2>
                <div className="text-xs text-slate-500">
                  Passport: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{result.passportMasked}</span> &middot; Case Order: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{result.caseOrderId}</span>
                </div>
              </div>

              <span className="self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active Dossier</span>
              </span>
            </div>

            {/* Current Stage Indicator */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-900 dark:text-emerald-200">
                  Current Status: Stage {result.stageNumber} of 6
                </span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  {Math.round((result.stageNumber / 6) * 100)}% Complete
                </span>
              </div>
              <div className="h-2 rounded-full bg-emerald-200/60 dark:bg-emerald-950 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all rounded-full"
                  style={{ width: `${(result.stageNumber / 6) * 100}%` }}
                />
              </div>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                {result.stageTitle}
              </p>
            </div>

            {/* Status Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Sponsor Employer</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{result.employerName}</span>
                <span className="text-slate-500 block text-[11px]">{result.jobTitle}</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Statutory KYC Clearance</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      result.kycStatus === 'verified'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : result.kycStatus === 'rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {result.kycStatus === 'verified' ? 'Verified & Approved' : result.kycStatus === 'rejected' ? 'Correction Requested' : 'Pending Review'}
                  </span>
                </div>
                <span className="text-slate-500 block text-[11px]">
                  Document Vault: <strong>{result.verifiedDocsCount}</strong> of {result.totalDocsCount} Verified
                </span>
              </div>

              {result.scheduledInterview && (
                <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 space-y-1 sm:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block">
                    Scheduled Stage 4 Zoom Interview
                  </span>
                  <div className="font-extrabold text-blue-950 dark:text-blue-100 text-sm flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{result.scheduledInterview}</span>
                  </div>
                </div>
              )}

              {result.scheduledAppointment && (
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-1 sm:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">
                    Confirmed Embassy / VFS Appointment
                  </span>
                  <div className="font-extrabold text-emerald-950 dark:text-emerald-100 text-sm flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>{result.scheduledAppointment}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy & Secure Login CTA */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Privacy Notice</span>
                </div>
                <p className="text-[11px] text-slate-500 max-w-md">
                  Personal phone numbers, raw passport scans, and residential addresses are withheld from public lookup. Sign in for complete dossier management.
                </p>
              </div>

              <Link
                href="/"
                className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <span>Candidate Portal Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <div>
          <Link href="/" className="hover:text-slate-600 dark:hover:text-slate-300 underline mr-3">
            Candidate Portal Login
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
