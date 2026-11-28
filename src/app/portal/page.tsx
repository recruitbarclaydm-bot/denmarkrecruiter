'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Header } from '@/components/shared/Header';
import { Stepper } from '@/components/portal/Stepper';
import { LiveBriefingCard } from '@/components/portal/LiveBriefingCard';
import { DocumentUploadCard } from '@/components/portal/DocumentUploadCard';
import { ChecklistCard } from '@/components/portal/ChecklistCard';
import { MandatoryOnboardingWizard, calculateCandidateReadiness, shouldOpenCandidateOnboarding } from '@/components/portal/MandatoryOnboardingWizard';
import { CandidateProcessPanel } from '@/components/portal/CandidateProcessPanel';
import { SignatureModal } from '@/components/portal/SignatureModal';
import { DocumentSigningModal } from '@/components/portal/DocumentSigningModal';
import { SeasonalAgriPortal } from '@/components/portal/SeasonalAgriPortal';
import { DocPreviewModal } from '@/components/shared/DocPreviewModal';
import { PrivateDossierSummary } from '@/components/shared/PrivateDossierSummary';
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
  Upload,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

export default function CandidatePortalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { candidates, reuploadDocument, uploadCoreDocument, submitServiceFeeReceipt } = usePortalStore();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [maskPassport, setMaskPassport] = useState(true);
  const [activeDocForPreview, setActiveDocForPreview] = useState<DocumentRecord | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [docForSigning, setDocForSigning] = useState<DocumentRecord | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [onboardingCandidateId, setOnboardingCandidateId] = useState('');

  // Re-upload state
  const [targetReuploadDocId, setTargetReuploadDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Resolve current candidate dynamically from store
  const candidate = user?.candidateId
    ? candidates.find((c) => c.id === user.candidateId)
    : user
    ? candidates.find((c) => c.email.toLowerCase() === user.email.toLowerCase())
    : null;

  useEffect(() => {
    if (candidate && onboardingCandidateId !== candidate.id) {
      setShowOnboarding(shouldOpenCandidateOnboarding(candidate));
      setOnboardingCandidateId(candidate.id);
    }
  }, [candidate, onboardingCandidateId]);

  // Authentication & Approval Guards
  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    if (user.role === 'admin') {
      router.push('/admin');
      return;
    }
    if (candidate && candidate.accountStatus !== 'approved') {
      router.push('/pending-approval');
    }
  }, [user, candidate, router]);

  if (!candidate || showOnboarding === null) return null;

  // Dedicated dynamic view for Denmark Seasonal Agricultural Scheme (Nokha Nath Adhikari)
  if (
    candidate.id === 'nokha-adhikari' ||
    candidate.schemeType === 'seasonal_agriculture' ||
    candidate.email.toLowerCase() === 'madanadhikari65@gmail.com'
  ) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col transition-colors">
        <Header />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
          <CandidateProcessPanel candidate={candidate} />
          <PrivateDossierSummary candidate={candidate} />
          {showOnboarding ? (
            <MandatoryOnboardingWizard candidate={candidate} onViewTracker={() => setShowOnboarding(false)} />
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-xs font-bold"><span>Dossier &amp; Biometric Readiness</span><span>{calculateCandidateReadiness(candidate)}%</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full bg-emerald-600" style={{ width: `${calculateCandidateReadiness(candidate)}%` }} /></div>
                </div>
                <button onClick={() => setShowOnboarding(true)} className="rounded-md border border-slate-300 px-3.5 py-2 text-xs font-bold dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0">
                  <span>✏️ Edit KYC &amp; Documents</span>
                </button>
              </div>
              <SeasonalAgriPortal candidate={candidate} onOpenOnboarding={() => setShowOnboarding(true)} />
            </>
          )}
        </main>
      </div>
    );
  }

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

  const triggerReupload = (docId: string) => {
    setTargetReuploadDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileReuploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetReuploadDocId) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be under 10MB.', 'error');
      return;
    }

    const targetDoc = candidate.documents.find((d) => d.id === targetReuploadDocId);
    const docName = targetDoc?.title || targetDoc?.name || 'Document';
    try {
      if (targetDoc?.category === 'subscription_receipt') {
        await submitServiceFeeReceipt(candidate.id, file, {
          amount: '€45.00',
          method: 'Bank Transfer / Remittance',
          transactionId: `TX-${Date.now().toString().slice(-6)}`,
          paymentDate: new Date().toISOString().slice(0, 10),
          remarks: 'Service fee receipt upload',
        });
      } else {
        await uploadCoreDocument(candidate.id, docName, targetDoc?.category || 'General', file, targetReuploadDocId);
      }
      showToast(`Uploaded new file for "${docName}". Caseworker notified.`, 'success');
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        reuploadDocument(candidate.id, targetReuploadDocId, dataUrl, file.name, file.type);
        showToast(`Uploaded new file for "${docName}". Caseworker notified.`, 'success');
      };
      reader.readAsDataURL(file);
    } finally {
      setTargetReuploadDocId(null);
      e.target.value = '';
    }
  };

  // Documents requiring candidate signature
  const docsRequiringSignature = candidate.documents.filter(
    (d) => d.requiresSignature && d.status !== 'verified'
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col transition-colors">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <CandidateProcessPanel candidate={candidate} />
        <PrivateDossierSummary candidate={candidate} />
        {showOnboarding ? (
          <MandatoryOnboardingWizard candidate={candidate} onViewTracker={() => setShowOnboarding(false)} />
        ) : (
          <>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="min-w-0 flex-1">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-200"><span>Dossier &amp; Biometric Readiness</span><span>{calculateCandidateReadiness(candidate)}%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full bg-emerald-600 transition-all" style={{ width: `${calculateCandidateReadiness(candidate)}%` }} /></div>
          </div>
          <button onClick={() => setShowOnboarding(true)} className="rounded-md border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0">
            <span>✏️ Edit KYC &amp; Documents</span>
          </button>
        </div>
        {/* Stepper */}
        <Stepper candidate={candidate} />

        {/* KYC Verification Alert Banner (if not yet verified) */}
        {candidate.kycStatus !== 'verified' && (
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
              candidate.kycStatus === 'rejected'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg flex-shrink-0 ${
                  candidate.kycStatus === 'rejected'
                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                    : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                }`}
              >
                {candidate.kycStatus === 'rejected' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3
                  className={`text-xs font-bold uppercase tracking-wider ${
                    candidate.kycStatus === 'rejected'
                      ? 'text-red-900 dark:text-red-200'
                      : 'text-amber-900 dark:text-amber-200'
                  }`}
                >
                  {candidate.kycStatus === 'rejected'
                    ? 'Action Required: Identity KYC Review Feedback'
                    : 'Statutory Identity KYC Clearance In Review'}
                </h3>
                <p
                  className={`text-xs mt-0.5 ${
                    candidate.kycStatus === 'rejected'
                      ? 'text-red-800 dark:text-red-300'
                      : 'text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {candidate.kycNote
                    ? `Caseworker Note: ${candidate.kycNote}`
                    : 'Please review and confirm your biometric and passport details to ensure fast-track visa issuance.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowOnboarding(true)}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-brand-primary hover:bg-brand-secondary text-white shadow-sm flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Update / Complete KYC Form</span>
            </button>
          </div>
        )}

        {/* Documents Requiring Signature Banner / Section */}
        {docsRequiringSignature.length > 0 && (
          <div className="p-5 rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200">
                  Documents Awaiting Your Digital Signature ({docsRequiringSignature.length})
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                Action Required
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {docsRequiringSignature.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {doc.title}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {doc.docId} &middot; Issued by SIRI Caseworker Desk
                    </div>
                  </div>

                  <button
                    onClick={() => setDocForSigning(doc)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-primary hover:bg-brand-secondary text-white shadow-sm flex items-center gap-1 flex-shrink-0"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{doc.status === 'signed_pending_review' ? 'Re-sign' : 'Review & Sign'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Meeting Countdown Banner */}
        <LiveBriefingCard />

        {/* Candidate Profile Summary Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-950 text-brand-primary dark:text-emerald-400 font-extrabold text-xl flex items-center justify-center border border-emerald-300 dark:border-emerald-800 flex-shrink-0">
                {candidate.avatarUrl
                  ? <img src={candidate.avatarUrl} alt={`${candidate.name} profile`} className="h-full w-full object-cover" />
                  : candidate.name.split(' ').map((n) => n[0]).join('')}
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

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowOnboarding(true)}
                className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
              >
                <span>✏️ Edit KYC &amp; Documents</span>
              </button>

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
                <div><strong>Action:</strong> In-person Biometrics &amp; Original Passport Presentation</div>
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
            {candidate.documents.map((doc) => {
              const isRejected = doc.status === 'rejected';
              const isActionRequired = doc.status === 'action_required';

              return (
                <div
                  key={doc.id}
                  className={`flex flex-col justify-between p-4 rounded-xl border transition-all shadow-sm ${
                    isRejected
                      ? 'border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-brand-primary'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-brand-primary dark:text-emerald-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {isRejected ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                            Re-upload Required
                          </span>
                        ) : isActionRequired ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Action Required
                          </span>
                        ) : doc.status === 'signed_pending_review' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            Signed (Review)
                          </span>
                        ) : doc.status === 'verified' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            Pending Review
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-2">
                      {doc.title}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      {doc.docId} &middot; {doc.date}
                    </div>

                    {/* Rejection Note Callout */}
                    {isRejected && doc.rejectionReason && (
                      <div className="mt-2 p-2 rounded bg-red-100/70 dark:bg-red-950/50 text-[11px] font-semibold text-red-900 dark:text-red-200 border border-red-200 dark:border-red-800">
                        <strong>Caseworker Note:</strong> {doc.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                    {isRejected ? (
                      <button
                        onClick={() => triggerReupload(doc.id)}
                        className="w-full py-1.5 px-3 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>🔄 Re-upload Corrected File</span>
                      </button>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
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
                        <button
                          onClick={() => triggerReupload(doc.id)}
                          className="w-full py-1.5 px-3 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>🔄 Replace File</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <DocumentUploadCard />

        {/* Pre-departure Checklist */}
        <ChecklistCard />
          </>
        )}
      </main>

      {/* Hidden file input for document re-upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileReuploadChange}
      />

      {/* Signature Pad Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
      />

      {/* Two-Way Document Signing Modal */}
      <DocumentSigningModal
        isOpen={!!docForSigning}
        onClose={() => setDocForSigning(null)}
        candidate={candidate}
        document={docForSigning}
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
