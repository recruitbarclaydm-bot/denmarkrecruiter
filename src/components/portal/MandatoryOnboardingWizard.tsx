'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CandidateRecord, DocumentRecord, NepalKycDetails } from '@/types';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useToast } from '@/context/ToastContext';
import { getSignedDocumentUrl } from '@/lib/supabase';
import { DocumentSigningModal } from '@/components/portal/DocumentSigningModal';
import { compressImageFile } from '@/utils/imageCompression';
import { CheckCircle2, Clock3, FileText, ImagePlus, ShieldCheck, Upload, AlertCircle, Sparkles } from 'lucide-react';

interface MandatoryOnboardingWizardProps {
  candidate: CandidateRecord;
  onViewTracker: () => void;
}

interface KycFormValues extends NepalKycDetails {
  full_name: string;
  dob: string;
  nationality: string;
  address: string;
  phone: string;
  passport_number: string;
  passport_expiry: string;
}

const emptyExtendedKyc: NepalKycDetails = {
  father_name: '',
  mother_name: '',
  marital_status: '',
  gender: '',
  citizenship_number: '',
  national_id_nin: '',
  passport_issue_date: '',
  passport_issue_place: '',
  emergency_contact_name: '',
  emergency_contact_relation: '',
  emergency_contact_phone: '',
  education_level: '',
  work_experience_years: '',
  work_skills_summary: '',
  previous_schengen_visa: '',
};

const getFormValues = (candidate: CandidateRecord): KycFormValues => ({
  full_name: candidate.name || '',
  dob: candidate.dob || '',
  nationality: candidate.nationality || '',
  address: candidate.permanentAddress || '',
  phone: candidate.phone || '',
  passport_number: candidate.passportNumber || '',
  passport_expiry: candidate.passportExpiry || '',
  ...emptyExtendedKyc,
  ...candidate.extendedKyc,
  work_skills_summary: candidate.extendedKyc?.work_skills_summary || candidate.workExperienceSummary || '',
});

const documentSlots = [
  {
    id: 'passport',
    name: 'Passport Bio-Data Scan (Front & Back)',
    category: 'Core Passport',
    aliases: ['passport'],
    required: true,
  },
  {
    id: 'citizenship',
    name: 'Nepalese Citizenship Certificate (Nagarikta / National ID)',
    category: 'Core Citizenship',
    aliases: ['citizenship', 'nagarikta', 'national id'],
    required: true,
  },
  {
    id: 'europass',
    name: 'Official Europass CV / Resume',
    category: 'Core Europass CV',
    aliases: ['europass', 'resume', ' cv'],
    required: true,
  },
  {
    id: 'qualification',
    name: 'Academic & Work Experience / Training Certificate',
    category: 'Core Qualification',
    aliases: ['academic', 'work experience', 'training', 'agricultural working certificate'],
    required: true,
  },
  {
    id: 'police',
    name: 'Nepal Police Clearance Certificate (PCC)',
    category: 'Core Police Clearance',
    aliases: ['police', 'clearance certificate', 'pcc'],
    required: true,
  },
  {
    id: 'medical',
    name: 'Medical Fitness Certificate',
    category: 'Medical Fitness',
    aliases: ['medical', 'fitness certificate'],
    required: false,
  },
];

const matchesSlot = (document: DocumentRecord, slot: (typeof documentSlots)[number]) => {
  const searchable = `${document.title} ${document.category || ''} ${document.key}`.toLowerCase();
  return slot.aliases.some((alias) => searchable.includes(alias));
};

export const calculateCandidateReadiness = (candidate: CandidateRecord) => {
  const requiredSlots = documentSlots.filter((slot) => slot.required);
  const uploadedSlots = requiredSlots.filter((slot) => candidate.documents.some(
    (document) => matchesSlot(document, slot) && Boolean(document.storagePath)
  )).length;
  return Math.min(100,
    (candidate.avatarStoragePath ? 20 : 0) +
    (candidate.kycStatus === 'submitted' || candidate.kycStatus === 'verified' ? 30 : 0) +
    uploadedSlots * 10
  );
};

