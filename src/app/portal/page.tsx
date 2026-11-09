'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Header } from '@/components/shared/Header';
import { Stepper } from '@/components/portal/Stepper';
import { LiveBriefingCard } from '@/components/portal/LiveBriefingCard';
import { DocumentUploadCard } from '@/components/portal/DocumentUploadCard';
import { ChecklistCard } from '@/components/portal/ChecklistCard';
import { SignatureModal } from '@/components/portal/SignatureModal';
import { DocPreviewModal } from '@/components/shared/DocPreviewModal';
import { generateAndDownloadVfsIcs } from '@/lib/icsGenerator';
import { generateDocumentPdf } from '@/lib/pdfGenerator';
import { DocumentRecord } from '@/types';
import {
  Calendar,
  MapPin,
  Copy,
  Eye,
  EyeOff,
  Building2,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Download,
  PenTool,
} from 'lucide-react';

export default function CandidatePortalPage() {
  const router = useRouter();
  const { user, candidate } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [maskPassport, setMaskPassport] = useState(true);
  const [activeDocForPreview, setActiveDocForPreview] = useState<DocumentRecord | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  // Authentication Guard
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!candidate) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`, 'success');
  };

  const handleDownloadCalendar = () => {
    generateAndDownloadVfsIcs(
      candidate.vfsAppointment,
      candidate.name,
      candidate.passportNumber,
      candidate.siriCaseOrder.caseOrderId,
      candidate.employer.name
    );
    showToast('Downloaded VFS Appointment (.ics) calendar event', 'success');
  };

  const handleQuickDownloadDoc = async (doc: DocumentRecord) => {
    showToast(`Generating official PDF for ${doc.title}...`, 'info');
    await generateDocumentPdf(doc, candidate);
    showToast(`Downloaded: ${doc.title}.pdf`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col transition-colors">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stepper */}
        <Stepper candidate={candidate} />

        {/* Live Meeting Countdown Banner */}
        <LiveBriefingCard />

        {/* Candidate Profile Summary Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-brand-primary dark:text-emerald-400 font-extrabold text-xl flex items-center justify-center border border-emerald-300 dark:border-emerald-800 flex-shrink-0">
                {candidate.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                    {candidate.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>SIRI VERIFIED APPLICANT</span>
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {candidate.jobTitle} &middot; {candidate.employer.name}
                </div>
              </div>
            </div>

            {/* Quick Passport & Copy Box */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Passport Number</span>
                <span className="font-mono font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  {maskPassport ? `••••${candidate.passportNumber.slice(-4)}` : candidate.passportNumber}
                </span>
              </div>
              <button
                onClick={() => setMaskPassport(!maskPassport)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                title={maskPassport ? 'Show Passport' : 'Mask Passport'}
              >
                {maskPassport ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => copyToClipboard(candidate.passportNumber, 'Passport Number')}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                title="Copy Passport"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tracking Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Widget 1: SIRI Case Order ID */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-brand-primary dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t('siriCaseWidgetTitle')}
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {t('siriCaseStatus')}
                </span>
              </div>
              <div className="flex items-center gap-2 my-2">
                <span className="text-xl font-mono font-extrabold text-brand-primary dark:text-emerald-400">
                  {candidate.siriCaseOrder.caseOrderId}
                </span>
                <button
                  onClick={() => copyToClipboard(candidate.siriCaseOrder.caseOrderId, 'Case Order ID')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 mt-3">
                <div><strong>Scheme:</strong> {candidate.siriCaseOrder.scheme}</div>
                <div><strong>Statutory Fee:</strong> {candidate.siriCaseOrder.statutoryFee} (Paid & Reconciled)</div>
                <div><strong>Registry:</strong> {candidate.siriCaseOrder.caseRegistry}</div>
              </div>
            </div>
          </div>

          {/* Widget 2: VFS Global Appointment Desk */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t('vfsWidgetTitle')}
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {t('vfsStatus')}
                </span>
              </div>
              <div className="flex items-center gap-2 my-2">
                <span className="text-xl font-mono font-extrabold text-blue-600 dark:text-blue-400">
                  {candidate.vfsAppointment.refNumber}
                </span>
                <button
                  onClick={() => copyToClipboard(candidate.vfsAppointment.refNumber, 'VFS Reference')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 mt-3">
                <div><strong>Center:</strong> {candidate.vfsAppointment.centerName} ({candidate.vfsAppointment.address})</div>
                <div><strong>Slot:</strong> {candidate.vfsAppointment.appointmentDate}</div>
                <div><strong>Action:</strong> In-person Biometrics & Original Passport Presentation</div>
              </div>
            </div>

            {/* Calendar & Map Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleDownloadCalendar}
                className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{t('addToCalendar')}</span>
              </button>
              <a
                href={candidate.vfsAppointment.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>{t('viewOnMaps')}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Danish Employer & Sponsor Registry Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-primary dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('employerRegistry')}
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              CVR ACTIVE &middot; SIRI FAST-TRACK VERIFIED
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('cvr')}</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                {candidate.employer.cvr}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('sponsorCode')}</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                {candidate.employer.sponsorCode}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('registeredOffice')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block truncate">
                {candidate.employer.address}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('collectiveTerms')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                {candidate.employer.monthlySalary} / mo (37 hrs)
              </span>
            </div>
          </div>
        </div>

        {/* Official Document Ledger */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-primary dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('documentLedger')}
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {candidate.documents.length} Authorized Records
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidate.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-brand-primary transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-brand-primary dark:text-emerald-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    {doc.isCandidateUpload ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {t('candidateUploadBadge')}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {t('verifiedBadge')}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-2">
                    {doc.title}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    {doc.docId} &middot; {doc.date}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                  <button
                    onClick={() => setActiveDocForPreview(doc)}
                    className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-primary transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('preview')}</span>
                  </button>
                  <button
                    onClick={() => handleQuickDownloadDoc(doc)}
                    className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-brand-primary hover:bg-brand-secondary text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <DocumentUploadCard />

        {/* Pre-departure Checklist */}
        <ChecklistCard />
      </main>

      {/* Signature Pad Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
      />

      {/* Document Preview Modal */}
      <DocPreviewModal
        doc={activeDocForPreview}
        candidate={candidate}
        isOpen={!!activeDocForPreview}
        onClose={() => setActiveDocForPreview(null)}
        onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
      />
    </div>
  );
}
