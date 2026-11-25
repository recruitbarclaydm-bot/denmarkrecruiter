'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  CandidateRecord,
  DocumentRecord,
  StageNumber,
  KycStatus,
  AccountStatus,
  AuditLogEntry,
  NotificationItem,
  NewCandidateInput,
  NepalKycDetails,
  CandidateProcessMetadata,
  ServiceFeeTransaction,
  VideoInterviewSchedule,
  ApplicationCenterSchedule,
  AdminCrmMetadata,
} from '@/types';
import { INITIAL_CANDIDATES } from '@/data/mockUsers';
import { createEphemeralSupabaseClient, getSignedDocumentUrl, supabase } from '@/lib/supabase';

interface PortalStoreContextType {
  candidates: CandidateRecord[];
  selectedCandidateId: string;
  selectedCandidate: CandidateRecord | null;
  isInitialized: boolean;
  adminCrmMetadata: Record<string, AdminCrmMetadata>;
  saveAdminCrmMetadata: (candidateId: string, metadata: AdminCrmMetadata) => Promise<void>;
  refreshStore: () => Promise<void>;
  submitServiceFeeReceipt: (candidateId: string, file: File, transaction: ServiceFeeTransaction) => Promise<void>;
  reviewServiceFeeReceipt: (candidateId: string, approved: boolean, reason?: string, actor?: string) => Promise<void>;
  updateCandidateAgencyDetails: (candidateId: string, details: { balance?: string; status?: string; sponsorCode?: string; caseOrderId?: string; employerName?: string }, actor?: string) => Promise<void>;
  updateCandidateProcessMeta: (candidateId: string, metadata: Partial<CandidateProcessMetadata>, actor?: string) => Promise<void>;
  sendCandidateNotification: (candidateId: string, title: string, message: string, actor?: string) => Promise<void>;
  createAgencyDocument: (candidateId: string, title: string, html: string, requiresSignature: boolean, actor?: string) => Promise<void>;
  uploadCandidateAvatar: (candidateId: string, file: File) => Promise<void>;
  uploadCoreDocument: (candidateId: string, name: string, category: string, file: File, existingDocumentId?: string) => Promise<void>;
  selectCandidate: (id: string) => void;
  deleteCandidatePermanently: (candidateId: string) => Promise<void>;
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
  updateCandidateKyc: (candidateId: string, data: Partial<CandidateRecord>) => Promise<void>;
  setCandidateStage: (
    candidateId: string,
    stage: StageNumber,
    actor?: string
  ) => { success: boolean; reason?: string };
  registerCandidate: (data: NewCandidateInput, useEphemeralClient?: boolean) => Promise<CandidateRecord>;
  markNotificationRead: (candidateId: string, notifId: string) => void;
  markAllNotificationsRead: (candidateId: string) => void;
  saveCandidateSignature: (candidateId: string, signatureDataUrl: string) => void;
  toggleChecklistItem: (candidateId: string, checkId: string) => void;
  getCandidateById: (id: string) => CandidateRecord | undefined;
  getCandidateByEmail: (email: string) => CandidateRecord | undefined;
}

const PortalStoreContext = createContext<PortalStoreContextType | undefined>(undefined);

type CandidateRow = Record<string, any>;
type DocumentRow = Record<string, any>;

const serializeKycNote = (candidate: CandidateRecord) => JSON.stringify({
  schema: 'siri_kyc_v1',
  rejectionNote: candidate.kycNote || '',
  extended: candidate.extendedKyc || {},
  process: Object.fromEntries(Object.entries(candidate.processMeta || {}).filter(
    ([key]) => key !== 'coordinatorNotes' && key !== 'priority'
  )),
});

const parseKycNote = (rawValue: unknown): { rejectionNote: string; extended: Partial<NepalKycDetails>; process: CandidateProcessMetadata } => {
  if (typeof rawValue !== 'string' || !rawValue) return { rejectionNote: '', extended: {}, process: {} };
  try {
    const parsed = JSON.parse(rawValue);
    if (parsed?.schema === 'siri_kyc_v1') {
      return {
        rejectionNote: typeof parsed.rejectionNote === 'string' ? parsed.rejectionNote : '',
        extended: parsed.extended && typeof parsed.extended === 'object' ? parsed.extended : {},
        process: parsed.process && typeof parsed.process === 'object'
          ? Object.fromEntries(Object.entries(parsed.process).filter(([key]) => key !== 'coordinatorNotes' && key !== 'priority'))
          : {},
      };
    }
  } catch {
    return { rejectionNote: rawValue, extended: {}, process: {} };
  }
  return { rejectionNote: rawValue, extended: {}, process: {} };
};

const toUiDocumentStatus = (status: string): DocumentRecord['status'] => {
  if (status === 'awaiting_signature') return 'action_required';
  if (status === 'signed_pending_review') return 'signed_pending_review';
  if (status === 'rejected') return 'rejected';
  if (status === 'verified') return 'verified';
  return 'pending';
};

