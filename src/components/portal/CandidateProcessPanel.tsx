'use client';

import React, { useState } from 'react';
import { CandidateRecord } from '@/types';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useToast } from '@/context/ToastContext';
import { DocPreviewModal } from '@/components/shared/DocPreviewModal';
import { CalendarDays, CheckCircle2, Clock3, ExternalLink, FileText, MapPin, Upload, Video } from 'lucide-react';

export const CandidateProcessPanel: React.FC<{ candidate: CandidateRecord }> = ({ candidate }) => {
  const { submitServiceFeeReceipt } = usePortalStore();
  const { showToast } = useToast();
  const [amount, setAmount] = useState('€45');
  const [method, setMethod] = useState('Bank Wire');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);

  const receipt = candidate.documents.find((document) => document.category === 'subscription_receipt');
  const feeStatus = candidate.actionRequired?.subscription || candidate.denbarAccount?.status || 'Not set';
  const normalizedStatus = feeStatus.toLowerCase();
  const feeVerified = normalizedStatus.includes('verified') || normalizedStatus.includes('paid');
  const feeRejected = normalizedStatus.includes('rejected');
  const interview = candidate.processMeta?.videoInterview;
  const appointment = candidate.processMeta?.applicationCenter;

  const submitReceipt = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !transactionId.trim() || !amount.trim() || !paymentDate) {
      showToast('Attach a receipt and complete amount, reference ID, and payment date.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await submitServiceFeeReceipt(candidate.id, file, {
        amount: amount.trim(),
        method,
        transactionId: transactionId.trim(),
        paymentDate,
        remarks: remarks.trim(),
      });
      showToast('Service-fee receipt submitted for coordinator review.', 'success');
      setFile(null);
      setTransactionId('');
      setRemarks('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Receipt submission failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReceipt = () => {
    if (receipt?.storagePath) setIsReceiptPreviewOpen(true);
  };

  return (
    <section className="space-y-4" aria-label="Private agency account and process updates">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300"><FileText className="h-4 w-4" /> Account Balance &amp; Service Fee Verification</div>
              <p className="mt-1 text-[11px] text-slate-500">Private recruitment agency account record. Verify fees only through your written service agreement.</p>
            </div>
            <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold ${feeVerified ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : feeRejected ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'}`}>{feeStatus}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-3 dark:bg-slate-800/60">
            <div><span className="block text-[10px] font-semibold uppercase text-slate-400">Account balance</span><strong className="mt-1 block text-sm text-slate-900 dark:text-slate-100">{candidate.denbarAccount?.amount || 'Not set'}</strong></div>
            <div><span className="block text-[10px] font-semibold uppercase text-slate-400">Service fee status</span><strong className="mt-1 block text-xs text-slate-900 dark:text-slate-100">{feeStatus}</strong></div>
          </div>
          {receipt?.status === 'rejected' && <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"><strong>Correction requested:</strong> {receipt.rejectionReason || 'Please upload a clearer receipt and confirm the transaction details.'}</div>}
          {receipt?.storagePath && <button type="button" onClick={openReceipt} className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"><FileText className="h-3.5 w-3.5" /> Preview submitted receipt</button>}
          {!feeVerified && (
            <form onSubmit={submitReceipt} className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Amount paid
                  <input value={amount} onChange={(event) => setAmount(event.target.value)} required className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950" placeholder="€45 / NPR equivalent" />
                </label>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Payment method
                  <select value={method} onChange={(event) => setMethod(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950">
                    {['Bank Wire', 'SWIFT', 'eSewa / Khalti / ConnectIPS', 'Remittance', 'Card'].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Transaction reference ID
                  <input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} required className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950" />
                </label>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Payment date
                  <input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} required className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950" />
                </label>
              </div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">Applicant notes
                <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={2} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} className="max-w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-900" />
                <button type="submit" disabled={isSubmitting} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"><Upload className="h-4 w-4" />{isSubmitting ? 'Submitting...' : feeRejected ? 'Submit Corrected Receipt' : 'Submit Receipt for Review'}</button>
              </div>
              {file && <p className="text-[10px] text-slate-500">Selected: {file.name}</p>}
            </form>
          )}
        </section>

        <div className="space-y-4">
          {interview && (
            <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-blue-900 dark:text-blue-200"><Video className="h-4 w-4" /> Video Interview &amp; Identity Discussion</div>
              <p className="mt-2 text-xs font-semibold text-slate-900 dark:text-slate-100">{new Date(interview.scheduledAt).toLocaleString()}</p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">Meeting ID: {interview.meetingId || 'Not provided'} · Passcode: {interview.passcode || 'Not provided'}</p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">Coordinator: {interview.coordinatorName || 'Your recruitment coordinator'}</p>
              {interview.preparationNotes && <p className="mt-2 whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-200">{interview.preparationNotes}</p>}
              <a href={interview.meetingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800">Join Video Meeting <ExternalLink className="h-3.5 w-3.5" /></a>
            </section>
          )}
          {appointment && (
            <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-900 dark:text-emerald-200"><MapPin className="h-4 w-4" /> Application Center Appointment</div>
              <p className="mt-2 text-xs font-semibold text-slate-900 dark:text-slate-100">{new Date(appointment.scheduledAt).toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-700 dark:text-slate-200">{appointment.location}</p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">Reference: {appointment.referenceCode}</p>
              {appointment.documentNotes && <p className="mt-2 whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-200">{appointment.documentNotes}</p>}
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-emerald-300 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-900 dark:border-emerald-800 dark:text-emerald-200"><CalendarDays className="h-3.5 w-3.5" /> Save the time and bring the documents listed above.</div>
            </section>
          )}
          {!interview && !appointment && <div className="rounded-lg border border-dashed border-slate-300 p-5 text-xs text-slate-500 dark:border-slate-700"><Clock3 className="mb-2 h-4 w-4" />No interview or application-center appointment has been scheduled yet.</div>}
        </div>
      </div>
      <DocPreviewModal
        doc={receipt || null}
        candidate={candidate}
        isOpen={isReceiptPreviewOpen}
        onClose={() => setIsReceiptPreviewOpen(false)}
      />
    </section>
  );
};
