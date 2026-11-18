'use client';

import React, { useState } from 'react';
import { CandidateRecord } from '@/types';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useToast } from '@/context/ToastContext';
import { X, Send, FileText, CheckCircle2, ShieldCheck, PenTool } from 'lucide-react';

interface DispatchDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateRecord;
}

export const DispatchDocModal: React.FC<DispatchDocModalProps> = ({
  isOpen,
  onClose,
  candidate,
}) => {
  const { dispatchAdminDocument } = usePortalStore();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Employment');
  const [body, setBody] = useState('');
  const [requiresSignature, setRequiresSignature] = useState(true);
  const [preset, setPreset] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState<string>();

  if (!isOpen) return null;

  const presets = [
    {
      title: 'Danish Seasonal Agricultural Contract Addendum (2026/2027)',
      category: 'Employment',
      body: 'Official addendum to employment contract stipulating collective agreement wages (DKK 135.50/hr), weekly 37-hour work commitment, and seasonal housing allocation under Danish 3F collective terms.',
      sig: true,
    },
    {
      title: 'SIRI Statutory Biometric Declaration & Representation Accord',
      category: 'SIRI Official',
      body: 'Statutory instrument authorizing Danish Agency for International Recruitment and Integration (SIRI) and VFS Global to capture and verify ten-finger biometric scans and high-resolution facial biometrics.',
      sig: true,
    },
    {
      title: 'Employer Housing & Mandatory Medical Insurance Guarantee',
      category: 'Compliance',
      body: 'Verified undertaking by Danish Sponsor confirming approved living quarters compliant with Danish agricultural health codes and municipal registration upon arrival.',
      sig: false,
    },
  ];

  const handleApplyPreset = (index: number) => {
    const p = presets[index];
    if (p) {
      setTitle(p.title);
      setCategory(p.category);
      setBody(p.body);
      setRequiresSignature(p.sig);
    }
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showToast('Title and document description are required.', 'error');
      return;
    }

    dispatchAdminDocument(candidate.id, title.trim(), category, body.trim(), requiresSignature, fileData);
    showToast(`Dispatched "${title}" to ${candidate.name}'s candidate portal.`, 'success');
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be under 10MB.', 'error');
      event.target.value = '';
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setFileData(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Send className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Dispatch Document to Candidate
              </h2>
              <p className="text-xs text-slate-500">
                Target: <strong>{candidate.name}</strong> ({candidate.passportNumber})
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

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Quick Document Templates
          </label>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p, idx) => (
              <button
                key={p.title}
                type="button"
                onClick={() => handleApplyPreset(idx)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors truncate max-w-xs"
              >
                {p.title.split(' ')[0]} {p.title.split(' ')[1]}...
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleDispatch} className="space-y-4">
          {/* Document Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Document Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Seasonal Employment Addendum & Wage Accord"
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              >
                <option value="Employment">Employment</option>
                <option value="SIRI Official">SIRI Official</option>
                <option value="Identity">Identity</option>
                <option value="Compliance">Compliance</option>
                <option value="Financial">Financial</option>
              </select>
            </div>

            {/* Signature Requirement Toggle */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresSignature}
                  onChange={(e) => setRequiresSignature(e.target.checked)}
                  className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <PenTool className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Require Signature</span>
                </span>
              </label>
            </div>
          </div>

          {/* Body / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Document Provisions &amp; Instructions *
            </label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter official legal provisions, obligations, and specific instructions for the candidate..."
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Optional Document File
            </label>
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg"
              onChange={handleFileUpload}
              className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
            />
            {fileName && <div className="text-[10px] text-slate-500 mt-1 font-mono">{fileName}</div>}
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
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-lg bg-brand-primary hover:bg-brand-secondary text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch to Candidate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