const toDatabaseDocumentStatus = (document: DocumentRecord) => {
  if (document.status === 'verified') return 'verified';
  if (document.status === 'rejected' || document.status === 'flagged') return 'rejected';
  if (document.status === 'signed_pending_review') return 'signed_pending_review';
  if (document.status === 'action_required' && document.requiresSignature) return 'awaiting_signature';
  return 'pending';
};

const toCandidateRow = (candidate: CandidateRecord) => ({
  id: candidate.id,
  email: candidate.email,
  full_name: candidate.name,
  role: 'candidate',
  account_status: candidate.accountStatus,
  kyc_status: candidate.kycStatus,
  kyc_note: serializeKycNote(candidate),
  avatar_url: candidate.avatarStoragePath || null,
  current_stage: candidate.currentStage,
  passport_number: candidate.passportNumber,
  passport_expiry: candidate.passportExpiry || null,
  dob: candidate.dob,
  nationality: candidate.nationality,
  address: candidate.permanentAddress,
  phone: candidate.phone,
  scheme: candidate.schemeType || null,
  sponsor_code: candidate.employer?.sponsorCode || null,
  case_order_id: candidate.siriCaseOrder?.caseOrderId || null,
  employer_name: candidate.employer?.name || null,
  denbar_balance: candidate.denbarAccount?.amount?.replace(/[^0-9.]/g, '') || null,
  subscription_status: candidate.actionRequired?.subscription || candidate.denbarAccount?.status || null,
});

const toDocumentRow = (candidateId: string, document: DocumentRecord, storagePath?: string) => ({
  candidate_id: candidateId,
  name: document.title || document.name || document.filename,
  category: document.category || 'General',
  direction: document.isDispatchedByAdmin ? 'admin_dispatched' : 'candidate_upload',
  requires_signature: Boolean(document.requiresSignature),
  status: toDatabaseDocumentStatus(document),
  rejection_reason: document.rejectionReason || null,
  storage_path: storagePath || document.storagePath || null,
  signature_data: document.signatureDataUrl || null,
  uploaded_at: document.uploadedAt || new Date().toISOString(),
});

