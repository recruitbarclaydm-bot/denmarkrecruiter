'use client';

import React from 'react';
import { CandidateRecord } from '@/types';
import { Printer } from 'lucide-react';

export const PrivateDossierSummary: React.FC<{ candidate: CandidateRecord }> = ({ candidate }) => (
  <section className="printable-dossier rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="no-print mb-3 flex items-center justify-between gap-2">
      <div><h2 className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">Private Application &amp; Dossier Summary</h2><p className="mt-1 text-[10px] text-slate-500">Recruitment agency record · Not a government document</p></div>
      <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700"><Printer className="h-3.5 w-3.5" />Print</button>
    </div>
    <div className="print-summary-content space-y-4">
      <header className="flex items-center gap-4 border-b border-slate-300 pb-3">
        {candidate.avatarUrl ? <img src={candidate.avatarUrl} alt={`${candidate.name} profile`} className="h-20 w-16 rounded border border-slate-300 object-cover" /> : <div className="flex h-20 w-16 items-center justify-center rounded border border-slate-300 text-xl font-bold">{candidate.name.split(' ').map((part) => part[0]).join('')}</div>}
        <div><div className="text-[10px] font-bold uppercase text-emerald-800">Private Recruitment Application</div><h1 className="text-xl font-bold">{candidate.name}</h1><p className="text-xs">{candidate.email} · {candidate.jobTitle}</p><p className="text-[10px] text-slate-500">Private agency/employer coordination copy · Not issued or endorsed by a government authority.</p></div>
      </header>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div><span className="summary-label">Passport</span><p>{candidate.passportNumber} · expires {candidate.passportExpiry || 'Not recorded'}</p></div>
        <div><span className="summary-label">Date of birth / Nationality</span><p>{candidate.dob} · {candidate.nationality}</p></div>
        <div><span className="summary-label">Address / Phone</span><p>{candidate.permanentAddress} · {candidate.phone}</p></div>
        <div><span className="summary-label">Family details</span><p>{candidate.extendedKyc?.father_name || 'N/A'} / {candidate.extendedKyc?.mother_name || 'N/A'}</p></div>
        <div><span className="summary-label">Citizenship / NIN</span><p>{candidate.extendedKyc?.citizenship_number || 'N/A'} / {candidate.extendedKyc?.national_id_nin || 'N/A'}</p></div>
        <div><span className="summary-label">Marital status / Gender</span><p>{candidate.extendedKyc?.marital_status || 'N/A'} / {candidate.extendedKyc?.gender || 'N/A'}</p></div>
        <div><span className="summary-label">Passport issue date / place</span><p>{candidate.extendedKyc?.passport_issue_date || 'N/A'} / {candidate.extendedKyc?.passport_issue_place || 'N/A'}</p></div>
        <div><span className="summary-label">Emergency contact</span><p>{candidate.extendedKyc?.emergency_contact_name || 'N/A'} · {candidate.extendedKyc?.emergency_contact_relation || ''} · {candidate.extendedKyc?.emergency_contact_phone || ''}</p></div>
        <div><span className="summary-label">Education / relevant experience</span><p>{candidate.extendedKyc?.education_level || 'N/A'} · {candidate.extendedKyc?.work_experience_years || 'N/A'} years</p></div>
        <div><span className="summary-label">Previous Schengen travel</span><p>{candidate.extendedKyc?.previous_schengen_visa || 'N/A'}</p></div>
        <div className="col-span-2"><span className="summary-label">Work skills</span><p className="whitespace-pre-wrap">{candidate.extendedKyc?.work_skills_summary || candidate.workExperienceSummary || 'N/A'}</p></div>
        <div><span className="summary-label">Sponsor / case reference</span><p>{candidate.employer.sponsorCode || 'N/A'} / {candidate.siriCaseOrder.caseOrderId || 'N/A'}</p></div>
        <div><span className="summary-label">Employer</span><p>{candidate.employer.name}</p></div>
        <div><span className="summary-label">Account balance / service-fee status</span><p>{candidate.denbarAccount?.amount || 'Not set'} / {candidate.actionRequired?.subscription || candidate.denbarAccount?.status || 'Not set'}</p></div>
        <div><span className="summary-label">Video interview</span><p>{candidate.processMeta?.videoInterview ? `${new Date(candidate.processMeta.videoInterview.scheduledAt).toLocaleString()} · ${candidate.processMeta.videoInterview.meetingId}` : 'Not scheduled'}</p></div>
        <div><span className="summary-label">Application-center appointment</span><p>{candidate.processMeta?.applicationCenter ? `${candidate.processMeta.applicationCenter.location} · ${new Date(candidate.processMeta.applicationCenter.scheduledAt).toLocaleString()} · ${candidate.processMeta.applicationCenter.referenceCode}` : 'Not scheduled'}</p></div>
      </div>
      <section><h2 className="text-xs font-bold uppercase">Document checklist</h2><div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">{candidate.documents.map((document) => <div key={document.id} className="flex justify-between gap-2 border-b border-slate-200 py-1"><span>{document.title}</span><strong>{document.status === 'verified' ? 'Verified' : document.status === 'rejected' ? 'Correction required' : document.status.replaceAll('_', ' ')}</strong></div>)}</div></section>
    </div>
  </section>
);
