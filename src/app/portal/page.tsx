'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Header } from '@/components/shared/Header';
import { Stepper } from '@/components/portal/Stepper';
import { DocumentUploadCard } from '@/components/portal/DocumentUploadCard';
import { ChecklistCard } from '@/components/portal/ChecklistCard';
import { CandidateProcessPanel } from '@/components/portal/CandidateProcessPanel';
import { SignatureModal } from '@/components/portal/SignatureModal';
import { DocumentSigningModal } from '@/components/portal/DocumentSigningModal';
import { DocPreviewModal } from '@/components/shared/DocPreviewModal';
import { PrivateDossierSummary } from '@/components/shared/PrivateDossierSummary';
import { generateAndDownloadVfsIcs } from '@/lib/icsGenerator';
import { generateDocumentPdf } from '@/lib/pdfGenerator';
import { getSignedDocumentUrl } from '@/lib/supabase';
import { compressImageFile } from '@/utils/imageCompression';
import { CandidateRecord, DocumentRecord, NepalKycDetails } from '@/types';
import {
  Copy,
  Eye,
  EyeOff,
  Building2,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Download,
  PenTool,
  Upload,
  AlertTriangle,
  ShieldCheck,
  MessageSquare,
  Camera,
  Sparkles,
  Send,
  Calendar,
  MapPin,
  HelpCircle,
  FolderOpen,
  Mail,
  Phone,
  Trash2,
  Check,
} from 'lucide-react';

