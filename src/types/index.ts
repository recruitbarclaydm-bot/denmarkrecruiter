export type Role = 'candidate' | 'admin';
export type Language = 'en' | 'da' | 'ne';
export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6;
export type StageStatus = 'completed' | 'active' | 'pending';

export interface StageItem {
  number: StageNumber;
  titleKey: string;
  title: string;
  description: string;
  status: StageStatus;
  completedDate?: string;
}

export type AccountStatus = 'pending_approval' | 'approved' | 'rejected';
export type KycStatus = 'pending' | 'submitted' | 'verified' | 'rejected';
export type SchemeType = 'siri_herdsman' | 'seasonal_agriculture';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

export type DocumentStatus =
  | 'verified'
  | 'pending'
  | 'flagged'
  | 'action_required'
  | 'rejected'
  | 'signed_pending_review';

export interface DocumentRecord {
  id: string;
  key: string;
  title: string;
  name?: string;
  filename: string;
  docId: string;
  authority: string;
  date: string;
  status: DocumentStatus;
  rejectionReason?: string;
  fileUrl?: string;
  uploadedAt?: string;
  isCandidateUpload?: boolean;
  category?: string;
  fileSize?: string;
  fileData?: string;
  fileType?: string;
  body: string;
  verificationHash?: string;
  reviewerNotes?: string;
  isDispatchedByAdmin?: boolean;
  requiresSignature?: boolean;
  signatureDataUrl?: string;
  signedAt?: string;
  signerLegalName?: string;
}

export interface VfsAppointment {
  refNumber: string;
  centerName: string;
  address: string;
  appointmentDate: string;
  isoDateTime: string; // UTC or ISO timestamp for ICS
  status: 'booked' | 'completed' | 'rescheduled';
  googleMapsUrl: string;
}

export interface SiriCaseOrder {
  caseOrderId: string;
  scheme: string;
  statutoryFee: string;
  feeStatus: 'paid' | 'pending';
  caseRegistry: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
}

export interface CandidateEmployer {
  name: string;
  cvr: string;
  sponsorCode: string;
  address: string;
  collectiveAgreement: string;
  monthlySalary: string;
  workingHours: string;
}

export interface CandidateRecord {
  id: string;
  email: string;
  password?: string;
  name: string;
  passportNumber: string;
  passportExpiry?: string;
  dob: string;
  nationality: string;
  permanentAddress: string;
  phone: string;
  jobTitle: string;
  employer: CandidateEmployer;
  currentStage: StageNumber;
  stages: StageItem[];
  siriCaseOrder: SiriCaseOrder;
  vfsAppointment: VfsAppointment;
  documents: DocumentRecord[];
  checklist: ChecklistItem[];
  signatureDataUrl?: string;
  signatureTimestamp?: string;
  schemeType?: SchemeType;
  contractDuration?: string;
  statusBadgeText?: string;
  denbarAccount?: {
    amount: string;
    status: string;
    vfsFee: string;
    linkedTo: string;
  };
  actionRequired?: {
    facialTime: string;
    subscription: string;
    task: string;
  };
  quickActions?: {
    zoomUrl: string;
    supportEmail: string;
    subscriptionAmount: string;
  };
  courierTracking?: string;
  accountStatus: AccountStatus;
  accountRejectionReason?: string;
  kycStatus: KycStatus;
  kycNote?: string;
  auditLog: AuditLogEntry[];
  notifications: NotificationItem[];
  workExperienceSummary?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  candidateId?: string;
  department?: string;
}

export interface SchemeMetadata {
  title: string;
  legalReference: string;
  minMonthlySalaryDKK: number;
  standardHoursWeekly: number;
  collectiveAgreementBoard: string;
}

export interface NewCandidateInput {
  name?: string;
  fullName?: string;
  email: string;
  password?: string;
  passportNumber: string;
  passportExpiry?: string;
  dob: string;
  nationality?: string;
  permanentAddress?: string;
  phone?: string;
  scheme: SchemeType;
  sponsorCode?: string;
  cvrNumber?: string;
  jobTitle?: string;
  workExperienceSummary?: string;
  initialDocName?: string;
  initialDocData?: string;
  passportScanData?: string;
  citizenshipScanData?: string;
  cvData?: string;
}
