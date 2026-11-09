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

export type DocumentStatus = 'verified' | 'pending' | 'flagged' | 'action_required';

export interface DocumentRecord {
  id: string;
  key: string;
  title: string;
  filename: string;
  docId: string;
  authority: string;
  date: string;
  status: DocumentStatus;
  isCandidateUpload?: boolean;
  category?: string;
  fileSize?: string;
  fileData?: string;
  fileType?: string;
  body: string;
  verificationHash?: string;
  reviewerNotes?: string;
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
  name: string;
  passportNumber: string;
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
