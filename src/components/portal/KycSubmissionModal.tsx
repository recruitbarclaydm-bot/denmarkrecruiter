'use client';

import React, { useState, useRef } from 'react';
import { CandidateRecord } from '@/types';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useToast } from '@/context/ToastContext';
import {
  X,
  Upload,
  CheckCircle,
  FileText,
  User,
  Calendar,
  MapPin,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';

interface KycSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateRecord;
}

export const KycSubmissionModal: React.FC<KycSubmissionModalProps> = ({
  isOpen,
  onClose,
  candidate,
}) => {
  const { updateCandidateKyc } = usePortalStore();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(candidate.name);
  const [passportNumber, setPassportNumber] = useState(candidate.passportNumber);
  const [passportExpiry, setPassportExpiry] = useState(candidate.passportExpiry || '2033-04-18');
  const [dob, setDob] = useState(candidate.dob || '1992-09-30');
  const [nationality, setNationality] = useState(candidate.nationality || 'Nepal');
  const [permanentAddress, setPermanentAddress] = useState(candidate.permanentAddress || 'Gorkha, Nepal');
  const [phone, setPhone] = useState(candidate.phone || '+977-9701148461');
  const [workExperience, setWorkExperience] = useState(
    candidate.workExperienceSummary || 'Agricultural field management and seasonal crop cultivation'
  );
  const [idFilePreview, setIdFilePreview] = useState<string | null>(null);
  const [idFileName, setIdFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('File size must be less than 8MB.', 'error');
      return;
    }

    setIdFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setIdFilePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !passportNumber.trim()) {
      showToast('Full Legal Name and Passport Number are required.', 'error');
      return;
    }

    setIsSubmitting(true);

    updateCandidateKyc(candidate.id, {
      name: fullName.trim(),
      passportNumber: passportNumber.trim().toUpperCase(),
      passportExpiry,
      dob,
      nationality,
      permanentAddress,
      phone,
      workExperienceSummary: workExperience,
      kycStatus: 'submitted',
    });

    showToast('KYC dossier updated and submitted to caseworker for verification.', 'success');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-brand-primary dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Identity &amp; Biometric KYC Verification
              </h2>
              <p className="text-xs text-slate-500">
                SIRI Statutory Compliance &middot; Green Sector Verification Desk
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

        {/* Rejection Note Alert (if previously rejected) */}
        {candidate.kycStatus === 'rejected' && candidate.kycNote && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300">
            <strong>Caseworker Correction Notice:</strong> {candidate.kycNote}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Legal Name (as in Passport) *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>

            {/* Passport Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Passport Number *
              </label>
              <input
                type="text"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-brand-primary focus:outline-none uppercase"
              />
            </div>

            {/* Passport Expiry */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Passport Expiry Date
              </label>
              <input
                type="date"
                value={passportExpiry}
                onChange={(e) => setPassportExpiry(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth
              </label>
              <input
                type="text"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                placeholder="e.g. 30 September 1992"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>

            {/* Nationality */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nationality / Citizenship
              </label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contact Mobile (with country code)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977-98..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Permanent Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Permanent Residence Address
            </label>
            <input
              type="text"
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>

          {/* Work Experience */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Work Experience &amp; Agricultural Qualifications Summary
            </label>
            <textarea
              rows={2}
              value={workExperience}
              onChange={(e) => setWorkExperience(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>

          {/* New ID Document Upload (Optional update) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Upload Updated Passport Photo Page / National ID Scan (PDF or Image)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-primary rounded-xl text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/40"
            >
              <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {idFileName ? `Selected: ${idFileName}` : 'Click to select revised passport scan or photo'}
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5">
                Maximum file size: 8MB (PDF, PNG, JPG)
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Action buttons */}
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
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-brand-primary hover:bg-brand-secondary text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Submit KYC Clearance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
