'use client';

import React, { useEffect, useState } from 'react';
import { CandidateProcessMetadata, CandidateRecord } from '@/types';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useToast } from '@/context/ToastContext';
import { getSignedDocumentUrl } from '@/lib/supabase';
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  MessageCircle,
  Send,
  Video,
  Copy,
  AlertTriangle,
  Building2,
  DollarSign,
  Sparkles,
  PenTool,
} from 'lucide-react';
import { OfficialContractGeneratorModal } from './OfficialContractGeneratorModal';

interface AdminCaseToolsProps {
  candidate: CandidateRecord;
  actor: string;
  activeTab?: 'overview' | 'financial' | 'interviews' | 'all';
}

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/80 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all';

const notificationPresets = {
  'KYC Approved':
    'Your statutory identity and biometric KYC clearance has been approved by the SIRI caseworker desk.',
  'Action Required: Upload Documents':
    'Please review your profile details and upload any missing documents in your candidate portal.',
  'Zoom Facial Verification Scheduled':
    'Your Stage 4 Live Zoom Facial Verification is scheduled. Review the meeting details and preparation notes in your candidate portal.',
  'Contract Dispatched for Signature':
    'An official employment contract and placement accord has been dispatched. Please review and electronically sign in your portal.',
  'Subscription Receipt Verified':
    'Your €45 subscription receipt has been verified and your Denbar account is approved.',
  'Stage 5 Biometrics Confirmed':
    'Your Stage 5 Embassy / VFS Global Biometrics appointment is confirmed. Bring your original passport and printed appointment slip.',
  'Custom Agency Notice': '',
};

const RECEIPT_REJECTION_CHIPS = [
  'Invalid / Unverifiable Payment Transaction ID',
  'Blurry / Illegible Receipt Screenshot',
  'Amount Does Not Match €45 Statutory Fee',
  'Payment Date Outside Permitted Cycle',
  'Payer Name Does Not Match Applicant',
];

