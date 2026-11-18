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
import { generateDocumentPdf } from '@/lib/pdfGenerator';
import { seedDipakAndNokha } from '@/lib/cloudSeeder';
import { INITIAL_CANDIDATES } from '@/data/mockUsers';
import { DocumentRecord, StageNumber, DocumentStatus, AccountStatus, KycStatus } from '@/types';
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
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthInitialized } = useAuth();
  const {
    candidates,
    isInitialized,
    selectedCandidateId,
    selectCandidate,
    approveAccount,
    rejectAccount,
    verifyDocument,
    rejectDocument,
    approveKyc,
    rejectKyc,
    setCandidateStage,
    refreshStore,
  } = usePortalStore();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Selected candidate from store
  const activeCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0] || INITIAL_CANDIDATES[0];

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'pending' | 'action_required' | 'approved'>('all');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [activeDocForFullPreview, setActiveDocForFullPreview] = useState<DocumentRecord | null>(null);

  // Inspector Viewer State
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  // Modal States
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
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

  // WhatsApp Alert Generator
  const handleSendWhatsAppAlert = () => {
    const cleanPhone = (activeCandidate.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      showToast('No valid phone number found for candidate.', 'error');
      return;
    }
    const stageTitle = activeCandidate.stages[activeCandidate.currentStage - 1]?.title || 'Processing';
    const message = `Hello ${activeCandidate.name}, this is SIRI Caseworker ${user.name} regarding your Danish Immigration Application (${activeCandidate.passportNumber}). Your status is currently at Stage ${activeCandidate.currentStage}: ${stageTitle}. Please log in to your portal to review official updates: https://denmarkrecruiter.netlify.app`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  if (!candidates.length) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col transition-colors">
        <Header />
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                SIRI Caseworker Workspace
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

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-6 space-y-5">
        {/* Admin Top Dashboard Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                SIRI Caseworker Workspace &middot; Green Sector &amp; Seasonal Work Division
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active Caseworker: <strong>{user.name}</strong> &middot; Copenhagen SIRI Processing Center
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {needsSeed && (
              <button
                onClick={() => setIsSeedFormOpen((open) => !open)}
                className="px-3.5 py-2 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-800 text-white shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <span>☁️ Seed Dipak &amp; Nokha to Supabase Cloud</span>
              </button>
            )}
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Register New Candidate</span>
            </button>
            <div className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Total Queue: <strong>{candidates.length} Dossiers</strong>
            </div>
            {needsSeed && isSeedFormOpen && (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40">
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
          </div>
        </div>

        {/* 3-Pane Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ======================================================== */}
          {/* LEFT PANE: Candidate Queue & Onboarding (3.5 cols)        */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-3">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, passport, sponsor..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {/* Filter Tabs */}
              <div className="grid grid-cols-2 gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setActiveFilterTab('all')}
                  className={`py-1.5 px-2 rounded-md transition-colors ${
                    activeFilterTab === 'all'
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All ({candidates.length})
                </button>
                <button
                  onClick={() => setActiveFilterTab('pending')}
                  className={`py-1.5 px-2 rounded-md transition-colors ${
                    activeFilterTab === 'pending'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Pending Appr ({candidates.filter((c) => c.accountStatus === 'pending_approval').length})
                </button>
                <button
                  onClick={() => setActiveFilterTab('action_required')}
                  className={`py-1.5 px-2 rounded-md transition-colors ${
                    activeFilterTab === 'action_required'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Action Req
                </button>
                <button
                  onClick={() => setActiveFilterTab('approved')}
                  className={`py-1.5 px-2 rounded-md transition-colors ${
                    activeFilterTab === 'approved'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Approved ({candidates.filter((c) => c.accountStatus === 'approved').length})
                </button>
              </div>
            </div>

            {/* Candidate Queue Cards */}
            <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
              {filteredCandidates.map((c) => {
                const isSelected = c.id === activeCandidate.id;
                const hasPendingSignedDoc = c.documents.some((d) => d.status === 'signed_pending_review');

                return (
                  <div
                    key={c.id}
                    onClick={() => selectCandidate(c.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-brand-primary ring-1 ring-brand-primary shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                          {c.avatarUrl ? <img src={c.avatarUrl} alt={`${c.name} biometric avatar`} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-[10px] font-bold text-slate-500">{c.name.split(' ').map((part) => part[0]).join('')}</span>}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {c.passportNumber} &middot; {c.employer?.sponsorCode || c.siriCaseOrder?.caseOrderId}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex-shrink-0">
                        Stg {c.currentStage}
                      </span>
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      {/* Account status badge */}
                      {c.accountStatus === 'pending_approval' && (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Pending Approval
                        </span>
                      )}
                      {c.accountStatus === 'rejected' && (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                          Rejected
                        </span>
                      )}
                      {c.accountStatus === 'approved' && (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Approved
                        </span>
                      )}

                      {/* KYC status badge */}
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
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

                      {/* Signed doc indicator */}
                      {hasPendingSignedDoc && (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 animate-pulse">
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
          {/* CENTER PANE: Split-Screen Document & KYC Inspector       */}
          {/* (5.5 cols)                                              */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 xl:col-span-6 space-y-4">
            {/* Account Approval Action Banner (if pending or rejected) */}
            {activeCandidate.accountStatus !== 'approved' && (
              <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
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
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 font-mono bg-white dark:bg-slate-800"
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
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 font-mono bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsRejectAccountModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-300 bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                  >
                    Reject Registration
                  </button>
                  <button
                    onClick={handleApproveAccount}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Approve Account &amp; Unlock Portal</span>
                  </button>
                </div>
              </div>
            )}

            {/* Dossier Header */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {activeCandidate.name}
                  </h2>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {activeCandidate.passportNumber}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Scheme: <strong>{activeCandidate.jobTitle}</strong> &middot; Employer: {activeCandidate.employer?.name}
                </div>
              </div>

              <button
                onClick={() => setIsDispatchModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-primary hover:bg-brand-secondary text-white shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>+ Dispatch Document</span>
              </button>
            </div>

            {/* Split Screen KYC vs. Document Inspector */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* KYC Profile Column (5 cols) */}
              <div className="md:col-span-5 max-h-[760px] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-brand-primary" />
                    <span>Submitted KYC Record</span>
                  </h3>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
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

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-3 rounded-md bg-slate-50 p-2 dark:bg-slate-800/60">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
                      {activeCandidate.avatarUrl
                        ? <img src={activeCandidate.avatarUrl} alt={`${activeCandidate.name} biometric avatar`} className="h-full w-full object-cover" />
                        : <div className="flex h-full items-center justify-center text-[10px] text-slate-500">No photo</div>}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">Biometric Profile Photo</span>
                      <span className="text-[11px] text-slate-700 dark:text-slate-300">{activeCandidate.avatarStoragePath ? 'Private dossier image' : 'Not uploaded'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Legal Full Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{activeCandidate.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">Passport Expiry</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{activeCandidate.passportExpiry || '2033-04-18'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">Date of Birth</span>
                      <span className="text-slate-800 dark:text-slate-200">{activeCandidate.dob}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Nationality</span>
                    <span className="text-slate-800 dark:text-slate-200">{activeCandidate.nationality}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Permanent Address</span>
                    <span className="text-slate-800 dark:text-slate-200">{activeCandidate.permanentAddress || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Contact Mobile</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{activeCandidate.phone}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-y border-slate-100 py-2 dark:border-slate-800">
                    <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Father&apos;s Name</span><span>{extendedKyc.father_name || 'N/A'}</span></div>
                    <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Mother&apos;s Name</span><span>{extendedKyc.mother_name || 'N/A'}</span></div>
                    <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Marital Status</span><span>{extendedKyc.marital_status || 'N/A'}</span></div>
                    <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Gender</span><span>{extendedKyc.gender || 'N/A'}</span></div>
                    <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Citizenship / Nagarikta No.</span><span className="break-all font-mono">{extendedKyc.citizenship_number || 'N/A'}</span></div>
                    <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">NIN</span><span className="break-all font-mono">{extendedKyc.national_id_nin || 'N/A'}</span></div>
                    <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Passport Issue Date</span><span>{extendedKyc.passport_issue_date || 'N/A'}</span></div>
                    <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Passport Issue Place</span><span>{extendedKyc.passport_issue_place || 'N/A'}</span></div>
                    <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Emergency Contact</span><span>{extendedKyc.emergency_contact_name || 'N/A'}{extendedKyc.emergency_contact_relation ? ` (${extendedKyc.emergency_contact_relation})` : ''}</span></div>
                    <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Emergency Phone</span><span className="break-all font-mono">{extendedKyc.emergency_contact_phone || 'N/A'}</span></div>
                    <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Education</span><span>{extendedKyc.education_level || 'N/A'}</span></div>
                    <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Relevant Experience</span><span>{extendedKyc.work_experience_years ? `${extendedKyc.work_experience_years} years` : 'N/A'}</span></div>
                    <div><span className="text-[9px] text-slate-400 uppercase block font-semibold">Previous Schengen Visa</span><span>{extendedKyc.previous_schengen_visa || 'N/A'}</span></div>
                    <div className="col-span-2"><span className="text-[9px] text-slate-400 uppercase block font-semibold">Work Skills Summary</span><span className="whitespace-pre-wrap">{extendedKyc.work_skills_summary || activeCandidate.workExperienceSummary || 'N/A'}</span></div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Work Experience / Skills</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      {activeCandidate.workExperienceSummary || 'Certified field agriculturist with greenhouse & seasonal harvesting qualifications.'}
                    </p>
                  </div>

                  {activeCandidate.kycNote && (
                    <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                      <strong>Caseworker Note:</strong> {activeCandidate.kycNote}
                    </div>
                  )}
                </div>

                {/* Caseworker KYC Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={handleApproveKyc}
                    className="flex-1 py-1.5 px-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve KYC</span>
                  </button>
                  <button
                    onClick={() => setIsRejectKycModalOpen(true)}
                    className="py-1.5 px-2 text-xs font-bold rounded-lg border border-red-300 bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    Flag / Reject
                  </button>
                </div>
              </div>

              {/* Interactive Document Viewer Column (7 cols) */}
              <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
                {/* File Switcher & Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full sm:w-auto text-xs font-bold p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {activeCandidate.documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.status.toUpperCase()})
                      </option>
                    ))}
                  </select>

                  {/* Viewer zoom & rotate tools */}
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={() => setZoomLevel(Math.max(50, zoomLevel - 15))}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold px-1">{zoomLevel}%</span>
                    <button
                      onClick={() => setZoomLevel(Math.min(200, zoomLevel + 15))}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setRotationAngle((rotationAngle + 90) % 360)}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 ml-1"
                      title="Rotate 90 Clockwise"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Document Display Window */}
                {activeDoc ? (
                  <div className="space-y-3">
                    <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950/50 min-h-[220px] max-h-[340px] overflow-auto flex flex-col justify-between">
                      <div
                        style={{
                          transform: `scale(${zoomLevel / 100}) rotate(${rotationAngle}deg)`,
                          transformOrigin: 'top center',
                          transition: 'transform 0.2s ease',
                        }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                              {activeDoc.title}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {activeDoc.docId} &middot; {activeDoc.authority}
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
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

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                          {activeDoc.body ||
                            `Official statutory document record issued under Danish Green Sector labor agreements. File: ${activeDoc.filename}`}
                        </p>

                        {/* If document was signed by candidate, show signature proof */}
                        {activeDoc.signatureDataUrl && (
                          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-200 block">
                                Candidate Electronic Signature Attached
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Signer: {activeDoc.signerLegalName || activeCandidate.name} &middot; {activeDoc.signedAt ? new Date(activeDoc.signedAt).toLocaleDateString() : 'Recent'}
                              </span>
                            </div>
                            <div className="p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 flex-shrink-0">
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

                    {/* Document Verification & Rejection Controls */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setActiveDocForFullPreview(activeDoc)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-primary flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Full View</span>
                        </button>
                        <button
                          onClick={() => handleDownloadDoc(activeDoc)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-primary flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsRejectDocModalOpen(true)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-300 bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        >
                          Reject / Request Re-upload
                        </button>
                        <button
                          onClick={handleVerifyDocument}
                          className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Verify Document</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs text-slate-400">
                    No documents uploaded.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT PANE: Stage Controller + WhatsApp + Audit Log      */}
          {/* (3 cols)                                                */}
          {/* ======================================================== */}
          <div className="lg:col-span-12 xl:col-span-3 space-y-4">
            {/* Gated 6-Stage Controller */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-primary" />
                  <span>Workflow Controller</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Stage {activeCandidate.currentStage} of 6
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Phase</span>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {activeCandidate.stages[activeCandidate.currentStage - 1]?.title || 'Processing'}
                </div>
              </div>

              {/* Stage Step Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleStageRollback}
                  disabled={activeCandidate.currentStage <= 1}
                  className="py-1.5 px-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Rollback</span>
                </button>
                <button
                  onClick={handleStageAdvance}
                  disabled={activeCandidate.currentStage >= 6}
                  className="py-1.5 px-2 text-xs font-bold rounded-lg bg-brand-primary hover:bg-brand-secondary text-white disabled:opacity-40 shadow-sm flex items-center justify-center gap-1"
                >
                  <span>Advance</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Direct Stage Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Direct Stage Override
                </label>
                <select
                  value={activeCandidate.currentStage}
                  onChange={(e) => handleSetStage(parseInt(e.target.value, 10) as StageNumber)}
                  className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {activeCandidate.stages.map((st) => (
                    <option key={st.number} value={st.number}>
                      Stage {st.number}: {st.title} {st.number >= 5 ? '(Gated)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stage 5 Gate Note */}
              <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-[10px] text-blue-800 dark:text-blue-300 flex items-start gap-1.5">
                <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Stage 5 requires KYC Clearance Approved + Identity Passport Verified.</span>
              </div>
            </div>

            {/* One-Click WhatsApp Notification Button */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                Instant Applicant Alerts
              </span>
              <p className="text-[11px] text-slate-500">
                Send official SMS/WhatsApp dispatch directly to {activeCandidate.phone || 'candidate phone'}.
              </p>
              <button
                type="button"
                onClick={handleSendWhatsAppAlert}
                className="w-full py-2 px-3 text-xs font-bold rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send WhatsApp Notice</span>
              </button>
            </div>

            {/* Live Audit Log */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Live Consular Audit Log
                </span>
                <span className="text-[10px] text-slate-400">
                  {activeCandidate.auditLog?.length || 0} events
                </span>
              </div>

              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {activeCandidate.auditLog && activeCandidate.auditLog.length > 0 ? (
                  activeCandidate.auditLog.map((log) => (
                    <div key={log.id} className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-0.5">
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                        <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {log.details}
                      </p>
                      <div className="text-[9px] text-slate-400 italic">
                        By {log.actor}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No logged actions yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

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
        isOpen={!!activeDocForFullPreview}
        onClose={() => setActiveDocForFullPreview(null)}
      />
    </div>
  );
}
