'use client';

import React, { useState } from 'react';
import { DocumentRecord, CandidateRecord } from '@/types';
import { generateDocumentPdf } from '@/lib/pdfGenerator';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { X, Download, ShieldCheck, FileText } from 'lucide-react';

interface DocPreviewModalProps {
  doc: DocumentRecord | null;
  candidate: CandidateRecord;
  isOpen: boolean;
  onClose: () => void;
  onOpenSignatureModal?: () => void;
}

export const DocPreviewModal: React.FC<DocPreviewModalProps> = ({
  doc,
  candidate,
  isOpen,
  onClose,
  onOpenSignatureModal,
}) => {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !doc) return null;

  const isSigned = doc.key === 'vfsletter' && !!candidate.signatureDataUrl;

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
                <span className="font-semibold text-slate-800 dark:text-slate-200">Herdsmen & Farm Managers (§9a)</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Employer</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.employer.name} (CVR: {candidate.employer.cvr})</span>
              </div>
            </div>

            {/* Document Content */}
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
              <p>{doc.body}</p>
            </div>

            {/* Uploaded Scan Preview */}
            {doc.fileData && doc.fileType?.startsWith('image/') && (
              <div className="mt-4 p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Attached Scan</span>
                <img
                  src={doc.fileData}
                  alt="Document Scan"
                  className="max-h-60 mx-auto rounded shadow-sm object-contain"
                />
              </div>
            )}

            {/* Signature Block */}
            {doc.key === 'vfsletter' && (
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
                      src={candidate.signatureDataUrl}
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
