'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { X, RotateCcw, Check, PenTool } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose }) => {
  const { candidate, saveCandidateSignature } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize and resize canvas with critical coordinate distortion fix
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // CRITICAL FIX: Reset transform before scaling to prevent exponential coordinate drift
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen || !candidate) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
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

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setHasDrawn(false);
  };

  const handleConfirm = () => {
    if (!hasDrawn || !canvasRef.current) {
      showToast('Please provide your signature on the pad before confirming.', 'error');
      return;
    }

    const dataUrl = canvasRef.current.toDataURL('image/png');
    saveCandidateSignature(candidate.id, dataUrl);
    showToast('Biometric consent signed and verified successfully!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-brand-primary dark:text-emerald-400">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('signModalTitle')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {candidate.name} &middot; Passport {candidate.passportNumber}
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

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('signModalDesc')}
          </p>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-slate-50/60 dark:bg-slate-800/40 relative">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-44 bg-white dark:bg-slate-950 rounded cursor-crosshair touch-none"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                Sign with mouse or touch here
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Danish Aliens Act Section 9a Compliant</span>
            <button
              type="button"
              onClick={clearCanvas}
              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('clearSig')}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-brand-primary hover:bg-brand-secondary text-white rounded-lg shadow-sm transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t('confirmSig')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
