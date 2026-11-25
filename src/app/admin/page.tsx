'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Header } from '@/components/shared/Header';
import { DocPreviewModal } from '@/components/shared/DocPreviewModal';
import { DispatchDocModal } from '@/components/admin/DispatchDocModal';
import { ManualRegisterModal } from '@/components/admin/ManualRegisterModal';
import { AdminCaseTools } from '@/components/admin/AdminCaseTools';
import { OfficialContractGeneratorModal } from '@/components/admin/OfficialContractGeneratorModal';
import { LightboxSplitInspectorModal, REJECTION_PRESET_CHIPS } from '@/components/admin/LightboxSplitInspectorModal';
import { PrivateDossierSummary } from '@/components/shared/PrivateDossierSummary';
import { generateDocumentPdf } from '@/lib/pdfGenerator';
import { seedDipakAndNokha } from '@/lib/cloudSeeder';
import { INITIAL_CANDIDATES } from '@/data/mockUsers';
import { DocumentRecord, StageNumber, DocumentStatus, AccountStatus, KycStatus } from '@/types';
import JSZip from 'jszip';
import { supabase, getSignedDocumentUrl } from '@/lib/supabase';
import {
  Search,
  Filter,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  Eye,
  Building2,
  Calendar,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Send,
  UserPlus,
  MessageCircle,
  Check,
  X,
  RefreshCw,
  PenTool,
  Lock,
  Unlock,
  AlertCircle,
  Activity,
  DownloadCloud,
  Maximize2,
  Copy,
  Printer,
  ExternalLink,
  DollarSign,
  Video,
  Trash2,
  Key,
  Archive,
  ShieldAlert,
  PauseCircle,
  PlayCircle,
  Package,
  X as CloseIcon,
} from 'lucide-react';

