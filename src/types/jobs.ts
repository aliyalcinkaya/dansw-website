export type JobStatus =
  | 'draft'
  | 'pending_payment'
  | 'pending_review'
  | 'changes_requested'
  | 'published'
  | 'archived';
export type JobPackageType = 'standard' | 'amplified';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'waived';
export type ApplicationMode = 'easy_apply' | 'external_apply' | 'both';
export type LocationMode = 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
export type SeniorityLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'manager' | 'director';
export type SalaryPeriod = 'year' | 'month' | 'day' | 'hour';

export interface EasyApplyFields {
  collectName: boolean;
  collectEmail: boolean;
  collectCv: boolean;
  collectLinkedin: boolean;
  collectCoverLetter: boolean;
}

export interface JobPost {
  id: string;
  slug: string;
  status: JobStatus;
  packageType: JobPackageType | null;
  paymentStatus: PaymentStatus;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  brandLogoUrl: string | null;
  brandPrimaryColor: string | null;
  brandSecondaryColor: string | null;
  locationText: string;
  locationMode: LocationMode;
  employmentType: EmploymentType;
  seniorityLevel: SeniorityLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: SalaryPeriod;
  summary: string;
  responsibilities: string;
  requirements: string;
  niceToHave: string | null;
  applicationMode: ApplicationMode;
  externalApplyUrl: string | null;
  easyApplyEmail: string | null;
  easyApplyFields: EasyApplyFields;
  applicationDeadline: string | null;
  contactName: string | null;
  postedByEmail: string;
  postedByUserId: string | null;
  stripeCheckoutSessionId: string | null;
  publishedAt: string | null;
  publishExpiresAt: string | null;
  reviewNote: string | null;
  lastReviewedByEmail: string | null;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobDraftInput {
  title: string;
  companyName: string;
  packageType?: JobPackageType;
  companyWebsite?: string;
  brandLogoUrl?: string;
  brandPrimaryColor?: string;
  brandSecondaryColor?: string;
  locationText: string;
  locationMode: LocationMode;
  employmentType: EmploymentType;
  seniorityLevel: SeniorityLevel;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency: string;
  salaryPeriod: SalaryPeriod;
  summary: string;
  responsibilities: string;
  requirements: string;
  niceToHave?: string;
  applicationMode: ApplicationMode;
  externalApplyUrl?: string;
  easyApplyEmail?: string;
  easyApplyFields?: Partial<EasyApplyFields>;
  applicationDeadline?: string;
  contactName?: string;
  postedByEmail: string;
}

export interface JobApplicationInput {
  jobPostId: string;
  applicantName: string;
  applicantEmail: string;
  phone?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  coverNote?: string;
}

export interface JobPackage {
  type: JobPackageType;
  title: string;
  priceAUD: number;
  description: string;
  benefits: string[];
}

export type JobNotificationEvent =
  | 'job_submitted'
  | 'job_payment_succeeded'
  | 'job_published'
  | 'job_changes_requested'
  | 'job_archived'
  | 'job_expiring_soon'
  | 'job_expired'
  | 'job_extended';

export interface JobAdminNotification {
  id: string;
  jobPostId: string | null;
  eventType: JobNotificationEvent;
  title: string;
  message: string;
  recipientScope: 'admin' | 'poster' | 'all';
  recipientEmail: string | null;
  status: 'unread' | 'read';
  metadata: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
}