const COUNTRY_DIAL_CODES = [
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+358', country: 'Finland', flag: '🇫🇮' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
  { code: '+36', country: 'Hungary', flag: '🇭🇺' },
  { code: '+40', country: 'Romania', flag: '🇷🇴' },
  { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
];

const formatToDateInput = (val?: string): string => {
  if (!val) return '';
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
};

const extractPhoneParts = (fullPhone?: string): { dialCode: string; number: string } => {
  if (!fullPhone) return { dialCode: '+977', number: '' };
  const clean = fullPhone.trim();
  for (const c of COUNTRY_DIAL_CODES) {
    if (clean.startsWith(c.code)) {
      const rest = clean.slice(c.code.length).replace(/^[- ]+/, '');
      return { dialCode: c.code, number: rest };
    }
  }
  return { dialCode: '+977', number: clean };
};

interface KycFormValues extends NepalKycDetails {
  full_name: string;
  email: string;
  dob: string;
  nationality: string;
  dial_code: string;
  phone_number: string;
  phone: string;
  address: string;
  passport_number: string;
  passport_expiry: string;
  signature_data_url: string;
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

const getFormValues = (candidate: CandidateRecord): KycFormValues => {
  const phoneParts = extractPhoneParts(candidate.phone);
  return {
    full_name: candidate.name || '',
    email: candidate.email || '',
    dob: formatToDateInput(candidate.dob),
    nationality: candidate.nationality || '',
    dial_code: phoneParts.dialCode,
    phone_number: phoneParts.number,
    phone: candidate.phone || '',
    address: candidate.permanentAddress || '',
    passport_number: candidate.passportNumber || '',
    passport_expiry: formatToDateInput(candidate.passportExpiry),
    signature_data_url: candidate.signatureDataUrl || '',
    ...emptyExtendedKyc,
    ...candidate.extendedKyc,
    passport_issue_date: formatToDateInput(candidate.extendedKyc?.passport_issue_date),
    work_skills_summary: candidate.extendedKyc?.work_skills_summary || candidate.workExperienceSummary || '',
  };
};

const coreDocumentSlots = [
  {
    id: 'passport',
    name: 'Passport Bio-Data Scan (Front & Back)',
    category: 'Core Passport',
    aliases: ['passport'],
    required: true,
  },
  {
    id: 'citizenship',
    name: 'Nepalese Citizenship Certificate (Citizenship / National ID)',
    category: 'Core Citizenship',
    aliases: ['citizenship', 'national id'],
    required: true,
  },
  {
    id: 'europass',
    name: 'Official Europass CV / Resume',
    category: 'Core Europass CV',
    aliases: ['europass', 'resume', 'cv'],
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

const matchesSlot = (document: DocumentRecord, slot: (typeof coreDocumentSlots)[number]) => {
  const searchable = `${document.title} ${document.category || ''} ${document.key}`.toLowerCase();
  return slot.aliases.some((alias) => searchable.includes(alias));
};

export default function CandidatePortalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    candidates,
    uploadCandidateAvatar,
    uploadCoreDocument,
    updateCandidateKyc,
    sendDirectMessage,
    markMessagesAsRead,
    saveCandidateSignature,
  } = usePortalStore();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'kyc' | 'documents' | 'appointments' | 'support'>('overview');

  // UI state
  const [maskPassport, setMaskPassport] = useState(true);
  const [activeDocForPreview, setActiveDocForPreview] = useState<DocumentRecord | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [docForSigning, setDocForSigning] = useState<DocumentRecord | null>(null);

  // Avatar upload
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement | null>(null);

  // Slot upload ref
  const [targetSlotId, setTargetSlotId] = useState<string | null>(null);
  const [uploadingSlotId, setUploadingSlotId] = useState<string | null>(null);
  const slotFileInputRef = useRef<HTMLInputElement | null>(null);

  // KYC Form state
  const [kycForm, setKycForm] = useState<KycFormValues | null>(null);
  const [isSavingKyc, setIsSavingKyc] = useState(false);

  // Signature Pad state
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signatureUploadRef = useRef<HTMLInputElement | null>(null);

  // Messaging state
  const [messageInput, setMessageInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Resolve current candidate dynamically from store
  const candidate = user?.candidateId
    ? candidates.find((c) => c.id === user.candidateId)
    : user
    ? candidates.find((c) => c.email.toLowerCase() === user.email.toLowerCase())
    : null;

  // Initialize KYC form when candidate loads/updates
  useEffect(() => {
    if (candidate) {
      setKycForm(getFormValues(candidate));
    }
  }, [
    candidate?.id,
    candidate?.name,
    candidate?.email,
    candidate?.dob,
    candidate?.phone,
    candidate?.passportNumber,
    candidate?.passportExpiry,
    candidate?.signatureDataUrl,
    candidate?.extendedKyc,
    candidate?.workExperienceSummary,
  ]);

  // Mark messages as read when viewing support tab
  useEffect(() => {
    if (candidate && activeTab === 'support') {
      markMessagesAsRead(candidate.id, 'candidate');
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, candidate?.id, markMessagesAsRead]);

  // Authentication & Approval Guards
  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    if (user.role === 'admin') {
      router.push('/admin');
      return;
    }
    if (candidate && candidate.accountStatus !== 'approved') {
      router.push('/pending-approval');
    }
  }, [user, candidate, router]);

  if (!candidate || !kycForm) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`, 'success');
  };

  const handleDownloadCalendar = () => {
    generateAndDownloadVfsIcs(
      candidate.vfsAppointment,
      candidate.name,
      candidate.passportNumber,
      candidate.siriCaseOrder.caseOrderId,
      candidate.employer.name
    );
    showToast('Downloaded VFS Appointment (.ics) calendar event', 'success');
  };

  const handleQuickDownloadDoc = async (doc: DocumentRecord) => {
    showToast(`Generating official PDF for ${doc.title}...`, 'info');
    await generateDocumentPdf(doc, candidate);
    showToast(`Downloaded: ${doc.title}.pdf`, 'success');
  };

  const previewDocument = async (document: DocumentRecord) => {
    if (document.storagePath) {
      const previewTab = window.open('about:blank', '_blank');
      const url = await getSignedDocumentUrl(document.storagePath);
      if (previewTab) previewTab.location.href = url;
    } else {
      setActiveDocForPreview(document);
    }
  };

  // Avatar Photo Upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const comp = await compressImageFile(file, { maxWidth: 600, maxHeight: 800, quality: 0.85 });
      await uploadCandidateAvatar(candidate.id, comp.file);
      showToast(comp.wasCompressed ? `Biometric photo updated! (${comp.badgeText})` : 'Biometric photo updated successfully.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to upload photo.', 'error');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  // Signature Pad Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setKycForm((prev) => (prev ? { ...prev, signature_data_url: dataUrl } : null));
  };

  // Touch handlers for mobile/tablets
  const startTouchDrawing = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = signatureCanvasRef.current;
    if (!canvas || !touch) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    setIsDrawing(true);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const canvas = signatureCanvasRef.current;
    if (!canvas || !touch) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setKycForm((prev) => (prev ? { ...prev, signature_data_url: '' } : null));
  };

  const handleSignatureFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const comp = await compressImageFile(file, { maxWidth: 800, maxHeight: 400, quality: 0.9 });
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setKycForm((prev) => (prev ? { ...prev, signature_data_url: dataUrl } : null));
        showToast('Signature image uploaded and adopted.', 'success');
      };
      reader.readAsDataURL(comp.file);
    } catch {
      showToast('Unable to process signature image.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Document Vault Upload
  const triggerSlotUpload = (slotId: string) => {
    setTargetSlotId(slotId);
    slotFileInputRef.current?.click();
  };

  const handleSlotFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const slot = coreDocumentSlots.find((s) => s.id === targetSlotId);
    if (!file || !slot) return;

    setUploadingSlotId(slot.id);
    const existing = candidate.documents.find((d) => matchesSlot(d, slot));
    try {
      const comp = await compressImageFile(file, { maxWidth: 1800, maxHeight: 2400, quality: 0.82 });
      await uploadCoreDocument(candidate.id, slot.name, slot.category, comp.file, existing?.id);
      showToast(comp.wasCompressed ? `${slot.name} uploaded! (${comp.badgeText})` : `${slot.name} uploaded for caseworker audit.`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to upload document.', 'error');
    } finally {
      setUploadingSlotId(null);
      setTargetSlotId(null);
      e.target.value = '';
    }
  };

  // KYC Save Handler
  const handleSaveKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingKyc(true);
    const combinedPhone = `${kycForm.dial_code}-${kycForm.phone_number.trim()}`;
    const signatureUrl = kycForm.signature_data_url || candidate.signatureDataUrl || '';

    try {
      await updateCandidateKyc(candidate.id, {
        name: kycForm.full_name.trim(),
        email: kycForm.email.trim(),
        dob: kycForm.dob.trim(),
        nationality: kycForm.nationality.trim(),
        permanentAddress: kycForm.address.trim(),
        phone: combinedPhone,
        passportNumber: kycForm.passport_number.trim().toUpperCase(),
        passportExpiry: kycForm.passport_expiry,
        signatureDataUrl: signatureUrl,
        signatureTimestamp: signatureUrl ? new Date().toISOString() : candidate.signatureTimestamp,
        extendedKyc: {
          father_name: kycForm.father_name.trim(),
          mother_name: kycForm.mother_name.trim(),
          marital_status: kycForm.marital_status,
          gender: kycForm.gender,
          citizenship_number: kycForm.citizenship_number.trim(),
          national_id_nin: kycForm.national_id_nin.trim(),
          passport_issue_date: kycForm.passport_issue_date,
          passport_issue_place: kycForm.passport_issue_place.trim(),
          emergency_contact_name: kycForm.emergency_contact_name.trim(),
          emergency_contact_relation: kycForm.emergency_contact_relation.trim(),
          emergency_contact_phone: kycForm.emergency_contact_phone.trim(),
          education_level: kycForm.education_level,
          work_experience_years: kycForm.work_experience_years,
          work_skills_summary: kycForm.work_skills_summary.trim(),
          previous_schengen_visa: kycForm.previous_schengen_visa,
        },
        workExperienceSummary: kycForm.work_skills_summary.trim(),
      });

      if (signatureUrl && signatureUrl !== candidate.signatureDataUrl) {
        saveCandidateSignature(candidate.id, signatureUrl);
      }

      showToast('KYC profile and digital signature updated successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update KYC details.', 'error');
    } finally {
      setIsSavingKyc(false);
    }
  };

  // Send Direct Message to Coordinator
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    setIsSendingMessage(true);
    try {
      await sendDirectMessage(candidate.id, messageInput.trim(), 'candidate', candidate.name);
      setMessageInput('');
      showToast('Message sent to caseworker desk.', 'success');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to send message.', 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Documents requiring candidate signature
  const docsRequiringSignature = candidate.documents.filter(
    (d) => d.requiresSignature && d.status !== 'verified'
  );

  // Unread coordinator messages count
  const unreadMessagesCount =
    candidate.processMeta?.messages?.filter((m) => m.sender === 'coordinator' && !m.read).length || 0;

  // Document Vault Statistics
  const uploadedCoreDocsCount = coreDocumentSlots.filter((slot) =>
    candidate.documents.some((d) => matchesSlot(d, slot) && Boolean(d.storagePath))
  ).length;

  const rejectedDocsCount = candidate.documents.filter((d) => d.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col transition-colors">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* COMPACT CANDIDATE COMMAND HEADER */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Candidate Identity Strip */}
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xl flex items-center justify-center border-2 border-emerald-500/40 shadow-sm">
                  {candidate.avatarUrl ? (
                    <img src={candidate.avatarUrl} alt={`${candidate.name} profile`} className="h-full w-full object-cover" />
                  ) : (
                    candidate.name.split(' ').map((n) => n[0]).join('')
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarFileRef.current?.click()}
                  disabled={isUploadingAvatar}
                  title="Upload / Change Biometric Profile Photo"
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition-transform hover:scale-110 disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                    {candidate.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>SIRI VERIFIED APPLICANT</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Stage {candidate.currentStage}: {candidate.currentStage === 4 ? 'Facial Verification' : candidate.currentStage === 5 ? 'VFS Biometrics' : 'Visa Processing'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{candidate.jobTitle}</span>
                  <span>&middot;</span>
                  <span>{candidate.employer.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">(Sponsor #{candidate.employer.sponsorCode})</span>
                </div>
              </div>
            </div>

            {/* Quick Identifier Chips & Chat Trigger */}
            <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
              {/* Passport Box */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/70 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Passport:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {maskPassport ? `••••${candidate.passportNumber.slice(-4)}` : candidate.passportNumber}
                </span>
                <button
                  onClick={() => setMaskPassport(!maskPassport)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                  title={maskPassport ? 'Reveal passport' : 'Mask passport'}
                >
                  {maskPassport ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => copyToClipboard(candidate.passportNumber, 'Passport Number')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                  title="Copy passport"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Case Order ID Box */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/70 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Case ID:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {candidate.siriCaseOrder.caseOrderId}
                </span>
                <button
                  onClick={() => copyToClipboard(candidate.siriCaseOrder.caseOrderId, 'Case Order ID')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                  title="Copy case order ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Coordinator Support Switch Button */}
              <button
                type="button"
                onClick={() => setActiveTab('support')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border transition-all ${
                  activeTab === 'support'
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Caseworker Desk</span>
                {unreadMessagesCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 5-TAB HORIZONTAL NAVIGATION BAR */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-1.5 shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <nav className="flex space-x-1 min-w-max" aria-label="Portal Navigation Tabs">
            {[
              { id: 'overview', label: '🏠 Overview & Stage', badge: null },
              {
                id: 'kyc',
                label: '🪪 Edit KYC Profile',
                badge:
                  candidate.kycStatus === 'verified'
                    ? 'Verified'
                    : candidate.kycStatus === 'rejected'
                    ? 'Fix Needed'
                    : 'Audit Pending',
                badgeColor:
                  candidate.kycStatus === 'verified'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : candidate.kycStatus === 'rejected'
                    ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
              },
              {
                id: 'documents',
                label: '📁 Documents Vault',
                badge: `${uploadedCoreDocsCount}/${coreDocumentSlots.length}`,
                badgeColor:
                  rejectedDocsCount > 0
                    ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
              },
              {
                id: 'appointments',
                label: '📅 Zoom & Appointments',
                badge: 'Stage 4 & 5',
                badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
              },
              {
                id: 'support',
                label: '💬 Coordinator Support',
                badge: unreadMessagesCount > 0 ? `${unreadMessagesCount} New` : null,
                badgeColor: 'bg-red-600 text-white animate-pulse',
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : tab.badgeColor
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* TAB 1: OVERVIEW & STAGE */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Stepper */}
            <Stepper candidate={candidate} />

            {/* Documents Requiring Signature Banner */}
            {docsRequiringSignature.length > 0 && (
              <div className="p-5 rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200">
                      Official Documents Awaiting Your Digital Signature ({docsRequiringSignature.length})
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    Action Required
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {docsRequiringSignature.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {doc.title}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {doc.docId} &middot; Issued by Caseworker Desk
                        </div>
                      </div>

                      <button
                        onClick={() => setDocForSigning(doc)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1 flex-shrink-0"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>{doc.status === 'signed_pending_review' ? 'Re-sign' : 'Review & Sign'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Statutory Overview 2-Widget Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Widget 1: SIRI Case Order ID */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t('siriCaseWidgetTitle')}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      ACTIVE CASE
                    </span>
                  </div>
                  <div className="flex items-center gap-2 my-2">
                    <span className="text-xl font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                      {candidate.siriCaseOrder.caseOrderId}
                    </span>
                    <button
                      onClick={() => copyToClipboard(candidate.siriCaseOrder.caseOrderId, 'Case Order ID')}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mt-3">
                    <div><strong>Scheme:</strong> {candidate.siriCaseOrder.scheme}</div>
                    <div><strong>Registry:</strong> {candidate.siriCaseOrder.caseRegistry}</div>
                  </div>
                </div>
              </div>

              {/* Widget 2: VFS Global Appointment Desk */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t('vfsWidgetTitle')}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {t('vfsStatus')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 my-2">
                    <span className="text-xl font-mono font-extrabold text-blue-600 dark:text-blue-400">
                      {candidate.vfsAppointment.refNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(candidate.vfsAppointment.refNumber, 'VFS Reference')}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 mt-2">
                    <div><strong>Center:</strong> {candidate.vfsAppointment.centerName} ({candidate.vfsAppointment.address})</div>
                    <div><strong>Slot:</strong> {candidate.vfsAppointment.appointmentDate}</div>
                    <div><strong>Requirement:</strong> In-person Biometrics &amp; Original Passport Presentation</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleDownloadCalendar}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t('addToCalendar')}</span>
                  </button>
                  <a
                    href={candidate.vfsAppointment.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>{t('viewOnMaps')}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Danish Employer & Sponsor Registry Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t('employerRegistry')}
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  CVR ACTIVE &middot; SIRI FAST-TRACK VERIFIED
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('cvr')}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                    {candidate.employer.cvr}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('sponsorCode')}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                    {candidate.employer.sponsorCode}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('registeredOffice')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block truncate">
                    {candidate.employer.address}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('collectiveTerms')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                    {candidate.employer.monthlySalary} / mo (37 hrs)
                  </span>
                </div>
              </div>
            </div>

            {/* Dossier Summary & Print Section */}
            <PrivateDossierSummary candidate={candidate} />

            {/* Pre-departure Checklist */}
            <ChecklistCard />
          </div>
        )}

        {/* TAB 2: EDIT KYC PROFILE (DIRECTLY EMBEDDED, UNLOCKED) */}
        {activeTab === 'kyc' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            {/* Header Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Statutory Nepal KYC &amp; Identity Ledger</span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  Candidate KYC Profile &amp; Biometrics
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ensure all details match your Passport and Citizenship certificate exactly. Edits are directly updated in the cloud registry.
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {candidate.kycStatus === 'verified' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verified by Caseworker Desk</span>
                  </div>
                )}
                {candidate.kycStatus === 'submitted' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Under Caseworker Audit</span>
                  </div>
                )}
                {candidate.kycStatus === 'rejected' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs font-bold border border-red-300 dark:border-red-800">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Correction Required</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Note Warning if applicable */}
            {candidate.kycStatus === 'rejected' && candidate.kycNote && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-xs text-red-800 dark:text-red-200">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Caseworker Feedback:</span>
                </div>
                <p className="leading-relaxed">{candidate.kycNote}</p>
              </div>
            )}

            {/* 1. DEDICATED INLINE PROFILE PHOTO UPLOADER CARD */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-2xl flex items-center justify-center border-2 border-emerald-500/50 shadow-sm shrink-0">
                  {candidate.avatarUrl ? (
                    <img src={candidate.avatarUrl} alt={`${candidate.name} biometric profile`} className="h-full w-full object-cover" />
                  ) : (
                    candidate.name.split(' ').map((n) => n[0]).join('')
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Biometric Profile Photo</span>
                    {candidate.avatarUrl && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Uploaded
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                    High-resolution passport-style photo. White background preferred. Supported formats: JPG, PNG, WebP up to 5MB. Files are automatically optimized.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => avatarFileRef.current?.click()}
                disabled={isUploadingAvatar}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all shrink-0 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>{isUploadingAvatar ? 'Optimizing & Uploading...' : '📷 Upload / Change Profile Photo'}</span>
              </button>
            </div>

            {/* Full Editable Form */}
            <form onSubmit={handleSaveKyc} className="space-y-6">
              {/* Group 1: Personal & Primary Identity */}
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                  1. Personal &amp; Contact Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Legal Name *
                    <input
                      type="text"
                      required
                      value={kycForm.full_name}
                      onChange={(e) => setKycForm({ ...kycForm, full_name: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email ID *
                    <div className="relative mt-1">
                      <input
                        type="email"
                        required
                        value={kycForm.email}
                        onChange={(e) => setKycForm({ ...kycForm, email: e.target.value })}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                      />
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </label>

                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Date of Birth *
                    <input
                      type="date"
                      required
                      value={kycForm.dob}
                      onChange={(e) => setKycForm({ ...kycForm, dob: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nationality *
                    <input
                      type="text"
                      required
                      value={kycForm.nationality}
                      onChange={(e) => setKycForm({ ...kycForm, nationality: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Gender *
                    <select
                      value={kycForm.gender}
                      onChange={(e) => setKycForm({ ...kycForm, gender: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Marital Status *
                    <select
                      value={kycForm.marital_status}
                      onChange={(e) => setKycForm({ ...kycForm, marital_status: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </label>

                  {/* Comprehensive Country Dial Code + Mobile Phone */}
                  <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Mobile Phone &amp; Country Code *
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={kycForm.dial_code}
                        onChange={(e) => setKycForm({ ...kycForm, dial_code: e.target.value })}
                        className="w-full sm:w-60 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium"
                      >
                        {COUNTRY_DIAL_CODES.map((c) => (
                          <option key={`${c.country}-${c.code}`} value={c.code}>
                            {c.flag} {c.country} ({c.code})
                          </option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 9801234567"
                          value={kycForm.phone_number}
                          onChange={(e) => setKycForm({ ...kycForm, phone_number: e.target.value })}
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono"
                        />
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>
                  </div>

                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 sm:col-span-2 lg:col-span-3">
                    Permanent Address in Nepal *
                    <input
                      type="text"
                      required
                      value={kycForm.address}
                      onChange={(e) => setKycForm({ ...kycForm, address: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>
                </div>
              </div>

              {/* Group 2: Passport & Statutory ID */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                  2. Passport &amp; Statutory Identifiers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Passport Number *
                    <input
                      type="text"
                      required
                      value={kycForm.passport_number}
                      onChange={(e) => setKycForm({ ...kycForm, passport_number: e.target.value.toUpperCase() })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-mono uppercase text-slate-900 dark:text-slate-100"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Passport Expiry Date *
                    <input
                      type="date"
                      required
                      value={kycForm.passport_expiry}
                      onChange={(e) => setKycForm({ ...kycForm, passport_expiry: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Passport Issue Date
                    <input
                      type="date"
                      value={kycForm.passport_issue_date}
                      onChange={(e) => setKycForm({ ...kycForm, passport_issue_date: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Passport Issue Place
                    <input
                      type="text"
                      placeholder="e.g. Kathmandu"
                      value={kycForm.passport_issue_place}
                      onChange={(e) => setKycForm({ ...kycForm, passport_issue_place: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Citizenship Number *
                    <input
                      type="text"
                      required
                      value={kycForm.citizenship_number}
                      onChange={(e) => setKycForm({ ...kycForm, citizenship_number: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    National ID / NIN (if issued)
                    <input
                      type="text"
                      value={kycForm.national_id_nin}
                      onChange={(e) => setKycForm({ ...kycForm, national_id_nin: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>
                </div>
              </div>

              {/* Group 3: Family & Emergency Contact */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                  3. Family &amp; Emergency Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Father&apos;s Full Name *
                    <input
                      type="text"
                      required
                      value={kycForm.father_name}
                      onChange={(e) => setKycForm({ ...kycForm, father_name: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mother&apos;s Full Name *
                    <input
                      type="text"
                      required
                      value={kycForm.mother_name}
                      onChange={(e) => setKycForm({ ...kycForm, mother_name: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Emergency Contact Name *
                    <input
                      type="text"
                      required
                      value={kycForm.emergency_contact_name}
                      onChange={(e) => setKycForm({ ...kycForm, emergency_contact_name: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Emergency Contact Relationship *
                    <input
                      type="text"
                      required
                      placeholder="e.g. Brother, Spouse"
                      value={kycForm.emergency_contact_relation}
                      onChange={(e) => setKycForm({ ...kycForm, emergency_contact_relation: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Emergency Contact Phone *
                    <input
                      type="tel"
                      required
                      value={kycForm.emergency_contact_phone}
                      onChange={(e) => setKycForm({ ...kycForm, emergency_contact_phone: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>
                </div>
              </div>

              {/* Group 4: Education & Experience */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                  4. Qualifications &amp; Work Background
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Highest Education Level *
                    <select
                      value={kycForm.education_level}
                      onChange={(e) => setKycForm({ ...kycForm, education_level: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select Education</option>
                      <option value="Primary">Primary</option>
                      <option value="Secondary">Secondary</option>
                      <option value="Higher Secondary">Higher Secondary</option>
                      <option value="Diploma / Technical">Diploma / Technical</option>
                      <option value="Bachelor's">Bachelor&apos;s</option>
                      <option value="Master's or above">Master&apos;s or above</option>
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Relevant Work Experience (Years) *
                    <input
                      type="number"
                      required
                      min={0}
                      max={40}
                      value={kycForm.work_experience_years}
                      onChange={(e) => setKycForm({ ...kycForm, work_experience_years: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Previous Schengen Travel *
                    <select
                      value={kycForm.previous_schengen_visa}
                      onChange={(e) => setKycForm({ ...kycForm, previous_schengen_visa: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select Option</option>
                      <option value="No">No previous Schengen visa</option>
                      <option value="Yes - approved">Yes - previously approved</option>
                      <option value="Yes - refused">Yes - previously refused</option>
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 sm:col-span-2 lg:col-span-3">
                    Work Experience &amp; Skills Summary *
                    <textarea
                      required
                      rows={3}
                      value={kycForm.work_skills_summary}
                      onChange={(e) => setKycForm({ ...kycForm, work_skills_summary: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>
                </div>
              </div>

              {/* 5. DIGITAL SIGNATURE PAD & UPLOADER SECTION */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                      <span>5. Candidate Digital Signature *</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Provide your official electronic signature to be stamped on Danish visa petitions and employment contracts.
                    </p>
                  </div>

                  {/* Mode Switcher */}
                  <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setSignatureMode('draw')}
                      className={`px-3 py-1 rounded font-bold transition-all ${
                        signatureMode === 'draw'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Draw Signature
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureMode('upload')}
                      className={`px-3 py-1 rounded font-bold transition-all ${
                        signatureMode === 'upload'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Upload Signature
                    </button>
                  </div>
                </div>

                {/* Draw Canvas Mode */}
                {signatureMode === 'draw' && (
                  <div className="space-y-2">
                    <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white p-2">
                      <canvas
                        ref={signatureCanvasRef}
                        width={600}
                        height={180}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startTouchDrawing}
                        onTouchMove={drawTouch}
                        onTouchEnd={stopDrawing}
                        className="w-full h-36 bg-white cursor-crosshair touch-none rounded-lg"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        Sign inside the box using your mouse, trackpad, or touch screen.
                      </span>
                      <button
                        type="button"
                        onClick={clearSignatureCanvas}
                        className="px-3 py-1 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Image Mode */}
                {signatureMode === 'upload' && (
                  <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-6 text-center space-y-3">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Upload Your Signed Signature Image
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                        Photograph or scan your handwritten signature on blank white paper. Formats: PNG, JPG, WebP.
                      </p>
                    </div>
                    <input
                      ref={signatureUploadRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleSignatureFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => signatureUploadRef.current?.click()}
                      className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      Select Signature Image
                    </button>
                  </div>
                )}

                {/* Current Active Signature Preview Box */}
                {kycForm.signature_data_url && (
                  <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-44 rounded-lg bg-white border border-emerald-200 dark:border-emerald-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
                        <img
                          src={kycForm.signature_data_url}
                          alt="Signature Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Active Signature Ready to Save</span>
                        </div>
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                          This signature will be stamped on your official dossier and submitted to the caseworker desk.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearSignatureCanvas}
                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-semibold self-end sm:self-auto"
                    >
                      Remove / Retake
                    </button>
                  </div>
                )}
              </div>

              {/* Prominent Save Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Click save to submit your updated identity profile directly to your caseworker for statutory verification.
                </p>
                <button
                  type="submit"
                  disabled={isSavingKyc}
                  className="px-6 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSavingKyc ? 'Saving Information...' : '💾 Save & Update KYC Information'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: DOCUMENTS VAULT */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Header Strip */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400">
                  <FolderOpen className="h-4 w-4" />
                  <span>Official SIRI &amp; Employer Document Vault</span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  Required Statutory Dossier Files
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload official scans (PDF or JPG/PNG). You can preview, replace, or update any file at any time.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="https://europa.eu/europass/en/create-europass-cv"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline inline-flex items-center gap-1"
                >
                  <span>Build Europass CV &rarr;</span>
                </a>
              </div>
            </div>

            {/* 6 Core Document Slots */}
            <div className="grid grid-cols-1 gap-4">
              {coreDocumentSlots.map((slot) => {
                const doc = candidate.documents.find((d) => matchesSlot(d, slot));
                const hasBinary = Boolean(doc?.storagePath);
                const isRejected = doc?.status === 'rejected';
                const isVerified = doc?.status === 'verified' && hasBinary;
                const isUploading = uploadingSlotId === slot.id;

                return (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-xl border bg-white dark:bg-slate-900 transition-all shadow-sm ${
                      isRejected
                        ? 'border-red-300 dark:border-red-800 bg-red-50/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {slot.name}
                          </span>
                          {slot.required ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              Required
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              Optional / Stage-dependent
                            </span>
                          )}
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center gap-2 pt-0.5">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verified by Caseworker Desk</span>
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Correction Required</span>
                            </span>
                          ) : hasBinary ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Uploaded &middot; Pending Caseworker Audit</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>No File Uploaded Yet</span>
                            </span>
                          )}
                        </div>

                        {/* Filename information */}
                        {hasBinary && (
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            File: {doc?.filename || doc?.name || 'Document scan'}
                          </div>
                        )}

                        {/* Rejection Note Callout */}
                        {isRejected && doc?.rejectionReason && (
                          <div className="mt-2 p-2.5 rounded-lg bg-red-100/70 dark:bg-red-950/60 text-xs text-red-900 dark:text-red-200 border border-red-200 dark:border-red-800">
                            <strong>Caseworker Note:</strong> {doc.rejectionReason}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {hasBinary && doc && (
                          <button
                            type="button"
                            onClick={() => void previewDocument(doc)}
                            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => triggerSlotUpload(slot.id)}
                          disabled={isUploading}
                          className={`px-3.5 py-2 text-xs font-bold rounded-lg text-white shadow-sm flex items-center gap-1.5 transition-colors ${
                            isRejected
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-emerald-700 hover:bg-emerald-800'
                          } disabled:opacity-50`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            {isUploading
                              ? 'Uploading...'
                              : isRejected
                              ? '🔄 Re-upload Corrected File'
                              : hasBinary
                              ? '🔄 Replace File'
                              : '📤 Upload File'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dispatched Contracts / Additional Documents Section */}
            {candidate.documents.filter((d) => d.isDispatchedByAdmin).length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Dispatched Contracts &amp; Agency Documents
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {candidate.documents
                    .filter((d) => d.isDispatchedByAdmin)
                    .map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {doc.title}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Status: {doc.status.replaceAll('_', ' ')}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {doc.requiresSignature && doc.status !== 'verified' && (
                            <button
                              onClick={() => setDocForSigning(doc)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                              <span>{doc.status === 'signed_pending_review' ? 'Re-sign' : 'Sign'}</span>
                            </button>
                          )}
                          <button
                            onClick={() => void previewDocument(doc)}
                            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* General Dropzone Upload */}
            <DocumentUploadCard />
          </div>
        )}

        {/* TAB 4: ZOOM & APPOINTMENTS (STAGE 4 & 5) */}
        {activeTab === 'appointments' && (
          <div className="space-y-5">
            <CandidateProcessPanel candidate={candidate} />
          </div>
        )}

        {/* TAB 5: COORDINATOR SUPPORT (INLINE TWO-WAY MESSAGING) */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Main Chat Thread */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-[600px]">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                    DK
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      SIRI &amp; Agency Caseworker Desk
                    </h2>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Dedicated Caseworker Active &middot; SLA 2-4 Hours</span>
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400">
                  Ref: {candidate.siriCaseOrder.caseOrderId}
                </span>
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
                {(!candidate.processMeta?.messages || candidate.processMeta.messages.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs">No direct messages yet.</p>
                    <p className="text-[11px] text-slate-500 max-w-sm">
                      Send a message to your caseworker regarding your KYC verification, document uploads, or interview appointment.
                    </p>
                  </div>
                ) : (
                  candidate.processMeta.messages.map((msg) => {
                    const isCandidate = msg.sender === 'candidate';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCandidate ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {isCandidate ? 'You' : msg.senderName || 'Caseworker Desk'}
                          </span>
                          <span>&middot;</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                            isCandidate
                              ? 'bg-emerald-700 text-white rounded-br-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex items-center gap-2 overflow-x-auto text-[11px]">
                <span className="text-slate-400 font-semibold shrink-0">Quick prompts:</span>
                {[
                  'I have updated my KYC details.',
                  'When will my Zoom interview be scheduled?',
                  'Please confirm receipt of my documents.',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMessageInput(prompt)}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message to your caseworker..."
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
                />
                <button
                  type="submit"
                  disabled={isSendingMessage || !messageInput.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>

            {/* Sidebar: Coordination Info */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Caseworker Contact Details
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Handling Desk</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      SIRI Fast-Track Coordination Team
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Office Hours</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      Monday &ndash; Friday: 08:30 &ndash; 16:30 CET
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Email Desk</span>
                    <a
                      href="mailto:support@denmarkrecruiter.dk"
                      className="font-mono text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      support@denmarkrecruiter.dk
                    </a>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Emergency Helpline</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      +45 70 80 90 00
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  <strong>Agency Note:</strong> All communications through this channel are logged into your official dossier audit trail.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Hidden File Input for Biometric Avatar Photo */}
      <input
        ref={avatarFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      {/* Hidden File Input for Document Vault Slots */}
      <input
        ref={slotFileInputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={handleSlotFileChange}
      />

      {/* Signature Pad Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
      />

      {/* Two-Way Document Signing Modal */}
      <DocumentSigningModal
        isOpen={!!docForSigning}
        onClose={() => setDocForSigning(null)}
        candidate={candidate}
        document={docForSigning}
      />

      {/* Document Preview Modal */}
      <DocPreviewModal
        doc={activeDocForPreview}
        candidate={candidate}
        isOpen={!!activeDocForPreview}
        onClose={() => setActiveDocForPreview(null)}
        onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
      />
    </div>
  );
}