export const AdminCaseTools: React.FC<AdminCaseToolsProps> = ({ candidate, actor, activeTab = 'all' }) => {
  const {
    updateCandidateAgencyDetails,
    reviewServiceFeeReceipt,
    updateCandidateProcessMeta,
    sendCandidateNotification,
    adminCrmMetadata,
    saveAdminCrmMetadata,
  } = usePortalStore();
  const { showToast } = useToast();

  const [balance, setBalance] = useState(candidate.denbarAccount?.amount || '€900.00');
  const [feeStatus, setFeeStatus] = useState(
    candidate.actionRequired?.subscription || candidate.denbarAccount?.status || '€45 Pending'
  );
  const [sponsorCode, setSponsorCode] = useState(candidate.employer.sponsorCode || '#944135');
  const [caseOrderId, setCaseOrderId] = useState(candidate.siriCaseOrder.caseOrderId || '');
  const [employerName, setEmployerName] = useState(candidate.employer.name || '');
  const [rejectReceiptReason, setRejectReceiptReason] = useState(RECEIPT_REJECTION_CHIPS[0]);

  // Stage 4 Zoom Scheduler
  const [meetingUrl, setMeetingUrl] = useState(candidate.processMeta?.videoInterview?.meetingUrl || '');
  const [meetingId, setMeetingId] = useState(candidate.processMeta?.videoInterview?.meetingId || '');
  const [passcode, setPasscode] = useState(candidate.processMeta?.videoInterview?.passcode || '');
  const [interviewAt, setInterviewAt] = useState(candidate.processMeta?.videoInterview?.scheduledAt || '');
  const [interviewCoordinator, setInterviewCoordinator] = useState(
    candidate.processMeta?.videoInterview?.coordinatorName || actor
  );
  const [preparationNotes, setPreparationNotes] = useState(
    candidate.processMeta?.videoInterview?.preparationNotes ||
      'Please have your original passport in hand. Ensure adequate lighting and quiet room for high-definition biometric verification.'
  );

  // Stage 5 VFS Scheduler
  const [centerLocation, setCenterLocation] = useState(
    candidate.processMeta?.applicationCenter?.location || 'VFS Global Kathmandu, Chhaya Center 3rd Floor, Thamel'
  );
  const [appointmentAt, setAppointmentAt] = useState(
    candidate.processMeta?.applicationCenter?.scheduledAt || ''
  );
  const [appointmentRef, setAppointmentRef] = useState(
    candidate.processMeta?.applicationCenter?.referenceCode || `VFS-KTM-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [appointmentNotes, setAppointmentNotes] = useState(
    candidate.processMeta?.applicationCenter?.documentNotes ||
      'Mandatory: Original Nepalese Passport, Printed SIRI Biometrics Authorization, 2 passport photos, and printed appointment slip.'
  );

  // Notice & WhatsApp
  const [preset, setPreset] = useState<keyof typeof notificationPresets>('KYC Approved');
  const [noticeTitle, setNoticeTitle] = useState('KYC Approved');
  const [noticeMessage, setNoticeMessage] = useState(notificationPresets['KYC Approved']);

  // CRM
  const [coordinatorNotes, setCoordinatorNotes] = useState(adminCrmMetadata[candidate.id]?.notes || '');
  const [priority, setPriority] = useState<string>(
    adminCrmMetadata[candidate.id]?.priority || 'Normal'
  );

  // Document Generator
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    setBalance(candidate.denbarAccount?.amount || '€900.00');
    setFeeStatus(candidate.actionRequired?.subscription || candidate.denbarAccount?.status || '€45 Pending');
    setSponsorCode(candidate.employer.sponsorCode || '#944135');
    setCaseOrderId(candidate.siriCaseOrder.caseOrderId || '');
    setEmployerName(candidate.employer.name || '');
    setMeetingUrl(candidate.processMeta?.videoInterview?.meetingUrl || '');
    setMeetingId(candidate.processMeta?.videoInterview?.meetingId || '');
    setPasscode(candidate.processMeta?.videoInterview?.passcode || '');
    setInterviewAt(candidate.processMeta?.videoInterview?.scheduledAt || '');
    setInterviewCoordinator(candidate.processMeta?.videoInterview?.coordinatorName || actor);
    setPreparationNotes(
      candidate.processMeta?.videoInterview?.preparationNotes ||
        'Please have your original passport in hand. Ensure adequate lighting and quiet room for high-definition biometric verification.'
    );
    setCenterLocation(
      candidate.processMeta?.applicationCenter?.location || 'VFS Global Kathmandu, Chhaya Center 3rd Floor, Thamel'
    );
    setAppointmentAt(candidate.processMeta?.applicationCenter?.scheduledAt || '');
    setAppointmentRef(
      candidate.processMeta?.applicationCenter?.referenceCode || `VFS-KTM-${Math.floor(100000 + Math.random() * 900000)}`
    );
    setAppointmentNotes(
      candidate.processMeta?.applicationCenter?.documentNotes ||
        'Mandatory: Original Nepalese Passport, Printed SIRI Biometrics Authorization, 2 passport photos, and printed appointment slip.'
    );
    setCoordinatorNotes(adminCrmMetadata[candidate.id]?.notes || '');
    setPriority(adminCrmMetadata[candidate.id]?.priority || 'Normal');
  }, [
    candidate.id,
    candidate.processMeta,
    candidate.denbarAccount,
    candidate.actionRequired,
    candidate.employer,
    candidate.siriCaseOrder,
    adminCrmMetadata,
    actor,
  ]);

  const receipt = candidate.documents.find((document) => document.category === 'subscription_receipt');
  const transaction = receipt?.transactionDetails || candidate.processMeta?.serviceFeeTransaction;

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setIsWorking(true);
    try {
      await action();
      showToast(successMessage, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save this update.', 'error');
    } finally {
      setIsWorking(false);
    }
  };

  const saveFinancials = () =>
    runAction(
      () =>
        updateCandidateAgencyDetails(
          candidate.id,
          {
            balance,
            status: feeStatus,
            sponsorCode,
            caseOrderId,
            employerName,
          },
          actor
        ),
      'Financial & employer account details saved successfully.'
    );

  const previewReceipt = async () => {
    if (!receipt?.storagePath) return;
    const opened = window.open('about:blank', '_blank');
    const url = await getSignedDocumentUrl(receipt.storagePath);
    if (opened) opened.location.href = url;
  };

  const approveReceipt = () =>
    runAction(
      () => reviewServiceFeeReceipt(candidate.id, true, undefined, actor),
      'Receipt approved as €45 Paid & Verified. Candidate notified.'
    );

  const rejectReceipt = () =>
    runAction(
      () => reviewServiceFeeReceipt(candidate.id, false, rejectReceiptReason, actor),
      'Receipt returned for correction with notice.'
    );

  const saveInterview = () => {
    if (!meetingUrl.startsWith('https://') || !interviewAt) {
      showToast('Enter a valid https:// meeting URL and a scheduled date/time.', 'error');
      return;
    }
    const details = {
      meetingUrl,
      meetingId,
      passcode,
      scheduledAt: interviewAt,
      coordinatorName: interviewCoordinator,
      preparationNotes,
    };
    void runAction(async () => {
      await updateCandidateProcessMeta(candidate.id, { videoInterview: details }, actor);
      await sendCandidateNotification(
        candidate.id,
        'Stage 4 Zoom Facial Verification Scheduled',
        `Your Live Zoom Facial Verification is scheduled for ${new Date(interviewAt).toLocaleString()}. Meeting Link: ${meetingUrl}. Check portal for details.`,
        actor
      );
    }, 'Stage 4 Zoom Facial Interview dispatched to candidate portal.');
  };

  const saveAppointment = () => {
    if (!centerLocation.trim() || !appointmentAt || !appointmentRef.trim()) {
      showToast('Enter the center venue, date/time, and reference code.', 'error');
      return;
    }
    const details = {
      location: centerLocation.trim(),
      scheduledAt: appointmentAt,
      referenceCode: appointmentRef.trim(),
      documentNotes: appointmentNotes.trim(),
    };
    void runAction(async () => {
      await updateCandidateProcessMeta(candidate.id, { applicationCenter: details }, actor);
      await sendCandidateNotification(
        candidate.id,
        'Stage 5 Embassy / VFS Biometrics Scheduled',
        `Your biometric appointment at ${details.location} is set for ${new Date(details.scheduledAt).toLocaleString()}. Ref: ${details.referenceCode}. Bring original passport and appointment slip.`,
        actor
      );
    }, 'Stage 5 Biometrics Appointment saved and candidate notified.');
  };

  const handlePreset = (value: keyof typeof notificationPresets) => {
    setPreset(value);
    setNoticeTitle(value);
    setNoticeMessage(notificationPresets[value]);
  };

  const sendNotice = async () => {
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      showToast('Enter a notification title and message.', 'error');
      return;
    }
    const phone = (candidate.phone || '').replace(/[^0-9]/g, '');
    const whatsappWindow = phone ? window.open('about:blank', '_blank') : null;
    await runAction(async () => {
      await sendCandidateNotification(candidate.id, noticeTitle.trim(), noticeMessage.trim(), actor);
      if (whatsappWindow && phone) {
        whatsappWindow.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(
          `🇩🇰 SIRI Official Update · ${candidate.name}\n\n*${noticeTitle.trim()}*\n${noticeMessage.trim()}\n\nCandidate Portal: https://denmarkrecruiter.netlify.app/`
        )}`;
      }
    }, 'Official notification sent to candidate portal and WhatsApp.');
    if (!phone) showToast('No phone number saved; portal notification sent only.', 'info');
  };

  const saveCrm = () =>
    runAction(
      () =>
        saveAdminCrmMetadata(candidate.id, {
          notes: coordinatorNotes.trim(),
          priority: (priority as any) || 'Normal',
        }),
      'Private caseworker CRM notes and priority saved.'
    );

  const copyWelcomeSummary = async () => {
    const summary = `🇩🇰 Danish Immigration & Candidate Portal · Official Onboarding
