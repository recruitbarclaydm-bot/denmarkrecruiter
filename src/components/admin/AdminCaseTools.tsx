'use client';

import React, { useEffect, useState } from 'react';
import { CandidateProcessMetadata, CandidateRecord } from '@/types';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useToast } from '@/context/ToastContext';
import { getSignedDocumentUrl } from '@/lib/supabase';
import { CalendarDays, CheckCircle2, FileText, MessageCircle, Send, Video } from 'lucide-react';

interface AdminCaseToolsProps {
  candidate: CandidateRecord;
  actor: string;
}

const inputClass = 'mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

const notificationPresets = {
  'Action Required: Complete KYC & Upload Documents': 'Please review your profile details and upload any missing documents in your candidate portal.',
  'Video Interview Schedule Updated': 'Your video interview schedule is available in your candidate portal. Please review the meeting details and preparation notes.',
  'Service Fee Receipt Verified': 'Your service-fee receipt has been reviewed by the recruitment coordinator.',
  'Agreement Ready for Review': 'A private recruitment agreement is available in your dossier. Please review it and complete any requested signature.',
  'Application Center Appointment Scheduled': 'Your application-center appointment details are available in your portal. Review the location, date, and document notes.',
  'Custom Agency Notice': '',
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character] || character));

export const AdminCaseTools: React.FC<AdminCaseToolsProps> = ({ candidate, actor }) => {
  const {
    updateCandidateAgencyDetails,
    reviewServiceFeeReceipt,
    updateCandidateProcessMeta,
    sendCandidateNotification,
    createAgencyDocument,
    adminCrmMetadata,
    saveAdminCrmMetadata,
  } = usePortalStore();
  const { showToast } = useToast();
  const [balance, setBalance] = useState(candidate.denbarAccount?.amount || '€0.00');
  const [feeStatus, setFeeStatus] = useState(candidate.actionRequired?.subscription || candidate.denbarAccount?.status || 'Not set');
  const [sponsorCode, setSponsorCode] = useState(candidate.employer.sponsorCode || '');
  const [caseOrderId, setCaseOrderId] = useState(candidate.siriCaseOrder.caseOrderId || '');
  const [employerName, setEmployerName] = useState(candidate.employer.name || '');
  const [rejectReceiptReason, setRejectReceiptReason] = useState('Transaction reference could not be verified. Please provide a clearer receipt.');
  const [meetingUrl, setMeetingUrl] = useState(candidate.processMeta?.videoInterview?.meetingUrl || '');
  const [meetingId, setMeetingId] = useState(candidate.processMeta?.videoInterview?.meetingId || '');
  const [passcode, setPasscode] = useState(candidate.processMeta?.videoInterview?.passcode || '');
  const [interviewAt, setInterviewAt] = useState(candidate.processMeta?.videoInterview?.scheduledAt || '');
  const [interviewCoordinator, setInterviewCoordinator] = useState(candidate.processMeta?.videoInterview?.coordinatorName || actor);
  const [preparationNotes, setPreparationNotes] = useState(candidate.processMeta?.videoInterview?.preparationNotes || '');
  const [centerLocation, setCenterLocation] = useState(candidate.processMeta?.applicationCenter?.location || '');
  const [appointmentAt, setAppointmentAt] = useState(candidate.processMeta?.applicationCenter?.scheduledAt || '');
  const [appointmentRef, setAppointmentRef] = useState(candidate.processMeta?.applicationCenter?.referenceCode || '');
  const [appointmentNotes, setAppointmentNotes] = useState(candidate.processMeta?.applicationCenter?.documentNotes || '');
  const [preset, setPreset] = useState<keyof typeof notificationPresets>('Custom Agency Notice');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [coordinatorNotes, setCoordinatorNotes] = useState(adminCrmMetadata[candidate.id]?.notes || '');
  const [priority, setPriority] = useState<CandidateProcessMetadata['priority']>(adminCrmMetadata[candidate.id]?.priority || 'Normal');
  const [agencyTemplate, setAgencyTemplate] = useState('Seasonal Agricultural Employment Agreement');
  const [requiresSignature, setRequiresSignature] = useState(true);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    setBalance(candidate.denbarAccount?.amount || '€0.00');
    setFeeStatus(candidate.actionRequired?.subscription || candidate.denbarAccount?.status || 'Not set');
    setSponsorCode(candidate.employer.sponsorCode || '');
    setCaseOrderId(candidate.siriCaseOrder.caseOrderId || '');
    setEmployerName(candidate.employer.name || '');
    setMeetingUrl(candidate.processMeta?.videoInterview?.meetingUrl || '');
    setMeetingId(candidate.processMeta?.videoInterview?.meetingId || '');
    setPasscode(candidate.processMeta?.videoInterview?.passcode || '');
    setInterviewAt(candidate.processMeta?.videoInterview?.scheduledAt || '');
    setInterviewCoordinator(candidate.processMeta?.videoInterview?.coordinatorName || actor);
    setPreparationNotes(candidate.processMeta?.videoInterview?.preparationNotes || '');
    setCenterLocation(candidate.processMeta?.applicationCenter?.location || '');
    setAppointmentAt(candidate.processMeta?.applicationCenter?.scheduledAt || '');
    setAppointmentRef(candidate.processMeta?.applicationCenter?.referenceCode || '');
    setAppointmentNotes(candidate.processMeta?.applicationCenter?.documentNotes || '');
    setCoordinatorNotes(adminCrmMetadata[candidate.id]?.notes || '');
    setPriority(adminCrmMetadata[candidate.id]?.priority || 'Normal');
  }, [candidate.id, candidate.processMeta, candidate.denbarAccount, candidate.actionRequired, candidate.employer, candidate.siriCaseOrder, adminCrmMetadata, actor]);

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

  const saveFinancials = () => runAction(() => updateCandidateAgencyDetails(candidate.id, {
    balance,
    status: feeStatus,
    sponsorCode,
    caseOrderId,
    employerName,
  }, actor), 'Agency account details saved.');

  const previewReceipt = async () => {
    if (!receipt?.storagePath) return;
    const opened = window.open('about:blank', '_blank');
    const url = await getSignedDocumentUrl(receipt.storagePath);
    if (opened) opened.location.href = url;
  };

  const approveReceipt = () => runAction(() => reviewServiceFeeReceipt(candidate.id, true, undefined, actor), 'Receipt approved and candidate notified.');
  const rejectReceipt = () => runAction(() => reviewServiceFeeReceipt(candidate.id, false, rejectReceiptReason, actor), 'Receipt returned for correction.');

  const saveInterview = () => {
    if (!meetingUrl.startsWith('https://') || !interviewAt) {
      showToast('Enter a secure meeting URL and a scheduled date/time.', 'error');
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
      await sendCandidateNotification(candidate.id, 'Video Interview Schedule Updated', `A video interview has been scheduled for ${new Date(interviewAt).toLocaleString()}. ${meetingUrl}`, actor);
    }, 'Video interview details saved and sent.');
  };

  const saveAppointment = () => {
    if (!centerLocation.trim() || !appointmentAt || !appointmentRef.trim()) {
      showToast('Enter the appointment location, date/time, and reference code.', 'error');
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
      await sendCandidateNotification(candidate.id, 'Application Center Appointment Scheduled', `${details.location} · ${new Date(details.scheduledAt).toLocaleString()} · Ref ${details.referenceCode}. ${details.documentNotes}`, actor);
    }, 'Appointment details saved and candidate notified.');
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
        whatsappWindow.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(`${noticeTitle.trim()}\n\n${noticeMessage.trim()}`)}`;
      }
    }, 'Notification sent to the candidate portal.');
    if (!phone) showToast('No phone number is saved; the portal notification was sent only.', 'info');
  };

  const saveCrm = () => runAction(
    () => saveAdminCrmMetadata(candidate.id, { notes: coordinatorNotes.trim(), priority: priority || 'Normal' }),
    'Private coordinator notes saved.'
  );

  const copyWelcomeSummary = async () => {
    const summary = `Private Recruitment Application Summary\nCandidate: ${candidate.name}\nEmail: ${candidate.email}\nApplication: ${candidate.jobTitle}\nPortal: ${window.location.origin}/`;
    await navigator.clipboard.writeText(summary);
    showToast('Welcome and login summary copied.', 'success');
  };

  const generateAgencyDocument = async () => {
    const templates: Record<string, string> = {
      'Seasonal Agricultural Employment Agreement': 'Private seasonal agricultural employment coordination agreement',
      'Herdsman Placement Agreement': 'Private herdsman placement coordination agreement',
      'Employer Sponsorship Summary': 'Employer and recruitment placement summary',
      'Service Fee Payment Confirmation': 'Private recruitment service fee confirmation',
    };
    const body = templates[agencyTemplate];
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(agencyTemplate)}</title><style>body{font:14px Arial,sans-serif;max-width:760px;margin:40px auto;color:#17212b}h1{font-size:22px;border-bottom:2px solid #166534;padding-bottom:12px}.label{color:#586674;font-size:11px;text-transform:uppercase}section{margin:18px 0;padding:12px;border:1px solid #d5dde3}footer{margin-top:36px;color:#52606d;font-size:11px}</style></head><body><p class="label">Private Recruitment Agency · Candidate Copy</p><h1>${escapeHtml(agencyTemplate)}</h1><p>${escapeHtml(body)}. This document is prepared by the private recruitment service and is not an immigration decision or government document.</p><section><p><span class="label">Candidate</span><br>${escapeHtml(candidate.name)}</p><p><span class="label">Email</span><br>${escapeHtml(candidate.email)}</p><p><span class="label">Passport</span><br>${escapeHtml(candidate.passportNumber)}</p><p><span class="label">Employer</span><br>${escapeHtml(candidate.employer.name)}</p><p><span class="label">Sponsor reference</span><br>${escapeHtml(candidate.employer.sponsorCode)}</p><p><span class="label">Case reference</span><br>${escapeHtml(candidate.siriCaseOrder.caseOrderId)}</p></section><p>${escapeHtml(candidate.processMeta?.coordinatorNotes || 'Prepared for candidate and employer coordination.')}</p><footer>Private recruitment agency document. Not issued, approved, or endorsed by any government authority.</footer></body></html>`;
    await runAction(async () => {
      await createAgencyDocument(candidate.id, agencyTemplate, html, requiresSignature, actor);
      setIsGeneratorOpen(false);
    }, 'Agency document uploaded to the candidate dossier.');
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800"><h2 className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">Account &amp; Service-Fee Review</h2><span className="text-[10px] text-slate-500">Private agency</span></div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">Account balance<input value={balance} onChange={(event) => setBalance(event.target.value)} className={inputClass} /></label>
          <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">Service-fee status<input value={feeStatus} onChange={(event) => setFeeStatus(event.target.value)} className={inputClass} /></label>
          <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">Sponsor reference<input value={sponsorCode} onChange={(event) => setSponsorCode(event.target.value)} className={inputClass} /></label>
          <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">Case reference<input value={caseOrderId} onChange={(event) => setCaseOrderId(event.target.value)} className={inputClass} /></label>
          <label className="col-span-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300">Employer name<input value={employerName} onChange={(event) => setEmployerName(event.target.value)} className={inputClass} /></label>
        </div>
        <button type="button" disabled={isWorking} onClick={saveFinancials} className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">Save account details</button>
        {receipt && <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Submitted service-fee receipt</h3>{receipt.storagePath && <button type="button" onClick={() => void previewReceipt()} className="text-[10px] font-bold text-blue-700 underline dark:text-blue-300">Preview receipt</button>}</div>
          {transaction ? <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]"><div><dt className="text-slate-400">Amount</dt><dd>{transaction.amount}</dd></div><div><dt className="text-slate-400">Method</dt><dd>{transaction.method}</dd></div><div><dt className="text-slate-400">Reference ID</dt><dd className="break-all">{transaction.transactionId}</dd></div><div><dt className="text-slate-400">Payment date</dt><dd>{transaction.paymentDate}</dd></div><div className="col-span-2"><dt className="text-slate-400">Applicant notes</dt><dd>{transaction.remarks || 'None'}</dd></div></dl> : <p className="mt-2 text-[10px] text-slate-500">No transaction metadata attached.</p>}
          {receipt.status === 'pending' || receipt.status === 'rejected' ? <div className="mt-3 space-y-2"><button type="button" disabled={isWorking} onClick={approveReceipt} className="w-full rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />Approve Receipt · Paid &amp; Verified</button><input value={rejectReceiptReason} onChange={(event) => setRejectReceiptReason(event.target.value)} aria-label="Receipt rejection reason" className={inputClass} /><button type="button" disabled={isWorking} onClick={rejectReceipt} className="w-full rounded-md border border-red-300 px-3 py-2 text-xs font-bold text-red-700 dark:border-red-900 dark:text-red-300">Reject Receipt &amp; Request Correction</button></div> : <p className="mt-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Receipt status: {receipt.status}</p>}
        </div>}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-100"><Video className="h-4 w-4" />Video Interview Coordination</h2>
        <div className="mt-3 space-y-2">
          <label className="block text-[10px] font-semibold">Meeting URL<input type="url" value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} placeholder="https://zoom.us/..." className={inputClass} /></label>
          <div className="grid grid-cols-2 gap-2"><label className="text-[10px] font-semibold">Meeting ID<input value={meetingId} onChange={(event) => setMeetingId(event.target.value)} className={inputClass} /></label><label className="text-[10px] font-semibold">Passcode<input value={passcode} onChange={(event) => setPasscode(event.target.value)} className={inputClass} /></label></div>
          <label className="block text-[10px] font-semibold">Scheduled date &amp; time<input type="datetime-local" value={interviewAt} onChange={(event) => setInterviewAt(event.target.value)} className={inputClass} /></label>
          <label className="block text-[10px] font-semibold">Coordinator name<input value={interviewCoordinator} onChange={(event) => setInterviewCoordinator(event.target.value)} className={inputClass} /></label>
          <label className="block text-[10px] font-semibold">Preparation notes<textarea rows={2} value={preparationNotes} onChange={(event) => setPreparationNotes(event.target.value)} className={inputClass} /></label>
          <button type="button" disabled={isWorking} onClick={saveInterview} className="w-full rounded-md bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Save &amp; Send Video Interview Invite</button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-100"><CalendarDays className="h-4 w-4" />Application Center Appointment</h2>
        <div className="mt-3 space-y-2"><label className="block text-[10px] font-semibold">Center location<input value={centerLocation} onChange={(event) => setCenterLocation(event.target.value)} className={inputClass} /></label><label className="block text-[10px] font-semibold">Appointment date &amp; time<input type="datetime-local" value={appointmentAt} onChange={(event) => setAppointmentAt(event.target.value)} className={inputClass} /></label><label className="block text-[10px] font-semibold">Reference code<input value={appointmentRef} onChange={(event) => setAppointmentRef(event.target.value)} className={inputClass} /></label><label className="block text-[10px] font-semibold">Document checklist notes<textarea rows={2} value={appointmentNotes} onChange={(event) => setAppointmentNotes(event.target.value)} className={inputClass} /></label><button type="button" disabled={isWorking} onClick={saveAppointment} className="w-full rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Save &amp; Send Appointment Schedule</button></div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-100"><Send className="h-4 w-4" />Portal Notice &amp; WhatsApp</h2>
        <div className="mt-3 space-y-2"><label className="block text-[10px] font-semibold">Message template<select value={preset} onChange={(event) => handlePreset(event.target.value as keyof typeof notificationPresets)} className={inputClass}>{Object.keys(notificationPresets).map((key) => <option key={key}>{key}</option>)}</select></label><label className="block text-[10px] font-semibold">Notification title<input value={noticeTitle} onChange={(event) => setNoticeTitle(event.target.value)} className={inputClass} /></label><label className="block text-[10px] font-semibold">Message<textarea rows={3} value={noticeMessage} onChange={(event) => setNoticeMessage(event.target.value)} className={inputClass} /></label><button type="button" disabled={isWorking} onClick={() => void sendNotice()} className="w-full rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><MessageCircle className="mr-1 inline h-3.5 w-3.5" />Send to Portal &amp; Open WhatsApp</button></div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase dark:border-slate-800">Private CRM Notes &amp; Priority</h2>
        <div className="mt-3 space-y-2"><label className="block text-[10px] font-semibold">Priority<select value={priority} onChange={(event) => setPriority(event.target.value as CandidateProcessMetadata['priority'])} className={inputClass}>{['Normal', 'High Priority', 'Ready', 'On Hold'].map((value) => <option key={value}>{value}</option>)}</select></label><label className="block text-[10px] font-semibold">Internal coordinator notes<textarea rows={3} value={coordinatorNotes} onChange={(event) => setCoordinatorNotes(event.target.value)} className={inputClass} /></label><button type="button" disabled={isWorking} onClick={saveCrm} className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">Save internal notes</button><button type="button" onClick={() => void copyWelcomeSummary()} className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">Copy Welcome &amp; Login Summary</button></div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-xs font-bold uppercase"><FileText className="h-4 w-4" />Agency Document Generator</h2><button type="button" onClick={() => setIsGeneratorOpen(true)} className="rounded-md bg-slate-800 px-3 py-1.5 text-[10px] font-bold text-white dark:bg-slate-200 dark:text-slate-900">Generate document</button></div>
        <p className="mt-2 text-[10px] text-slate-500">Private employer/recruitment templates, not government forms.</p>
      </section>

      {isGeneratorOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><div className="w-full max-w-md space-y-4 rounded-lg bg-white p-5 dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="text-sm font-bold">Generate private agency document</h2><button type="button" onClick={() => setIsGeneratorOpen(false)} aria-label="Close">×</button></div><label className="block text-xs font-semibold">Template<select value={agencyTemplate} onChange={(event) => setAgencyTemplate(event.target.value)} className={inputClass}>{['Seasonal Agricultural Employment Agreement', 'Herdsman Placement Agreement', 'Employer Sponsorship Summary', 'Service Fee Payment Confirmation'].map((value) => <option key={value}>{value}</option>)}</select></label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={requiresSignature} onChange={(event) => setRequiresSignature(event.target.checked)} />Request candidate signature</label><div className="flex justify-end gap-2"><button type="button" onClick={() => setIsGeneratorOpen(false)} className="rounded-md border px-3 py-2 text-xs">Cancel</button><button type="button" disabled={isWorking} onClick={() => void generateAgencyDocument()} className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Upload to dossier</button></div></div></div>}
    </div>
  );
};
