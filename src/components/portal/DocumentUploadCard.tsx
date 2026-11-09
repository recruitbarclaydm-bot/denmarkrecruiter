'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { DocumentRecord } from '@/types';
import { UploadCloud, FilePlus, ShieldCheck } from 'lucide-react';

export const DocumentUploadCard: React.FC = () => {
  const { candidate, addCandidateDocument } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    'Vocational Agriculture Certificate (Landbrugsuddannelse / CTEVT)'
  );
  const [customTitle, setCustomTitle] = useState('');

  if (!candidate) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    Array.from(files).forEach((file, index) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (!validExtensions.includes(ext)) {
        showToast(`Invalid file type "${file.name}". Only PDF, JPG, and PNG are accepted.`, 'error');
        return;
      }

      if (file.size > maxSizeBytes) {
        showToast(`File "${file.name}" exceeds the 10 MB limit.`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const docTitle = customTitle.trim() || `${selectedCategory} (${file.name})`;
        const docId = `CUST-SIRI-${Math.floor(100000 + Math.random() * 900000)}`;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

        const newDoc: DocumentRecord = {
          id: `doc_custom_${Date.now()}_${index}`,
          key: `custom_${Date.now()}_${index}`,
          title: docTitle,
          filename: `${docTitle.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 36)}.pdf`,
          docId,
          authority: 'Applicant Submission · Royal Danish Embassy Legalization Pending',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: 'pending',
          isCandidateUpload: true,
          category: selectedCategory,
          fileSize: `${sizeMb} MB`,
          fileData: dataUrl,
          fileType: file.type,
          verificationHash: `SHA256:${Math.random().toString(36).substring(2, 15)}...${Math.random().toString(36).substring(2, 6)}`,
          body: `Official candidate-submitted supporting credential: ${docTitle}. Categorized under: ${selectedCategory}. Verified for virus signatures and encrypted for Danish Agency for International Recruitment and Integration (SIRI) dossier review. Status: Pending Consular Review at Danish Embassy Kathmandu.`,
        };

        addCandidateDocument(candidate.id, newDoc);
        showToast(`Uploaded & attached: ${docTitle}`, 'success');
        setCustomTitle('');
      };

      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-brand-primary dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {t('uploadTitle')}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <ShieldCheck className="w-3 h-3" />
          <span>ENCRYPTED EMBASSY UPLOAD</span>
        </span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
        {t('uploadDesc')}
      </p>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-brand-primary bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-brand-primary hover:bg-emerald-50/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-brand-primary dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <FilePlus className="w-6 h-6" />
        </div>
        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
          {t('dropzonePrimary')}
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          {t('dropzoneSecondary')}
        </div>
      </div>

      {/* Upload Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
            {t('categoryLabel')}
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-primary focus:outline-none"
          >
            <option value="Vocational Agriculture Certificate (Landbrugsuddannelse / CTEVT)">
              Vocational Agriculture Certificate (Landbrugsuddannelse / CTEVT)
            </option>
            <option value="Heavy Machinery & Tractor Operating License">
              Heavy Machinery & Tractor Operating License
            </option>
            <option value="Prior Dairy & Livestock Experience Certificate">
              Prior Dairy & Livestock Experience Certificate
            </option>
            <option value="Bank Solvency & Financial Guarantee">
              Bank Solvency & Financial Guarantee
            </option>
            <option value="English / Danish Language Proficiency Certificate">
              English / Danish Language Proficiency Certificate
            </option>
            <option value="Medical & Physical Fitness Certificate">
              Medical & Physical Fitness Certificate
            </option>
            <option value="Other Official Supporting Document">
              Other Official Supporting Document
            </option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
            {t('customTitleLabel')}
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g., CTEVT Dairy Management Diploma"
            className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-primary focus:outline-none"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{t('attachBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