const uploadDocumentData = async (
  candidateId: string,
  fileName: string,
  fileData?: string,
  isAdminUpload = false,
  pathPrefix = ''
) => {
  if (!fileData) return undefined;
  const blob = fileData.startsWith('data:')
    ? await (await fetch(fileData)).blob()
    : new Blob([Uint8Array.from(atob(fileData), (character) => character.charCodeAt(0))]);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${candidateId}/${isAdminUpload ? 'admin_' : pathPrefix}${Date.now()}_${safeName}`;
  const { error } = await supabase.storage.from('dossier-documents').upload(storagePath, blob, {
    contentType: blob.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw error;
  return storagePath;
};

const persistCandidateDiff = async (previous: CandidateRecord | undefined, candidate: CandidateRecord) => {
  const profileResult = previous
    ? await supabase.from('candidates').update(toCandidateRow(candidate)).eq('id', candidate.id)
    : await supabase.from('candidates').upsert(toCandidateRow(candidate), { onConflict: 'id' });
  if (profileResult.error) throw profileResult.error;

  const oldDocuments = new Map((previous?.documents || []).map((document) => [document.id, document]));
  for (const document of candidate.documents) {
    const oldDocument = oldDocuments.get(document.id);
    if (oldDocument && JSON.stringify(oldDocument) === JSON.stringify(document)) continue;
    const uploadedPath = document.fileData
      ? await uploadDocumentData(candidate.id, document.filename, document.fileData, document.isDispatchedByAdmin)
      : undefined;
    const payload = toDocumentRow(candidate.id, document, uploadedPath);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(document.id);
    const result = oldDocument && isUuid
      ? await supabase.from('dossier_documents').update(payload).eq('id', document.id)
      : await supabase.from('dossier_documents').insert(payload);
    if (result.error) throw result.error;
  }

  const oldNotifications = new Map((previous?.notifications || []).map((item) => [item.id, item]));
  for (const notification of candidate.notifications) {
    const oldNotification = oldNotifications.get(notification.id);
    if (oldNotification && oldNotification.read === notification.read) continue;
    const result = oldNotification
      ? await supabase.from('notifications').update({ is_read: notification.read }).eq('id', notification.id)
      : await supabase.from('notifications').insert({
          candidate_id: candidate.id,
          title: notification.title,
          message: notification.message,
          is_read: notification.read,
        });
    if (result.error) throw result.error;
  }

  const oldLogs = new Set((previous?.auditLog || []).map((item) => item.id));
  const newLogs = candidate.auditLog.filter((item) => !oldLogs.has(item.id));
  const signaturePath = candidate.signatureDataUrl && candidate.signatureDataUrl !== previous?.signatureDataUrl
    ? await uploadDocumentData(candidate.id, 'candidate-signature.png', candidate.signatureDataUrl, false, 'signature_')
    : undefined;
  if (newLogs.length) {
    const { error } = await supabase.from('audit_logs').insert(
      newLogs.map((item) => ({
        candidate_id: candidate.id,
        actor: item.actor,
        action: item.action,
        details: item.action === 'Biometric Canvas Signature Recorded' && signaturePath
          ? JSON.stringify({ storage_path: signaturePath })
          : item.details,
      }))
    );
    if (error) throw error;
  }
};

const mapCandidateRow = async (
  row: CandidateRow,
  documents: DocumentRow[],
  notifications: CandidateRow[],
  auditLogs: CandidateRow[]
): Promise<CandidateRecord> => {
  const template = INITIAL_CANDIDATES.find((candidate) => candidate.email.toLowerCase() === String(row.email).toLowerCase());
  const base = template || INITIAL_CANDIDATES[row.scheme === 'seasonal_agriculture' ? 1 : 0];
  const mappedDocuments = await Promise.all(
    documents.map(async (document) => {
      const source = base.documents.find((item) =>
        (item.title || item.name || '').toLowerCase() === String(document.name || '').toLowerCase()
      );
      const storagePath = document.storage_path as string | null;
      const fileUrl = storagePath ? await getSignedDocumentUrl(storagePath) : source?.fileUrl;
      let signatureDataUrl: string | undefined;
      let transactionDetails: ServiceFeeTransaction | undefined;
      if (typeof document.signature_data === 'string' && document.signature_data) {
        try {
          const parsed = JSON.parse(document.signature_data);
          if (parsed && typeof parsed === 'object' && 'transactionId' in parsed) {
            transactionDetails = parsed as ServiceFeeTransaction;
          } else {
            signatureDataUrl = document.signature_data;
          }
        } catch {
          signatureDataUrl = document.signature_data;
        }
      }
      return {
        ...(source || {}),
        id: document.id,
        key: source?.key || String(document.category || 'document').toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        title: document.name,
        name: document.name,
        filename: storagePath?.split('/').pop()?.replace(/^\d+_/, '') || source?.filename || document.name,
        category: document.category || source?.category || 'General',
        date: source?.date || new Date(document.uploaded_at || Date.now()).toLocaleDateString('en-GB'),
        uploadedAt: document.uploaded_at || source?.uploadedAt,
        status: toUiDocumentStatus(document.status),
        rejectionReason: document.rejection_reason || undefined,
        fileUrl,
        storagePath: storagePath || undefined,
        fileData: undefined,
        isCandidateUpload: document.direction === 'candidate_upload',
        isDispatchedByAdmin: document.direction === 'admin_dispatched',
        requiresSignature: Boolean(document.requires_signature),
        signatureDataUrl,
        transactionDetails,
        body: source?.body || `Submitted document: ${document.name}.`,
      } as DocumentRecord;
    })
  );

  const stage = Math.min(6, Math.max(1, Number(row.current_stage) || 1)) as StageNumber;
  const kycData = parseKycNote(row.kyc_note);
  const avatarStoragePath = row.avatar_url || undefined;
  const avatarUrl = avatarStoragePath ? await getSignedDocumentUrl(avatarStoragePath) : undefined;
  const checklistLog = auditLogs.find((item) => item.action === 'Checklist State');
  let checklist = base.checklist;
  if (checklistLog) {
    try {
      checklist = JSON.parse(checklistLog.details);
    } catch {
      checklist = base.checklist;
    }
  }
  let signatureDataUrl = base.signatureDataUrl;
  const signatureLog = auditLogs.find((item) => item.action === 'Biometric Canvas Signature Recorded');
  if (signatureLog) {
    try {
      const signatureDetails = JSON.parse(signatureLog.details);
      if (signatureDetails.storage_path) signatureDataUrl = await getSignedDocumentUrl(signatureDetails.storage_path);
    } catch {
      signatureDataUrl = base.signatureDataUrl;
    }
  }
  return {
    ...base,
    id: row.id,
    email: row.email,
    name: row.full_name || base.name,
    password: undefined,
    passportNumber: row.passport_number || '',
    passportExpiry: row.passport_expiry || '',
    dob: row.dob || '',
    nationality: row.nationality || '',
    permanentAddress: row.address || '',
    phone: row.phone || '',
    schemeType: row.scheme || base.schemeType,
    currentStage: stage,
    stages: base.stages.map((item) => ({
      ...item,
      status: item.number < stage ? 'completed' : item.number === stage ? 'active' : 'pending',
    })),
    accountStatus: row.account_status,
    accountRejectionReason: row.account_status === 'rejected' ? kycData.rejectionNote || undefined : undefined,
    kycStatus: row.kyc_status,
    kycNote: kycData.rejectionNote,
    extendedKyc: kycData.extended,
    processMeta: kycData.process,
    avatarUrl,
    avatarStoragePath,
    employer: { ...base.employer, name: row.employer_name || base.employer.name, sponsorCode: row.sponsor_code || '' },
    siriCaseOrder: { ...base.siriCaseOrder, caseOrderId: row.case_order_id || '' },
    denbarAccount: row.denbar_balance
      ? {
          ...(base.denbarAccount || { vfsFee: 'Fully Sponsored', linkedTo: 'Pending Setup' }),
          amount: `€${row.denbar_balance}`,
          status: row.subscription_status || 'Pending',
        }
      : base.denbarAccount,
    actionRequired: row.subscription_status
      ? {
          ...(base.actionRequired || { facialTime: '10:00 AM', task: 'Portal Verification' }),
          subscription: row.subscription_status,
        }
      : base.actionRequired,
    documents: mappedDocuments,
    checklist,
    signatureDataUrl,
    signatureTimestamp: signatureLog?.created_at || base.signatureTimestamp,
    notifications: notifications.map((item) => ({
      id: item.id,
      timestamp: item.created_at,
      title: item.title,
      message: item.message,
      read: Boolean(item.is_read),
      type: 'info' as const,
    })),
    auditLog: auditLogs.map((item) => ({
      id: item.id,
      timestamp: item.created_at,
      actor: item.actor,
      action: item.action,
      details: item.details,
    })),
  };
};

export const PortalStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [adminCrmMetadata, setAdminCrmMetadata] = useState<Record<string, AdminCrmMetadata>>({});
  const candidatesRef = useRef<CandidateRecord[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  const refreshStore = useCallback(async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setAdminCrmMetadata({});
        candidatesRef.current = [];
        setCandidates([]);
        setSelectedCandidateId('');
        return;
      }

      const { data: ownProfile, error: profileError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!ownProfile) {
        setAdminCrmMetadata({});
        candidatesRef.current = [];
        setCandidates([]);
        setSelectedCandidateId('');
        return;
      }

      if (ownProfile.role === 'admin') {
        const { data: crmRows, error: crmError } = await supabase.from('notifications')
          .select('title,message')
          .eq('candidate_id', authData.user.id)
          .like('title', 'crm:%');
        if (crmError) throw crmError;
        const crmMetadata = Object.fromEntries((crmRows || []).flatMap((row) => {
          try {
            return [[row.title.slice(4), JSON.parse(row.message) as AdminCrmMetadata]];
          } catch {
            return [];
          }
        }));
        setAdminCrmMetadata(crmMetadata);
      } else {
        setAdminCrmMetadata({});
      }

      const candidateQuery = supabase.from('candidates').select('*').eq('role', 'candidate');
      const { data: candidateRows, error: candidatesError } = ownProfile.role === 'admin'
        ? await candidateQuery.order('created_at', { ascending: false })
        : await supabase.from('candidates').select('*').eq('id', authData.user.id).eq('role', 'candidate');
      if (candidatesError) throw candidatesError;

      const rows = candidateRows || [];
      const candidateIds = rows.map((row) => row.id);
      if (!candidateIds.length) {
        candidatesRef.current = [];
        setCandidates([]);
        setSelectedCandidateId('');
        return;
      }

      const [documentResult, notificationResult, auditResult] = await Promise.all([
        supabase.from('dossier_documents').select('*').in('candidate_id', candidateIds),
        supabase.from('notifications').select('*').in('candidate_id', candidateIds).order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').in('candidate_id', candidateIds).order('created_at', { ascending: false }),
      ]);
      if (documentResult.error) throw documentResult.error;
      if (notificationResult.error) throw notificationResult.error;
      if (auditResult.error) throw auditResult.error;

      const hydrated = await Promise.all(rows.map((row) => mapCandidateRow(
        row,
        (documentResult.data || []).filter((item) => item.candidate_id === row.id),
        (notificationResult.data || []).filter((item) => item.candidate_id === row.id),
        (auditResult.data || []).filter((item) => item.candidate_id === row.id)
      )));
      candidatesRef.current = hydrated;
      setCandidates(hydrated);
      setSelectedCandidateId((selectedId) => hydrated.some((candidate) => candidate.id === selectedId)
        ? selectedId
        : hydrated[0]?.id || '');
    } catch (error) {
      console.error('Unable to load portal data from Supabase:', error);
      setAdminCrmMetadata({});
      candidatesRef.current = [];
      setCandidates([]);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    void refreshStore();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setIsInitialized(false);
      queueMicrotask(() => void refreshStore());
    });
    let realtimeChannel = supabase.channel(`portal-sync-${Math.random().toString(36).slice(2)}`);
    for (const table of ['candidates', 'dossier_documents', 'notifications', 'audit_logs']) {
      realtimeChannel = realtimeChannel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
      }, () => queueMicrotask(() => void refreshStore()));
    }
    realtimeChannel.subscribe();
    return () => {
      subscription.unsubscribe();
      void realtimeChannel.unsubscribe();
    };
  }, [refreshStore]);

  const saveToStorage = (updated: CandidateRecord[], propagateError = false): Promise<void> => {
    const previous = candidatesRef.current;
    candidatesRef.current = updated;
    setCandidates(updated);
    const changed = updated.filter((candidate) => {
      const oldCandidate = previous.find((item) => item.id === candidate.id);
      return !oldCandidate || JSON.stringify(oldCandidate) !== JSON.stringify(candidate);
    });
    return Promise.all(changed.map((candidate) => persistCandidateDiff(
      previous.find((item) => item.id === candidate.id),
      candidate
    ))).then(() => refreshStore()).catch((error) => {
      console.error('Unable to save portal changes to Supabase:', error);
      if (propagateError) throw error;
    });
  };

  const uploadCandidateAvatar = async (candidateId: string, file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Choose a JPG, PNG, or WEBP image.');
    }
    if (file.size > 5 * 1024 * 1024) throw new Error('Profile photo must be 5MB or smaller.');

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${candidateId}/avatar_${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage.from('dossier-documents').upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { error: profileError } = await supabase.from('candidates')
      .update({ avatar_url: storagePath })
      .eq('id', candidateId);
    if (profileError) {
      await supabase.storage.from('dossier-documents').remove([storagePath]);
      throw profileError;
    }

    const candidate = candidatesRef.current.find((item) => item.id === candidateId);
    const actor = candidate?.name || 'Candidate';
    const { error: auditError } = await supabase.from('audit_logs').insert({
      candidate_id: candidateId,
      actor: `${actor} (Applicant)`,
      action: 'Biometric Avatar Uploaded',
      details: 'Candidate uploaded a passport-style profile photo.',
    });
    if (auditError) throw auditError;

    const signedUrl = await getSignedDocumentUrl(storagePath);
    const updated = candidatesRef.current.map((item) => item.id === candidateId
      ? {
          ...item,
          avatarStoragePath: storagePath,
          avatarUrl: signedUrl,
          auditLog: [{
            id: `avatar_${Date.now()}`,
            timestamp: new Date().toISOString(),
            actor: `${actor} (Applicant)`,
            action: 'Biometric Avatar Uploaded',
            details: 'Candidate uploaded a passport-style profile photo.',
          }, ...item.auditLog],
        }
      : item);
    candidatesRef.current = updated;
    setCandidates(updated);
  };

  const uploadCoreDocument = async (
    candidateId: string,
    name: string,
    category: string,
    file: File,
    existingDocumentId?: string
  ) => {
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      throw new Error('Choose a PDF, JPG, or PNG document.');
    }
    if (file.size > 10 * 1024 * 1024) throw new Error('Document must be 10MB or smaller.');

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${candidateId}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage.from('dossier-documents').upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const candidate = candidatesRef.current.find((item) => item.id === candidateId);
    const existing = candidate?.documents.find((document) => document.id === existingDocumentId) || candidate?.documents.find((document) =>
      document.title.toLowerCase() === name.toLowerCase() || document.category?.toLowerCase() === category.toLowerCase()
    );
    const row = {
      candidate_id: candidateId,
      name,
      category,
      direction: 'candidate_upload',
      requires_signature: false,
      status: 'pending',
      rejection_reason: null,
      storage_path: storagePath,
      signature_data: null,
      uploaded_at: new Date().toISOString(),
    };
    const documentResult = existing && /^[0-9a-f-]{36}$/i.test(existing.id)
      ? await supabase.from('dossier_documents').update(row).eq('id', existing.id)
      : await supabase.from('dossier_documents').insert(row);
    if (documentResult.error) {
      await supabase.storage.from('dossier-documents').remove([storagePath]);
      throw documentResult.error;
    }

    const { error: auditError } = await supabase.from('audit_logs').insert({
      candidate_id: candidateId,
      actor: `${candidate?.name || 'Candidate'} (Applicant)`,
      action: 'Core Document Uploaded',
      details: `Uploaded ${name} (${file.name}) for caseworker review.`,
    });
    if (auditError) throw auditError;
    await refreshStore();
  };

  const selectCandidate = useCallback((id: string) => {
    setSelectedCandidateId(id);
  }, []);

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

  const submitServiceFeeReceipt = async (
    candidateId: string,
    file: File,
    transaction: ServiceFeeTransaction
  ) => {
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Choose a PDF, JPG, PNG, or WEBP receipt.');
    }
    if (file.size > 10 * 1024 * 1024) throw new Error('Receipt must be 10MB or smaller.');
    const candidate = candidatesRef.current.find((item) => item.id === candidateId);
    if (!candidate) throw new Error('Candidate profile is not available.');

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${candidateId}/receipt_${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage.from('dossier-documents').upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const existing = candidate.documents.find((document) => document.category === 'subscription_receipt');
    const documentRow = {
      candidate_id: candidateId,
      name: 'Service Fee Payment Receipt',
      category: 'subscription_receipt',
      direction: 'candidate_upload',
      requires_signature: false,
      status: 'pending',
      rejection_reason: null,
      storage_path: storagePath,
      signature_data: JSON.stringify(transaction),
      uploaded_at: new Date().toISOString(),
    };
    const documentResult = existing && /^[0-9a-f-]{36}$/i.test(existing.id)
      ? await supabase.from('dossier_documents').update(documentRow).eq('id', existing.id)
      : await supabase.from('dossier_documents').insert(documentRow);
    if (documentResult.error) {
      await supabase.storage.from('dossier-documents').remove([storagePath]);
      throw documentResult.error;
    }

    const processMeta: CandidateProcessMetadata = {
      ...candidate.processMeta,
      serviceFeeTransaction: transaction,
    };
    const status = 'Service Fee Receipt Submitted (Under Review)';
    const { error: profileError } = await supabase.from('candidates').update({
      subscription_status: status,
      kyc_note: serializeKycNote({ ...candidate, processMeta }),
    }).eq('id', candidateId);
    if (profileError) throw profileError;

    const { error: auditError } = await supabase.from('audit_logs').insert({
      candidate_id: candidateId,
      actor: `${candidate.name} (Applicant)`,
      action: 'Service Fee Receipt Submitted',
      details: `Receipt uploaded: ${transaction.amount} by ${transaction.method}; reference ${transaction.transactionId}.`,
    });
    if (auditError) throw auditError;
    await refreshStore();
  };

  const reviewServiceFeeReceipt = async (
    candidateId: string,
    approved: boolean,
    reason = '',
    actor = 'Recruitment Coordinator'
  ) => {
    const candidate = candidatesRef.current.find((item) => item.id === candidateId);
    const receipt = candidate?.documents.find((document) => document.category === 'subscription_receipt');
    if (!candidate || !receipt) throw new Error('No service-fee receipt is available to review.');
    if (!approved && !reason.trim()) throw new Error('Enter a reason for rejecting this receipt.');

    const status = approved ? '€45 Paid & Verified' : '€45 Rejected (Action Required)';
    const { error: documentError } = await supabase.from('dossier_documents').update({
      status: approved ? 'verified' : 'rejected',
      rejection_reason: approved ? null : reason.trim(),
    }).eq('id', receipt.id).eq('candidate_id', candidateId);
    if (documentError) throw documentError;

    const { error: profileError } = await supabase.from('candidates').update({ subscription_status: status }).eq('id', candidateId);
    if (profileError) throw profileError;

    const title = approved ? 'Service Fee Receipt Approved' : 'Service Fee Receipt Requires Correction';
    const message = approved
      ? 'Your service-fee receipt has been reviewed and verified by the recruitment coordinator.'
      : `Your service-fee receipt could not be verified: ${reason.trim()}. Please upload a corrected receipt.`;
    const [{ error: notificationError }, { error: auditError }] = await Promise.all([
      supabase.from('notifications').insert({ candidate_id: candidateId, title, message, is_read: false }),
      supabase.from('audit_logs').insert({
        candidate_id: candidateId,
        actor,
        action: approved ? 'Service Fee Receipt Approved' : 'Service Fee Receipt Rejected',
        details: approved ? 'Receipt verified and account fee status updated.' : `Receipt rejected: ${reason.trim()}`,
      }),
    ]);
    if (notificationError) throw notificationError;
    if (auditError) throw auditError;
    await refreshStore();
  };

  const updateCandidateAgencyDetails = async (
    candidateId: string,
    details: { balance?: string; status?: string; sponsorCode?: string; caseOrderId?: string; employerName?: string },
    actor = 'Recruitment Coordinator'
  ) => {
    const candidate = candidatesRef.current.find((item) => item.id === candidateId);
    if (!candidate) throw new Error('Candidate profile is not available.');
    const updated: CandidateRecord = {
      ...candidate,
      employer: {
        ...candidate.employer,
        name: details.employerName ?? candidate.employer.name,
        sponsorCode: details.sponsorCode ?? candidate.employer.sponsorCode,
      },
      siriCaseOrder: { ...candidate.siriCaseOrder, caseOrderId: details.caseOrderId ?? candidate.siriCaseOrder.caseOrderId },
      denbarAccount: candidate.denbarAccount ? {
        ...candidate.denbarAccount,
        amount: details.balance ?? candidate.denbarAccount.amount,
        status: details.status ?? candidate.denbarAccount.status,
      } : {
        amount: details.balance || '€0.00',
        status: details.status || 'Not set',
        vfsFee: 'Not applicable',
        linkedTo: 'Candidate account',
      },
      actionRequired: candidate.actionRequired ? {
        ...candidate.actionRequired,
        subscription: details.status ?? candidate.actionRequired.subscription,
      } : details.status ? {
        facialTime: '', task: '', subscription: details.status,
      } : undefined,
      auditLog: [createAuditEntry(actor, 'Agency Profile Details Updated', JSON.stringify(details)), ...candidate.auditLog],
    };
    await saveToStorage(candidatesRef.current.map((item) => item.id === candidateId ? updated : item), true);
  };

  const updateCandidateProcessMeta = async (
    candidateId: string,
    metadata: Partial<CandidateProcessMetadata>,
    actor = 'Recruitment Coordinator'
  ) => {
    const candidate = candidatesRef.current.find((item) => item.id === candidateId);
    if (!candidate) throw new Error('Candidate profile is not available.');
    const processMeta: CandidateProcessMetadata = { ...candidate.processMeta, ...metadata };
    const updated = {
      ...candidate,
      processMeta,
      auditLog: [createAuditEntry(actor, 'Candidate Process Metadata Updated', JSON.stringify(metadata)), ...candidate.auditLog],
    };
    await saveToStorage(candidatesRef.current.map((item) => item.id === candidateId ? updated : item), true);
  };

  const sendCandidateNotification = async (
    candidateId: string,
    title: string,
    message: string,
    actor = 'Recruitment Coordinator'
  ) => {
    const candidate = candidatesRef.current.find((item) => item.id === candidateId);
    if (!candidate) throw new Error('Candidate profile is not available.');
    const updated = {
      ...candidate,
      notifications: [pushNotification(candidate, title, message), ...candidate.notifications],
      auditLog: [createAuditEntry(actor, 'Portal Notification Sent', `${title}: ${message}`), ...candidate.auditLog],
    };
    await saveToStorage(candidatesRef.current.map((item) => item.id === candidateId ? updated : item), true);
  };

  const saveAdminCrmMetadata = async (candidateId: string, metadata: AdminCrmMetadata) => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw new Error('Coordinator authentication is required.');
    const title = `crm:${candidateId}`;
    const { data: existing, error: lookupError } = await supabase.from('notifications')
      .select('id')
      .eq('candidate_id', authData.user.id)
      .eq('title', title)
      .maybeSingle();
    if (lookupError) throw lookupError;
    const result = existing
      ? await supabase.from('notifications').update({ message: JSON.stringify(metadata), is_read: true }).eq('id', existing.id)
      : await supabase.from('notifications').insert({
          candidate_id: authData.user.id,
          title,
          message: JSON.stringify(metadata),
          is_read: true,
        });
    if (result.error) throw result.error;
    setAdminCrmMetadata((current) => ({ ...current, [candidateId]: metadata }));
  };

  const createAgencyDocument = async (
    candidateId: string,
    title: string,
    html: string,
    requiresSignature: boolean,
    actor = 'Recruitment Coordinator'
  ) => {
    const candidate = candidatesRef.current.find((item) => item.id === candidateId);
    if (!candidate) throw new Error('Candidate profile is not available.');
    const fileName = `${title.replace(/[^a-zA-Z0-9._-]/g, '_')}.html`;
    const storagePath = `${candidateId}/agency_${Date.now()}_${fileName}`;
    const { error: uploadError } = await supabase.storage.from('dossier-documents').upload(
      storagePath,
      new Blob([html], { type: 'text/html;charset=utf-8' }),
      { contentType: 'text/html;charset=utf-8', upsert: false }
    );
    if (uploadError) throw uploadError;
    const { error: documentError } = await supabase.from('dossier_documents').insert({
      candidate_id: candidateId,
      name: title,
      category: 'agency_document',
      direction: 'admin_dispatched',
      requires_signature: requiresSignature,
      status: requiresSignature ? 'awaiting_signature' : 'pending',
      storage_path: storagePath,
      signature_data: null,
      uploaded_at: new Date().toISOString(),
    });
    if (documentError) {
      await supabase.storage.from('dossier-documents').remove([storagePath]);
      throw documentError;
    }
    const [{ error: notificationError }, { error: auditError }] = await Promise.all([
      supabase.from('notifications').insert({
        candidate_id: candidateId,
        title: requiresSignature ? 'Agency Agreement Requires Your Signature' : 'New Agency Document Available',
        message: `A private recruitment agency document, "${title}", is available in your dossier.`,
        is_read: false,
      }),
      supabase.from('audit_logs').insert({ candidate_id: candidateId, actor, action: 'Agency Document Generated', details: title }),
    ]);
    if (notificationError) throw notificationError;
    if (auditError) throw auditError;
    await refreshStore();
  };

  // Account Approval for Registration
  const approveAccount = (
    candidateId: string,
    sponsorCode?: string,
    caseOrderId?: string,
    actor = 'Morten Nyborg (SIRI Caseworker)'
  ) => {
    const updated = candidatesRef.current.map((c) => {
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
          kycNote: '',
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
          kycNote: reason,
          notifications: [notif, ...c.notifications],
          auditLog: [log, ...c.auditLog],
        };
      }
      return c;
    });
    saveToStorage(updated);
  };

  // Permanent Candidate Deletion (Storage + DB + Auth RPC)
  const deleteCandidatePermanently = async (candidateId: string): Promise<void> => {
    try {
      // 1. List and remove all objects in private 'dossier-documents' bucket under folder `${candidateId}`
      const { data: files, error: listError } = await supabase.storage
        .from('dossier-documents')
        .list(candidateId);

      const pathsToRemove: string[] = [];
      if (!listError && files && files.length > 0) {
        for (const file of files) {
          pathsToRemove.push(`${candidateId}/${file.name}`);
        }
      }

      // Also collect any explicit storage paths recorded in candidate records
      const targetCandidate = candidatesRef.current.find((c) => c.id === candidateId);
      if (targetCandidate) {
        if (targetCandidate.avatarStoragePath) {
          pathsToRemove.push(targetCandidate.avatarStoragePath);
        }
        for (const doc of targetCandidate.documents) {
          if (doc.storagePath) {
            pathsToRemove.push(doc.storagePath);
          }
        }
      }

      const uniquePaths = Array.from(new Set(pathsToRemove));
      if (uniquePaths.length > 0) {
        await supabase.storage.from('dossier-documents').remove(uniquePaths);
      }

      // 2. Call RPC 'delete_candidate_permanently' to permanently delete records and auth user
      const { error: rpcError } = await supabase.rpc('delete_candidate_permanently', {
        target_candidate_id: candidateId,
      });

      if (rpcError) {
        console.warn('RPC delete_candidate_permanently failed or not found, performing cascade delete fallback:', rpcError);
        await supabase.from('notifications').delete().eq('candidate_id', candidateId);
        await supabase.from('audit_logs').delete().eq('candidate_id', candidateId);
        await supabase.from('dossier_documents').delete().eq('candidate_id', candidateId);
        const { error: candidateDelError } = await supabase.from('candidates').delete().eq('id', candidateId);
        if (candidateDelError) throw candidateDelError;
      }

      // 3. Refresh local store state and select next candidate
      const remaining = candidatesRef.current.filter((c) => c.id !== candidateId);
      candidatesRef.current = remaining;
      setCandidates(remaining);

      if (selectedCandidateId === candidateId) {
        const nextId = remaining[0]?.id || '';
        setSelectedCandidateId(nextId);
      }

      await refreshStore();
    } catch (error) {
      console.error('Error permanently deleting candidate:', error);
      throw error;
    }
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
  const updateCandidateKyc = async (candidateId: string, data: Partial<CandidateRecord>) => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        const notif = pushNotification(
          c,
          'KYC Dossier Updated',
          'Your updated identity information has been submitted for caseworker review.',
          'info'
        );
        const log = createAuditEntry(
          `${c.name} (Applicant)`,
          'KYC Dossier Updated',
          'Applicant updated personal identity and biometric data.'
        );
        return {
          ...c,
          ...data,
          kycStatus: 'submitted' as KycStatus,
          notifications: [notif, ...c.notifications],
          auditLog: [log, ...c.auditLog],
        };
      }
      return c;
    });
    await saveToStorage(updated, true);
  };

  // Gated Stage Controller
  const setCandidateStage = (
    candidateId: string,
    stage: StageNumber,
    actor = 'Morten Nyborg (SIRI Caseworker)'
  ): { success: boolean; reason?: string } => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return { success: false, reason: 'Candidate not found.' };

    if (stage >= 4) {
      const policeClearance = candidate.documents.find((document) =>
        document.title.toLowerCase().includes('police') || document.title.toLowerCase().includes('pcc')
      );
      if (!policeClearance?.storagePath || policeClearance.status !== 'verified') {
        return {
          success: false,
          reason: 'Stage 4/5 clearance is locked until a real Nepal Police Clearance Certificate is uploaded and verified.',
        };
      }
    }

    // Stage 5 Gatekeeper: Check that KYC is verified and core documents are approved
    if (stage >= 5) {
      const passportDoc = candidate.documents.find((d) =>
        d.key === 'passport' || d.title.toLowerCase().includes('passport')
      );
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
  const registerCandidate = async (data: NewCandidateInput, useEphemeralClient = false): Promise<CandidateRecord> => {
    const authClient = useEphemeralClient ? createEphemeralSupabaseClient() : supabase;
    const { data: authData, error: signUpError } = await authClient.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password || 'Candidate@2026',
    });
    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('Supabase did not return a user for this registration.');

    const newId = authData.user.id;
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
      password: undefined,
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
    candidatesRef.current = updatedList;
    setCandidates(updatedList);
    newCandidate.auditLog.unshift(createAuditEntry(
      `${candidateName} (Applicant)`,
      'Checklist State',
      JSON.stringify(newCandidate.checklist)
    ));
    await persistCandidateDiff(undefined, newCandidate);
    await refreshStore();
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
        const checklist = c.checklist.map((item) => (item.id === checkId ? { ...item, checked: !item.checked } : item));
        const log = createAuditEntry(`${c.name} (Applicant)`, 'Checklist State', JSON.stringify(checklist));
        return {
          ...c,
          checklist,
          auditLog: [log, ...c.auditLog],
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
        adminCrmMetadata,
        saveAdminCrmMetadata,
        refreshStore,
        submitServiceFeeReceipt,
        reviewServiceFeeReceipt,
        updateCandidateAgencyDetails,
        updateCandidateProcessMeta,
        sendCandidateNotification,
        createAgencyDocument,
        uploadCandidateAvatar,
        uploadCoreDocument,
        selectCandidate,
        deleteCandidatePermanently,
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