type FunnelKey = 'all' | 'pending' | 'documents' | 'fees' | 'stage4' | 'stage56';
type AdminTab = 'overview' | 'documents' | 'financial' | 'interviews' | 'audit';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthInitialized } = useAuth();
  const {
    candidates,
    isInitialized,
    selectedCandidateId,
    selectCandidate,
    deleteCandidatePermanently,
    approveAccount,
    rejectAccount,
    verifyDocument,
    rejectDocument,
    approveKyc,
    rejectKyc,
    setCandidateStage,
    refreshStore,
    adminCrmMetadata,
  } = usePortalStore();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Selected candidate from store
  const activeCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0] || INITIAL_CANDIDATES[0];

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'pending' | 'action_required' | 'approved'>('all');
  const [activeFunnel, setActiveFunnel] = useState<FunnelKey>('all');
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [activeDocForFullPreview, setActiveDocForFullPreview] = useState<DocumentRecord | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Inspector Viewer State
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  // Modal States
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isContractGeneratorOpen, setIsContractGeneratorOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSeedFormOpen, setIsSeedFormOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [dipakSeedPassword, setDipakSeedPassword] = useState('');
  const [nokhaSeedPassword, setNokhaSeedPassword] = useState('');
  const [isRejectDocModalOpen, setIsRejectDocModalOpen] = useState(false);
  const [rejectDocReason, setRejectDocReason] = useState('Blurry or illegible scan');
  const [customRejectDocReason, setCustomRejectDocReason] = useState('');

  // Account Approval Form States
  const [sponsorCodeInput, setSponsorCodeInput] = useState('');
  const [caseOrderIdInput, setCaseOrderIdInput] = useState('');
  const [isRejectAccountModalOpen, setIsRejectAccountModalOpen] = useState(false);
  const [accountRejectionReason, setAccountRejectionReason] = useState('Incomplete passport documentation or unverifiable details.');

  // KYC Reject Form
  const [isRejectKycModalOpen, setIsRejectKycModalOpen] = useState(false);
  const [kycRejectionNote, setKycRejectionNote] = useState('Passport photo page is partially obscured. Please provide a clear color scan.');

  // Account Hold & Danger Zone States
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdReason, setHoldReason] = useState('Account temporarily placed on administrative hold pending caseworker review.');
  const [isPermanentDeleteModalOpen, setIsPermanentDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);

  // Admin Guard
  useEffect(() => {
    if (isAuthInitialized && (!user || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, isAuthInitialized, router]);

  // Sync inputs on candidate switch
  useEffect(() => {
    if (activeCandidate) {
      setSponsorCodeInput(activeCandidate.employer?.sponsorCode || '#944135');
      setCaseOrderIdInput(activeCandidate.siriCaseOrder?.caseOrderId || `SB6-${Math.floor(100000 + Math.random() * 900000)}-2026`);
      if (activeCandidate.documents.length > 0) {
        setSelectedDocId(activeCandidate.documents[0].id);
      }
      setZoomLevel(100);
      setRotationAngle(0);
    }
  }, [selectedCandidateId, activeCandidate?.id]);

  const needsSeed = ['dk3430143@gmail.com', 'madanadhikari65@gmail.com'].some(
    (email) => !candidates.some((candidate) => candidate.email.toLowerCase() === email)
  );

  if (!isAuthInitialized || !isInitialized || !user || user.role !== 'admin') return null;

  // Active Document for Center Pane
  const activeDoc = activeCandidate.documents.find((d) => d.id === selectedDocId) || activeCandidate.documents[0];
  const extendedKyc = activeCandidate.extendedKyc || {};

  // Candidates filtering
  const filteredCandidates = candidates.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.passportNumber.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.siriCaseOrder?.caseOrderId || '').toLowerCase().includes(q) ||
      (c.employer?.sponsorCode || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeFunnel === 'pending' && !(c.accountStatus === 'pending_approval' || c.kycStatus === 'submitted' || c.kycStatus === 'pending')) return false;
    if (activeFunnel === 'documents' && !c.documents.some((document) => document.status === 'pending' || document.status === 'signed_pending_review')) return false;
    if (activeFunnel === 'fees' && !`${c.actionRequired?.subscription || c.denbarAccount?.status || ''}`.toLowerCase().match(/pending|submitted|review|rejected/)) return false;
    if (activeFunnel === 'stage4' && c.currentStage !== 4) return false;
    if (activeFunnel === 'stage56' && c.currentStage < 5) return false;

    if (activeFilterTab === 'pending') {
      return c.accountStatus === 'pending_approval';
    }
    if (activeFilterTab === 'action_required') {
      const hasPendingDoc = c.documents.some((d) => d.status === 'pending' || d.status === 'signed_pending_review');
      return c.kycStatus === 'submitted' || c.kycStatus === 'rejected' || hasPendingDoc;
    }
    if (activeFilterTab === 'approved') {
      return c.accountStatus === 'approved';
    }
    return true;
  });

  // Action Handlers
  const handleApproveAccount = () => {
    approveAccount(activeCandidate.id, sponsorCodeInput.trim(), caseOrderIdInput.trim(), user.name);
    showToast(`Account approved and portal unlocked for ${activeCandidate.name}.`, 'success');
  };

  const handleRejectAccountSubmit = () => {
    if (!accountRejectionReason.trim()) {
      showToast('Please provide a reason for registration rejection.', 'error');
      return;
    }
    rejectAccount(activeCandidate.id, accountRejectionReason.trim(), user.name);
    setIsRejectAccountModalOpen(false);
    showToast(`Account rejected for ${activeCandidate.name}.`, 'info');
  };

  const handleVerifyDocument = () => {
    if (!activeDoc) return;
    verifyDocument(activeCandidate.id, activeDoc.id, user.name);
    showToast(`Document "${activeDoc.title}" marked as Verified.`, 'success');
  };

  const handleRejectDocumentSubmit = () => {
    if (!activeDoc) return;
    const reason = rejectDocReason === 'custom' ? customRejectDocReason : rejectDocReason;
    if (!reason.trim()) {
      showToast('Please provide a rejection reason.', 'error');
      return;
    }
    rejectDocument(activeCandidate.id, activeDoc.id, reason, user.name);
    setIsRejectDocModalOpen(false);
    showToast(`Document "${activeDoc.title}" rejected and flagged for re-upload.`, 'warning');
  };

  const handleApproveKyc = () => {
    approveKyc(activeCandidate.id, user.name);
    showToast(`KYC clearance verified for ${activeCandidate.name}.`, 'success');
  };

  const handleRejectKycSubmit = () => {
    if (!kycRejectionNote.trim()) {
      showToast('Please provide a KYC note.', 'error');
      return;
    }
    rejectKyc(activeCandidate.id, kycRejectionNote.trim(), user.name);
    setIsRejectKycModalOpen(false);
    showToast(`KYC clearance flagged for correction.`, 'warning');
  };

  const handleStageAdvance = () => {
    const nextStage = (activeCandidate.currentStage + 1) as StageNumber;
    if (nextStage > 6) {
      showToast('Candidate is already at final stage 6.', 'info');
      return;
    }
    const res = setCandidateStage(activeCandidate.id, nextStage, user.name);
    if (!res.success) {
      showToast(res.reason || 'Cannot advance stage.', 'error');
    } else {
      showToast(`Advanced ${activeCandidate.name} to Stage ${nextStage}.`, 'success');
    }
  };

  const handleStageRollback = () => {
    const prevStage = (activeCandidate.currentStage - 1) as StageNumber;
    if (prevStage < 1) {
      showToast('Candidate is already at Stage 1.', 'info');
      return;
    }
    const res = setCandidateStage(activeCandidate.id, prevStage, user.name);
    if (!res.success) {
      showToast(res.reason || 'Cannot rollback stage.', 'error');
    } else {
      showToast(`Rolled back ${activeCandidate.name} to Stage ${prevStage}.`, 'info');
    }
  };

  const handleSetStage = (stage: StageNumber) => {
    const res = setCandidateStage(activeCandidate.id, stage, user.name);
    if (!res.success) {
      showToast(res.reason || 'Cannot set stage.', 'error');
    } else {
      showToast(`Updated workflow stage to Stage ${stage}.`, 'success');
    }
  };

  const handleDownloadDoc = async (doc: DocumentRecord) => {
    showToast(`Generating official PDF for ${doc.title}...`, 'info');
    await generateDocumentPdf(doc, activeCandidate);
    showToast(`Downloaded: ${doc.title}.pdf`, 'success');
  };

  const handleSeedCandidates = async () => {
    if (!dipakSeedPassword || !nokhaSeedPassword) {
      showToast('Enter both candidate passwords to seed their cloud accounts.', 'error');
      return;
    }
    setIsSeeding(true);
    try {
      await seedDipakAndNokha({
        'dk3430143@gmail.com': dipakSeedPassword,
        'madanadhikari65@gmail.com': nokhaSeedPassword,
      });
      await refreshStore();
      setIsSeedFormOpen(false);
      setDipakSeedPassword('');
      setNokhaSeedPassword('');
      showToast('Dipak and Nokha are synced to Supabase Cloud.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Cloud seeding failed.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Live Sync from Supabase Cloud
  const handleLiveSync = async () => {
    setIsSyncing(true);
    try {
      await refreshStore();
      showToast('Real-time sync complete: candidates & audit logs refreshed.', 'success');
    } catch {
      showToast('Real-time sync failed. Please check your network connection.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // WhatsApp Welcome & Login Card Copy
  const copyCandidateCard = async (c: typeof activeCandidate) => {
    const summary = `🇩🇰 Danish Immigration & Candidate Portal · Official Onboarding
Candidate: ${c.name}
Portal URL: https://denmarkrecruiter.netlify.app/
Registered Email: ${c.email}
Case Order ID: ${c.siriCaseOrder?.caseOrderId || 'Assigned'}
Sponsor Code: ${c.employer?.sponsorCode || '#944135'}
Visa Scheme: ${c.jobTitle}
Status: Active in SIRI Caseworker Queue
Please log in to complete your KYC declaration and review official documents.`;
    await navigator.clipboard.writeText(summary);
    showToast(`Copied ${c.name}'s Onboarding Card to clipboard!`, 'success');
  };

  // WhatsApp Alert Generator
  const handleSendWhatsAppAlert = () => {
    const cleanPhone = (activeCandidate.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      showToast('No valid phone number found for candidate.', 'error');
      return;
    }
    const stageTitle = activeCandidate.stages[activeCandidate.currentStage - 1]?.title || 'Processing';
    const message = `Hello ${activeCandidate.name}, this is ${user.name} from your private recruitment coordination team regarding your application (${activeCandidate.passportNumber}). Current workflow: Stage ${activeCandidate.currentStage}, ${stageTitle}. Please log in to your candidate portal for updates.`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // 1-Click Full Dossier ZIP Export (Summary + Documents + Signatures)
  const handleDownloadFullDossierZip = async () => {
    setIsExportingZip(true);
    showToast(`Packaging full dossier for ${activeCandidate.name}...`, 'info');
    try {
      const zip = new JSZip();

      // 1. Text Summary File
      const summaryLines = [
        '=========================================================================',
        '       DENMARK RECRUITER & SIRI IMMIGRATION CANDIDATE DOSSIER',
        '=========================================================================',
        `Generated On:           ${new Date().toLocaleString()}`,
        `Caseworker / Actor:     ${user.name}`,
        `Dossier Status:         ${activeCandidate.accountStatus.toUpperCase()} (KYC: ${activeCandidate.kycStatus.toUpperCase()})`,
        `Current Workflow Stage: Stage ${activeCandidate.currentStage} of 6 - ${activeCandidate.stages[activeCandidate.currentStage - 1]?.title || 'Processing'}`,
        '',
        '-------------------------------------------------------------------------',
        '1. CANDIDATE IDENTIFICATION & STATUTORY DETAILS',
        '-------------------------------------------------------------------------',
        `Full Legal Name:        ${activeCandidate.name}`,
        `Passport Number:        ${activeCandidate.passportNumber}`,
        `Passport Expiry:        ${activeCandidate.passportExpiry || 'N/A'}`,
        `Date of Birth:          ${activeCandidate.dob || 'N/A'}`,
        `Nationality:            ${activeCandidate.nationality || 'Nepalese'}`,
        `Contact Mobile:         ${activeCandidate.phone || 'N/A'}`,
        `Registered Email:       ${activeCandidate.email}`,
        `Permanent Address:      ${activeCandidate.permanentAddress || 'N/A'}`,
        '',
        '-------------------------------------------------------------------------',
        '2. EXTENDED STATUTORY KYC DATA (NEPAL / SIRI)',
        '-------------------------------------------------------------------------',
        `Father's Name:          ${extendedKyc.father_name || 'N/A'}`,
        `Mother's Name:          ${extendedKyc.mother_name || 'N/A'}`,
        `Gender:                 ${extendedKyc.gender || 'N/A'}`,
        `Marital Status:         ${extendedKyc.marital_status || 'N/A'}`,
        `Citizenship / Nagarikta:${extendedKyc.citizenship_number || 'N/A'}`,
        `National ID (NIN):      ${extendedKyc.national_id_nin || 'N/A'}`,
        `Passport Issue Date:    ${extendedKyc.passport_issue_date || 'N/A'}`,
        `Passport Issue Place:   ${extendedKyc.passport_issue_place || 'N/A'}`,
        `Emergency Contact:      ${extendedKyc.emergency_contact_name || 'N/A'}${extendedKyc.emergency_contact_relation ? ` (${extendedKyc.emergency_contact_relation})` : ''} - Phone: ${extendedKyc.emergency_contact_phone || 'N/A'}`,
        `Education Level:        ${extendedKyc.education_level || 'N/A'}`,
        `Relevant Experience:    ${extendedKyc.work_experience_years ? `${extendedKyc.work_experience_years} years` : 'N/A'}`,
        `Previous Schengen Visa: ${extendedKyc.previous_schengen_visa || 'None'}`,
        `Work Skills Summary:    ${extendedKyc.work_skills_summary || activeCandidate.workExperienceSummary || 'N/A'}`,
        `Caseworker KYC Note:    ${activeCandidate.kycNote || 'None'}`,
        '',
        '-------------------------------------------------------------------------',
        '3. EMPLOYER SPONSORSHIP & CONSULAR CASE',
        '-------------------------------------------------------------------------',
        `Assigned Employer:      ${activeCandidate.employer?.name || 'AgroNord A/S'}`,
        `Sponsor Code:           ${activeCandidate.employer?.sponsorCode || '#944135'}`,
        `Employer CVR:           ${activeCandidate.employer?.cvr || 'DK-39841209'}`,
        `Visa Placement Scheme:  ${activeCandidate.jobTitle}`,
        `Monthly Salary / Hours: ${activeCandidate.employer?.monthlySalary || '28,500 DKK'} / ${activeCandidate.employer?.workingHours || '37 hrs/week'}`,
        `SIRI Case Order ID:     ${activeCandidate.siriCaseOrder?.caseOrderId || 'Assigned'}`,
        `Statutory Fee Status:   ${activeCandidate.siriCaseOrder?.feeStatus?.toUpperCase() || 'PAID'} (${activeCandidate.siriCaseOrder?.statutoryFee || '3,425 DKK'})`,
        `VFS Biometrics Ref:     ${activeCandidate.vfsAppointment?.refNumber || 'N/A'}`,
        `VFS Center Location:    ${activeCandidate.vfsAppointment?.centerName || 'VFS Global Kathmandu'} (${activeCandidate.vfsAppointment?.appointmentDate || 'Confirmed'})`,
        '',
        '-------------------------------------------------------------------------',
        '4. FINANCIALS & DENBAR ACCOUNT',
        '-------------------------------------------------------------------------',
        `Denbar Account Balance: ${activeCandidate.denbarAccount?.amount || '€0.00'}`,
        `Denbar Account Status:  ${activeCandidate.denbarAccount?.status || 'N/A'}`,
        `Subscription Status:    ${activeCandidate.actionRequired?.subscription || 'N/A'}`,
        '',
        '-------------------------------------------------------------------------',
        '5. UPLOADED & DISPATCHED DOSSIER DOCUMENTS',
        '-------------------------------------------------------------------------',
        ...activeCandidate.documents.map((doc, idx) =>
          `[${idx + 1}] ${doc.title} | Category: ${doc.category || 'General'} | Status: ${doc.status.toUpperCase()} | Authority: ${doc.authority} | Doc ID: ${doc.docId} | File: ${doc.filename}`
        ),
        '',
        '-------------------------------------------------------------------------',
        '6. CONSULAR & AGENCY AUDIT TRAIL',
        '-------------------------------------------------------------------------',
        ...activeCandidate.auditLog.map((log) =>
          `[${new Date(log.timestamp).toISOString()}] ${log.action} | Actor: ${log.actor} | Details: ${log.details}`
        ),
        '=========================================================================',
      ];

      zip.file('00_Candidate_Summary.txt', summaryLines.join('\r\n'));

      // 2. Fetch and pack each document file
      for (let i = 0; i < activeCandidate.documents.length; i++) {
        const doc = activeCandidate.documents[i];
        const indexNum = String(i + 1).padStart(2, '0');
        const safeTitle = (doc.title || doc.filename || `document_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');

        let extension = 'pdf';
        if (doc.filename && doc.filename.includes('.')) {
          extension = doc.filename.split('.').pop() || 'pdf';
        }

        const zipFileName = `${indexNum}_${safeTitle}.${extension}`;

        let addedFile = false;
        let targetUrl = doc.fileUrl;
        if (!targetUrl && doc.storagePath) {
          try {
            targetUrl = (await getSignedDocumentUrl(doc.storagePath)) || undefined;
          } catch {
            // pass
          }
        }

        if (targetUrl) {
          try {
            const res = await fetch(targetUrl);
            if (res.ok) {
              const blob = await res.blob();
              zip.file(zipFileName, blob);
              addedFile = true;
            }
          } catch (fetchErr) {
            console.warn(`Could not fetch binary for ${doc.title}:`, fetchErr);
          }
        }

        if (!addedFile && doc.body) {
          zip.file(
            `${indexNum}_${safeTitle}.txt`,
            `Document: ${doc.title}\nAuthority: ${doc.authority}\nDate: ${doc.date}\nStatus: ${doc.status}\n\n${doc.body}`
          );
        }
      }

      // 3. Add biometric signature if available
      if (activeCandidate.signatureDataUrl && activeCandidate.signatureDataUrl.startsWith('data:image/')) {
        try {
          const base64Data = activeCandidate.signatureDataUrl.split(',')[1];
          if (base64Data) {
            zip.file('00_Biometric_Signature.png', base64Data, { base64: true });
          }
        } catch (e) {
          console.warn('Error adding signature image to zip', e);
        }
      }

      // 4. Generate and download zip
      const blob = await zip.generateAsync({ type: 'blob' });
      const zipName = `${activeCandidate.name.replace(/\s+/g, '_')}_${activeCandidate.passportNumber || 'Dossier'}.zip`;
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = zipName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      showToast(`Dossier package "${zipName}" downloaded successfully!`, 'success');
    } catch (error) {
      console.error('Failed to export dossier ZIP:', error);
      showToast('Failed to generate ZIP export. Please try again.', 'error');
    } finally {
      setIsExportingZip(false);
    }
  };

  // Password Reset Email Dispatch
  const handleSendPasswordReset = async () => {
    setIsSendingPasswordReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(activeCandidate.email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      showToast(`Password reset instructions emailed to ${activeCandidate.email}.`, 'success');
    } catch (err) {
      console.error('Password reset email error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to dispatch password reset email.', 'error');
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  // Account Hold & Reactivation
  const handleConfirmAccountHold = () => {
    if (!holdReason.trim()) {
      showToast('Please provide a reason for placing account on hold.', 'error');
      return;
    }
    rejectAccount(activeCandidate.id, holdReason.trim(), user.name);
    setIsHoldModalOpen(false);
    showToast(`Account for ${activeCandidate.name} has been placed on Administrative Hold.`, 'warning');
  };

  const handleReactivateAccount = () => {
    approveAccount(
      activeCandidate.id,
      activeCandidate.employer?.sponsorCode || '#944135',
      activeCandidate.siriCaseOrder?.caseOrderId || `SB6-${Math.floor(100000 + Math.random() * 900000)}-2026`,
      user.name
    );
    showToast(`Account for ${activeCandidate.name} has been reactivated and unlocked.`, 'success');
  };

  // Permanent Candidate Deletion
  const isDeleteConfirmed =
    deleteConfirmText.trim().toUpperCase() === 'DELETE' ||
    (Boolean(activeCandidate.passportNumber) &&
      deleteConfirmText.trim().toUpperCase() === activeCandidate.passportNumber.toUpperCase());

  const handleConfirmPermanentDelete = async () => {
    if (!isDeleteConfirmed) return;
    setIsDeletingPermanently(true);
    try {
      await deleteCandidatePermanently(activeCandidate.id);
      showToast(`Candidate "${activeCandidate.name}" and all storage files were permanently deleted.`, 'success');
      setIsPermanentDeleteModalOpen(false);
      setDeleteConfirmText('');
    } catch (err) {
      console.error('Permanent delete failed:', err);
      showToast(err instanceof Error ? err.message : 'Permanent deletion failed.', 'error');
    } finally {
      setIsDeletingPermanently(false);
    }
  };

  const globalActivity = candidates.flatMap((candidate) => candidate.auditLog.map((log) => ({ candidate, log })))
    .sort((left, right) => new Date(right.log.timestamp).getTime() - new Date(left.log.timestamp).getTime())
    .slice(0, 25);

  const funnelCounts: Record<FunnelKey, number> = {
    all: candidates.length,
    pending: candidates.filter((candidate) => candidate.accountStatus === 'pending_approval' || candidate.kycStatus === 'submitted' || candidate.kycStatus === 'pending').length,
    documents: candidates.filter((candidate) => candidate.documents.some((document) => document.status === 'pending' || document.status === 'signed_pending_review')).length,
    fees: candidates.filter((candidate) => /pending|submitted|review|rejected/i.test(candidate.actionRequired?.subscription || candidate.denbarAccount?.status || '')).length,
    stage4: candidates.filter((candidate) => candidate.currentStage === 4).length,
    stage56: candidates.filter((candidate) => candidate.currentStage >= 5).length,
  };

  const exportQueueCsv = () => {
    const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = [
      ['Name', 'Email', 'Stage', 'Account status', 'KYC status', 'Service fee status', 'Employer', 'Sponsor reference', 'Case reference'],
      ...filteredCandidates.map((candidate) => [
        candidate.name,
        candidate.email,
        candidate.currentStage,
        candidate.accountStatus,
        candidate.kycStatus,
        candidate.actionRequired?.subscription || candidate.denbarAccount?.status || '',
        candidate.employer.name,
        candidate.employer.sponsorCode,
        candidate.siriCaseOrder.caseOrderId,
      ]),
    ];
    const csv = rows.map((row) => row.map(quote).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'private-recruitment-queue.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!candidates.length) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col transition-colors">
        <Header />
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Private Recruitment Coordination Console
              </h1>
              <p className="text-xs text-slate-500 mt-1">No candidate records are currently available in the cloud.</p>
            </div>
            {needsSeed && (
              <button
                onClick={() => setIsSeedFormOpen((open) => !open)}
                className="px-3.5 py-2 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-800 text-white shadow-sm transition-colors"
              >
                ☁️ Seed Dipak &amp; Nokha to Supabase Cloud
              </button>
            )}
          </div>
          {needsSeed && isSeedFormOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 rounded-lg border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900">
              <input
                type="password"
                value={dipakSeedPassword}
                onChange={(event) => setDipakSeedPassword(event.target.value)}
                placeholder="Dipak account password"
                autoComplete="new-password"
                className="px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <input
                type="password"
                value={nokhaSeedPassword}
                onChange={(event) => setNokhaSeedPassword(event.target.value)}
                placeholder="Nokha account password"
                autoComplete="new-password"
                className="px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <button
                onClick={handleSeedCandidates}
                disabled={isSeeding}
                className="sm:col-span-2 px-3 py-2 text-xs font-bold rounded-md bg-sky-700 hover:bg-sky-800 text-white disabled:opacity-50"
              >
                {isSeeding ? 'Syncing profiles and documents...' : 'Create / Sync Cloud Profiles'}
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col transition-colors">
      <Header />

      <main className="flex-1 max-w-[1700px] w-full mx-auto px-3 sm:px-6 py-4 space-y-4">
        {/* Sleek Horizontal Command Toolbar (Linear / Stripe style) */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 sm:px-4 border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sticky top-16 z-20 transition-all">
          {/* Left: Title & Inline Clickable Funnel Filters */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-white/10 shrink-0">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Coordinator Workspace
              </span>
            </div>

            {/* Clickable KPI Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {([
                ['all', 'All', funnelCounts.all],
                ['pending', 'KYC Review', funnelCounts.pending],
                ['documents', 'Docs Pending', funnelCounts.documents],
                ['fees', 'Receipts', funnelCounts.fees],
                ['stage4', 'Stage 4 Zoom', funnelCounts.stage4],
                ['stage56', 'Ready (5/6)', funnelCounts.stage56],
              ] as [FunnelKey, string, number][]).map(([key, label, count]) => {
                const isActive = activeFunnel === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActiveFunnel(key);
                      setActiveFilterTab('all');
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        isActive
                          ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {needsSeed && (
              <button
                onClick={() => setIsSeedFormOpen((open) => !open)}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-800 text-white shadow-sm flex items-center gap-1 transition-colors"
                title="Seed Dipak & Nokha to cloud"
              >
                <span>☁️ Seed Profiles</span>
              </button>
            )}

            <button
              onClick={handleLiveSync}
              disabled={isSyncing}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Force real-time cloud data refresh from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsActivityOpen(true)}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm flex items-center gap-1.5 transition-colors"
              title="Global Activity Feed"
            >
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span>Activity</span>
            </button>

            <button
              type="button"
              onClick={exportQueueCsv}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm flex items-center gap-1.5 transition-colors"
              title="Export Queue as CSV"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ New Candidate</span>
            </button>
          </div>
        </div>

        {/* If seed form open */}
        {needsSeed && isSeedFormOpen && (
          <div className="p-3 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="password"
              value={dipakSeedPassword}
              onChange={(event) => setDipakSeedPassword(event.target.value)}
              placeholder="Dipak account password"
              autoComplete="new-password"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
            <input
              type="password"
              value={nokhaSeedPassword}
              onChange={(event) => setNokhaSeedPassword(event.target.value)}
              placeholder="Nokha account password"
              autoComplete="new-password"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
            <button
              onClick={handleSeedCandidates}
              disabled={isSeeding}
              className="sm:col-span-2 px-3 py-2 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-800 text-white disabled:opacity-50"
            >
              {isSeeding ? 'Syncing profiles and documents...' : 'Create / Sync Cloud Profiles'}
            </button>
          </div>
        )}

        {/* 2-Pane SaaS Workspace (Left Queue 320px | Right Main Workspace flex-1) */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* ======================================================== */}
          {/* PANE 1: Candidate Queue & Navigation (320px fixed)        */}
          {/* ======================================================== */}
          <div className="w-full lg:w-80 shrink-0 space-y-3">
            <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-3.5 shadow-sm border border-slate-200 dark:border-white/[0.08] space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, passport, sponsor..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
                />
              </div>

              {/* Status Filter Tabs (4 tabs) */}
              <div className="grid grid-cols-2 gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => { setActiveFilterTab('all'); setActiveFunnel('all'); }}
                  className={`py-1.5 px-2 rounded-lg text-center transition-colors ${
                    activeFilterTab === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  All ({candidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveFilterTab('pending'); setActiveFunnel('all'); }}
                  className={`py-1.5 px-2 rounded-lg text-center transition-colors ${
                    activeFilterTab === 'pending'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  Pending ({candidates.filter((c) => c.accountStatus === 'pending_approval').length})
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveFilterTab('action_required'); setActiveFunnel('all'); }}
                  className={`py-1.5 px-2 rounded-lg text-center transition-colors ${
                    activeFilterTab === 'action_required'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  Action Req
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveFilterTab('approved'); setActiveFunnel('all'); }}
                  className={`py-1.5 px-2 rounded-lg text-center transition-colors ${
                    activeFilterTab === 'approved'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  Approved ({candidates.filter((c) => c.accountStatus === 'approved').length})
                </button>
              </div>
            </div>

            {/* Candidate Queue Cards List */}
            <div className="space-y-2 max-h-[calc(100vh-210px)] overflow-y-auto pr-1 custom-scrollbar">
              {filteredCandidates.map((c) => {
                const isSelected = c.id === activeCandidate.id;
                const hasPendingSignedDoc = c.documents.some((d) => d.status === 'signed_pending_review');
                const pri = adminCrmMetadata[c.id]?.priority;

                return (
                  <div
                    key={c.id}
                    onClick={() => selectCandidate(c.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/50 ring-1 ring-emerald-500/40 shadow-sm'
                        : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800">
                          {c.avatarUrl ? (
                            <img src={c.avatarUrl} alt={`${c.name} avatar`} className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full items-center justify-center text-[10px] font-bold text-slate-500">
                              {c.name.split(' ').map((part) => part[0]).join('')}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                            {c.passportNumber} &middot; {c.employer?.sponsorCode || c.siriCaseOrder?.caseOrderId}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void copyCandidateCard(c);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Copy WhatsApp card"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          Stg {c.currentStage}
                        </span>
                      </div>
                    </div>

                    {/* Status & Priority Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                      {pri === 'High Priority' && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          🔥 High Priority
                        </span>
                      )}
                      {pri === 'Ready' && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          ✅ Ready
                        </span>
                      )}
                      {pri === 'On Hold' && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          ⚠️ Hold
                        </span>
                      )}

                      {c.accountStatus === 'pending_approval' && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Pending Approval
                        </span>
                      )}
                      {c.accountStatus === 'approved' && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Approved
                        </span>
                      )}

                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          c.kycStatus === 'verified'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : c.kycStatus === 'submitted'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : c.kycStatus === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        KYC: {c.kycStatus.toUpperCase()}
                      </span>

                      {hasPendingSignedDoc && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 animate-pulse">
                          Signed Doc Waiting
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredCandidates.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  No applicants matching filter.
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* PANE 2: Active Candidate Workspace (flex-1)               */}
          {/* ======================================================== */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* 1. Candidate Profile Header Card */}
            <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-white/[0.08] space-y-4">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                {/* Avatar & Candidate Identity */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-slate-100 dark:bg-slate-800 shadow-sm">
                    {activeCandidate.avatarUrl ? (
                      <img
                        src={activeCandidate.avatarUrl}
                        alt={`${activeCandidate.name} avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-sm font-bold text-slate-500">
                        {activeCandidate.name.split(' ').map((p) => p[0]).join('')}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                        {activeCandidate.name}
                      </h2>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                        {activeCandidate.passportNumber}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        {activeCandidate.jobTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span>Employer: <strong className="text-slate-700 dark:text-slate-200">{activeCandidate.employer?.name || 'AgroNord A/S'}</strong></span>
                      <span>&middot;</span>
                      <span>Sponsor: <code className="font-mono text-slate-700 dark:text-slate-200">{activeCandidate.employer?.sponsorCode || '#944135'}</code></span>
                      <span>&middot;</span>
                      <span>Case ID: <code className="font-mono text-slate-700 dark:text-slate-200">{activeCandidate.siriCaseOrder?.caseOrderId}</code></span>
                      <span>&middot;</span>
                      <span>{activeCandidate.email}</span>
                      <span>&middot;</span>
                      <span className="font-mono">{activeCandidate.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsContractGeneratorOpen(true)}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>+ Generate Doc</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDispatchModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-brand-primary hover:bg-brand-secondary text-white shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>+ Dispatch Doc</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Print Candidate Dossier"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSendWhatsAppAlert}
                    className="p-2 text-xs font-semibold rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-sm transition-colors"
                    title="Send WhatsApp Alert"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadFullDossierZip}
                    disabled={isExportingZip}
                    className="p-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    title="Download Full Candidate Dossier as ZIP (Summary + Documents)"
                  >
                    {isExportingZip ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                    ) : (
                      <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <span className="hidden sm:inline font-bold">Download ZIP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void copyCandidateCard(activeCandidate)}
                    className="p-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Copy Welcome Card"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Interactive Stage Controller Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Workflow Stage:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleStageRollback}
                      disabled={activeCandidate.currentStage <= 1}
                      className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Rollback</span>
                    </button>

                    <div className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-2">
                      <span>Stage {activeCandidate.currentStage} of 6:</span>
                      <strong className="text-slate-900 dark:text-slate-100">
                        {activeCandidate.stages[activeCandidate.currentStage - 1]?.title || 'Processing'}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={handleStageAdvance}
                      disabled={activeCandidate.currentStage >= 6}
                      className="px-2 py-1 text-xs font-bold rounded-lg bg-brand-primary hover:bg-brand-secondary text-white disabled:opacity-40 shadow-sm flex items-center gap-1 transition-colors"
                    >
                      <span>Advance</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Override:</span>
                  <select
                    value={activeCandidate.currentStage}
                    onChange={(e) => handleSetStage(parseInt(e.target.value, 10) as StageNumber)}
                    className="text-xs font-semibold py-1 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    {activeCandidate.stages.map((st) => (
                      <option key={st.number} value={st.number}>
                        Stage {st.number}: {st.title} {st.number >= 5 ? '(Gated)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Horizontal SaaS Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.08] overflow-x-auto pb-1">
              {([
                ['overview', 'Overview & KYC', activeCandidate.kycStatus === 'submitted' || activeCandidate.accountStatus === 'pending_approval'],
                ['documents', 'Documents & Vault', activeCandidate.documents.filter((d) => d.status === 'pending' || d.status === 'signed_pending_review').length],
                ['financial', 'Payments & Financial', /pending|submitted|review/i.test(activeCandidate.actionRequired?.subscription || activeCandidate.denbarAccount?.status || '')],
                ['interviews', 'Interviews & Notices', false],
                ['audit', 'Audit Log & Account', false],
              ] as [AdminTab, string, boolean | number][]).map(([tabKey, tabTitle, badge]) => {
                const isCurrent = activeTab === tabKey;
                return (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => setActiveTab(tabKey)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap border ${
                      isCurrent
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-transparent shadow-sm'
                        : 'bg-white/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{tabTitle}</span>
                    {typeof badge === 'number' && badge > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isCurrent
                          ? 'bg-emerald-500 text-white dark:text-slate-950'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {badge}
                      </span>
                    )}
                    {typeof badge === 'boolean' && badge && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 3. Tab Contents */}
            {/* TAB 1: OVERVIEW & KYC */}
            {activeTab === 'overview' && (
              <div className="space-y-4 animate-fade-in">
                {/* Account Approval Action Banner (if pending) */}
                {activeCandidate.accountStatus !== 'approved' && (
                  <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                          <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                            Applicant Awaiting Account Verification &amp; Portal Unlock
                          </h3>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300">
                            {activeCandidate.name} has submitted self-registration. Assign sponsor code &amp; case order to approve.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                          Sponsor Code
                        </label>
                        <input
                          type="text"
                          value={sponsorCodeInput}
                          onChange={(e) => setSponsorCodeInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 font-mono bg-white dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                          SIRI Case Order ID
                        </label>
                        <input
                          type="text"
                          value={caseOrderIdInput}
                          onChange={(e) => setCaseOrderIdInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 font-mono bg-white dark:bg-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsRejectAccountModalOpen(true)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-300 bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                      >
                        Reject Registration
                      </button>
                      <button
                        type="button"
                        onClick={handleApproveAccount}
                        className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Approve Account &amp; Unlock Portal</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* KYC Clearance Status Banner */}
                <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-white/[0.08] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <UserCheck className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                            Identity &amp; Biometric KYC Verification
                          </h3>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                              activeCandidate.kycStatus === 'verified'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : activeCandidate.kycStatus === 'submitted'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : activeCandidate.kycStatus === 'rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {activeCandidate.kycStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Submitted Profile &middot; Active Registration
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleApproveKyc}
                        className="py-1.5 px-3 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve KYC</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsRejectKycModalOpen(true)}
                        className="py-1.5 px-3 text-xs font-bold rounded-lg border border-red-300 bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        Flag / Reject
                      </button>
                    </div>
                  </div>

                  {/* Rejection / Correction Preset Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
                    {['Blurry / Unreadable Scan', 'All 4 Corners Must Be Visible', 'Name / DOB Mismatch', 'Europass CV Format Required', 'Unverifiable Transaction Reference'].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => {
                          setKycRejectionNote(reason);
                          setIsRejectKycModalOpen(true);
                        }}
                        className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 transition-colors"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>

                  {activeCandidate.kycNote && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                      <strong>Caseworker Note:</strong> {activeCandidate.kycNote}
                    </div>
                  )}
                </div>

                {/* Structured Dossier Data Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Personal & Biometric KYC */}
                  <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        Personal &amp; Statutory Identity
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200/60 dark:border-white/5">
                      <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
                        {activeCandidate.avatarUrl ? (
                          <img src={activeCandidate.avatarUrl} alt={`${activeCandidate.name} biometric avatar`} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-slate-500">No photo</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Biometric Avatar</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{activeCandidate.name}</span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{activeCandidate.passportNumber}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Date of Birth</span><span className="text-slate-800 dark:text-slate-200 font-medium">{activeCandidate.dob}</span></div>
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Nationality</span><span className="text-slate-800 dark:text-slate-200 font-medium">{activeCandidate.nationality}</span></div>
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Passport Expiry</span><span className="font-mono text-slate-800 dark:text-slate-200 font-medium">{activeCandidate.passportExpiry || '2033-04-18'}</span></div>
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Contact Mobile</span><span className="font-mono text-slate-800 dark:text-slate-200 font-medium">{activeCandidate.phone}</span></div>
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Father&apos;s Name</span><span className="text-slate-700 dark:text-slate-300">{extendedKyc.father_name || 'N/A'}</span></div>
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Mother&apos;s Name</span><span className="text-slate-700 dark:text-slate-300">{extendedKyc.mother_name || 'N/A'}</span></div>
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Gender</span><span className="text-slate-700 dark:text-slate-300">{extendedKyc.gender || 'N/A'}</span></div>
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Marital Status</span><span className="text-slate-700 dark:text-slate-300">{extendedKyc.marital_status || 'N/A'}</span></div>
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Citizenship / Nagarikta</span><span className="font-mono text-slate-700 dark:text-slate-300">{extendedKyc.citizenship_number || 'N/A'}</span></div>
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">NIN</span><span className="font-mono text-slate-700 dark:text-slate-300">{extendedKyc.national_id_nin || 'N/A'}</span></div>
                      <div className="col-span-2"><span className="text-[9px] text-slate-400 uppercase block font-semibold">Permanent Address</span><span className="text-slate-700 dark:text-slate-300">{activeCandidate.permanentAddress || 'N/A'}</span></div>
                    </div>
                  </div>

                  {/* Card 2: Employment & Sponsorship */}
                  <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        Sponsorship &amp; Consular Case
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Assigned Employer</span><span className="font-bold text-slate-800 dark:text-slate-200">{activeCandidate.employer?.name || 'AgroNord A/S'}</span></div>
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Sponsor Code</span><span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{activeCandidate.employer?.sponsorCode || '#944135'}</span></div>
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Visa Scheme</span><span className="text-slate-800 dark:text-slate-200">{activeCandidate.jobTitle}</span></div>
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">SIRI Case Order ID</span><span className="font-mono text-slate-800 dark:text-slate-200">{activeCandidate.siriCaseOrder?.caseOrderId}</span></div>
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Education Level</span><span className="text-slate-700 dark:text-slate-300">{extendedKyc.education_level || 'Vocational Certificate'}</span></div>
                      <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Work Experience</span><span className="text-slate-700 dark:text-slate-300">{extendedKyc.work_experience_years ? `${extendedKyc.work_experience_years} years` : '3+ years'}</span></div>
                      <div className="col-span-2">
                        <span className="text-[9px] text-slate-400 uppercase block font-semibold">Work Experience / Skills</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug mt-0.5">
                          {activeCandidate.workExperienceSummary || 'Certified field agriculturist with greenhouse & seasonal harvesting qualifications.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08]">
                      <PrivateDossierSummary candidate={activeCandidate} />
                    </div>
                  </div>
                </div>

                {/* Sub-tools for Overview */}
                <AdminCaseTools candidate={activeCandidate} actor={user.name} activeTab="overview" />
              </div>
            )}

            {/* TAB 2: DOCUMENTS & VAULT */}
            {activeTab === 'documents' && (
              <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-white/[0.08] space-y-4 animate-fade-in">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  {/* Sub-pane A: Documents List */}
                  <div className="w-full md:w-80 shrink-0 space-y-2 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/[0.08] pr-0 md:pr-4 pb-4 md:pb-0">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.08]">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        Document Vault ({activeCandidate.documents.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsDispatchModalOpen(true)}
                        className="text-[10px] font-bold text-brand-primary hover:underline"
                      >
                        + Upload / Dispatch
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
                      {activeCandidate.documents.map((d) => {
                        const isDocActive = d.id === (activeDoc?.id || '');
                        return (
                          <div
                            key={d.id}
                            onClick={() => setSelectedDocId(d.id)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isDocActive
                                ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/50 ring-1 ring-emerald-500/40'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">
                                  {d.title}
                                </span>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                                  {d.docId} &middot; {d.authority}
                                </div>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                  d.status === 'verified'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : d.status === 'signed_pending_review'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                    : d.status === 'rejected'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {d.status}
                              </span>
                            </div>

                            {d.signatureDataUrl && (
                              <div className="mt-1.5 flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle className="w-3 h-3" />
                                <span>Candidate Signed</span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {activeCandidate.documents.length === 0 && (
                        <div className="text-center py-8 text-xs text-slate-400">
                          No documents uploaded yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sub-pane B: Document Inspector */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {activeDoc ? (
                      <div className="space-y-3">
                        {/* Inspector Top Controls */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.08] pb-2">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {activeDoc.title}
                            </h3>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              ID: {activeDoc.docId} &middot; Issuer: {activeDoc.authority} &middot; Category: {activeDoc.category}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                            <div className="flex items-center gap-1 mr-2 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-white/10">
                              <button
                                type="button"
                                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 15))}
                                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[10px] font-mono font-bold px-1 text-slate-700 dark:text-slate-300">{zoomLevel}%</span>
                              <button
                                type="button"
                                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 15))}
                                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRotationAngle((rotationAngle + 90) % 360)}
                                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 ml-0.5"
                                title="Rotate 90deg"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => setIsLightboxOpen(true)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300 hover:bg-sky-100 flex items-center gap-1"
                              title="Split-View Inspector"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Split-View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveDocForFullPreview(activeDoc)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-500 flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadDoc(activeDoc)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-500 flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>
                          </div>
                        </div>

                        {/* Document Content Display Box */}
                        <div className="relative border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 bg-slate-50 dark:bg-slate-950/60 min-h-[260px] max-h-[460px] overflow-auto custom-scrollbar flex flex-col justify-between">
                          <div
                            style={{
                              transform: `scale(${zoomLevel / 100}) rotate(${rotationAngle}deg)`,
                              transformOrigin: 'top center',
                              transition: 'transform 0.2s ease',
                            }}
                            className="space-y-3"
                          >
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-2">
                              <div>
                                <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                                  {activeDoc.title}
                                </span>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  File: {activeDoc.filename}
                                </div>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                  activeDoc.status === 'verified'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : activeDoc.status === 'signed_pending_review'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                    : activeDoc.status === 'rejected'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {activeDoc.status}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              {activeDoc.body ||
                                `Official statutory document record issued under Danish Green Sector labor agreements. File: ${activeDoc.filename}`}
                            </p>

                            {activeDoc.fileUrl && (
                              /\.(pdf|html?)($|\?)/i.test(activeDoc.filename) || activeDoc.fileType === 'application/pdf'
                                ? <iframe title={`${activeDoc.title} preview`} src={activeDoc.fileUrl} className="mt-3 h-80 w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white" />
                                : <img src={activeDoc.fileUrl} alt={`${activeDoc.title} uploaded file`} className="mt-3 max-h-80 max-w-full rounded-xl border border-slate-300 dark:border-white/10 object-contain mx-auto" />
                            )}

                            {/* Electronic signature proof */}
                            {activeDoc.signatureDataUrl && (
                              <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
                                <div>
                                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                                    Candidate Electronic Signature Attached
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    Signer: {activeDoc.signerLegalName || activeCandidate.name} &middot; Date: {activeDoc.signedAt ? new Date(activeDoc.signedAt).toLocaleString() : 'Recent'}
                                  </span>
                                </div>
                                <div className="p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                                  <img
                                    src={activeDoc.signatureDataUrl}
                                    alt="Signature"
                                    className="max-h-8 object-contain"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Inspector Bottom Action Controls */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-white/[0.08]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Preset:</span>
                            {['Blurry Scan', 'Missing Signature', 'Expired Document'].map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => {
                                  setRejectDocReason('custom');
                                  setCustomRejectDocReason(chip);
                                  setIsRejectDocModalOpen(true);
                                }}
                                className="px-2 py-0.5 text-[10px] rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 transition-colors"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              type="button"
                              onClick={() => setIsRejectDocModalOpen(true)}
                              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-red-300 bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            >
                              Reject / Re-upload
                            </button>
                            <button
                              type="button"
                              onClick={handleVerifyDocument}
                              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Verify Document</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-xs text-slate-400">
                        No document selected.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PAYMENTS & FINANCIAL */}
            {activeTab === 'financial' && (
              <div className="space-y-4 animate-fade-in">
                <AdminCaseTools candidate={activeCandidate} actor={user.name} activeTab="financial" />
              </div>
            )}

            {/* TAB 4: INTERVIEWS & NOTICES */}
            {activeTab === 'interviews' && (
              <div className="space-y-4 animate-fade-in">
                <AdminCaseTools candidate={activeCandidate} actor={user.name} activeTab="interviews" />
              </div>
            )}

            {/* TAB 5: AUDIT LOG & ACCOUNT */}
            {activeTab === 'audit' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 animate-fade-in">
                {/* Timeline Column (8 cols) */}
                <div className="md:col-span-8 bg-white dark:bg-slate-900/90 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Chronological Consular &amp; Agency Audit Trail
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {activeCandidate.auditLog?.length || 0} events
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                    {activeCandidate.auditLog && activeCandidate.auditLog.length > 0 ? (
                      activeCandidate.auditLog.map((log) => (
                        <div key={log.id} className="text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 space-y-1">
                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <strong className="text-slate-900 dark:text-slate-100 font-bold">{log.action}</strong>
                            <span className="text-slate-400 text-[10px]">
                              {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                            {log.details}
                          </p>
                          <div className="text-[9px] text-slate-400">
                            Logged by: <span className="font-medium text-slate-500 dark:text-slate-300">{log.actor}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-xs text-slate-400">
                        No logged events yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Settings & Danger Zone Column (4 cols) */}
                <div className="md:col-span-4 space-y-3">
                  {/* Card 1: Account Access Controls */}
                  <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-white/[0.08] space-y-3">
                    <div className="border-b border-slate-100 dark:border-white/[0.08] pb-2 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-brand-primary" />
                        <span>Account &amp; Security Controls</span>
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        activeCandidate.accountStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : activeCandidate.accountStatus === 'pending_approval'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {activeCandidate.accountStatus === 'rejected' ? 'On Hold / Suspended' : activeCandidate.accountStatus}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-semibold">Registered Email</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{activeCandidate.email}</span>
                      </div>

                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-semibold">Candidate Portal Link</span>
                        <a
                          href="https://denmarkrecruiter.netlify.app/"
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>denmarkrecruiter.netlify.app</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {activeCandidate.accountRejectionReason && activeCandidate.accountStatus === 'rejected' && (
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-300">
                          <strong>Administrative Hold Reason:</strong> {activeCandidate.accountRejectionReason}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] space-y-2">
                      {/* 1. Account Hold / Reactivate Toggle */}
                      {activeCandidate.accountStatus === 'approved' ? (
                        <button
                          type="button"
                          onClick={() => setIsHoldModalOpen(true)}
                          className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <PauseCircle className="w-3.5 h-3.5" />
                          <span>Put Account on Administrative Hold</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleReactivateAccount}
                          className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Reactivate &amp; Unlock Portal Access</span>
                        </button>
                      )}

                      {/* 2. Send Password Reset Email */}
                      <button
                        type="button"
                        onClick={handleSendPasswordReset}
                        disabled={isSendingPasswordReset}
                        className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {isSendingPasswordReset ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                        ) : (
                          <Key className="w-3.5 h-3.5 text-blue-500" />
                        )}
                        <span>{isSendingPasswordReset ? 'Sending Reset Instructions...' : 'Send Password Reset Email'}</span>
                      </button>

                      {/* Copy Login & Onboarding Card */}
                      <button
                        type="button"
                        onClick={() => void copyCandidateCard(activeCandidate)}
                        className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Onboarding Credentials Card</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Danger Zone Card */}
                  <div className="bg-red-500/[0.04] dark:bg-red-950/20 rounded-2xl p-4 border border-red-300/60 dark:border-red-900/40 space-y-3">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        Danger Zone &middot; Irreversible
                      </h4>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      Permanently delete this candidate from storage bucket, database tables, and authentication service.
                    </p>

                    <button
                      type="button"
                      onClick={() => setIsPermanentDeleteModalOpen(true)}
                      className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-red-300 dark:border-red-800/80 bg-white dark:bg-red-950/40 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Candidate Permanently</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {isActivityOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50" onClick={() => setIsActivityOpen(false)}>
          <aside className="ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <div><h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Global Activity Feed</h2><p className="mt-1 text-[10px] text-slate-500">Latest 25 candidate and agency events</p></div>
              <button type="button" onClick={() => setIsActivityOpen(false)} aria-label="Close activity feed" className="rounded border p-1.5"><CloseIcon className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {globalActivity.length ? globalActivity.map(({ candidate, log }) => (
                <button key={`${candidate.id}-${log.id}`} type="button" onClick={() => { selectCandidate(candidate.id); setIsActivityOpen(false); }} className="w-full rounded-md border border-slate-200 p-3 text-left hover:border-emerald-600 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-2"><strong className="text-xs text-slate-900 dark:text-slate-100">{log.action}</strong><span className="shrink-0 text-[9px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</span></div>
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">{candidate.name} · {log.details}</p>
                  <p className="mt-1 text-[9px] text-slate-400">Coordinator: {log.actor}</p>
                </button>
              )) : <p className="py-8 text-center text-xs text-slate-500">No activity has been recorded yet.</p>}
            </div>
          </aside>
        </div>
      )}

      {/* Reject Document Modal */}
      {isRejectDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Reject &amp; Request Document Re-upload</span>
              </h3>
              <button onClick={() => setIsRejectDocModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  1-Click Rejection Preset Chips
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {REJECTION_PRESET_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setRejectDocReason('custom');
                        setCustomRejectDocReason(chip);
                      }}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[9px] font-semibold text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Preset Rejection Feedback
                </label>
                <select
                  value={rejectDocReason}
                  onChange={(e) => setRejectDocReason(e.target.value)}
                  className="w-full p-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Blurry or illegible scan">Blurry or illegible scan</option>
                  <option value="Missing official consular stamp or seal">Missing official consular stamp or seal</option>
                  <option value="Expired validity date">Expired validity date</option>
                  <option value="Incorrect document category uploaded">Incorrect document category uploaded</option>
                  <option value="custom">Custom Reason...</option>
                </select>
              </div>

              {rejectDocReason === 'custom' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Specific Instructions for Candidate
                  </label>
                  <textarea
                    rows={3}
                    value={customRejectDocReason}
                    onChange={(e) => setCustomRejectDocReason(e.target.value)}
                    placeholder="Enter instructions..."
                    className="w-full p-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRejectDocModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectDocumentSubmit}
                className="px-4 py-1.5 text-xs font-bold rounded bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                Confirm Document Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Account Modal */}
      {isRejectAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Reject Account Registration</span>
              </h3>
              <button onClick={() => setIsRejectAccountModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Reason for Rejection (Displayed to Candidate)
              </label>
              <textarea
                rows={3}
                value={accountRejectionReason}
                onChange={(e) => setAccountRejectionReason(e.target.value)}
                className="w-full p-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRejectAccountModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectAccountSubmit}
                className="px-4 py-1.5 text-xs font-bold rounded bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                Confirm Account Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject KYC Modal */}
      {isRejectKycModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Flag KYC Clearance for Correction</span>
              </h3>
              <button onClick={() => setIsRejectKycModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                1-Click Rejection Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {REJECTION_PRESET_CHIPS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setKycRejectionNote(reason)}
                    className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200 transition-colors"
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mt-2">
                Correction Instructions for Candidate
              </label>
              <textarea
                rows={3}
                value={kycRejectionNote}
                onChange={(e) => setKycRejectionNote(e.target.value)}
                className="w-full p-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRejectKycModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectKycSubmit}
                className="px-4 py-1.5 text-xs font-bold rounded bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                Send KYC Correction Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Register Modal */}
      <ManualRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />

      {/* Dispatch Document Modal */}
      <DispatchDocModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        candidate={activeCandidate}
      />

      {/* Full Document Preview Modal */}
      <DocPreviewModal
        doc={activeDocForFullPreview}
        candidate={activeCandidate}
        showKycComparison
        isOpen={!!activeDocForFullPreview}
        onClose={() => setActiveDocForFullPreview(null)}
      />

      {/* Official Statutory Contract & Document Generator */}
      <OfficialContractGeneratorModal
        isOpen={isContractGeneratorOpen}
        onClose={() => setIsContractGeneratorOpen(false)}
        candidate={activeCandidate}
        actor={user.name}
      />

      {/* Lightbox Split-View Document & KYC Inspector */}
      <LightboxSplitInspectorModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        document={activeDoc}
        candidate={activeCandidate}
        onVerify={(docId) => {
          verifyDocument(activeCandidate.id, docId, user.name);
          showToast(`Document "${activeDoc?.title || ''}" marked as Verified.`, 'success');
        }}
        onReject={(docId, reason) => {
          rejectDocument(activeCandidate.id, docId, reason, user.name);
          showToast(`Document rejected and flagged for re-upload.`, 'warning');
        }}
      />

      {/* Account Hold Modal */}
      {isHoldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                  <PauseCircle className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Place Account On Administrative Hold
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHoldModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Placing <strong>{activeCandidate.name}</strong>&apos;s account on hold will suspend portal access and send a notification dispatch to the applicant.
            </p>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Administrative Reason
              </label>
              <textarea
                rows={3}
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="State reason for placing account on hold..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsHoldModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccountHold}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Apply Administrative Hold</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Candidate Deletion Modal */}
      {isPermanentDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-red-300 dark:border-red-900/60 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-red-100 dark:border-red-900/40 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                  <Trash2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-red-950 dark:text-red-100">
                    Permanent Candidate Deletion
                  </h3>
                  <p className="text-xs text-red-700/80 dark:text-red-300/70">
                    Irreversible Cloud Storage, Database &amp; Auth RPC Removal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPermanentDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-900 dark:text-red-200 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Warning: This destructive operation cannot be undone.</span>
              </div>
              <p className="text-[11px] leading-relaxed text-red-800 dark:text-red-300">
                All uploaded passport scans, certificates, digital signatures, notifications, audit trails, and authentication credentials for this candidate will be purged permanently from Supabase Cloud Storage (<code>dossier-documents/{activeCandidate.id}/*</code>) and PostgreSQL records.
              </p>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-white/5">
                <span className="text-slate-500">Legal Full Name:</span>
                <strong className="text-slate-800 dark:text-slate-200">{activeCandidate.name}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-white/5">
                <span className="text-slate-500">Registered Email:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{activeCandidate.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-white/5">
                <span className="text-slate-500">Passport Number:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{activeCandidate.passportNumber}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Storage Files in Vault:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{activeCandidate.documents.length} files will be deleted</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Type <span className="font-mono text-red-600 font-extrabold">DELETE</span> or passport number <span className="font-mono text-red-600 font-extrabold">{activeCandidate.passportNumber}</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={`Type DELETE or ${activeCandidate.passportNumber}`}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsPermanentDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeletingPermanently}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                disabled={!isDeleteConfirmed || isDeletingPermanently}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5 transition-colors"
              >
                {isDeletingPermanently ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Purging Records...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Permanent Deletion</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
