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
}

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none';

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

export const AdminCaseTools: React.FC<AdminCaseToolsProps> = ({ candidate, actor }) => {
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

  return (
    <div className="space-y-4">
      {/* Financial & Subscription Receipt Verification Manager */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Financial &amp; Subscription Receipt Manager</span>
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {feeStatus}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Denbar Sponsored Relocation Balance
            <input value={balance} onChange={(e) => setBalance(e.target.value)} className={inputClass} />
          </label>
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Subscription Fee Status
            <select value={feeStatus} onChange={(e) => setFeeStatus(e.target.value)} className={inputClass}>
              <option value="€45 Pending">€45 Pending</option>
              <option value="€45 Paid & Verified">€45 Paid &amp; Verified</option>
              <option value="€45 Rejected (Action Required)">€45 Rejected (Action Required)</option>
              <option value="Waived / Fully Sponsored">Waived / Fully Sponsored</option>
            </select>
          </label>
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Sponsor Registry Code
            <input value={sponsorCode} onChange={(e) => setSponsorCode(e.target.value)} className={inputClass} />
          </label>
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
            SIRI Case Order ID
            <input value={caseOrderId} onChange={(e) => setCaseOrderId(e.target.value)} className={inputClass} />
          </label>
          <label className="col-span-2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Sponsoring Employer Name
            <input value={employerName} onChange={(e) => setEmployerName(e.target.value)} className={inputClass} />
          </label>
        </div>

        <button
          type="button"
          disabled={isWorking}
          onClick={saveFinancials}
          className="mt-3 w-full rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50"
        >
          Save Financial &amp; Account Details
        </button>

        {/* Uploaded Receipt Details & Verification */}
        {receipt && (
          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Candidate Uploaded Payment Receipt</span>
              </h3>
              {receipt.storagePath && (
                <button
                  type="button"
                  onClick={() => void previewReceipt()}
                  className="text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Inspect Receipt File ↗
                </button>
              )}
            </div>

            {transaction ? (
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <dt className="text-slate-400 font-semibold text-[9px] uppercase">Amount Paid</dt>
                  <dd className="font-bold text-slate-900 dark:text-slate-100">{transaction.amount}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-semibold text-[9px] uppercase">Channel / Method</dt>
                  <dd className="font-semibold text-slate-900 dark:text-slate-100">{transaction.method}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-semibold text-[9px] uppercase">Transaction Ref ID</dt>
                  <dd className="font-mono font-bold text-slate-900 dark:text-slate-100 break-all">
                    {transaction.transactionId}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-semibold text-[9px] uppercase">Payment Date</dt>
                  <dd className="font-semibold text-slate-900 dark:text-slate-100">{transaction.paymentDate}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400 font-semibold text-[9px] uppercase">Candidate Remarks</dt>
                  <dd className="text-slate-700 dark:text-slate-300 italic">{transaction.remarks || 'None provided'}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-[11px] text-slate-500">Receipt file uploaded without structured transaction metadata.</p>
            )}

            {receipt.status === 'pending' || receipt.status === 'rejected' ? (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isWorking}
                  onClick={approveReceipt}
                  className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Receipt · €45 Paid &amp; Verified</span>
                </button>

                {/* Quick Rejection Preset Chips */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Quick Rejection Chips:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {RECEIPT_REJECTION_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setRejectReceiptReason(chip)}
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors ${
                          rejectReceiptReason === chip
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-red-300'
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
                  placeholder="Enter rejection feedback for candidate..."
                  className={inputClass}
                />

                <button
                  type="button"
                  disabled={isWorking}
                  onClick={rejectReceipt}
                  className="w-full rounded-lg border border-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-700 dark:text-red-300 px-3 py-1.5 text-xs font-bold transition-colors"
                >
                  Reject Receipt &amp; Request Correction
                </button>
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Receipt Status: {receipt.status.toUpperCase()}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Built-In Official Contract & SIRI Document Generator Button Card */}
      <section className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-950 dark:text-emerald-200">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Official SIRI Contract &amp; Document Generator</span>
          </div>
          <button
            type="button"
            onClick={() => setIsGeneratorOpen(true)}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Document</span>
          </button>
        </div>
        <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
          Auto-fills candidate legal data into 4 binding SIRI templates (Job Contract, Sponsorship Cert, Biometrics Authorization, Denbar Stamp).
        </p>
      </section>

      {/* Stage 4 Live Zoom Facial Verification Scheduler */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:border-slate-800 dark:text-slate-100">
          <Video className="w-4 h-4 text-blue-600" />
          <span>Stage 4 Live Zoom Facial Scheduler</span>
        </h2>
        <div className="mt-3 space-y-2 text-xs">
          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Zoom Meeting Link URL *
            <input
              type="url"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://us05web.zoom.us/j/..."
              className={inputClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
              Meeting ID
              <input value={meetingId} onChange={(e) => setMeetingId(e.target.value)} className={inputClass} />
            </label>
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
              Passcode
              <input value={passcode} onChange={(e) => setPasscode(e.target.value)} className={inputClass} />
            </label>
          </div>
          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Scheduled Date &amp; Time *
            <input
              type="datetime-local"
              value={interviewAt}
              onChange={(e) => setInterviewAt(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Assigned Caseworker / Officer
            <input
              value={interviewCoordinator}
              onChange={(e) => setInterviewCoordinator(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Preparation Notes for Candidate
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
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
          >
            Save &amp; Dispatch Zoom Facial Schedule
          </button>
        </div>
      </section>

      {/* Stage 5 Embassy / VFS Biometrics Scheduler */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:border-slate-800 dark:text-slate-100">
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          <span>Stage 5 Embassy / VFS Biometrics Scheduler</span>
        </h2>
        <div className="mt-3 space-y-2 text-xs">
          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Venue / Application Center Location *
            <input
              value={centerLocation}
              onChange={(e) => setCenterLocation(e.target.value)}
              placeholder="e.g. VFS Global Kathmandu, Chhaya Center 3rd Floor"
              className={inputClass}
            />
          </label>
          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Biometrics Appointment Date &amp; Time *
            <input
              type="datetime-local"
              value={appointmentAt}
              onChange={(e) => setAppointmentAt(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Appointment Reference Code *
            <input
              value={appointmentRef}
              onChange={(e) => setAppointmentRef(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">
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
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
          >
            Save &amp; Dispatch Biometrics Appointment
          </button>
        </div>
      </section>

      {/* Custom Portal Notification & WhatsApp Dispatcher */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:border-slate-800 dark:text-slate-100">
          <Send className="w-4 h-4 text-emerald-600" />
          <span>Official Notification &amp; WhatsApp Dispatch</span>
        </h2>
        <div className="mt-3 space-y-2 text-xs">
          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Official Notification Preset Template
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
          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Notification Title *
            <input value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Message Body *
            <textarea
              rows={3}
              value={noticeMessage}
              onChange={(e) => setNoticeMessage(e.target.value)}
              className={inputClass}
            />
          </label>
          <button
            type="button"
            disabled={isWorking}
            onClick={() => void sendNotice()}
            className="w-full rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white px-3 py-2 text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send to Portal &amp; Open WhatsApp</span>
          </button>
        </div>
      </section>

      {/* Caseworker CRM Tools: Internal Notes & Priority Tags */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:border-slate-800 dark:text-slate-100">
          Caseworker CRM Notes &amp; Priority
        </h2>
        <div className="mt-3 space-y-2 text-xs">
          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Dossier Priority Status
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
              <option value="Normal">Normal</option>
              <option value="High Priority">High Priority 🔥</option>
              <option value="Ready">Ready for Visa Stamp ✅</option>
              <option value="On Hold">On Hold ⚠️</option>
            </select>
          </label>
          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">
            Private Caseworker Internal Notes (Hidden from Candidate)
            <textarea
              rows={3}
              value={coordinatorNotes}
              onChange={(e) => setCoordinatorNotes(e.target.value)}
              placeholder="e.g. Verified with employer via phone; awaiting police clearance..."
              className={inputClass}
            />
          </label>
          <button
            type="button"
            disabled={isWorking}
            onClick={saveCrm}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 text-xs font-bold transition-colors"
          >
            Save Internal Notes &amp; Priority
          </button>
          <button
            type="button"
            onClick={() => setIsGeneratorOpen(true)}
            className="w-full rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Generate Official Contract / Letter</span>
          </button>
          <button
            type="button"
            onClick={() => void copyWelcomeSummary()}
            className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Welcome &amp; Login Card (WhatsApp)</span>
          </button>
        </div>
      </section>

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
