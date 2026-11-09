'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Header } from '@/components/shared/Header';
import { DocPreviewModal } from '@/components/shared/DocPreviewModal';
import { generateDocumentPdf } from '@/lib/pdfGenerator';
import { DocumentRecord, StageNumber, DocumentStatus } from '@/types';
import {
  Search,
  Filter,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  Eye,
  Check,
  Building2,
  Calendar,
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const {
    user,
    allCandidates,
    candidate,
    selectCandidate,
    advanceCandidateStage,
    rollbackCandidateStage,
    setCandidateStage,
    updateDocumentStatus,
  } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<number | 'all'>('all');
  const [activeDocForPreview, setActiveDocForPreview] = useState<DocumentRecord | null>(null);

  // Admin Guard
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/admin/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin' || !candidate) return null;

  // Filter candidates
  const filteredCandidates = allCandidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.passportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.siriCaseOrder.caseOrderId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStageFilter === 'all' || c.currentStage === selectedStageFilter;
    return matchesSearch && matchesStage;
  });

  const handleAdvance = () => {
    if (candidate.currentStage >= 6) {
      showToast('Candidate is already at the final decision stage.', 'info');
      return;
    }
    advanceCandidateStage(candidate.id);
    showToast(`Advanced ${candidate.name} to Stage ${candidate.currentStage + 1}.`, 'success');
  };

  const handleRollback = () => {
    if (candidate.currentStage <= 1) {
      showToast('Candidate is at Stage 1.', 'info');
      return;
    }
    rollbackCandidateStage(candidate.id);
    showToast(`Rolled back ${candidate.name} to Stage ${candidate.currentStage - 1}.`, 'info');
  };

  const handleSetStage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stage = parseInt(e.target.value, 10) as StageNumber;
    setCandidateStage(candidate.id, stage);
    showToast(`Updated ${candidate.name} workflow stage to ${stage}.`, 'success');
  };

  const handleDocStatusChange = (docId: string, status: DocumentStatus) => {
    updateDocumentStatus(candidate.id, docId, status);
    showToast(`Updated document status to ${status.toUpperCase()}.`, 'success');
  };

  const handleDownloadDoc = async (doc: DocumentRecord) => {
    showToast(`Generating official PDF for ${doc.title}...`, 'info');
    await generateDocumentPdf(doc, candidate);
    showToast(`Downloaded: ${doc.title}.pdf`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col transition-colors">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Admin Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {t('adminTitle')}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active Caseworker: <strong>{user.name}</strong> &middot; Green Sector & Seasonal Work Division (SIRI Copenhagen)
            </p>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {allCandidates.length} Active Dossiers in Queue
          </div>
        </div>

        {/* 2-Column Split: Candidate List vs. Detailed Dossier Inspection */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Candidate List & Filters (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {/* Stage Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setSelectedStageFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
                    selectedStageFilter === 'all'
                      ? 'bg-brand-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All ({allCandidates.length})
                </button>
                {[1, 2, 3, 4, 5, 6].map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setSelectedStageFilter(stage)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
                      selectedStageFilter === stage
                        ? 'bg-brand-primary text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    Stg {stage}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate List */}
            <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
              {filteredCandidates.map((c) => {
                const isSelected = c.id === candidate.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => selectCandidate(c.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-brand-primary ring-1 ring-brand-primary shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {c.passportNumber} &middot; {c.siriCaseOrder.caseOrderId}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Stage {c.currentStage}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
                      {c.employer.name} &middot; {c.jobTitle}
                    </div>
                  </div>
                );
              })}

              {filteredCandidates.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  No applicants matching search criteria.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Dossier Inspection Pane (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Applicant Summary Header */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {candidate.name}
                    </h2>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {candidate.passportNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    DOB: {candidate.dob} ({candidate.nationality}) &middot; Case Order: {candidate.siriCaseOrder.caseOrderId}
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Currently at Stage {candidate.currentStage} of 6</span>
                </span>
              </div>

              {/* Stage Override Controls */}
              <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  {t('stageOverride')}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleRollback}
                    disabled={candidate.currentStage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{t('rollbackStage')}</span>
                  </button>

                  <button
                    onClick={handleAdvance}
                    disabled={candidate.currentStage >= 6}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg bg-brand-primary hover:bg-brand-secondary text-white disabled:opacity-40 shadow-sm"
                  >
                    <span>{t('advanceStage')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-slate-500">{t('selectStage')}:</span>
                    <select
                      value={candidate.currentStage}
                      onChange={handleSetStage}
                      className="text-xs font-semibold p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value={1}>Stage 1: Contract Signed</option>
                      <option value={2}>Stage 2: Case Order Paid</option>
                      <option value={3}>Stage 3: Form AR1 Submitted</option>
                      <option value={4}>Stage 4: VFS Biometrics</option>
                      <option value={5}>Stage 5: SIRI Assessment</option>
                      <option value={6}>Stage 6: Decision Issued</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate Digital Signature Review Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{t('applicantSignature')}</span>
              </h3>

              {candidate.signatureDataUrl ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                  <div>
                    <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      {t('verifiedSignatureText')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Recorded: {candidate.signatureTimestamp ? new Date(candidate.signatureTimestamp).toLocaleString() : 'Recent'} &middot; Biometric Declaration Approved
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <img
                      src={candidate.signatureDataUrl}
                      alt="Applicant Signature"
                      className="max-h-12 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                  {t('noSignatureYet')}
                </div>
              )}
            </div>

            {/* Document Verification & Consular Audit Pane */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-primary" />
                  <span>{t('documentReview')}</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {candidate.documents.length} Dossier Files
                </span>
              </div>

              <div className="space-y-3">
                {candidate.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {doc.title}
                        </span>
                        {doc.isCandidateUpload && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            Candidate Upload
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {doc.docId} &middot; {doc.authority}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setActiveDocForPreview(doc)}
                        className="py-1 px-2.5 text-xs font-semibold rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-primary flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => handleDownloadDoc(doc)}
                        className="py-1 px-2.5 text-xs font-semibold rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-primary flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>

                      {/* Status Selector */}
                      <select
                        value={doc.status}
                        onChange={(e) => handleDocStatusChange(doc.id, e.target.value as DocumentStatus)}
                        className={`text-xs font-bold py-1 px-2 rounded border focus:outline-none ${
                          doc.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            : doc.status === 'flagged'
                            ? 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        <option value="verified">&#10003; Approved</option>
                        <option value="pending">&#9203; Pending Review</option>
                        <option value="flagged">&#9888; Flagged for Audit</option>
                        <option value="action_required">&#9997; Action Required</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Document Preview Modal */}
      <DocPreviewModal
        doc={activeDocForPreview}
        candidate={candidate}
        isOpen={!!activeDocForPreview}
        onClose={() => setActiveDocForPreview(null)}
      />
    </div>
  );
}
