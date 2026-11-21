'use client';

import React, { useState } from 'react';
import { CandidateRecord, DocumentRecord } from '@/types';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Check,
  AlertTriangle,
  UserCheck,
  FileText,
  ShieldCheck,
  Eye,
  Maximize2,
} from 'lucide-react';

interface LightboxSplitInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentRecord | null;
  candidate: CandidateRecord;
  onVerify: (docId: string) => void;
  onReject: (docId: string, reason: string) => void;
}

export const REJECTION_PRESET_CHIPS = [
  'Blurry / Glare on Passport MRZ Zone',
  'All 4 Corners of Document Must Be Visible',
  'Name / DOB Mismatch with Passport',
  'Official Europass CV Format Required',
  'Invalid / Unverifiable Payment Transaction ID',
  'High-Resolution Color Scan Required',
];

export const LightboxSplitInspectorModal: React.FC<LightboxSplitInspectorModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  candidate,
  onVerify,
  onReject,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(REJECTION_PRESET_CHIPS[0]);

  if (!isOpen || !doc) return null;

  const extendedKyc = candidate.extendedKyc || {};
  const isPdf = /\.(pdf)($|\?)/i.test(doc.filename) || doc.fileType === 'application/pdf';
  const isHtml = /\.(html?)($|\?)/i.test(doc.filename) || doc.fileType === 'text/html';

  const handleApplyChip = (chip: string) => {
    setRejectionReason(chip);
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) return;
    onReject(doc.id, rejectionReason.trim());
    setIsRejectOpen(false);
  };

  const handleConfirmVerify = () => {
    onVerify(doc.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-hidden">
      <div className="relative w-full h-[96vh] max-w-7xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Top App Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400">
              <Maximize2 className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Full-Screen Split-Check Lightbox Inspector
                </h2>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                    doc.status === 'verified'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : doc.status === 'signed_pending_review'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : doc.status === 'rejected'
                      ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {doc.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Inspecting: <strong>{doc.title}</strong> &middot; Applicant: {candidate.name} ({candidate.passportNumber})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Action buttons inside lightbox */}
            <button
              onClick={() => setIsRejectOpen((prev) => !prev)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-300 bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              Reject / Request Re-upload
            </button>
            <button
              onClick={handleConfirmVerify}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Verify Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Rejection Tray (if toggled open) */}
        {isRejectOpen && (
          <div className="bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-800 p-3.5 shrink-0 space-y-2 animate-slide-down">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-900 dark:text-red-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>1-Click Rejection Preset Chips:</span>
              </span>
              <button
                onClick={() => setIsRejectOpen(false)}
                className="text-[11px] text-red-600 dark:text-red-300 font-semibold hover:underline"
              >
                Close
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {REJECTION_PRESET_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleApplyChip(chip)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors ${
                    rejectionReason === chip
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-red-400'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Or type specific instructions for candidate..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm shrink-0"
              >
                Confirm Rejection &amp; Notify
              </button>
            </div>
          </div>
        )}

        {/* 2-Column Split Lightbox Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left: Document View Area with Zoom & Rotate (7 cols) */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/70 overflow-hidden">
            {/* Viewer toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-xs sm:max-w-md">
                {doc.filename}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setZoomLevel(Math.max(40, zoomLevel - 20))}
                  className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold px-1.5">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel(Math.min(260, zoomLevel + 20))}
                  className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="px-2 py-1 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                >
                  Reset
                </button>
                <button
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 ml-1"
                  title="Rotate 90deg Clockwise"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    download={doc.filename}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 ml-1"
                    title="Download Original File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Document display window */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-w-full max-h-full flex flex-col items-center justify-center"
              >
                {doc.fileUrl ? (
                  isPdf || isHtml ? (
                    <iframe
                      title="Document Viewer"
                      src={doc.fileUrl}
                      className="w-[680px] h-[720px] rounded-lg shadow-lg border border-slate-300 bg-white"
                    />
                  ) : (
                    <img
                      src={doc.fileUrl}
                      alt={doc.title}
                      className="max-w-[700px] max-h-[720px] rounded-lg shadow-lg border border-slate-300 object-contain bg-white"
                    />
                  )
                ) : (
                  <div className="w-[500px] p-6 rounded-xl border border-slate-300 bg-white shadow text-xs space-y-3">
                    <div className="font-bold text-sm text-slate-900">{doc.title}</div>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{doc.body}</p>
                  </div>
                )}

                {/* E-signature preview if signed */}
                {doc.signatureDataUrl && (
                  <div className="mt-4 p-3 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-xl shadow-md flex items-center justify-between gap-4 w-full max-w-md">
                    <div>
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                        Candidate Biometric Signature
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {doc.signerLegalName || candidate.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Signed: {doc.signedAt ? new Date(doc.signedAt).toLocaleString() : 'Recent'}
                      </div>
                    </div>
                    <img
                      src={doc.signatureDataUrl}
                      alt="Signature Stamp"
                      className="max-h-12 object-contain border p-1 rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Typed Candidate KYC Fields for 1:1 Verification (5 cols) */}
          <div className="lg:col-span-5 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Candidate Typed KYC Record</span>
              </div>
              <span className="text-[10px] text-slate-400">Compare field-by-field with scan</span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Primary Identity Anchor
                </span>
                <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {candidate.name}
                </div>
                <div className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Passport: {candidate.passportNumber}
                </div>
              </div>

              {/* Character by character comparison table */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Birth</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.dob}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Passport Expiry</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {candidate.passportExpiry || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Nationality</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.nationality}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Gender / Marital</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {extendedKyc.gender || 'N/A'} &middot; {extendedKyc.marital_status || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Citizenship No.</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 break-all">
                      {extendedKyc.citizenship_number || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">National ID (NIN)</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 break-all">
                      {extendedKyc.national_id_nin || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Father&apos;s Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{extendedKyc.father_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Mother&apos;s Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{extendedKyc.mother_name || 'N/A'}</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Permanent Residence</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.permanentAddress}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Passport Issue Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {extendedKyc.passport_issue_date || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Passport Issue Place</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {extendedKyc.passport_issue_place || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Emergency Contact</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {extendedKyc.emergency_contact_name || 'N/A'} ({extendedKyc.emergency_contact_relation || 'Kin'}) &middot;{' '}
                    <span className="font-mono">{extendedKyc.emergency_contact_phone || 'N/A'}</span>
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Work Experience &amp; Skills</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 whitespace-pre-wrap">
                    {extendedKyc.work_skills_summary || candidate.workExperienceSummary || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