export const shouldOpenCandidateOnboarding = (candidate: CandidateRecord) =>
  calculateCandidateReadiness(candidate) < 100 ||
  candidate.kycStatus === 'pending' ||
  candidate.kycStatus === 'rejected' ||
  candidate.documents.some((document) => document.status === 'rejected' || document.status === 'action_required');

const requiredKycFields: (keyof KycFormValues)[] = [
  'full_name', 'dob', 'nationality', 'address', 'phone', 'passport_number', 'passport_expiry',
  'father_name', 'mother_name', 'marital_status', 'gender', 'citizenship_number',
  'passport_issue_date', 'passport_issue_place', 'emergency_contact_name',
  'emergency_contact_relation', 'emergency_contact_phone', 'education_level',
  'work_experience_years', 'work_skills_summary', 'previous_schengen_visa',
];

const textFields: { key: keyof KycFormValues; label: string; type?: string }[] = [
  { key: 'full_name', label: 'Full legal name', type: 'text' },
  { key: 'dob', label: 'Date of birth', type: 'text' },
  { key: 'nationality', label: 'Nationality', type: 'text' },
  { key: 'address', label: 'Permanent address in Nepal', type: 'text' },
  { key: 'phone', label: 'Mobile number (+977)', type: 'tel' },
  { key: 'passport_number', label: 'Passport number', type: 'text' },
  { key: 'passport_expiry', label: 'Passport expiry', type: 'date' },
  { key: 'father_name', label: "Father's full name", type: 'text' },
  { key: 'mother_name', label: "Mother's full name", type: 'text' },
  { key: 'citizenship_number', label: 'Citizenship / Nagarikta number', type: 'text' },
  { key: 'national_id_nin', label: 'National ID / NIN (if issued)', type: 'text' },
  { key: 'passport_issue_date', label: 'Passport issue date', type: 'date' },
  { key: 'passport_issue_place', label: 'Passport issue place', type: 'text' },
  { key: 'emergency_contact_name', label: 'Emergency contact full name', type: 'text' },
  { key: 'emergency_contact_relation', label: 'Relationship to applicant', type: 'text' },
  { key: 'emergency_contact_phone', label: 'Emergency contact phone', type: 'tel' },
  { key: 'work_experience_years', label: 'Agricultural / relevant experience (years)', type: 'number' },
];

