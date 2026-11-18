'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CandidateRecord, DocumentRecord } from '@/types';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useToast } from '@/context/ToastContext';
import { X, PenTool, CheckCircle, RotateCcw, ShieldCheck, FileText } from 'lucide-react';

interface DocumentSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateRecord;
  document: DocumentRecord | null;
}

export const DocumentSigningModal: React.FC<DocumentSigningModalProps> = ({
  isOpen,
  onClose,
  candidate,
  document: doc,
}) => {
  const { signDocument } = usePortalStore();
  const { showToast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signerLegalName, setSignerLegalName] = useState(candidate.name);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSignerLegalName(candidate.name);
      setAgreeTerms(false);
      setHasSignature(false);
      setTimeout(initCanvas, 50);
    }
  }, [isOpen, candidate]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  if (!isOpen || !doc) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    initCanvas();
    setHasSignature(false);
  };

  const handleSignSubmit = () => {
    if (!signerLegalName.trim()) {
      showToast('Please confirm your legal name as recorded in your passport.', 'error');
      return;
    }
    if (!hasSignature) {
      showToast('Please provide your electronic signature in the box below.', 'error');
      return;
    }
    if (!agreeTerms) {
      showToast('You must confirm the statutory legal declaration before submitting.', 'error');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureDataUrl = canvas.toDataURL('image/png');

    setIsSubmitting(true);
    signDocument(candidate.id, doc.id, signatureDataUrl, signerLegalName.trim());
    showToast(`Successfully signed and returned "${doc.title}" to the caseworker.`, 'success');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-brand-primary dark:text-emerald-400">
              <PenTool className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Electronic Document Signing &amp; Attestation
              </h2>
              <p className="text-xs text-slate-500">
                SIRI Two-Way Digital Verification Protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Details Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-brand-primary" />
              <span>{doc.title}</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {doc.docId || 'DOC-EXEC-2026'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {doc.body ||
              'Official statutory declaration and contractual addendum dispatched by the SIRI caseworker desk for candidate attestation.'}
          </p>
        </div>

        {/* Legal Declaration */}
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Statutory Declaration (Danish Immigration Law)</span>
          </div>
          <p>
            I hereby certify under penalty of perjury pursuant to Danish Aliens Act provisions that I am the authorized applicant named below, and that my electronic signature constitutes a legally binding execution of this instrument.
          </p>
        </div>

        {/* Signer Legal Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Confirmed Signer Legal Name (as on Passport) *
          </label>
          <input
            type="text"
            value={signerLegalName}
            onChange={(e) => setSignerLegalName(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-brand-primary focus:outline-none"
          />
        </div>

        {/* Interactive Canvas Signature Pad */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Draw Your Signature in the Box Below *
            </label>
            <button
              type="button"
              onClick={clearSignature}
              className="text-[11px] font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Signature</span>
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950/40 overflow-hidden cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={560}
              height={140}
              className="w-full h-36 touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Use mouse, trackpad, or finger to sign.</span>
            <span>{hasSignature ? '✓ Signature recorded' : 'Waiting for stroke...'}</span>
          </div>
        </div>

        {/* Statutory Checkbox */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            id="agreeTerms"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
          />
          <label htmlFor="agreeTerms" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            I confirm that I have reviewed the contents of this document and voluntarily affix my biometric electronic signature.
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSignSubmit}
            disabled={isSubmitting || !hasSignature || !agreeTerms}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-brand-primary hover:bg-brand-secondary text-white shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Sign &amp; Return to Caseworker</span>
          </button>
        </div>
      </div>
    </div>
  );
};
