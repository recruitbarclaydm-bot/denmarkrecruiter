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
  storagePath?: string;
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
  transactionDetails?: ServiceFeeTransaction;
}

export interface ServiceFeeTransaction {
  amount: string;
  method: string;
  transactionId: string;
  paymentDate: string;
  remarks: string;
  submittedAt?: string;
}

export interface VideoInterviewSchedule {
  meetingUrl: string;
  meetingId: string;
  passcode: string;
  scheduledAt: string;
  coordinatorName: string;
  preparationNotes: string;
}

export interface ApplicationCenterSchedule {
  location: string;
  scheduledAt: string;
  referenceCode: string;
  documentNotes: string;
}

export interface DirectCoordinatorMessage {
  id: string;
  sender: 'candidate' | 'coordinator';
  senderRole?: 'candidate' | 'coordinator';
  senderName: string;
  message: string;
  text?: string;
  timestamp: string;
  read: boolean;
}

export interface CandidateEvaluationScorecard {
  communicationRating: number; // 1-5
  experienceRating: number; // 1-5
  documentAuthenticityRating: number; // 1-5
  employerReadinessRating: number; // 1-5
  overallReadinessRating?: number; // 1-5
  totalScore?: number;
  recommendation?: string;
  notes?: string;
  evaluatorNotes?: string;
  evaluatedAt?: string;
  evaluatedBy?: string;
}

export interface InterviewPreparationChecklist {
  passportAndCitizenshipReady: boolean;
  dossierSummaryPrinted: boolean;
  quietRoomAndTechTested: boolean;
}

export interface CandidateProcessMetadata {
  serviceFeeTransaction?: ServiceFeeTransaction;
  videoInterview?: VideoInterviewSchedule;
  applicationCenter?: ApplicationCenterSchedule;
  coordinatorNotes?: string;
  priority?: 'Normal' | 'High Priority' | 'Ready' | 'On Hold';
  evaluation?: CandidateEvaluationScorecard;
  messages?: DirectCoordinatorMessage[];
  prepChecklist?: InterviewPreparationChecklist;
}

export interface AdminCrmMetadata {
  notes: string;
  priority: 'Normal' | 'High Priority' | 'Ready' | 'On Hold';
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

export interface NepalKycDetails {
  father_name: string;
  mother_name: string;
  marital_status: string;
  gender: string;
  citizenship_number: string;
  national_id_nin: string;
  passport_issue_date: string;
  passport_issue_place: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
  education_level: string;
  work_experience_years: string;
  work_skills_summary: string;
  previous_schengen_visa: string;
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
  avatarUrl?: string;
  avatarStoragePath?: string;
  extendedKyc?: Partial<NepalKycDetails>;
  processMeta?: CandidateProcessMetadata;
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
  createdAt?: string;
  submittedAt?: string;
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
