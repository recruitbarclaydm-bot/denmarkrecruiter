'use client';

import React, { useState, useEffect } from 'react';
import { CandidateRecord } from '@/types';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useToast } from '@/context/ToastContext';
import {
  FileText,
  X,
  Send,
  Eye,
  Edit3,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Building2,
  PenTool,
} from 'lucide-react';

interface OfficialContractGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateRecord;
  actor: string;
}

type TemplateType =
  | 'job_offer_contract'
  | 'siri_sponsorship_clearance'
  | 'embassy_biometrics_notice'
  | 'subscription_denbar_receipt';

const escapeHtml = (str: string = '') =>
  str.replace(/[&<>"']/g, (match) => {
    switch (match) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return match;
    }
  });

export const OfficialContractGeneratorModal: React.FC<OfficialContractGeneratorModalProps> = ({
  isOpen,
  onClose,
  candidate,
  actor,
}) => {
  const { createAgencyDocument } = usePortalStore();
  const { showToast } = useToast();

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('job_offer_contract');
  const [docTitle, setDocTitle] = useState('');
  const [editableBody, setEditableBody] = useState('');
  const [requiresSignature, setRequiresSignature] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const sponsorCode = candidate.employer?.sponsorCode || '#944135';
  const employerName = candidate.employer?.name || 'AgroNord A/S & Denbar Green Sector Partner Consortium';
  const caseOrderId = candidate.siriCaseOrder?.caseOrderId || `SB6-${Math.floor(100000 + Math.random() * 900000)}-2026`;
  const schemeTitle = candidate.schemeType === 'siri_herdsman'
    ? 'Danish Herdsman & Agricultural Specialist Scheme (SIRI Section 9a)'
    : 'Denmark Seasonal Agricultural Scheme & Green Sector Collective Agreement';
  const denbarBalance = candidate.denbarAccount?.amount || '€900.00';
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Generate template default texts
  const getTemplateContent = (type: TemplateType) => {
    switch (type) {
      case 'job_offer_contract':
        return {
          title: `Official Employment Contract & Binding Job Offer - ${candidate.name}`,
          defaultRequiresSignature: true,
          body: `This Binding Employment Accord is entered into in accordance with the Danish Aliens Act (Udlændingeloven) and Green Sector Collective Bargaining Board (Gartneri-, Land- og Skovbrugets Arbejdsgivere / 3F Agreement).

1. APPOINTMENT & WORKPLACE
The Candidate, ${candidate.name} (Passport No: ${candidate.passportNumber}, Nationality: ${candidate.nationality}), is officially offered full-time placement under the ${schemeTitle}.
Sponsoring Employer: ${employerName}
Sponsor Registry Code: ${sponsorCode}
Case Reference: ${caseOrderId}

2. DURATION, WORKING HOURS & REMUNERATION
- Contract Term: Seasonal Agricultural Cycle (24 Months renewable).
- Standard Working Hours: 37 hours per week with overtime regulated under Danish 3F collective rates.
- Collective Agreement Monthly Wage: DKK 35,705.00 / month (equivalent hourly: DKK 135.50 - 222.00).
- Statutory Denbar Relocation Buffer: Disbursed upon arrival (${denbarBalance}).

3. STATUTORY COMPLIANCE & HOUSING
The employer guarantees verified employer-provided accommodation meeting Danish municipal health, sanitation, and safety standards at Havnegade 42, 5000 Odense C, Denmark.

4. BINDING ATTESTATION
Both employer and candidate agree that this contract is subject to final Danish Agency for International Recruitment and Integration (SIRI) biometric validation and visa endorsement.`,
        };

      case 'siri_sponsorship_clearance':
        return {
          title: `SIRI Sponsorship & Accommodation Clearance Certificate - ${sponsorCode}`,
          defaultRequiresSignature: false,
          body: `DANISH AGENCY FOR INTERNATIONAL RECRUITMENT AND INTEGRATION (SIRI)
OFFICIAL SPONSORSHIP & STATUTORY HOUSING CLEARANCE CERTIFICATE

Ref: SIRI/DK-SPONSOR/${sponsorCode.replace(/[^a-zA-Z0-9]/g, '')}-2026
Candidate Name: ${candidate.name}
Passport Number: ${candidate.passportNumber}
Date of Birth: ${candidate.dob}
Case Order ID: ${caseOrderId}

CERTIFICATION CLAUSE:
It is hereby certified that Sponsoring Employer ${employerName} (CVR: 38291044 / Sponsor Reference: ${sponsorCode}) holds active accreditation under the Danish Fast-Track & Green Sector Recruitment Scheme.

HOUSING GUARANTEE:
1. Certified residential accommodation compliant with Section 9a of the Danish Aliens Act has been inspected, allocated, and held in escrow for the applicant.
2. Full statutory municipal registration (CPR registration support) is guaranteed upon applicant arrival in Denmark.
3. Health and workplace indemnity insurance coverage (Sygesikring) is fully underwritten by the sponsor for the entire period of statutory engagement.

This clearance is officially lodged in the SIRI central electronic registry and authorizes VFS Global biometrics processing.`,
        };

      case 'embassy_biometrics_notice':
        return {
          title: `Embassy Biometrics Submission Authorization & Courier Notice - ${caseOrderId}`,
          defaultRequiresSignature: true,
          body: `OFFICIAL EMBASSY & VFS GLOBAL BIOMETRICS SUBMISSION AUTHORIZATION
Issued under the authority of the Ministry of Foreign Affairs of Denmark (Udenrigsministeriet) & SIRI

Applicant: ${candidate.name}
Passport Number: ${candidate.passportNumber}
Permanent Address: ${candidate.permanentAddress}
Contact Phone: ${candidate.phone}
Allocated Case Order ID: ${caseOrderId}
Accredited Danish Sponsor: ${employerName} (${sponsorCode})

DIRECTIVE TO VFS GLOBAL / CONSULAR POST:
The applicant named herein has completed pre-departure dossier vetting and statutory case order registration. The accredited visa application center is authorized to:
1. Capture ten-digit biometric fingerprints and high-resolution facial biometrics.
2. Verify original Nepalese passport against submitted color copies.
3. Securely seal the biometric dossier for priority consular diplomatic courier dispatch to SIRI Copenhagen Central Registry.

APPLICANT MANDATORY CHECKLIST:
- Original passport with minimum 24-month validity.
- 2 passport-size biometric color photographs (35mm x 45mm, white background).
- Printed copy of this Authorization Certificate with signed candidate declaration.
- Receipt of statutory SIRI administrative fee and VFS service charge reconciliation.`,
        };

      case 'subscription_denbar_receipt':
        return {
          title: `Official Subscription Fee & Denbar Clearance Receipt Stamp - €45.00`,
          defaultRequiresSignature: false,
          body: `DENBAR & DENMARK RECRUITMENT CONSORTIUM
OFFICIAL PORTAL SUBSCRIPTION & STATUTORY DISPATCH RECEIPT

Candidate Name: ${candidate.name}
Passport ID: ${candidate.passportNumber}
Assigned Ref: ${caseOrderId}
Scheme: ${schemeTitle}
Sponsor ID: ${sponsorCode}

FINANCIAL CLEARANCE SUMMARY:
- Portal Subscription & Biometric Crypto-Sync Fee: €45.00 (Reconciled / Certified)
- Denbar Sponsored Relocation Account: ${denbarBalance} (Active in Escrow)
- VFS Consular Biometrics Allowance: Fully Sponsored by Sponsoring Employer #${sponsorCode}

TRANSACTION AUDIT NOTE:
The payment has been reconciled with the central recruitment clearinghouse. The candidate dossier has been cleared for Stage 4 Live Zoom Facial Verification and subsequent Stage 5 Embassy Biometrics submission. No additional processing charges may be levied upon the candidate.

Certified by: ${actor}
Date of Certification: ${today}`,
        };
    }
  };

  useEffect(() => {
    if (isOpen) {
      const initial = getTemplateContent(selectedTemplate);
      setDocTitle(initial.title);
      setEditableBody(initial.body);
      setRequiresSignature(initial.defaultRequiresSignature);
      setPreviewMode(false);
    }
  }, [isOpen, selectedTemplate, candidate.id]);

  if (!isOpen) return null;

  const handleTemplateChange = (type: TemplateType) => {
    setSelectedTemplate(type);
    const content = getTemplateContent(type);
    setDocTitle(content.title);
    setEditableBody(content.body);
    setRequiresSignature(content.defaultRequiresSignature);
  };

  const generateFullHtmlDocument = () => {
    const safeTitle = escapeHtml(docTitle);
    const safeBody = escapeHtml(editableBody).replace(/\n/g, '<br/>');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <style>
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.6;
      margin: 0;
      padding: 32px;
      background: #ffffff;
    }
    .header {
      border-bottom: 3px solid #0b5e4a;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .flag {
      display: inline-block;
      width: 44px;
      height: 32px;
      background: #c8102e;
      position: relative;
      border: 1px solid #e2e8f0;
      border-radius: 2px;
    }
    .flag::before {
      content: '';
      position: absolute;
      left: 14px;
      top: 0;
      bottom: 0;
      width: 6px;
      background: #ffffff;
    }
    .flag::after {
      content: '';
      position: absolute;
      top: 13px;
      left: 0;
      right: 0;
      height: 6px;
      background: #ffffff;
    }
    .title-area h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: #0b5e4a;
      letter-spacing: -0.02em;
    }
    .title-area p {
      margin: 2px 0 0 0;
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 24px;
      font-size: 12px;
    }
    .meta-item strong {
      color: #475569;
      display: block;
      font-size: 10px;
      text-transform: uppercase;
    }
    .meta-item span {
      font-weight: 700;
      color: #0f172a;
    }
    .content-box {
      font-size: 12.5px;
      color: #1e293b;
      white-space: pre-wrap;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      line-height: 1.7;
    }
    .stamp-box {
      border: 2px dashed #0b5e4a;
      background: #f0fdf4;
      border-radius: 8px;
      padding: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
    }
    .stamp-text {
      font-size: 11px;
      color: #166534;
      font-weight: 700;
    }
    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="display: flex; align-items: center; gap: 12px;">
      <div class="flag"></div>
      <div class="title-area">
        <h1>DANISH IMMIGRATION &amp; RECRUITMENT CLEARANCE</h1>
        <p>SIRI Green Sector &middot; Official Consular Instrument &middot; 2026 Protocol</p>
      </div>
    </div>
    <div style="text-align: right; font-size: 11px; color: #64748b; font-family: monospace;">
      <strong>REF:</strong> ${escapeHtml(caseOrderId)}<br/>
      <strong>DATE:</strong> ${escapeHtml(today)}
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <strong>Candidate Full Legal Name</strong>
      <span>${escapeHtml(candidate.name)}</span>
    </div>
    <div class="meta-item">
      <strong>Passport Number</strong>
      <span style="font-family: monospace;">${escapeHtml(candidate.passportNumber)}</span>
    </div>
    <div class="meta-item">
      <strong>Sponsoring Employer &amp; CVR</strong>
      <span>${escapeHtml(employerName)}</span>
    </div>
    <div class="meta-item">
      <strong>SIRI Sponsor Reference Code</strong>
      <span style="font-family: monospace;">${escapeHtml(sponsorCode)}</span>
    </div>
  </div>

  <div class="content-box">${safeBody}</div>

  <div class="stamp-box">
    <div>
      <div class="stamp-text">✓ OFFICIALLY ENDORSED &amp; RECORDED IN SIRI RECRUITMENT REGISTRY</div>
      <div style="font-size: 10px; color: #15803d; margin-top: 2px;">
        Dispatched by Caseworker: ${escapeHtml(actor)} &middot; Copenhagen SIRI Processing Center
      </div>
    </div>
    <div style="border: 2px solid #0b5e4a; border-radius: 50%; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 800; color: #0b5e4a; text-align: center; transform: rotate(-10deg);">
      SIRI<br/>OFFICIAL<br/>2026
    </div>
  </div>

  <div class="footer">
    <span>Danish Agency for International Recruitment and Integration (SIRI) &middot; Carl Jacobsens Vej 39, 2500 Valby, Denmark</span>
    <span>Encrypted Cloud Dossier Entry</span>
  </div>
