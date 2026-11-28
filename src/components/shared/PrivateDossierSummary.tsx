'use client';

import React from 'react';
import { CandidateRecord } from '@/types';
import { Printer, ShieldCheck, PenTool, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const PrivateDossierSummary: React.FC<{ candidate: CandidateRecord }> = ({ candidate }) => (
  <section className="printable-dossier rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm transition-colors">
    <div className="no-print mb-4 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Private Application &amp; Dossier Summary</span>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Official Candidate Record &middot; Private recruitment agency and employer coordination copy
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
      >
        <Printer className="h-3.5 w-3.5" />
        <span>Print Dossier Summary</span>
      </button>
    </div>

    <div className="print-summary-content space-y-5">
      {/* Candidate Profile Strip */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700/60">
        <div className="w-16 h-20 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-700 dark:text-slate-300 shrink-0">
          {candidate.avatarUrl ? (
            <img src={candidate.avatarUrl} alt={`${candidate.name} profile`} className="h-full w-full object-cover" />
          ) : (
            candidate.name.split(' ').map((part) => part[0]).join('')
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
            SIRI Dossier &middot; Candidate Profile
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 truncate mt-0.5">
            {candidate.name}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            {candidate.email} &middot; {candidate.jobTitle} &middot; {candidate.nationality}
          </p>
          <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px]">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Employer: {candidate.employer.name}
            </span>
            <span className="text-slate-400">&middot;</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
              Case ID: {candidate.siriCaseOrder.caseOrderId}
            </span>
          </div>
        </div>
      </header>

      {/* Structured KYC & Dossier Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
        <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Passport Details</span>
          <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
            {candidate.passportNumber}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Expires: {candidate.passportExpiry || 'Not recorded'}
          </p>
        </div>

        <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Date of Birth &amp; Nationality</span>
          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
            {candidate.dob || 'Not recorded'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Nationality: {candidate.nationality}
          </p>
        </div>

        <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Permanent Address &amp; Contact</span>
          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
            {candidate.permanentAddress || 'Not recorded'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
            {candidate.phone || 'Not recorded'}
          </p>
        </div>

        <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Citizenship Certificate &amp; NIN</span>
          <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-1">
            Citizenship No: {candidate.extendedKyc?.citizenship_number || 'N/A'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            NIN: {candidate.extendedKyc?.national_id_nin || 'N/A'}
          </p>
        </div>

        <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Parents&apos; Details</span>
          <p className="text-slate-800 dark:text-slate-200 mt-1">
            Father: <strong>{candidate.extendedKyc?.father_name || 'N/A'}</strong>
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
            Mother: <strong>{candidate.extendedKyc?.mother_name || 'N/A'}</strong>
          </p>
        </div>

        <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Emergency Contact</span>
          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
            {candidate.extendedKyc?.emergency_contact_name || 'N/A'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {candidate.extendedKyc?.emergency_contact_relation ? `(${candidate.extendedKyc.emergency_contact_relation}) ` : ''}
            {candidate.extendedKyc?.emergency_contact_phone || ''}
          </p>
        </div>

        <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Education &amp; Experience</span>
          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
            {candidate.extendedKyc?.education_level || 'N/A'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Experience: {candidate.extendedKyc?.work_experience_years || '0'} years
          </p>
        </div>

        <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Marital Status &amp; Gender</span>
          <p className="text-slate-800 dark:text-slate-200 mt-1">
            {candidate.extendedKyc?.marital_status || 'N/A'} &middot; {candidate.extendedKyc?.gender || 'N/A'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Previous Schengen: {candidate.extendedKyc?.previous_schengen_visa || 'No'}
          </p>
        </div>

        <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Danish Employer &amp; Sponsor</span>
          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
            {candidate.employer.name}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Sponsor Code: #{candidate.employer.sponsorCode}
          </p>
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Work Skills &amp; Qualifications Summary</span>
          <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
            {candidate.extendedKyc?.work_skills_summary || candidate.workExperienceSummary || 'No work summary recorded.'}
          </p>
        </div>
      </div>

      {/* SAVED DIGITAL SIGNATURE PREVIEW BOX */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
              <PenTool className="w-3.5 h-3.5 text-emerald-600" />
              <span>Candidate Electronic Signature Ledger</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Legally binding digital signature captured for official Danish immigration coordination
            </p>
          </div>

          {candidate.signatureDataUrl ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Signature Verified On File</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Signature Capture Pending</span>
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-700/60">
          <div className="h-16 w-56 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 p-1 flex items-center justify-center overflow-hidden">
            {candidate.signatureDataUrl ? (
              <img
                src={candidate.signatureDataUrl}
                alt={`${candidate.name} digital signature`}
                className="max-h-full max-w-full object-contain filter dark:invert"
              />
            ) : (
              <span className="text-[11px] text-slate-400 italic">No signature on file</span>
            )}
          </div>
          <div className="text-right text-[11px] text-slate-500 space-y-0.5">
            <div>Signer: <strong>{candidate.name}</strong></div>
            <div>Passport: <strong className="font-mono">{candidate.passportNumber}</strong></div>
            {candidate.signatureTimestamp && (
              <div className="text-[10px] text-slate-400">
                Timestamp: {new Date(candidate.signatureTimestamp).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Checklist Ledger */}
      <section className="pt-2">
        <h2 className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100 mb-2">
          Authorized Document Checklist ({candidate.documents.length} Records)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {candidate.documents.map((doc) => {
            const isVerified = doc.status === 'verified';
            const isRejected = doc.status === 'rejected';
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                    {doc.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {doc.docId}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    isVerified
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : isRejected
                      ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {isVerified ? 'Verified' : isRejected ? 'Correction Required' : doc.status.replaceAll('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  </section>
);
