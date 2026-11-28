'use client';

import React, { useState, useEffect } from 'react';
import { CandidateRecord, InterviewPreparationChecklist } from '@/types';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useToast } from '@/context/ToastContext';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Video,
  Printer,
  Sparkles,
} from 'lucide-react';

const formatCountdown = (isoDate: string): string => {
  const target = new Date(isoDate).getTime();
  const now = Date.now();
  const diffMs = target - now;
  if (diffMs <= 0) return 'In progress / Concluded';
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days === 0) {
    return hours === 0 ? `Starts in ${minutes}m` : `Today · Starts in ${hours}h ${minutes}m`;
  }
  return `Starts in ${days}d ${hours}h ${minutes}m`;
};

export const CandidateProcessPanel: React.FC<{ candidate: CandidateRecord }> = ({ candidate }) => {
  const { savePrepChecklist } = usePortalStore();
  const { showToast } = useToast();
  const [isPrintSlipOpen, setIsPrintSlipOpen] = useState(false);
  const [, setNowTick] = useState(Date.now());

  const [prepChecklist, setPrepChecklist] = useState<InterviewPreparationChecklist>(() => ({
    passportAndCitizenshipReady: Boolean(candidate.processMeta?.prepChecklist?.passportAndCitizenshipReady),
    dossierSummaryPrinted: Boolean(candidate.processMeta?.prepChecklist?.dossierSummaryPrinted),
    quietRoomAndTechTested: Boolean(candidate.processMeta?.prepChecklist?.quietRoomAndTechTested),
  }));

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (candidate.processMeta?.prepChecklist) {
      setPrepChecklist({
        passportAndCitizenshipReady: Boolean(candidate.processMeta.prepChecklist.passportAndCitizenshipReady),
        dossierSummaryPrinted: Boolean(candidate.processMeta.prepChecklist.dossierSummaryPrinted),
        quietRoomAndTechTested: Boolean(candidate.processMeta.prepChecklist.quietRoomAndTechTested),
      });
    }
  }, [candidate.id, candidate.processMeta?.prepChecklist]);

  const handleTogglePrep = async (key: keyof InterviewPreparationChecklist) => {
    const updated = {
      ...prepChecklist,
      [key]: !prepChecklist[key],
    };
    setPrepChecklist(updated);
    try {
      await savePrepChecklist(candidate.id, updated);
      showToast('Readiness checklist updated.', 'success');
    } catch {
      // Local state updated
    }
  };

  const interview = candidate.processMeta?.videoInterview;
  const appointment = candidate.processMeta?.applicationCenter;

  const handlePrintSlip = () => {
    window.print();
  };

  if (!interview && !appointment) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Interviews &amp; Biometric Appointments
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Your Stage 4 Live Zoom facial identity verification and Stage 5 VFS appointment will be scheduled by your assigned coordinator once your KYC profile and core documents are approved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-label="Official Process Directives & Appointment Desks">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stage 4 Live Zoom Facial Card */}
        {interview && (
          <div className="rounded-2xl border-2 border-blue-400/60 bg-gradient-to-br from-blue-50 to-indigo-50/40 dark:from-blue-950/40 dark:to-indigo-950/20 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">
                <Video className="h-4 w-4 text-blue-600" />
                <span>Stage 4 Live Zoom Facial Verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-100 border border-blue-300 dark:border-blue-700 flex items-center gap-1">
                  <Clock3 className="w-3 h-3 text-blue-600" />
                  <span>{formatCountdown(interview.scheduledAt)}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-100">
                  Scheduled
                </span>
              </div>
            </div>

            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-blue-100 dark:border-blue-900 space-y-1">
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {new Date(interview.scheduledAt).toLocaleString([], {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Assigned Officer: <strong className="text-slate-800 dark:text-slate-200">{interview.coordinatorName}</strong>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Meeting ID: {interview.meetingId || 'Direct Link'} &middot; Passcode: {interview.passcode || 'Direct'}
              </div>
            </div>

            {interview.preparationNotes && (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900">
                <strong>Directive:</strong> {interview.preparationNotes}
              </p>
            )}

            {/* Interactive Zoom Readiness Checklist */}
            <div className="rounded-xl border border-blue-200 dark:border-blue-800/60 bg-white/90 dark:bg-slate-900/90 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Interview Readiness Checklist</span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {prepChecklist.passportAndCitizenshipReady && prepChecklist.quietRoomAndTechTested ? 'Ready (2/2)' : 'Action Required'}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 cursor-pointer select-none py-0.5">
                  <input
                    type="checkbox"
                    checked={prepChecklist.passportAndCitizenshipReady}
                    onChange={() => handleTogglePrep('passportAndCitizenshipReady')}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 flex-shrink-0"
                  />
                  <span className={prepChecklist.passportAndCitizenshipReady ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                    Original Passport in hand for live visual check
                  </span>
                </label>

                <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 cursor-pointer select-none py-0.5">
                  <input
                    type="checkbox"
                    checked={prepChecklist.quietRoomAndTechTested}
                    onChange={() => handleTogglePrep('quietRoomAndTechTested')}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 flex-shrink-0"
                  />
                  <span className={prepChecklist.quietRoomAndTechTested ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                    High-speed internet, microphone &amp; lighting verified
                  </span>
                </label>
              </div>
            </div>

            <a
              href={interview.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 shadow transition-all"
            >
              <span>Join Verified Zoom Verification Call</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* Stage 5 VFS Appointment Card */}
        {appointment && (
          <div className="rounded-2xl border-2 border-emerald-400/60 bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/40 dark:to-teal-950/20 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>Stage 5 Embassy / VFS Biometrics Appointment</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                  <Clock3 className="w-3 h-3 text-emerald-600" />
                  <span>{formatCountdown(appointment.scheduledAt)}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
                  Confirmed
                </span>
              </div>
            </div>

            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-emerald-100 dark:border-emerald-900 space-y-1">
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {new Date(appointment.scheduledAt).toLocaleString([], {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Venue: {appointment.location}
              </div>
              <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                Reference: <strong>{appointment.referenceCode}</strong>
              </div>
            </div>

            {appointment.documentNotes && (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
                <strong>Mandatory Checklist:</strong> {appointment.documentNotes}
              </p>
            )}

            {/* VFS / Biometrics Interactive Checklist */}
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-white/90 dark:bg-slate-900/90 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Appointment Readiness Checklist</span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {prepChecklist.passportAndCitizenshipReady && prepChecklist.dossierSummaryPrinted ? 'Ready (2/2)' : 'Action Required'}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 cursor-pointer select-none py-0.5">
                  <input
                    type="checkbox"
                    checked={prepChecklist.passportAndCitizenshipReady}
                    onChange={() => handleTogglePrep('passportAndCitizenshipReady')}
                    className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 w-4 h-4 flex-shrink-0"
                  />
                  <span className={prepChecklist.passportAndCitizenshipReady ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                    Original Passport &amp; Citizenship certificate in hand
                  </span>
                </label>

                <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 cursor-pointer select-none py-0.5">
                  <input
                    type="checkbox"
                    checked={prepChecklist.dossierSummaryPrinted}
                    onChange={() => handleTogglePrep('dossierSummaryPrinted')}
                    className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 w-4 h-4 flex-shrink-0"
                  />
                  <span className={prepChecklist.dossierSummaryPrinted ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                    Printed Appointment Slip &amp; Dossier Summary ready
                  </span>
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPrintSlipOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 shadow transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Official Biometrics Appointment Slip</span>
            </button>
          </div>
        )}
      </div>

      {/* Printable Biometrics Appointment Slip Modal */}
      {isPrintSlipOpen && appointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 space-y-5 my-6 text-slate-900">
            <div className="border-b-2 border-emerald-700 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🇩🇰</span>
                <div>
                  <h3 className="text-base font-extrabold text-emerald-800">
                    SIRI &middot; VFS GLOBAL BIOMETRICS APPOINTMENT SLIP
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Official Embassy Submission Directive &middot; 2026 Protocol
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintSlipOpen(false)}
                className="text-slate-400 hover:text-slate-600 print:hidden text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Applicant Name</span>
                <span className="font-bold text-sm text-slate-900">{candidate.name}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Passport Number</span>
                <span className="font-mono font-bold text-slate-900">{candidate.passportNumber}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">SIRI Case Order ID</span>
                <span className="font-mono font-bold text-emerald-700">{candidate.siriCaseOrder?.caseOrderId || 'Assigned'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">VFS Reference Code</span>
                <span className="font-mono font-bold text-blue-700">{appointment.referenceCode}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="font-bold text-emerald-900">Scheduled Date &amp; Venue:</div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {new Date(appointment.scheduledAt).toLocaleString([], {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="text-slate-700 mt-1">{appointment.location}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900">Mandatory Submission Checklist:</div>
                <p className="text-[11px] text-slate-600 mt-1 whitespace-pre-wrap">{appointment.documentNotes}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 print:hidden">
              <button
                type="button"
                onClick={() => setIsPrintSlipOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintSlip}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white shadow flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Slip (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
