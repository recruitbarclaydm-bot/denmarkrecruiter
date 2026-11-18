'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CandidateRecord,
  DocumentRecord,
  StageNumber,
  KycStatus,
  AccountStatus,
  AuditLogEntry,
  NotificationItem,
  NewCandidateInput,
} from '@/types';
import { INITIAL_CANDIDATES } from '@/data/mockUsers';

interface PortalStoreContextType {
  candidates: CandidateRecord[];
  selectedCandidateId: string;
  selectedCandidate: CandidateRecord | null;
  isInitialized: boolean;
  selectCandidate: (id: string) => void;
  approveAccount: (candidateId: string, sponsorCode?: string, caseOrderId?: string, actor?: string) => void;
  rejectAccount: (candidateId: string, reason: string, actor?: string) => void;
  verifyDocument: (candidateId: string, docId: string, actor?: string) => void;
  rejectDocument: (candidateId: string, docId: string, reason: string, actor?: string) => void;
  reuploadDocument: (
    candidateId: string,
    docId: string,
    fileData: string,
    fileName: string,
    fileType?: string
  ) => void;
  dispatchAdminDocument: (
    candidateId: string,
    title: string,
    category: string,
    body: string,
    requiresSignature: boolean,
    fileData?: string,
    actor?: string
  ) => void;
  signDocument: (
    candidateId: string,
    docId: string,
    signatureDataUrl: string,
    legalName: string
  ) => void;
  approveKyc: (candidateId: string, actor?: string) => void;
  rejectKyc: (candidateId: string, note: string, actor?: string) => void;
  updateCandidateKyc: (candidateId: string, data: Partial<CandidateRecord>) => void;
  setCandidateStage: (
    candidateId: string,
    stage: StageNumber,
    actor?: string
  ) => { success: boolean; reason?: string };
  registerCandidate: (data: NewCandidateInput) => CandidateRecord;
  markNotificationRead: (candidateId: string, notifId: string) => void;
  markAllNotificationsRead: (candidateId: string) => void;
  saveCandidateSignature: (candidateId: string, signatureDataUrl: string) => void;
  toggleChecklistItem: (candidateId: string, checkId: string) => void;
  getCandidateById: (id: string) => CandidateRecord | undefined;
  getCandidateByEmail: (email: string) => CandidateRecord | undefined;
}

const PortalStoreContext = createContext<PortalStoreContextType | undefined>(undefined);

const STORAGE_KEY = 'siri_portal_store_v2';