Candidate: ${candidate.name}
Portal URL: https://denmarkrecruiter.netlify.app/
Registered Email: ${candidate.email}
Case Order ID: ${candidate.siriCaseOrder?.caseOrderId || 'Assigned'}
Sponsor Code: ${candidate.employer?.sponsorCode || '#944135'}
Visa Scheme: ${candidate.jobTitle}
Status: Active in SIRI Caseworker Queue
Please log in to complete your KYC declaration and review official documents.`;
    await navigator.clipboard.writeText(summary);
    showToast('Copied WhatsApp Welcome & Login Card to clipboard!', 'success');
  };

  const showFinancial = activeTab === 'all' || activeTab === 'financial';
  const showInterviews = activeTab === 'all' || activeTab === 'interviews';
  const showCrm = activeTab === 'all' || activeTab === 'overview';

  return (
    <div className="space-y-6">
      {/* Tab 3: Financial & Subscription Receipt Verification Manager */}
      {showFinancial && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.08] pb-3">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>Sponsoring Employer &amp; Relocation Account Setup</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Set candidate relocation balance, SIRI case order, and employer registry details.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                {feeStatus}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Denbar Sponsored Relocation Balance
                <input value={balance} onChange={(e) => setBalance(e.target.value)} className={inputClass} />
              </label>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Subscription Fee Status
                <select value={feeStatus} onChange={(e) => setFeeStatus(e.target.value)} className={inputClass}>
                  <option value="€45 Pending">€45 Pending</option>
                  <option value="€45 Paid & Verified">€45 Paid &amp; Verified</option>
                  <option value="€45 Rejected (Action Required)">€45 Rejected (Action Required)</option>
                  <option value="Waived / Fully Sponsored">Waived / Fully Sponsored</option>
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Sponsor Registry Code
                <input value={sponsorCode} onChange={(e) => setSponsorCode(e.target.value)} className={inputClass} />
              </label>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                SIRI Case Order ID
                <input value={caseOrderId} onChange={(e) => setCaseOrderId(e.target.value)} className={inputClass} />
              </label>
              <label className="sm:col-span-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Sponsoring Employer Name
                <input value={employerName} onChange={(e) => setEmployerName(e.target.value)} className={inputClass} />
              </label>
            </div>

            <button
              type="button"
              disabled={isWorking}
              onClick={saveFinancials}
              className="mt-4 w-full rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white border border-transparent dark:border-white/10 px-4 py-2.5 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              Save Financial &amp; Account Details
            </button>
          </section>

          {/* Uploaded Receipt Details & Verification */}
          <section className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-500" />
                  <span>Subscription Fee Receipt Audit</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Verify statutory €45 candidate synchronization receipt and payment proof.
                </p>
              </div>
              {receipt?.storagePath && (
                <button
                  type="button"
                  onClick={() => void previewReceipt()}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>Inspect Receipt File</span>
                  <span>↗</span>
                </button>
              )}
            </div>

            {receipt ? (
              <div className="space-y-4">
                {transaction ? (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-white/[0.06]">
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Amount Paid</dt>
                      <dd className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{transaction.amount}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Channel / Method</dt>
                      <dd className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{transaction.method}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Transaction Ref ID</dt>
                      <dd className="font-mono font-bold text-emerald-600 dark:text-emerald-400 break-all mt-0.5">
                        {transaction.transactionId}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Payment Date</dt>
                      <dd className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{transaction.paymentDate}</dd>
                    </div>
                    {transaction.remarks && (
                      <div className="sm:col-span-2 lg:col-span-4 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                        <dt className="text-slate-500 dark:text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Candidate Remarks</dt>
                        <dd className="text-slate-700 dark:text-slate-300 italic mt-0.5">{transaction.remarks}</dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <p className="text-xs text-slate-500">Receipt file uploaded without structured transaction metadata.</p>
                )}

                {receipt.status === 'pending' || receipt.status === 'rejected' ? (
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      disabled={isWorking}
                      onClick={approveReceipt}
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Receipt · Mark €45 Paid &amp; Verified</span>
                    </button>

                    {/* Quick Rejection Preset Chips */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Quick Rejection Presets:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {RECEIPT_REJECTION_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setRejectReceiptReason(chip)}
                            className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${
                              rejectReceiptReason === chip
                                ? 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/50'
                                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.06] hover:border-red-400/40 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      value={rejectReceiptReason}
                      onChange={(e) => setRejectReceiptReason(e.target.value)}
                      placeholder="Enter specific feedback for candidate..."
                      className={inputClass}
                    />

                    <button
                      type="button"
                      disabled={isWorking}
                      onClick={rejectReceipt}
                      className="w-full rounded-xl border border-red-300 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-2 text-xs font-bold transition-all"
                    >
                      Reject Receipt &amp; Request Correction
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Receipt Status: {receipt.status.toUpperCase()} (Approved &amp; Cleared)</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl">
                No subscription receipt has been uploaded by the candidate yet.
              </div>
            )}
          </section>
        </div>
      )}

      {/* Tab 4: Interviews & Notices */}
      {showInterviews && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Stage 4 Live Zoom Facial Verification Scheduler */}
            <section className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-white/[0.08] pb-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Video className="w-4 h-4 text-blue-500" />
                  <span>Stage 4 Live Zoom Facial Scheduler</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure the candidate&apos;s live biometric identity verification call.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Zoom Meeting Link URL *
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://us05web.zoom.us/j/..."
                    className={inputClass}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Meeting ID
                    <input value={meetingId} onChange={(e) => setMeetingId(e.target.value)} className={inputClass} />
                  </label>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Passcode
                    <input value={passcode} onChange={(e) => setPasscode(e.target.value)} className={inputClass} />
                  </label>
                </div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Scheduled Date &amp; Time *
                  <input
                    type="datetime-local"
                    value={interviewAt}
                    onChange={(e) => setInterviewAt(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Assigned Caseworker / Officer
                  <input
                    value={interviewCoordinator}
                    onChange={(e) => setInterviewCoordinator(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Preparation Instructions for Candidate
                  <textarea
                    rows={2}
                    value={preparationNotes}
                    onChange={(e) => setPreparationNotes(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <button
                  type="button"
                  disabled={isWorking}
                  onClick={saveInterview}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-md shadow-blue-950/20 disabled:opacity-50"
                >
                  Save &amp; Dispatch Zoom Facial Schedule
                </button>
              </div>
            </section>

            {/* Stage 5 Embassy / VFS Biometrics Scheduler */}
            <section className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-white/[0.08] pb-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <CalendarDays className="w-4 h-4 text-emerald-500" />
                  <span>Stage 5 Application Center (VFS) Scheduler</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Schedule physical passport submission &amp; biometric appointment.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Venue / Application Center Location *
                  <input
                    value={centerLocation}
                    onChange={(e) => setCenterLocation(e.target.value)}
                    placeholder="e.g. VFS Global Kathmandu, Chhaya Center 3rd Floor"
                    className={inputClass}
                  />
                </label>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Biometrics Appointment Date &amp; Time *
                  <input
                    type="datetime-local"
                    value={appointmentAt}
                    onChange={(e) => setAppointmentAt(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Appointment Reference Code *
                  <input
                    value={appointmentRef}
                    onChange={(e) => setAppointmentRef(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Mandatory Physical Checklist Notes
                  <textarea
                    rows={2}
                    value={appointmentNotes}
                    onChange={(e) => setAppointmentNotes(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <button
                  type="button"
                  disabled={isWorking}
                  onClick={saveAppointment}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-md shadow-emerald-950/20 disabled:opacity-50"
                >
                  Save &amp; Dispatch Biometrics Appointment
                </button>
              </div>
            </section>
          </div>

          {/* Portal & WhatsApp Notification Dispatcher */}
          <section className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-white/[0.08] pb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Send className="w-4 h-4 text-emerald-500" />
                <span>Portal &amp; WhatsApp Notification Dispatcher</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dispatch official recruitment updates to the candidate&apos;s in-app inbox and direct WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Notification Preset Template
                <select
                  value={preset}
                  onChange={(e) => handlePreset(e.target.value as keyof typeof notificationPresets)}
                  className={inputClass}
                >
                  {Object.keys(notificationPresets).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Notification Title *
                <input value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} className={inputClass} />
              </label>
              <label className="sm:col-span-2 block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Message Body *
                <textarea
                  rows={3}
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <button
              type="button"
              disabled={isWorking}
              onClick={() => void sendNotice()}
              className="w-full rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-2.5 text-xs font-bold shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send In-App Notification &amp; Open WhatsApp Chat</span>
            </button>
          </section>
        </div>
      )}

      {/* Tab 1: Overview & CRM Tools */}
      {showCrm && (
        <section className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-white/[0.08] pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Caseworker CRM Notes &amp; Priority Management</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Private agency notes and prioritization visible only to coordinators and casework staff.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Dossier Priority Status
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
                <option value="Normal">Normal</option>
                <option value="High Priority">High Priority 🔥</option>
                <option value="Ready">Ready for Visa Stamp ✅</option>
                <option value="On Hold">On Hold ⚠️</option>
              </select>
            </label>
            <label className="sm:col-span-2 block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Private Coordinator Notes (Hidden from Candidate)
              <textarea
                rows={2}
                value={coordinatorNotes}
                onChange={(e) => setCoordinatorNotes(e.target.value)}
                placeholder="e.g. Verified with employer via phone; awaiting police clearance..."
                className={inputClass}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={isWorking}
              onClick={saveCrm}
              className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white border border-transparent dark:border-white/10 px-4 py-2.5 text-xs font-bold transition-all shadow-sm"
            >
              Save Internal Notes &amp; Priority
            </button>
            <button
              type="button"
              onClick={() => setIsGeneratorOpen(true)}
              className="rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-sky-950/20"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Generate Official Contract</span>
            </button>
            <button
              type="button"
              onClick={() => void copyWelcomeSummary()}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-white/10"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy WhatsApp Welcome Card</span>
            </button>
          </div>
        </section>
      )}

      {/* Official Contract Generator Modal */}
      <OfficialContractGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        candidate={candidate}
        actor={actor}
      />
    </div>
  );
};