const selectFields: { key: keyof KycFormValues; label: string; options: string[] }[] = [
  { key: 'marital_status', label: 'Marital status', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
  { key: 'gender', label: 'Gender', options: ['Female', 'Male', 'Other', 'Prefer not to say'] },
  { key: 'education_level', label: 'Highest education level', options: ['Primary', 'Secondary', 'Higher Secondary', 'Diploma / Technical', "Bachelor's", "Master's or above"] },
  { key: 'previous_schengen_visa', label: 'Previous Schengen visa', options: ['No', 'Yes - approved', 'Yes - refused'] },
];

const fieldClass = 'w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-900';

export const MandatoryOnboardingWizard: React.FC<MandatoryOnboardingWizardProps> = ({ candidate, onViewTracker }) => {
  const { uploadCandidateAvatar, uploadCoreDocument, updateCandidateKyc, refreshStore } = usePortalStore();
  const { showToast } = useToast();
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<KycFormValues>(() => getFormValues(candidate));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [targetSlotId, setTargetSlotId] = useState<string | null>(null);
  const [docForSigning, setDocForSigning] = useState<DocumentRecord | null>(null);
  const [compressionBadge, setCompressionBadge] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  const kycSubmitted = candidate.kycStatus === 'submitted';
  const kycVerified = candidate.kycStatus === 'verified';
  const kycRejected = candidate.kycStatus === 'rejected';

  useEffect(() => {
    setForm(getFormValues(candidate));
  }, [candidate.id, candidate.name, candidate.dob, candidate.passportNumber, candidate.passportExpiry, candidate.extendedKyc]);

  const getSlotDocument = (slot: (typeof documentSlots)[number]) => candidate.documents.find((document) => matchesSlot(document, slot));
  const coreRequiredSlots = documentSlots.filter((slot) => slot.required);
  const completedDocuments = coreRequiredSlots.filter((slot) => Boolean(getSlotDocument(slot)?.storagePath)).length;
  const readiness = calculateCandidateReadiness(candidate);
  const dispatchedDocs = candidate.documents.filter((document) => document.isDispatchedByAdmin);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    setCompressionBadge(null);
    try {
      const comp = await compressImageFile(file, { maxWidth: 600, maxHeight: 800, quality: 0.85 });
      if (comp.wasCompressed) setCompressionBadge(comp.badgeText || null);
      await uploadCandidateAvatar(candidate.id, comp.file);
      showToast(comp.wasCompressed ? `Biometric photo optimized & uploaded! (${comp.badgeText})` : 'Biometric profile photo uploaded & submitted for review.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to upload profile photo.', 'error');
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleDocumentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const slot = documentSlots.find((item) => item.id === targetSlotId);
    if (!file || !slot) return;
    const existing = getSlotDocument(slot);
    setCompressionBadge(null);
    try {
      const comp = await compressImageFile(file, { maxWidth: 1800, maxHeight: 2400, quality: 0.82 });
      if (comp.wasCompressed) setCompressionBadge(comp.badgeText || null);
      await uploadCoreDocument(candidate.id, slot.name, slot.category, comp.file, existing?.id);
      showToast(comp.wasCompressed ? `${slot.name} optimized & uploaded! (${comp.badgeText})` : `${slot.name} uploaded for caseworker audit.`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to upload document.', 'error');
    } finally {
      setTargetSlotId(null);
      event.target.value = '';
    }
  };

  const handleKycSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!candidate.avatarStoragePath) {
      showToast('Upload your biometric profile photo before submitting KYC.', 'error');
      setActiveStep(1);
      return;
    }
    const missingField = requiredKycFields.find((key) => !String(form[key] || '').trim());
    if (missingField) {
      showToast('Complete all required identity, family, passport, emergency contact, and experience fields.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateCandidateKyc(candidate.id, {
        name: form.full_name.trim(),
        dob: form.dob.trim(),
        nationality: form.nationality.trim(),
        permanentAddress: form.address.trim(),
        phone: form.phone.trim(),
        passportNumber: form.passport_number.trim().toUpperCase(),
        passportExpiry: form.passport_expiry,
        extendedKyc: {
          father_name: form.father_name.trim(),
          mother_name: form.mother_name.trim(),
          marital_status: form.marital_status,
          gender: form.gender,
          citizenship_number: form.citizenship_number.trim(),
          national_id_nin: form.national_id_nin.trim(),
          passport_issue_date: form.passport_issue_date,
          passport_issue_place: form.passport_issue_place.trim(),
          emergency_contact_name: form.emergency_contact_name.trim(),
          emergency_contact_relation: form.emergency_contact_relation.trim(),
          emergency_contact_phone: form.emergency_contact_phone.trim(),
          education_level: form.education_level,
          work_experience_years: form.work_experience_years,
          work_skills_summary: form.work_skills_summary.trim(),
          previous_schengen_visa: form.previous_schengen_visa,
        },
        workExperienceSummary: form.work_skills_summary.trim(),
      });
      showToast(
        kycRejected
          ? 'Corrected KYC submitted for caseworker audit.'
          : 'Updated KYC submitted for caseworker audit.',
        'success'
      );
    } catch (error) {
      await refreshStore();
      showToast(error instanceof Error ? error.message : 'Unable to submit KYC.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewDocument = async (document: DocumentRecord) => {
    if (!document.storagePath) return;
    const previewTab = window.open('about:blank', '_blank');
    const url = await getSignedDocumentUrl(document.storagePath);
    if (previewTab) previewTab.location.href = url;
  };

  return (
    <section className="space-y-4" aria-label="Mandatory SIRI candidate onboarding">
      <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" /> Mandatory candidate onboarding
            </div>
            <h1 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-slate-100">Dossier &amp; Biometric Readiness</h1>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Complete your photo, Nepal KYC details, and required dossier scans.</p>
          </div>
          <div className="min-w-52 sm:w-64">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Readiness</span><span>{readiness}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={readiness}>
              <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${readiness}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-1 border-b border-slate-200 dark:border-slate-700" role="tablist" aria-label="Onboarding steps">
          {([
            [1, 'Step 1: Biometric Photo & Full KYC'],
            [2, 'Step 2: Mandatory Document Uploads'],
            [3, 'Step 3: Dispatched Contracts & E-Signatures'],
          ] as const).map(([step, title]) => (
            <button
              key={step}
              role="tab"
              aria-selected={activeStep === step}
              onClick={() => setActiveStep(step)}
              className={`min-h-10 border-b-2 px-2 py-2 text-left text-xs font-semibold ${activeStep === step ? 'border-emerald-600 text-emerald-800 dark:text-emerald-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              {title}
            </button>
          ))}
        </div>

        {compressionBadge && (
          <div className="mt-3 flex items-center gap-1.5 rounded-md border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{compressionBadge}</span>
          </div>
        )}

        {activeStep === 1 && (
          <div className="grid grid-cols-1 xl:grid-cols-[250px_1fr] gap-5 pt-4">
            <div className="space-y-3">
              <div className="flex aspect-[4/5] max-h-72 items-center justify-center overflow-hidden rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                {candidate.avatarUrl ? (
                  <img src={candidate.avatarUrl} alt={`${candidate.name} biometric profile`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500"><ImagePlus className="h-8 w-8" /><span className="text-xs">Passport-style photo required</span></div>
                )}
              </div>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 shadow-sm"
              >
                <Upload className="h-4 w-4" /> {isUploadingAvatar ? 'Uploading photo...' : candidate.avatarStoragePath ? '🔄 Replace Biometric Photo' : 'Upload Biometric Photo'}
              </button>

              {kycVerified && (
                <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Identity KYC Verified &amp; Approved</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Your identity records are verified. You can update your details anytime below if corrections are required.
                  </p>
                </div>
              )}

              {kycSubmitted && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <Clock3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>Under Caseworker Audit</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Your KYC submission is currently being reviewed by your caseworker. You can update details below anytime.
                  </p>
                </div>
              )}

              {kycRejected && (
                <div className="rounded-md border border-red-300 bg-red-50 p-3 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span>KYC Requires Correction</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    <strong>Caseworker Note:</strong> {candidate.kycNote || 'Please correct your details and re-submit.'}
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleKycSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {textFields.map((field) => (
                  <label key={field.key} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {field.label}{requiredKycFields.includes(field.key) ? ' *' : ''}
                    <input
                      type={field.type || 'text'}
                      value={form[field.key]}
                      required={requiredKycFields.includes(field.key)}
                      disabled={isSubmitting}
                      onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                      className={`${fieldClass} mt-1`}
                    />
                  </label>
                ))}
                {selectFields.map((field) => (
                  <label key={field.key} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {field.label} *
                    <select
                      value={form[field.key]}
                      required
                      disabled={isSubmitting}
                      onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                      className={`${fieldClass} mt-1`}
                    >
                      <option value="">Select</option>
                      {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                ))}
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 sm:col-span-2">
                  Work skills summary *
                  <textarea
                    value={form.work_skills_summary}
                    required
                    disabled={isSubmitting}
                    onChange={(event) => setForm((current) => ({ ...current, work_skills_summary: event.target.value }))}
                    rows={3}
                    className={`${fieldClass} mt-1`}
                  />
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !candidate.avatarStoragePath}
                  className="rounded-md bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting
                    ? 'Saving KYC...'
                    : kycRejected
                    ? 'Fix & Re-submit KYC'
                    : '💾 Save & Update KYC Information'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-3 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Mandatory SIRI Dossier Document Checklist
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Upload an official PDF or JPG/PNG scan. Seeded text records do not count as uploaded files. You can replace or re-upload files at any time.
                </p>
              </div>
              <a
                href="https://europa.eu/europass/en/create-europass-cv"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-blue-700 underline dark:text-blue-300"
              >
                Create a Europass CV
              </a>
            </div>

            {/* Hidden file input for document uploads */}
            <input
              ref={documentInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={handleDocumentChange}
            />

            {documentSlots.map((slot) => {
              const document = getSlotDocument(slot);
              const hasBinary = Boolean(document?.storagePath);
              const isRejected = document?.status === 'rejected';
              const isVerified = document?.status === 'verified' && hasBinary;
              const label = isRejected
                ? 'Rejected - Correction Required'
                : isVerified
                ? 'Verified'
                : hasBinary
                ? 'Pending Caseworker Audit'
                : 'Missing / Action Required';

              return (
                <div
                  key={slot.id}
                  className={`grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-3 rounded-md border p-3.5 transition-colors ${
                    isRejected
                      ? 'border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                      <FileText className="h-4 w-4 shrink-0 text-emerald-700" />
                      {slot.name}
                      {slot.required ? ' *' : ' (Optional / stage-dependent)'}
                    </div>
                    <div
                      className={`mt-1 inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold ${
                        isRejected
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                          : isVerified
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          : hasBinary
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {isVerified ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : hasBinary ? (
                        <Clock3 className="h-3 w-3" />
                      ) : isRejected ? (
                        <AlertCircle className="h-3 w-3" />
                      ) : null}
                      {label}
                    </div>

                    {isRejected && document?.rejectionReason && (
                      <div className="mt-2 rounded bg-red-100/70 p-2 text-[11px] font-semibold text-red-900 dark:bg-red-950/60 dark:text-red-200 border border-red-200 dark:border-red-800">
                        <strong>Caseworker Note:</strong> {document.rejectionReason}
                      </div>
                    )}

                    {hasBinary && (
                      <p className="mt-1.5 truncate text-[10px] text-slate-500">
                        {document?.filename || document?.name}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {hasBinary && document && (
                      <button
                        type="button"
                        onClick={() => void previewDocument(document)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        👁️ Preview
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setTargetSlotId(slot.id);
                        documentInputRef.current?.click();
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors ${
                        isRejected
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-emerald-700 hover:bg-emerald-800'
                      }`}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {isRejected
                        ? '🔄 Re-upload Corrected File'
                        : hasBinary
                        ? '🔄 Replace / Update File'
                        : 'Upload Official Scan (PDF/JPG)'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-3 pt-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Dispatched Contracts &amp; E-Signatures</h2>
              <p className="mt-1 text-xs text-slate-500">Review caseworker-dispatched documents and submit requested signatures.</p>
            </div>
            {dispatchedDocs.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 dark:border-slate-700">No contracts or documents have been dispatched to your dossier.</div>
            ) : dispatchedDocs.map((document) => (
              <div key={document.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-700">
                <div><div className="text-xs font-bold text-slate-900 dark:text-slate-100">{document.title}</div><div className="mt-1 text-[10px] text-slate-500">Status: {document.status.replaceAll('_', ' ')}</div></div>
                {document.requiresSignature && document.status !== 'verified' && <button type="button" onClick={() => setDocForSigning(document)} className="rounded-md bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800">{document.status === 'signed_pending_review' ? 'Signature Submitted' : 'Review & Sign'}</button>}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <p className="text-[11px] text-slate-500">{readiness === 100 ? 'Required onboarding items are complete.' : `${coreRequiredSlots.length - completedDocuments} required document slot(s) remain.`}</p>
          <button type="button" onClick={onViewTracker} className="rounded-md border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Open Visa Tracker &amp; Dossier</button>
        </div>
      </div>
      <DocumentSigningModal isOpen={Boolean(docForSigning)} onClose={() => setDocForSigning(null)} candidate={candidate} document={docForSigning} />
    </section>
  );
};