export const PortalStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [candidates, setCandidates] = useState<CandidateRecord[]>(INITIAL_CANDIDATES);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('dipak-karki');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize and merge store from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CandidateRecord[] = JSON.parse(stored);
        // Ensure core initial candidates exist and merge any schema additions
        const missing = INITIAL_CANDIDATES.filter(
          (ic) => !parsed.some((p) => p.id === ic.id || p.email.toLowerCase() === ic.email.toLowerCase())
        );

        // Also ensure parsed candidates have all modern fields (notifications, accountStatus, etc.)
        const upgraded = parsed.map((c) => {
          const matchInitial = INITIAL_CANDIDATES.find((ic) => ic.id === c.id);
          return {
            ...c,
            accountStatus: c.accountStatus || matchInitial?.accountStatus || 'approved',
            kycStatus: c.kycStatus || matchInitial?.kycStatus || 'submitted',
            kycNote: c.kycNote ?? matchInitial?.kycNote ?? '',
            auditLog: c.auditLog || matchInitial?.auditLog || [],
            notifications: c.notifications || matchInitial?.notifications || [],
            documents: c.documents || matchInitial?.documents || [],
          };
        });

        const merged = [...upgraded, ...missing];
        setCandidates(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CANDIDATES));
        setCandidates(INITIAL_CANDIDATES);
      }
    } catch (e) {
      console.warn('Error reading portal store from localStorage:', e);
      setCandidates(INITIAL_CANDIDATES);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const saveToStorage = (updated: CandidateRecord[]) => {
    setCandidates(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving portal store to localStorage:', e);
    }
  };

  const selectCandidate = (id: string) => {
    setSelectedCandidateId(id);
  };

  const getCandidateById = (id: string) => {
    return candidates.find((c) => c.id === id);
  };

  const getCandidateByEmail = (email: string) => {
    return candidates.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
  };

  // Helper to add notification and audit log
  const pushNotification = (
    candidate: CandidateRecord,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): NotificationItem => {
    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      title,
      message,
      read: false,
      type,
    };
  };

  const createAuditEntry = (actor: string, action: string, details: string): AuditLogEntry => {
    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      details,
    };
  };

  // Account Approval for Registration
  const approveAccount = (
    candidateId: string,
    sponsorCode?: string,
    caseOrderId?: string,
    actor = 'Morten Nyborg (SIRI Caseworker)'
  ) => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        const notif = pushNotification(
          c,
          'Account Approved & Portal Unlocked',
          `Your registration has been approved. Sponsor code ${sponsorCode || c.employer.sponsorCode} and Case Order ID ${caseOrderId || c.siriCaseOrder.caseOrderId} have been registered.`,
          'success'
        );
        const log = createAuditEntry(
          actor,
          'Account Registration Approved',
          `Unlocked candidate portal dossier. Assigned Sponsor: ${sponsorCode || c.employer.sponsorCode}`
        );

        return {
          ...c,
          accountStatus: 'approved' as AccountStatus,
          accountRejectionReason: undefined,
          employer: {
            ...c.employer,
            sponsorCode: sponsorCode || c.employer.sponsorCode,
          },
          siriCaseOrder: {
            ...c.siriCaseOrder,
            caseOrderId: caseOrderId || c.siriCaseOrder.caseOrderId,
          },
          notifications: [notif, ...c.notifications],
          auditLog: [log, ...c.auditLog],
        };
      }
      return c;
    });
    saveToStorage(updated);
  };

  const rejectAccount = (
    candidateId: string,
    reason: string,
    actor = 'Morten Nyborg (SIRI Caseworker)'
  ) => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        const notif = pushNotification(
          c,
          'Registration Feedback & Action Required',
          `Your account registration was not approved: ${reason}. Please update your details or contact the help desk.`,
          'error'
        );
        const log = createAuditEntry(
          actor,
          'Account Registration Rejected',
          `Registration rejected. Reason: ${reason}`
        );

        return {
          ...c,
          accountStatus: 'rejected' as AccountStatus,
          accountRejectionReason: reason,
          notifications: [notif, ...c.notifications],
          auditLog: [log, ...c.auditLog],
        };
      }
      return c;
    });
    saveToStorage(updated);
  };

  // Document Verification
  const verifyDocument = (
    candidateId: string,
    docId: string,
    actor = 'Morten Nyborg (SIRI Caseworker)'
  ) => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        let verifiedDocTitle = 'Document';
        const updatedDocs = c.documents.map((d) => {
          if (d.id === docId) {
            verifiedDocTitle = d.title || d.name || 'Document';
            return {
              ...d,
              status: 'verified' as const,
              rejectionReason: undefined,
            };
          }
          return d;
        });

        const notif = pushNotification(
          c,
          'Document Approved',
          `Your document "${verifiedDocTitle}" has been verified and cleared by the caseworker.`,
          'success'
        );
        const log = createAuditEntry(
          actor,
          'Document Verified',
          `Approved document: ${verifiedDocTitle}`
        );

        return {
          ...c,
          documents: updatedDocs,
          notifications: [notif, ...c.notifications],
          auditLog: [log, ...c.auditLog],
        };
      }
      return c;
    });
    saveToStorage(updated);
  };

  const rejectDocument = (
    candidateId: string,
    docId: string,
    reason: string,
    actor = 'Morten Nyborg (SIRI Caseworker)'
  ) => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        let rejectedDocTitle = 'Document';
        const updatedDocs = c.documents.map((d) => {
          if (d.id === docId) {
            rejectedDocTitle = d.title || d.name || 'Document';
            return {
              ...d,
              status: 'rejected' as const,
              rejectionReason: reason,
            };
          }
          return d;
        });

        const notif = pushNotification(
          c,
          'Document Requires Re-upload',
          `"${rejectedDocTitle}" was rejected: ${reason}. Please upload a new scan to proceed.`,
          'warning'
        );
        const log = createAuditEntry(
          actor,
          'Document Rejected',
          `Flagged "${rejectedDocTitle}". Feedback: ${reason}`
        );

        return {
          ...c,
          kycStatus: 'rejected' as KycStatus,
          documents: updatedDocs,
          notifications: [notif, ...c.notifications],
          auditLog: [log, ...c.auditLog],
        };
      }
      return c;
    });
    saveToStorage(updated);
  };

  const reuploadDocument = (
    candidateId: string,
    docId: string,
    fileData: string,
    fileName: string,
    fileType = 'application/pdf'
  ) => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        let docTitle = 'Document';
        const updatedDocs = c.documents.map((d) => {
          if (d.id === docId) {
            docTitle = d.title || d.name || 'Document';
            return {
              ...d,
              status: 'pending' as const,
              rejectionReason: undefined,
              fileData,
              filename: fileName,
              fileType,
              uploadedAt: new Date().toISOString(),
            };
          }
          return d;
        });

        const log = createAuditEntry(
          `${c.name} (Applicant)`,
          'Document Re-uploaded',
          `Uploaded revised file for "${docTitle}" (${fileName})`
        );

        return {
          ...c,
          kycStatus: 'submitted' as KycStatus,
          documents: updatedDocs,
          auditLog: [log, ...c.auditLog],
        };
      }
      return c;
    });
    saveToStorage(updated);
  };

  // Two-way Document Dispatch (Admin -> Candidate)
  const dispatchAdminDocument = (
    candidateId: string,
    title: string,
    category: string,
    body: string,
    requiresSignature: boolean,
    fileData?: string,
    actor = 'Morten Nyborg (SIRI Caseworker)'
  ) => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        const newDocId = `doc_dispatched_${Date.now()}`;
        const newDoc: DocumentRecord = {
          id: newDocId,
          key: `dispatched_${Date.now()}`,
          title,
          name: title,
          category,
          body,
          filename: `${title.replace(/\s+/g, '_')}.pdf`,
          docId: `DK-SIRI-REQ-${Math.floor(1000 + Math.random() * 9000)}`,
          authority: 'Danish Agency for International Recruitment and Integration (SIRI)',
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          uploadedAt: new Date().toISOString(),
          status: requiresSignature ? 'action_required' : 'verified',
          isDispatchedByAdmin: true,
          requiresSignature,
          fileData,
          fileType: fileData?.startsWith('data:image/') ? 'image/png' : 'application/pdf',
        };

        const notif = pushNotification(
          c,
          requiresSignature ? 'Action Required: Document Awaiting Your Signature' : 'New Official Document Dispatched',
          `Caseworker has dispatched "${title}". ${requiresSignature ? 'Please review and electronically sign this document in your portal.' : 'Available for download.'}`,
          requiresSignature ? 'warning' : 'info'
        );
        const log = createAuditEntry(
          actor,
          'Document Dispatched to Candidate',
          `Dispatched "${title}" (Signature Required: ${requiresSignature ? 'Yes' : 'No'})`
        );

        return {
          ...c,
          documents: [newDoc, ...c.documents],
          notifications: [notif, ...c.notifications],
          auditLog: [log, ...c.auditLog],
        };
      }
      return c;
    });
    saveToStorage(updated);
  };

  // Two-way Document Signing (Candidate signs back)
  const signDocument = (
    candidateId: string,
    docId: string,
    signatureDataUrl: string,
    legalName: string
  ) => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        let signedDocTitle = 'Document';
        const updatedDocs = c.documents.map((d) => {
          if (d.id === docId) {
            signedDocTitle = d.title || d.name || 'Document';
            return {
              ...d,
              status: 'signed_pending_review' as const,
              signatureDataUrl,
              signerLegalName: legalName,
              signedAt: new Date().toISOString(),
            };
          }
          return d;
        });

        const notif = pushNotification(
          c,
          'Signature Submitted',
          `Your electronic signature for "${signedDocTitle}" has been received and forwarded to the SIRI caseworker for final endorsement.`,
          'success'
        );
        const log = createAuditEntry(
          `${c.name} (Applicant)`,
          'Document Signed & Submitted',
          `Applicant electronically signed "${signedDocTitle}" as "${legalName}"`
        );

        return {
          ...c,
          documents: updatedDocs,
          notifications: [notif, ...c.notifications],
          auditLog: [log, ...c.auditLog],
        };
      }
      return c;
    });
    saveToStorage(updated);
  };

  // KYC Approval / Rejection
  const approveKyc = (candidateId: string, actor = 'Morten Nyborg (SIRI Caseworker)') => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        const notif = pushNotification(
          c,
          'KYC Verification Clearance Approved',
          'Your biometric and statutory identity documents have met all Danish SIRI compliance standards.',
          'success'
        );
        const log = createAuditEntry(
          actor,
          'KYC Clearance Approved',
          'All identity records, MRZ parameters, and background checks endorsed.'
        );

        return {
          ...c,
          kycStatus: 'verified' as KycStatus,
          kycNote: '',
          notifications: [notif, ...c.notifications],
          auditLog: [log, ...c.auditLog],
        };
      }
      return c;
    });
    saveToStorage(updated);
  };

  const rejectKyc = (
    candidateId: string,
    note: string,
    actor = 'Morten Nyborg (SIRI Caseworker)'
  ) => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        const notif = pushNotification(
          c,
          'KYC Review Notice',
          `Caseworker has requested updates to your identity dossier: ${note}. Please update your KYC information.`,
          'warning'
        );
        const log = createAuditEntry(
          actor,
          'KYC Clearance Flagged',
          `KYC dossier flagged for correction. Note: ${note}`
        );

        return {
          ...c,
          kycStatus: 'rejected' as KycStatus,
          kycNote: note,
          notifications: [notif, ...c.notifications],
          auditLog: [log, ...c.auditLog],
        };
      }
      return c;
    });
    saveToStorage(updated);
  };

  // Candidate updates their personal KYC data
  const updateCandidateKyc = (candidateId: string, data: Partial<CandidateRecord>) => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        const log = createAuditEntry(
          `${c.name} (Applicant)`,
          'KYC Dossier Updated',
          'Applicant updated personal identity and biometric data.'
        );
        return {
          ...c,
          ...data,
          kycStatus: 'submitted' as KycStatus,
          auditLog: [log, ...c.auditLog],
        };
      }
      return c;
    });
    saveToStorage(updated);
  };

  // Gated Stage Controller
  const setCandidateStage = (
    candidateId: string,
    stage: StageNumber,
    actor = 'Morten Nyborg (SIRI Caseworker)'
  ): { success: boolean; reason?: string } => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return { success: false, reason: 'Candidate not found.' };

    // Stage 5 Gatekeeper: Check that KYC is verified and core documents are approved
    if (stage >= 5) {
      const passportDoc = candidate.documents.find((d) => d.key === 'passport' || d.category?.toLowerCase() === 'identity');
      const passportVerified = passportDoc?.status === 'verified';
      const kycVerified = candidate.kycStatus === 'verified';

      if (!passportVerified || !kycVerified) {
        const missing = [];
        if (!passportVerified) missing.push('Passport Scan Verified');
        if (!kycVerified) missing.push('Full KYC Clearance Approved');
        return {
          success: false,
          reason: `Stage 5 (SIRI Case Processing & Assessment) is locked. Requirements missing: ${missing.join(', ')}.`,
        };
      }
    }

    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        const updatedStages = c.stages.map((st) => {
          if (st.number < stage) return { ...st, status: 'completed' as const };
          if (st.number === stage) return { ...st, status: 'active' as const };
          return { ...st, status: 'pending' as const };
        });

        const notif = pushNotification(
          c,
          `Visa Stage Updated to Stage ${stage}`,
          `Your immigration application has advanced to Stage ${stage}: ${c.stages[stage - 1]?.title || 'In Process'}.`,
          'info'
        );
        const log = createAuditEntry(
          actor,
          `Workflow Advanced to Stage ${stage}`,
          `Candidate dossier transitioned to Stage ${stage} (${c.stages[stage - 1]?.title || ''})`
        );

        return {
          ...c,
          currentStage: stage,
          stages: updatedStages,
          notifications: [notif, ...c.notifications],
          auditLog: [log, ...c.auditLog],
        };
      }
      return c;
    });
    saveToStorage(updated);
    return { success: true };
  };

  // Self-Registration Wizard / Admin Manual Registration
  const registerCandidate = (data: NewCandidateInput): CandidateRecord => {
    const newId = `cand_${Date.now()}`;
    const candidateName = (data.fullName || data.name || 'Candidate').trim();
    const isHerdsman = data.scheme === 'siri_herdsman';
    const caseId = `SB6-${Math.floor(100000 + Math.random() * 900000)}-2026`;
    const vfsRef = `VFS-KTM-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const initialDocs: DocumentRecord[] = [];

    // Passport Doc
    initialDocs.push({
      id: `doc_${newId}_passport`,
      key: 'passport',
      title: `Passport Scan (${data.passportNumber})`,
      name: `Passport Scan (${data.passportNumber})`,
      category: 'Identity',
      filename: `${candidateName.replace(/\s+/g, '_')}_Passport_Scan.pdf`,
      docId: `DOC-NPL-${data.passportNumber}`,
      authority: 'Ministry of Foreign Affairs, Kathmandu',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      uploadedAt: new Date().toISOString(),
      status: 'pending',
      body: `Color biometric scan and identity details page for Nepalese Passport ${data.passportNumber} issued to ${candidateName}.`,
      fileData: data.passportScanData || data.initialDocData,
      fileType: data.passportScanData?.startsWith('data:image/') ? 'image/png' : 'application/pdf',
      isCandidateUpload: true,
    });

    // Citizenship Doc
    if (data.citizenshipScanData) {
      initialDocs.push({
        id: `doc_${newId}_citizenship`,
        key: 'citizenship',
        title: 'Citizenship Certificate / National ID',
        name: 'Citizenship Certificate / National ID',
        category: 'Identity',
        filename: `${candidateName.replace(/\s+/g, '_')}_Citizenship.pdf`,
        docId: `CIT-NPL-${Math.floor(100000 + Math.random() * 900000)}`,
        authority: 'District Administration Office, Nepal',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        uploadedAt: new Date().toISOString(),
        status: 'pending',
        body: `Certified copy of National Citizenship Certificate for ${candidateName}.`,
        fileData: data.citizenshipScanData,
        fileType: 'image/png',
        isCandidateUpload: true,
      });
    }

    // CV Doc
    if (data.cvData) {
      initialDocs.push({
        id: `doc_${newId}_cv`,
        key: 'cv',
        title: 'Europass CV / Agricultural Profile',
        name: 'Europass CV / Agricultural Profile',
        category: 'Qualification',
        filename: `${candidateName.replace(/\s+/g, '_')}_CV.pdf`,
        docId: `CV-EU-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        authority: 'Europass Standard Framework',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        uploadedAt: new Date().toISOString(),
        status: 'pending',
        body: `Curriculum Vitae detailing agricultural background for ${candidateName}. Experience summary: ${data.workExperienceSummary || 'Verified agricultural experience.'}`,
        fileData: data.cvData,
        fileType: 'application/pdf',
        isCandidateUpload: true,
      });
    }

    const newCandidate: CandidateRecord = {
      id: newId,
      email: data.email.trim().toLowerCase(),
      password: data.password || 'Candidate@2026',
      name: candidateName,
      passportNumber: data.passportNumber.trim(),
      passportExpiry: data.passportExpiry || '2032-12-31',
      dob: data.dob,
      nationality: data.nationality || 'Nepalese',
      permanentAddress: data.permanentAddress || 'Kathmandu, Nepal',
      phone: data.phone || '+977-9800000000',
      jobTitle: data.jobTitle || (isHerdsman ? 'Herdsman / Agricultural Specialist' : 'Agriculturist'),
      schemeType: data.scheme,
      contractDuration: isHerdsman ? '24 Months (Extendable to Permanent)' : 'January 2027 – June 2028',
      statusBadgeText: 'Registration Under Review',
      accountStatus: 'pending_approval',
      kycStatus: 'submitted',
      kycNote: '',
      workExperienceSummary: data.workExperienceSummary,
      employer: {
        name: isHerdsman ? 'AgroNord A/S' : 'Denbar & Denmark Seasonal Agricultural Scheme',
        cvr: '38291044',
        sponsorCode: data.sponsorCode || '#944135',
        address: 'Havnegade 42, 5000 Odense C, Denmark',
        collectiveAgreement: isHerdsman
          ? '3F / GLA Agreement (Gartneri-, Land- og Skovbrugets Arbejdsgivere)'
          : 'Denmark Seasonal Scheme Collective Terms',
        monthlySalary: 'DKK 35,705.00',
        workingHours: '37 Hours/Week',
      },
      currentStage: 1,
      stages: [
        {
          number: 1,
          titleKey: 'stage1',
          title: 'Employment Contract Signed',
          description: 'Standard 37-hr Danish collective contract signed under 3F / GLA terms.',
          status: 'active',
        },
        {
          number: 2,
          titleKey: 'stage2',
          title: 'SIRI Case Order ID Created & Paid',
          description: `SIRI Case Order ID ${caseId} registered.`,
          status: 'pending',
        },
        {
          number: 3,
          titleKey: 'stage3',
          title: 'Online Application Form (AR1) Submitted',
          description: 'Joint employer and applicant filing on Newtodenmark.dk.',
          status: 'pending',
        },
        {
          number: 4,
          titleKey: 'stage4',
          title: 'VFS Biometrics & Passport Presentation',
          description: 'Sign biometric consent declaration & present passport at VFS Global Kathmandu.',
          status: 'pending',
        },
        {
          number: 5,
          titleKey: 'stage5',
          title: 'SIRI Case Processing & Assessment',
          description: 'Danish Immigration Authority assessment of qualification and compliance.',
          status: 'pending',
        },
        {
          number: 6,
          titleKey: 'stage6',
          title: 'Residence & Work Permit Decision',
          description: 'Approval letter, biometric card (opholdskort), and entry visa vignette.',
          status: 'pending',
        },
      ],
      siriCaseOrder: {
        caseOrderId: caseId,
        scheme: isHerdsman
          ? 'Herdsmen & Farm Managers Scheme (SIRI Section 9a)'
          : 'Denmark Seasonal Agricultural Scheme',
        statutoryFee: isHerdsman ? 'DKK 4,405.00' : '€900.00 Sponsored',
        feeStatus: 'paid',
        caseRegistry: 'Danish Immigration Service · Copenhagen',
      },
      vfsAppointment: {
        refNumber: vfsRef,
        centerName: 'VFS Global Kathmandu',
        address: 'Level 4, Chhaya Center, Amrit Marg, Thamel, Kathmandu 44600, Nepal',
        appointmentDate: 'Scheduled Post-Approval',
        isoDateTime: new Date(Date.now() + 14 * 86400000).toISOString(),
        status: 'booked',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=VFS+Global+Kathmandu+Chhaya+Center+Thamel',
      },
      denbarAccount: !isHerdsman
        ? {
            amount: '€900.00',
            status: 'Funds Awaiting Approval',
            vfsFee: 'Fully Sponsored',
            linkedTo: 'Pending Setup',
          }
        : undefined,
      actionRequired: !isHerdsman
        ? {
            facialTime: '10:00 AM',
            subscription: '€45 Pending',
            task: 'Portal Verification',
          }
        : undefined,
      quickActions: !isHerdsman
        ? {
            zoomUrl: 'https://us05web.zoom.us/j/87248052434?pwd=BLjLLbOBFdg93bEHEkRTkIuZzc6QXY.1',
            supportEmail: 'verification@denmarkscheme.com',
            subscriptionAmount: '€45',
          }
        : undefined,
      documents: initialDocs,
      checklist: [
        { id: `chk_${newId}_1`, label: 'Passport & Citizenship Documents Submitted', checked: true },
        { id: `chk_${newId}_2`, label: 'Police Clearance Certificate (Apostilled)', checked: false },
        { id: `chk_${newId}_3`, label: 'Signed Biometric Consent & Data Privacy Declaration', checked: false },
        { id: `chk_${newId}_4`, label: 'Medical Clearance & Physical Fitness Certificate', checked: false },
      ],
      notifications: [
        {
          id: `notif_${newId}_welcome`,
          timestamp: new Date().toISOString(),
          title: 'Registration Received',
          message: 'Your registration dossier has been submitted to the SIRI Caseworker Division for account approval.',
          read: false,
          type: 'info',
        },
      ],
      auditLog: [
        {
          id: `log_${newId}_init`,
          timestamp: new Date().toISOString(),
          actor: `${data.name} (Applicant)`,
          action: 'Candidate Registered',
          details: `Self-registered via Portal wizard with Passport ${data.passportNumber}.`,
        },
      ],
    };

    const updatedList = [newCandidate, ...candidates];
    saveToStorage(updatedList);
    return newCandidate;
  };

  // Notification management
  const markNotificationRead = (candidateId: string, notifId: string) => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        return {
          ...c,
          notifications: c.notifications.map((n) => (n.id === notifId ? { ...n, read: true } : n)),
        };
      }
      return c;
    });
    saveToStorage(updated);
  };

  const markAllNotificationsRead = (candidateId: string) => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        return {
          ...c,
          notifications: c.notifications.map((n) => ({ ...n, read: true })),
        };
      }
      return c;
    });
    saveToStorage(updated);
  };

  const saveCandidateSignature = (candidateId: string, signatureDataUrl: string) => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        const log = createAuditEntry(
          `${c.name} (Applicant)`,
          'Biometric Canvas Signature Recorded',
          'Candidate completed digital signature capture on official portal canvas.'
        );
        return {
          ...c,
          signatureDataUrl,
          signatureTimestamp: new Date().toISOString(),
          auditLog: [log, ...c.auditLog],
        };
      }
      return c;
    });
    saveToStorage(updated);
  };

  const toggleChecklistItem = (candidateId: string, checkId: string) => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        return {
          ...c,
          checklist: c.checklist.map((chk) => (chk.id === checkId ? { ...chk, checked: !chk.checked } : chk)),
        };
      }
      return c;
    });
    saveToStorage(updated);
  };

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0] || null;

  return (
    <PortalStoreContext.Provider
      value={{
        candidates,
        selectedCandidateId,
        selectedCandidate,
        isInitialized,
        selectCandidate,
        approveAccount,
        rejectAccount,
        verifyDocument,
        rejectDocument,
        reuploadDocument,
        dispatchAdminDocument,
        signDocument,
        approveKyc,
        rejectKyc,
        updateCandidateKyc,
        setCandidateStage,
        registerCandidate,
        markNotificationRead,
        markAllNotificationsRead,
        saveCandidateSignature,
        toggleChecklistItem,
        getCandidateById,
        getCandidateByEmail,
      }}
    >
      {children}
    </PortalStoreContext.Provider>
  );
};

export const usePortalStore = (): PortalStoreContextType => {
  const context = useContext(PortalStoreContext);
  if (!context) {
    throw new Error('usePortalStore must be used within a PortalStoreProvider');
  }
  return context;
};
