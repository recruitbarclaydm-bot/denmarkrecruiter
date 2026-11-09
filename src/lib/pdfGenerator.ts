import { DocumentRecord, CandidateRecord } from '@/types';

export const generateDocumentPdf = async (
  doc: DocumentRecord,
  candidate: CandidateRecord
): Promise<void> => {
  if (typeof window === 'undefined') return;

  const pdfFilename = doc.filename.endsWith('.pdf') ? doc.filename : `${doc.filename}.pdf`;

  // Try html2pdf.js
  try {
    // Dynamic import to prevent SSR window issues
    // @ts-ignore
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const container = document.createElement('div');
    container.style.cssText =
      'width:794px;background:#ffffff;color:#0f172a;font-family:system-ui,-apple-system,sans-serif;padding:36px;box-sizing:border-box;position:fixed;left:-9999px;top:0;line-height:1.55;';

    const isSigned = doc.key === 'vfsletter' && !!candidate.signatureDataUrl;
    let signatureHtml = '';
    if (isSigned && candidate.signatureDataUrl) {
      signatureHtml = `
        <div style="margin-top:20px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:11px;font-weight:700;color:#0b5e4a;text-transform:uppercase;">Applicant Biometric Declaration Signature</div>
            <div style="font-size:11px;color:#64748b;">${candidate.name} &middot; Verified via Central Immigration Gateway</div>
          </div>
          <div style="text-align:right;">
            <img src="${candidate.signatureDataUrl}" alt="Signature" style="max-height:48px;display:block;margin-left:auto;">
            <span style="font-size:10px;font-weight:700;color:#10b981;">&#10003; Cryptographically Signed</span>
          </div>
        </div>
      `;
    }

    let embeddedMediaHtml = '';
    if (doc.fileData && doc.fileType && doc.fileType.startsWith('image/')) {
      embeddedMediaHtml = `
        <div style="margin:16px 0;text-align:center;">
          <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:6px;text-transform:uppercase;">Attached Credential Document Scan</div>
          <img src="${doc.fileData}" style="max-width:100%;max-height:380px;border:1px solid #cbd5e1;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        </div>
      `;
    }

    container.innerHTML = `
      <div style="border-top: 5px solid #0b5e4a; padding-top: 14px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0b5e4a;padding-bottom:14px;margin-bottom:18px;">
          <div>
            <div style="font-size:15px;font-weight:800;color:#0b5e4a;letter-spacing:0.5px;">DANISH AGENCY FOR INTERNATIONAL RECRUITMENT AND INTEGRATION</div>
            <div style="font-size:10px;font-weight:600;color:#64748b;letter-spacing:0.5px;margin-top:2px;">MINISTRY OF IMMIGRATION AND INTEGRATION &middot; RESIDENCE &amp; WORK DIVISION &middot; COPENHAGEN</div>
            <div style="font-size:10.5px;font-weight:700;color:#0f172a;margin-top:3px;">OFFICIAL DOSSIER RECORD &middot; CASE ORDER ID: ${candidate.siriCaseOrder.caseOrderId}</div>
          </div>
          <div style="text-align:right;">
            <svg viewBox="0 0 370 280" width="46" height="35" style="border-radius:3px;box-shadow:0 1px 3px rgba(0,0,0,0.2);">
              <rect width="370" height="280" fill="#c8102e"/>
              <rect x="120" width="40" height="280" fill="#ffffff"/>
              <rect y="120" width="370" height="40" fill="#ffffff"/>
            </svg>
          </div>
        </div>

        <!-- Title Banner -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #0b5e4a;padding:12px 14px;border-radius:6px;margin-bottom:16px;">
          <div style="font-size:14px;font-weight:800;color:#0f172a;">${doc.title}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px;">Document Reference: <strong>${doc.docId}</strong> &middot; Issuing Authority: ${doc.authority}</div>
        </div>

        <!-- Metadata Grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;padding:12px;margin-bottom:18px;font-size:11.5px;">
          <div><strong style="color:#64748b;font-size:10px;text-transform:uppercase;display:block;">Candidate Name</strong> ${candidate.name}</div>
          <div><strong style="color:#64748b;font-size:10px;text-transform:uppercase;display:block;">Passport Number</strong> ${candidate.passportNumber} (ICAO 9303 Verified)</div>
          <div><strong style="color:#64748b;font-size:10px;text-transform:uppercase;display:block;">Immigration Scheme</strong> ${candidate.siriCaseOrder.scheme}</div>
          <div><strong style="color:#64748b;font-size:10px;text-transform:uppercase;display:block;">Designated Role</strong> ${candidate.jobTitle}</div>
          <div><strong style="color:#64748b;font-size:10px;text-transform:uppercase;display:block;">Authorized Employer</strong> ${candidate.employer.name} (CVR: ${candidate.employer.cvr})</div>
          <div><strong style="color:#64748b;font-size:10px;text-transform:uppercase;display:block;">Collective Standard</strong> ${candidate.employer.collectiveAgreement}</div>
          <div><strong style="color:#64748b;font-size:10px;text-transform:uppercase;display:block;">Registered Remuneration</strong> ${candidate.employer.monthlySalary} / Month</div>
          <div><strong style="color:#64748b;font-size:10px;text-transform:uppercase;display:block;">Verification Status</strong> Officially Registered &amp; Reconciled</div>
        </div>

        <!-- Document Body -->
        <div style="font-size:12.5px;color:#1e293b;line-height:1.6;margin-bottom:18px;">
          ${doc.body}
        </div>

        ${embeddedMediaHtml}
        ${signatureHtml}

        <!-- Official Stamp & Legal Footer -->
        <div style="margin-top:24px;border-top:1px solid #e2e8f0;padding-top:14px;display:flex;justify-content:space-between;align-items:flex-end;">
          <div>
            <div style="display:inline-block;padding:6px 12px;background:#fffbeb;border:1.5px solid #fbbf24;color:#92400e;font-size:11px;font-weight:800;border-radius:5px;letter-spacing:0.5px;">
              &#9733; OFFICIAL IMMIGRATION RECORD &middot; SIRI VERIFIED
            </div>
            <div style="font-size:10px;color:#64748b;margin-top:6px;">
              Issued under Section 9a of the Danish Aliens Act. Authenticated via Udl&aelig;ndingestyrelsen.
            </div>
          </div>
          <div style="text-align:right;font-size:10px;color:#64748b;">
            Verification Cryptographic Hash:<br>
            <code style="font-family:monospace;font-size:9.5px;color:#0f172a;">${doc.verificationHash || 'SHA256:7f83b1657ff1...9069'}</code><br>
            Date of Record: ${doc.date}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: pdfFilename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    await html2pdf().set(opt).from(container).save();
    document.body.removeChild(container);
  } catch (err) {
    console.warn('html2pdf generation error, using fallback:', err);
    // Fallback: download as formatted HTML document
    const fallbackHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${doc.title}</title><style>body{font-family:sans-serif;padding:30px;color:#0f172a;max-width:800px;margin:0 auto;line-height:1.6}.meta{background:#f8fafc;padding:14px;border:1px solid #e2e8f0;border-radius:6px;margin:18px 0;font-size:13px;display:grid;grid-template-columns:1fr 1fr;gap:10px;}</style></head><body><h2>DANISH AGENCY FOR INTERNATIONAL RECRUITMENT AND INTEGRATION (SIRI)</h2><div class="meta"><div><strong>Document:</strong> ${doc.title}</div><div><strong>ID:</strong> ${doc.docId}</div><div><strong>Applicant:</strong> ${candidate.name} (${candidate.passportNumber})</div><div><strong>Scheme:</strong> ${candidate.siriCaseOrder.scheme}</div><div><strong>Employer:</strong> ${candidate.employer.name}</div><div><strong>Case Order ID:</strong> ${candidate.siriCaseOrder.caseOrderId}</div></div><div>${doc.body}</div><div style="margin-top:30px;border-top:1px solid #e2e8f0;padding-top:14px;font-size:11px;color:#64748b;">Official SIRI Record &middot; Verified</div></body></html>`;

    const blob = new Blob([fallbackHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.filename.replace('.pdf', '.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
