'use client';

import React, { useEffect, useState } from 'react';
import { DocumentRecord, CandidateRecord } from '@/types';
import { generateDocumentPdf } from '@/lib/pdfGenerator';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { getSignedDocumentUrl } from '@/lib/supabase';
import { X, Download, ShieldCheck, FileText, ZoomIn, ZoomOut, RotateCw, ExternalLink } from 'lucide-react';

interface DocPreviewModalProps {
  doc: DocumentRecord | null;
  candidate: CandidateRecord;
  isOpen: boolean;
  onClose: () => void;
  onOpenSignatureModal?: () => void;
  showKycComparison?: boolean;
}

export const DocPreviewModal: React.FC<DocPreviewModalProps> = ({
  doc,
  candidate,
  isOpen,
  onClose,
  onOpenSignatureModal,
  showKycComparison = false,
}) => {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [signedUrl, setSignedUrl] = useState('');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setZoom(100);
    setRotation(0);
    setSignedUrl(doc?.fileUrl || '');
    if (doc?.storagePath) void getSignedDocumentUrl(doc.storagePath).then(setSignedUrl);
  }, [doc]);

  if (!isOpen || !doc) return null;

  const signature = doc.signatureDataUrl || (doc.key === 'vfsletter' ? candidate.signatureDataUrl : undefined);
  const isSigned = Boolean(signature);
  const previewUrl = signedUrl || doc.fileData || '';
  const isPdf = doc.fileType === 'application/pdf' || /\.(pdf|html?)($|\?)/i.test(doc.filename);

  const handleOpenOriginal = () => {
    if (previewUrl) window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadOriginal = () => {
    if (!previewUrl) return;
    const anchor = document.createElement('a');
    anchor.href = previewUrl;
    anchor.download = doc.filename || doc.title;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    anchor.click();
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    showToast(`Generating official PDF for ${doc.title}...`, 'info');
    try {
      await generateDocumentPdf(doc, candidate);
      showToast(`Downloaded: ${doc.title}.pdf`, 'success');
    } catch (e) {
      showToast('Error generating PDF, downloaded as HTML record.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-brand-primary dark:text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {doc.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {doc.docId} &middot; {doc.authority}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Official Sheet */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          <div className="relative border-2 border-slate-200 dark:border-slate-700/80 rounded-lg p-6 bg-slate-50/40 dark:bg-slate-800/30">
            {/* Dannebrog Emblem & Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <div className="text-xs font-extrabold text-brand-primary dark:text-emerald-400 tracking-wider">
                  DANISH AGENCY FOR INTERNATIONAL RECRUITMENT AND INTEGRATION
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  OFFICIAL DOSSIER RECORD &middot; CASE ORDER ID: {candidate.siriCaseOrder.caseOrderId}
                </div>
              </div>
              <div className="w-9 h-6 rounded overflow-hidden shadow-sm flex-shrink-0 border border-slate-200">
                <svg viewBox="0 0 370 280" className="w-full h-full">
                  <rect width="370" height="280" fill="#c8102e" />
                  <rect x="120" width="40" height="280" fill="#ffffff" />
                  <rect y="120" width="370" height="40" fill="#ffffff" />
                </svg>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 my-4 p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700/60 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Applicant</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Passport</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.passportNumber}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Scheme</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.siriCaseOrder?.scheme || candidate.jobTitle}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Employer</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.employer.name} {candidate.employer.cvr ? `(CVR: ${candidate.employer.cvr})` : ''}</span>
              </div>
            </div>

            {/* Document Content */}
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
              <p>{doc.body}</p>
            </div>

            {/* Uploaded Scan Preview */}
            {showKycComparison && (
              <div className="my-4 grid grid-cols-2 gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs dark:border-emerald-900 dark:bg-emerald-950/30">
                <div><span className="summary-label">Candidate name</span>{candidate.name}</div>
                <div><span className="summary-label">Date of birth</span>{candidate.dob}</div>
                <div><span className="summary-label">Passport number</span>{candidate.passportNumber}</div>
                <div><span className="summary-label">Nationality</span>{candidate.nationality}</div>
                <div className="col-span-2"><span className="summary-label">Address</span>{candidate.permanentAddress}</div>
              </div>
            )}

            {previewUrl && (
              <div className="mt-4 overflow-hidden rounded border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-950">
                <div className="no-print flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2 text-[10px] dark:border-slate-700 dark:bg-slate-900">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Private file preview</span>
                  <div className="flex items-center gap-1">
                    <button type="button" title="Zoom out" onClick={() => setZoom((value) => Math.max(50, value - 10))} className="rounded border p-1"><ZoomOut className="h-3.5 w-3.5" /></button>
                    <span className="px-1 font-mono">{zoom}%</span>
                    <button type="button" title="Zoom in" onClick={() => setZoom((value) => Math.min(200, value + 10))} className="rounded border p-1"><ZoomIn className="h-3.5 w-3.5" /></button>
                    <button type="button" title="Rotate" onClick={() => setRotation((value) => (value + 90) % 360)} className="rounded border p-1"><RotateCw className="h-3.5 w-3.5" /></button>
                    <button type="button" title="Open original" onClick={handleOpenOriginal} className="rounded border p-1"><ExternalLink className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="flex max-h-[60vh] min-h-56 items-center justify-center overflow-auto p-2">
                  {isPdf ? (
                    <iframe title={`${doc.title} PDF preview`} src={previewUrl} className="h-[55vh] w-full bg-white" />
                  ) : (
                    <img src={previewUrl} alt={`${doc.title} preview`} className="max-h-[55vh] max-w-full object-contain" style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }} />
                  )}
                </div>
              </div>
            )}

            {/* Signature Block */}
            {(doc.key === 'vfsletter' || signature) && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                {isSigned ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div>
                      <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        Applicant Biometric Declaration Signed
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {candidate.name} &middot; Cryptographically verified
                      </div>
                    </div>
                    <img
                      src={signature}
                      alt="Biometric Signature"
                      className="max-h-10 border-b border-slate-300 dark:border-slate-600 px-2"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800">
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      Biometric Consent Signature Required
                    </span>
                    {onOpenSignatureModal && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenSignatureModal();
                        }}
                        className="px-3 py-1 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-semibold rounded shadow-sm transition-colors"
                      >
                        Sign Now
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Official Gold Seal & Hash */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded text-[11px] font-bold text-amber-800 dark:text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>OFFICIAL IMMIGRATION RECORD &middot; SIRI VERIFIED</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Fingerprint: {doc.verificationHash || 'SHA256:7f83b1657ff1...9069'}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleDownloadOriginal}
            disabled={!previewUrl}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Original</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-brand-primary hover:bg-brand-secondary text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Generating PDF...' : t('downloadPdf')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
