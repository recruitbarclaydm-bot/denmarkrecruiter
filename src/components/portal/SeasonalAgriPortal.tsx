'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CandidateRecord, DocumentRecord } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useToast } from '@/context/ToastContext';
import { DocPreviewModal } from '@/components/shared/DocPreviewModal';
import { DocumentSigningModal } from '@/components/portal/DocumentSigningModal';
import { generateDocumentPdf } from '@/lib/pdfGenerator';
import {
  Copy,
  Eye,
  EyeOff,
  Video,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Mail,
  X,
  Camera,
  Upload,
  AlertTriangle,
  PenTool,
  ShieldCheck,
} from 'lucide-react';

interface SeasonalAgriPortalProps {
  candidate: CandidateRecord;
  onOpenOnboarding: () => void;
}

export const SeasonalAgriPortal: React.FC<SeasonalAgriPortalProps> = ({ candidate, onOpenOnboarding }) => {
  const { logout } = useAuth();
  const { reuploadDocument, uploadCandidateAvatar, uploadCoreDocument, submitServiceFeeReceipt } = usePortalStore();
  const { showToast } = useToast();

  const [maskPassport, setMaskPassport] = useState(true);
  const [todayDate, setTodayDate] = useState('');
  const [activeDocForPreview, setActiveDocForPreview] = useState<DocumentRecord | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [docForSigning, setDocForSigning] = useState<DocumentRecord | null>(null);

  // Re-upload state
  const [targetReuploadDocId, setTargetReuploadDocId] = useState<string | null>(null);
  const reuploadInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Dynamic today date
    const today = new Date();
    const formatted = today.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    setTodayDate(formatted);

  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`, 'success');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB.', 'error');
      return;
    }

    try {
      await uploadCandidateAvatar(candidate.id, file);
      showToast('Profile photo updated successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to upload profile photo.', 'error');
    }
  };

  const handleDownloadDoc = async (doc: DocumentRecord) => {
    showToast(`Generating official PDF for ${doc.title}...`, 'info');
    try {
      await generateDocumentPdf(doc, candidate);
      showToast(`Downloaded: ${doc.title}.pdf`, 'success');
    } catch (err) {
      showToast('Error generating PDF.', 'error');
    }
  };

  const triggerReupload = (docId: string) => {
    setTargetReuploadDocId(docId);
    reuploadInputRef.current?.click();
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
        showToast(`Uploaded revised file for review.`, 'success');
      };
      reader.readAsDataURL(file);
    } finally {
      setTargetReuploadDocId(null);
      e.target.value = '';
    }
  };

  const getDocEmoji = (index: number): string => {
    const emojis = ['🛂', '🪪', '📄', '🛡️', '📜', '🏅', '📦', '✍️'];
    return emojis[index % emojis.length];
  };

  // Documents requiring candidate signature
  const docsRequiringSignature = candidate.documents.filter(
    (d) => d.requiresSignature && d.status !== 'verified'
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="rounded-2xl overflow-hidden shadow-lg border border-emerald-800/40 bg-gradient-to-r from-[#0a2540] via-[#0b5e4a] to-[#12876a] text-white p-6 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇩🇰</span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Denbar &amp; Denmark Dashboard
              </h1>
            </div>
            <div className="inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
              CANDIDATE PORTAL &middot; LIVE STATUS
            </div>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-2">
              Welcome back, <strong className="text-white">{candidate.name}</strong>
            </p>
          </div>

          <button
            onClick={logout}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/30 transition-all self-end sm:self-auto"
          >
            Logout
          </button>
        </div>
      </div>

      {/* KYC Clearance Alert Banner (if not yet verified) */}
      {candidate.kycStatus !== 'verified' && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
            candidate.kycStatus === 'rejected'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl flex-shrink-0 ${
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
            onClick={onOpenOnboarding}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-[#0b5e4a] hover:bg-[#074737] text-white shadow-sm flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Update / Complete KYC Form</span>
          </button>
        </div>
      )}

      {/* Documents Requiring Signature Banner / Section */}
      {docsRequiringSignature.length > 0 && (
        <div className="p-5 rounded-2xl border border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200">
                Official Documents Awaiting Your Digital Signature ({docsRequiringSignature.length})
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {docsRequiringSignature.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm"
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
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#0b5e4a] hover:bg-[#074737] text-white shadow-sm flex items-center gap-1 flex-shrink-0"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{doc.status === 'signed_pending_review' ? 'Re-sign' : 'Review & Sign'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Body Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-8 transition-colors">
        {/* Profile Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          {/* Avatar with Upload */}
          <div className="relative group flex-shrink-0">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#12876a] bg-slate-200 dark:bg-slate-700 flex items-center justify-center cursor-pointer shadow-md relative"
              title="Click to upload profile photo"
            >
              {candidate.avatarUrl ? (
                <img
                  src={candidate.avatarUrl}
                  alt={candidate.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-extrabold text-[#1e4a76] dark:text-emerald-400">
                  NA
                </span>
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-x-0 bottom-0 bg-[#12876a]/85 text-white text-[10px] font-bold text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <Camera className="w-3 h-3" />
                <span>Upload</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Profile Information */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b5e4a] dark:text-emerald-400">
                  {candidate.name}
                </h2>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {candidate.jobTitle}
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700 self-center sm:self-auto">
                <Clock className="w-3.5 h-3.5" />
                <span>⏳ {candidate.statusBadgeText || 'Verification & VFS Pending'}</span>
              </span>
            </div>

            {/* Metadata Badges & Details */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
              <span className="flex items-center gap-1.5">
                <strong className="text-slate-900 dark:text-slate-100">Passport:</strong>
                <span className="font-mono font-bold">
                  {maskPassport ? `••••${candidate.passportNumber.slice(-4)}` : candidate.passportNumber}
                </span>
                <button
                  type="button"
                  onClick={() => setMaskPassport(!maskPassport)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title={maskPassport ? 'Show Passport' : 'Mask Passport'}
                >
                  {maskPassport ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(candidate.passportNumber, 'Passport Number')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Copy Passport"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </span>
              <span>
                <strong className="text-slate-900 dark:text-slate-100">DOB:</strong> {candidate.dob}
              </span>
              <span>
                <strong className="text-slate-900 dark:text-slate-100">Phone:</strong> {candidate.phone}
              </span>
              <span>
                <strong className="text-slate-900 dark:text-slate-100">Email:</strong> {candidate.email}
              </span>
            </div>

            {/* Sponsor Code Pill & Quick Edit */}
            <div className="pt-1 flex items-center gap-2 flex-wrap">
              <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Sponsor Code: {candidate.employer.sponsorCode}
              </span>
              <button
                type="button"
                onClick={onOpenOnboarding}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#12876a] hover:bg-[#0b5e4a] text-white transition-colors flex items-center gap-1 shadow-sm"
              >
                <span>✏️ Edit KYC &amp; Documents</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard 2-Widget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Widget 1: Denbar Account */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                <span>🏦</span>
                <span>Denbar Account</span>
              </div>
              <div className="text-3xl font-extrabold text-[#0b5e4a] dark:text-emerald-400">
                {candidate.denbarAccount?.amount || '€900.00'}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-1">
                <div>
                  <strong>Status:</strong> {candidate.denbarAccount?.status || 'Funds Awaiting Approval'}
                </div>
                <div>
                  <strong>VFS Fee:</strong> {candidate.denbarAccount?.vfsFee || 'Fully Sponsored'}
                </div>
                <div>
                  <strong>Linked To:</strong> {candidate.denbarAccount?.linkedTo || 'Pending Setup'}
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: Action Required */}
          <div className="p-5 rounded-2xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/20 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Action Required</span>
              </div>
              <div className="text-3xl font-extrabold text-amber-700 dark:text-amber-300">
                Today
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 mt-2 space-y-1">
                <div>
                  <strong>Facial Scheduled:</strong> {todayDate || 'Today'} at {candidate.actionRequired?.facialTime || '10:00 AM'}
                </div>
                <div>
                  <strong>Subscription:</strong> {candidate.actionRequired?.subscription || '€45 Pending'}
                </div>
                <div>
                  <strong>Task:</strong> {candidate.actionRequired?.task || 'Portal Verification'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Application Details */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-[#0b5e4a] dark:text-emerald-400 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <span>📋</span>
            <span>Application Details</span>
          </h3>

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
            <table className="w-full text-left">
              <tbody>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-semibold text-[#1e4a76] dark:text-emerald-400 w-1/3">
                    Full Name
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {candidate.name}
                  </td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <td className="py-2.5 px-4 font-semibold text-[#1e4a76] dark:text-emerald-400">
                    Passport Number
                  </td>
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                    {candidate.passportNumber}
                  </td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-semibold text-[#1e4a76] dark:text-emerald-400">
                    Date of Birth
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {candidate.dob}
                  </td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <td className="py-2.5 px-4 font-semibold text-[#1e4a76] dark:text-emerald-400">
                    Nationality
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {candidate.nationality}
                  </td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-semibold text-[#1e4a76] dark:text-emerald-400">
                    Address
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {candidate.permanentAddress}
                  </td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <td className="py-2.5 px-4 font-semibold text-[#1e4a76] dark:text-emerald-400">
                    Phone
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {candidate.phone}
                  </td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-semibold text-[#1e4a76] dark:text-emerald-400">
                    Job Applied For
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                    Agriculturist
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-[#1e4a76] dark:text-emerald-400">
                    Contract Duration
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {candidate.contractDuration || 'January 2027 – June 2028'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section: Your Documents */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-[#0b5e4a] dark:text-emerald-400 flex items-center gap-2">
              <span>📄</span>
              <span>Your Documents</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {candidate.documents.length} Authorized Records
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {candidate.documents.map((doc, idx) => {
              const isRejected = doc.status === 'rejected';

              return (
                <div
                  key={doc.id}
                  className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all gap-2.5 ${
                    isRejected
                      ? 'border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-[#12876a]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl flex-shrink-0">{getDocEmoji(idx)}</span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                          {doc.title}
                        </div>
                        <div className="text-[11px] font-semibold">
                          {isRejected ? (
                            <span className="text-red-600 dark:text-red-400 font-bold">
                              ⚠️ Re-upload Required
                            </span>
                          ) : doc.status === 'signed_pending_review' ? (
                            <span className="text-purple-600 dark:text-purple-400 font-bold">
                              ✍️ Signed (Pending Review)
                            </span>
                          ) : doc.status === 'verified' ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              ✅ Available &amp; Verified
                            </span>
                          ) : (
                            <span className="text-blue-600 dark:text-blue-400">
                              ⏳ Pending Caseworker Review
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Note if rejected */}
                  {isRejected && doc.rejectionReason && (
                    <div className="p-2 rounded bg-red-100/70 dark:bg-red-950/50 text-[11px] text-red-900 dark:text-red-200">
                      <strong>Caseworker Note:</strong> {doc.rejectionReason}
                    </div>
                  )}

                  {/* Document Card Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    {isRejected ? (
                      <button
                        type="button"
                        onClick={() => triggerReupload(doc.id)}
                        className="w-full py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>🔄 Re-upload Corrected File</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => triggerReupload(doc.id)}
                          className="px-2 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1"
                          title="Replace Document"
                        >
                          <Upload className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Replace</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveDocForPreview(doc)}
                          className="p-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#12876a] hover:border-[#12876a] transition-colors"
                          title="Preview Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(doc)}
                          className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#12876a] hover:bg-[#0b5e4a] text-white transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Process Timeline (6 stages) */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#0b5e4a] dark:text-emerald-400 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <span>🕐</span>
            <span>Process Timeline</span>
          </h3>

          <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            {candidate.stages.map((st) => {
              const isDone = st.status === 'completed';
              const isActive = st.status === 'active';
              return (
                <div key={st.number} className="relative group">
                  {/* Bullet */}
                  <div
                    className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                      isDone
                        ? 'bg-[#12876a] border-emerald-200'
                        : isActive
                        ? 'bg-amber-500 border-amber-200 animate-pulse'
                        : 'bg-slate-300 dark:bg-slate-600 border-slate-100 dark:border-slate-800'
                    }`}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {st.title}
                    </div>
                    <div
                      className={`text-xs font-semibold ${
                        isDone
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isActive
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {isDone ? '✅ Completed' : isActive ? '⏳ Pending' : st.number === 5 ? '⏳ Action Required' : '⏳ Next Step'}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {st.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Quick Actions */}
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-bold text-[#0b5e4a] dark:text-emerald-400 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <span>🔗</span>
            <span>Quick Actions</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="py-3 px-4 rounded-full font-bold text-xs sm:text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <CreditCard className="w-4 h-4" />
              <span>💳 Subscribe €45</span>
            </button>

            <a
              href={
                candidate.quickActions?.zoomUrl ||
                'https://us05web.zoom.us/j/87248052434?pwd=BLjLLbOBFdg93bEHEkRTkIuZzc6QXY.1'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-full font-bold text-xs sm:text-sm bg-[#2D8CFF] hover:bg-[#2075db] text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Video className="w-4 h-4" />
              <span>🎥 Join Facial</span>
            </a>
          </div>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
            Need help? Contact us at{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {candidate.quickActions?.supportEmail || 'verification@denmarkscheme.com'}
            </strong>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-400 dark:text-slate-600 py-3">
        Denbar &amp; Denmark Seasonal Scheme &middot; Candidate Portal &middot; {candidate.name} (Sponsor: {candidate.employer.sponsorCode})
      </footer>

      {/* Hidden file input for document re-upload */}
      <input
        ref={reuploadInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileReuploadChange}
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
      />

      {/* Subscription Info Modal */}
      {isSubscriptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <CreditCard className="w-5 h-5" />
                <span>Portal Subscription &middot; €45.00</span>
              </div>
              <button
                onClick={() => setIsSubscriptionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>
                The <strong>€45 subscription fee</strong> is required to complete final portal KYC and cryptographic file synchronization prior to your scheduled 10:00 AM facial session.
              </p>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                <strong>Important:</strong> Your VFS fee of <strong>€900.00</strong> is fully sponsored by Sponsor #{candidate.employer.sponsorCode} and will be released directly following facial completion.
              </div>
              <p>
                To settle this fee, please follow the payment instructions provided via SMS or contact your assigned case coordinator directly at:
                <br />
                <span className="font-mono text-emerald-700 dark:text-emerald-400">
                  verification@denmarkscheme.com
                </span>
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSubscriptionModalOpen(false);
                  showToast('Verification instructions acknowledged.', 'info');
                }}
                className="w-full py-2.5 rounded-lg bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs shadow-sm transition-colors"
              >
                Acknowledge &amp; Prepare for Facial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