</body>
</html>`;
  };

  const handleDispatch = async () => {
    if (!docTitle.trim() || !editableBody.trim()) {
      showToast('Title and document content are required.', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const fullHtml = generateFullHtmlDocument();
      await createAgencyDocument(candidate.id, docTitle.trim(), fullHtml, requiresSignature, actor);
      showToast(`Generated & dispatched "${docTitle}" directly to candidate portal!`, 'success');
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to generate document.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5 my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Generate &amp; Dispatch Official SIRI Document
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Auto-Fill Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Recipient: <strong>{candidate.name}</strong> ({candidate.passportNumber}) &middot; Scheme: {candidate.schemeType || 'Seasonal'}
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

        {/* 4 Official Template Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 shrink-0">
          {[
            {
              id: 'job_offer_contract' as TemplateType,
              title: '1. Employment Contract',
              desc: 'Official 3F Collective Accord',
              icon: Building2,
            },
            {
              id: 'siri_sponsorship_clearance' as TemplateType,
              title: '2. SIRI Sponsorship Cert',
              desc: `Sponsor Code ${sponsorCode}`,
              icon: ShieldCheck,
            },
            {
              id: 'embassy_biometrics_notice' as TemplateType,
              title: '3. Embassy / VFS Notice',
              desc: 'Biometrics Authorization',
              icon: PenTool,
            },
            {
              id: 'subscription_denbar_receipt' as TemplateType,
              title: '4. Fee & Denbar Receipt',
              desc: `€45 Verified & ${denbarBalance}`,
              icon: Sparkles,
            },
          ].map((item) => {
            const isSelected = selectedTemplate === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTemplateChange(item.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-600'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Icon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{item.title}</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">{item.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Edit / Preview Controls */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-colors ${
                !previewMode
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Document</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-colors ${
                previewMode
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Formatted Preview</span>
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={requiresSignature}
              onChange={(e) => setRequiresSignature(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Candidate Digital E-Signature Required
            </span>
          </label>
        </div>

        {/* Content Body / Preview */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-[280px]">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Official Document Title
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {previewMode ? (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 p-2">
              <iframe
                title="Document Live Preview"
                srcDoc={generateFullHtmlDocument()}
                className="w-full h-[320px] rounded bg-white border border-slate-200"
              />
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Document Provisions &amp; Content (Auto-filled with candidate parameters)
              </label>
              <textarea
                rows={11}
                value={editableBody}
                onChange={(e) => setEditableBody(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="text-xs text-slate-500">
            {requiresSignature ? (
              <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                <PenTool className="w-3.5 h-3.5" />
                Will alert candidate to digitally sign in candidate portal
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Available immediately for download in candidate portal
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleDispatch}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating & Uploading...' : 'Generate & Dispatch to Candidate'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
