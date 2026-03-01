import { trackAnalyticsEvent } from './analytics';
import { forwardFormByEmail } from './formForwarding';
import { getSupabaseClient } from './supabase';
import { SAMPLE_PUBLISHED_JOBS } from './sampleJobs';
import type {
  ApplicationMode,
  EasyApplyFields,
  JobAdminNotification,
  JobApplicationInput,
  JobDraftInput,
  JobNotificationEvent,
  JobPackage,
  JobPackageType,
  JobPost,
  PaymentStatus,
} from '../types/jobs';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/[\w.-]+(?:\/[\S]*)?$/i;
const JOB_LISTING_DURATION_DAYS = 90;
const JOB_EXPIRING_SOON_WINDOW_DAYS = 14;

const DEFAULT_JOBS_TABLE = 'job_posts';
const DEFAULT_JOB_APPLICATIONS_TABLE = 'job_applications';
const DEFAULT_JOB_ADMIN_NOTIFICATIONS_TABLE = 'job_admin_notifications';
const DEFAULT_EASY_APPLY_FIELDS: EasyApplyFields = {
  collectName: true,
  collectEmail: true,
  collectCv: true,
  collectLinkedin: true,
  collectCoverLetter: true,
};

interface JobPostRecord {
  id: string;
  slug: string;
  status: JobPost['status'];
  package_type: JobPackageType | null;
  payment_status: PaymentStatus;
  title: string;
  company_name: string;
  company_website: string | null;
  brand_logo_url: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  location_text: string;
  location_mode: JobPost['locationMode'];
  employment_type: JobPost['employmentType'];
  seniority_level: JobPost['seniorityLevel'];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_period: JobPost['salaryPeriod'];
  summary: string;
  responsibilities: string;
  requirements: string;
  nice_to_have: string | null;
  application_mode: ApplicationMode;
  external_apply_url: string | null;
  easy_apply_email: string | null;
  easy_apply_fields: unknown;
  application_deadline: string | null;
  contact_name: string | null;
  posted_by_email: string;
  posted_by_user_id: string | null;
  stripe_checkout_session_id: string | null;
  published_at: string | null;
  publish_expires_at: string | null;
  review_note: string | null;
  last_reviewed_by_email: string | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface JobAdminNotificationRecord {
  id: string;
  job_post_id: string | null;
  event_type: JobNotificationEvent;
  title: string;
  message: string;
  recipient_scope: JobAdminNotification['recipientScope'];
  recipient_email: string | null;
  status: JobAdminNotification['status'];
  metadata: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
}

type ServiceResult<T> = { ok: boolean; data: T; message?: string };

interface CreateAdminNotificationInput {
  jobPostId: string | null;
  eventType: JobNotificationEvent;
  title: string;
  message: string;
  recipientScope?: JobAdminNotification['recipientScope'];
  recipientEmail?: string | null;
  metadata?: Record<string, unknown>;
  dedupe?: boolean;
}

type CheckoutResult =
  | { ok: true; url: string; mode: 'endpoint' | 'payment_link' }
  | { ok: false; message: string };

function getSortedSampleJobs() {
  return [...SAMPLE_PUBLISHED_JOBS].sort(
    (a, b) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime()
  );
}

function getJobsTableName() {
  return import.meta.env.VITE_SUPABASE_JOBS_TABLE?.trim() || DEFAULT_JOBS_TABLE;
}

function getJobApplicationsTableName() {
  return import.meta.env.VITE_SUPABASE_JOB_APPLICATIONS_TABLE?.trim() || DEFAULT_JOB_APPLICATIONS_TABLE;
}

function getAppBasePath() {
  const configuredBase = import.meta.env.BASE_URL || '/';
  if (configuredBase === '/') return '';
  return configuredBase.endsWith('/') ? configuredBase.slice(0, -1) : configuredBase;
}

function buildAbsoluteAppUrl(pathAndQuery: string) {
  if (typeof window === 'undefined') return undefined;
  const normalizedPath = pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`;
  return `${window.location.origin}${getAppBasePath()}${normalizedPath}`;
}

function getJobAdminNotificationsTableName() {
  return (
    import.meta.env.VITE_SUPABASE_JOB_ADMIN_NOTIFICATIONS_TABLE?.trim() ||
    DEFAULT_JOB_ADMIN_NOTIFICATIONS_TABLE
  );
}

function toTrimmed(value: string | null | undefined) {
  return value?.trim() ?? '';
}

function toNullable(value: string | null | undefined) {
  const normalized = toTrimmed(value);
  return normalized ? normalized : null;
}

function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value);
}

function isValidUrl(value: string) {
  return URL_REGEX.test(value);
}

function isValidHexColor(value: string) {
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeEasyApplyFields(value: unknown): EasyApplyFields {
  const fields = value && typeof value === 'object' ? value : {};

  return {
    collectName: readBoolean(
      (fields as Record<string, unknown>).collectName ?? (fields as Record<string, unknown>).collect_name,
      DEFAULT_EASY_APPLY_FIELDS.collectName
    ),
    collectEmail: true,
    collectCv: readBoolean(
      (fields as Record<string, unknown>).collectCv ?? (fields as Record<string, unknown>).collect_cv,
      DEFAULT_EASY_APPLY_FIELDS.collectCv
    ),
    collectLinkedin: readBoolean(
      (fields as Record<string, unknown>).collectLinkedin ??
        (fields as Record<string, unknown>).collect_linkedin,
      DEFAULT_EASY_APPLY_FIELDS.collectLinkedin
    ),
    collectCoverLetter: readBoolean(
      (fields as Record<string, unknown>).collectCoverLetter ??
        (fields as Record<string, unknown>).collect_cover_letter,
      DEFAULT_EASY_APPLY_FIELDS.collectCoverLetter
    ),
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function buildSlug(title: string, companyName: string) {
  const prefix = `${slugify(title)}-${slugify(companyName)}`.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  const randomSuffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix || 'job'}-${randomSuffix}`;
}

function mapJobRecord(record: JobPostRecord): JobPost {
  return {
    id: record.id,
    slug: record.slug,
    status: record.status,
    packageType: record.package_type,
    paymentStatus: record.payment_status,
    title: record.title,
    companyName: record.company_name,
    companyWebsite: record.company_website,
    brandLogoUrl: record.brand_logo_url ?? null,
    brandPrimaryColor: record.brand_primary_color ?? null,
    brandSecondaryColor: record.brand_secondary_color ?? null,
    locationText: record.location_text,
    locationMode: record.location_mode,
    employmentType: record.employment_type,
    seniorityLevel: record.seniority_level,
    salaryMin: record.salary_min,
    salaryMax: record.salary_max,
    salaryCurrency: record.salary_currency,
    salaryPeriod: record.salary_period,
    summary: record.summary,
    responsibilities: record.responsibilities,
    requirements: record.requirements,
    niceToHave: record.nice_to_have,
    applicationMode: record.application_mode,
    externalApplyUrl: record.external_apply_url,
    easyApplyEmail: record.easy_apply_email,
    easyApplyFields: normalizeEasyApplyFields(record.easy_apply_fields),
    applicationDeadline: record.application_deadline,
    contactName: record.contact_name,
    postedByEmail: record.posted_by_email,
    postedByUserId: record.posted_by_user_id,
    stripeCheckoutSessionId: record.stripe_checkout_session_id,
    publishedAt: record.published_at,
    publishExpiresAt: record.publish_expires_at,
    reviewNote: record.review_note,
    lastReviewedByEmail: record.last_reviewed_by_email,
    lastReviewedAt: record.last_reviewed_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapNotificationRecord(record: JobAdminNotificationRecord): JobAdminNotification {
  return {
    id: record.id,
    jobPostId: record.job_post_id,
    eventType: record.event_type,
    title: record.title,
    message: record.message,
    recipientScope: record.recipient_scope,
    recipientEmail: record.recipient_email,
    status: record.status,
    metadata: record.metadata ?? {},
    createdAt: record.created_at,
    readAt: record.read_at,
  };
}

function isJobStillPublished(job: JobPost) {
  if (job.status !== 'published' || !['paid', 'waived'].includes(job.paymentStatus)) return false;
  if (!job.publishExpiresAt) return true;
  return new Date(job.publishExpiresAt).getTime() > Date.now();
}

function formatServiceError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    if (error.message.toLowerCase().includes('stack depth limit exceeded')) {
      return 'Database policy recursion detected. Run supabase/admin_rls_fix.sql in Supabase SQL Editor, then refresh.';
    }
    return error.message;
  }
  return fallback;
}

function addDays(baseDate: Date, days: number) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function validateDraftInput(input: JobDraftInput) {
  const errors: string[] = [];

  if (toTrimmed(input.title).length < 4) errors.push('Job title must be at least 4 characters.');
  if (!toTrimmed(input.companyName)) errors.push('Company name is required.');
  if (!toTrimmed(input.locationText)) errors.push('Job location is required.');
  if (!toTrimmed(input.summary)) errors.push('A role summary is required.');
  if (!toTrimmed(input.responsibilities)) errors.push('Responsibilities are required.');
  if (!toTrimmed(input.requirements)) errors.push('Requirements are required.');
  if (!isValidEmail(toTrimmed(input.postedByEmail))) errors.push('A valid contact email is required.');

  const hasExternalUrl = Boolean(toNullable(input.externalApplyUrl));
  const hasEasyApplyEmail = isValidEmail(toTrimmed(input.easyApplyEmail ?? input.postedByEmail));

  if (input.applicationMode === 'external_apply' && !hasExternalUrl) {
    errors.push('External apply mode needs an apply URL.');
  }

  if (input.applicationMode === 'both' && !hasExternalUrl) {
    errors.push('Both apply modes selected: external apply URL is required.');
  }

  if ((input.applicationMode === 'easy_apply' || input.applicationMode === 'both') && !hasEasyApplyEmail) {
    errors.push('Easy apply mode needs a valid application email.');
  }

  if (input.applicationMode === 'easy_apply' || input.applicationMode === 'both') {
    const easyApplyFields = normalizeEasyApplyFields(input.easyApplyFields);
    if (!easyApplyFields.collectEmail) {
      errors.push('Easy apply must collect applicant email.');
    }
  }

  const externalUrl = toNullable(input.externalApplyUrl);
  if (externalUrl && !isValidUrl(externalUrl)) {
    errors.push('External apply URL must start with http:// or https://.');
  }

  const companyWebsite = toNullable(input.companyWebsite);
  if (companyWebsite && !isValidUrl(companyWebsite)) {
    errors.push('Company website must start with http:// or https://.');
  }

  const brandLogoUrl = toNullable(input.brandLogoUrl);
  if (brandLogoUrl && !isValidUrl(brandLogoUrl)) {
    errors.push('Brand logo URL must start with http:// or https://.');
  }

  const brandPrimaryColor = toNullable(input.brandPrimaryColor);
  if (brandPrimaryColor && !isValidHexColor(brandPrimaryColor)) {
    errors.push('Brand primary color must be a valid hex color.');
  }

  const brandSecondaryColor = toNullable(input.brandSecondaryColor);
  if (brandSecondaryColor && !isValidHexColor(brandSecondaryColor)) {
    errors.push('Brand secondary color must be a valid hex color.');
  }

  return errors;
}

function buildDraftPayload(input: JobDraftInput, slug: string, postedByUserId: string | null) {
  const easyApplyFields = normalizeEasyApplyFields(input.easyApplyFields);

  return {
    slug,
    status: 'draft' as const,
    package_type: input.packageType ?? null,
    title: toTrimmed(input.title),
    company_name: toTrimmed(input.companyName),
    company_website: toNullable(input.companyWebsite),
    brand_logo_url: toNullable(input.brandLogoUrl),
    brand_primary_color: toNullable(input.brandPrimaryColor),
    brand_secondary_color: toNullable(input.brandSecondaryColor),
    location_text: toTrimmed(input.locationText),
    location_mode: input.locationMode,
    employment_type: input.employmentType,
    seniority_level: input.seniorityLevel,
    salary_min: input.salaryMin ?? null,
    salary_max: input.salaryMax ?? null,
    salary_currency: toTrimmed(input.salaryCurrency || 'AUD').toUpperCase(),
    salary_period: input.salaryPeriod,
    summary: toTrimmed(input.summary),
    responsibilities: toTrimmed(input.responsibilities),
    requirements: toTrimmed(input.requirements),
    nice_to_have: toNullable(input.niceToHave),
    application_mode: input.applicationMode,
    external_apply_url: toNullable(input.externalApplyUrl),
    easy_apply_email: toNullable(input.easyApplyEmail) ?? toTrimmed(input.postedByEmail).toLowerCase(),
    easy_apply_fields: {
      collect_name: easyApplyFields.collectName,
      collect_email: true,
      collect_cv: easyApplyFields.collectCv,
      collect_linkedin: easyApplyFields.collectLinkedin,
      collect_cover_letter: easyApplyFields.collectCoverLetter,
    },
    application_deadline: toNullable(input.applicationDeadline),
    contact_name: toNullable(input.contactName),
    posted_by_email: toTrimmed(input.postedByEmail).toLowerCase(),
    posted_by_user_id: postedByUserId,
  };
}

async function getCurrentUserIdentity() {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data } = await client.auth.getUser();
  if (!data.user) return null;

  const email = toTrimmed(data.user.email).toLowerCase();
  return {
    userId: data.user.id,
    email: email || null,
  };
}

async function isCurrentUserAdmin() {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }

  const { data, error } = await client.rpc('is_job_admin');
  if (error) {
    return false;
  }

  return data === true;
}

function createDraftRedirectUrl(draftId: string) {
  return buildAbsoluteAppUrl(`/jobs/submit?draft=${encodeURIComponent(draftId)}`);
}

async function forwardJobSubmissionForReview(job: JobPost) {
  const pagePath =
    typeof window === 'undefined'
      ? '/jobs/submit'
      : `${window.location.pathname}${window.location.search}${window.location.hash}`;

  const result = await forwardFormByEmail('job', {
    type: 'job',
    source: 'jobs-submit',
    name: job.contactName ?? null,
    email: job.postedByEmail,
    company: job.companyName,
    message: `Job submitted for review: ${job.title}`,
    page_path: pagePath,
    received_at: new Date().toISOString(),
    payload: {
      job_id: job.id,
      title: job.title,
      company_name: job.companyName,
      package_type: job.packageType,
      payment_status: job.paymentStatus,
      posted_by_email: job.postedByEmail,
      application_mode: job.applicationMode,
      location_mode: job.locationMode,
      location_text: job.locationText,
    },
  });

  if (!result.ok) {
    if (import.meta.env.DEV) {
      console.error(`Job forwarding failed: ${result.message ?? 'unknown error'}`);
    }

    void trackAnalyticsEvent('Job submit forward failed', {
      form_type: 'job_post',
      source: 'jobs-submit',
      job_id: job.id,
      company_name: job.companyName,
      failure_reason: result.message ?? 'forwarding_failed',
    });
    return;
  }

  if (!result.skipped) {
    void trackAnalyticsEvent('Job submitted forwarded', {
      form_type: 'job_post',
      source: 'jobs-submit',
      job_id: job.id,
      company_name: job.companyName,
    });
  }
}

async function createAdminNotification(input: CreateAdminNotificationInput) {
  const client = getSupabaseClient();
  if (!client) return;

  const recipientScope = input.recipientScope ?? 'admin';
  const recipientEmail = toNullable(input.recipientEmail ?? null);

  try {
    if (input.dedupe) {
      let dedupeQuery = client
        .from(getJobAdminNotificationsTableName())
        .select('id')
        .eq('event_type', input.eventType)
        .eq('recipient_scope', recipientScope);

      if (input.jobPostId) {
        dedupeQuery = dedupeQuery.eq('job_post_id', input.jobPostId);
      } else {
        dedupeQuery = dedupeQuery.is('job_post_id', null);
      }

      if (recipientEmail) {
        dedupeQuery = dedupeQuery.eq('recipient_email', recipientEmail);
      } else {
        dedupeQuery = dedupeQuery.is('recipient_email', null);
      }

      const { data: existingRows, error: existingError } = await dedupeQuery.limit(1);
      if (!existingError && (existingRows?.length ?? 0) > 0) {
        return;
      }
    }

    await client.from(getJobAdminNotificationsTableName()).insert({
      job_post_id: input.jobPostId,
      event_type: input.eventType,
      title: input.title,
      message: input.message,
      recipient_scope: recipientScope,
      recipient_email: recipientEmail,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Notification errors should not block the primary job action.
  }
}

export const JOB_PACKAGES: JobPackage[] = [
  {
    type: 'standard',
    title: 'Standard Listing',
    priceAUD: 150,
    description: 'Job listing published on the DAWS job board for 3 months.',
    benefits: [
      'Live on the job board for 90 days',
      'Visible to data and analytics professionals browsing the community site',
      'Role detail page with company + role highlights',
    ],
  },
  {
    type: 'amplified',
    title: 'Amplified Reach',
    priceAUD: 950,
    description: 'Job board listing plus newsletter and on-stage event promotion.',
    benefits: [
      'Everything in Standard Listing',
      '3 newsletter pushes to the DAWS mailing list',
      'Live announcement at a DAWS event to 100+ in-person attendees',
    ],
  },
];

export function formatSalaryRange(job: Pick<JobPost, 'salaryMin' | 'salaryMax' | 'salaryCurrency' | 'salaryPeriod'>) {
  if (!job.salaryMin && !job.salaryMax) return 'Salary not disclosed';

  const formatter = new Intl.NumberFormat('en-AU', {
    maximumFractionDigits: 0,
  });

  const min = job.salaryMin ? `${job.salaryCurrency} ${formatter.format(job.salaryMin)}` : null;
  const max = job.salaryMax ? `${job.salaryCurrency} ${formatter.format(job.salaryMax)}` : null;
  const suffix = job.salaryPeriod === 'year' ? '/yr' : `/${job.salaryPeriod}`;

  if (min && max) return `${min} - ${max} ${suffix}`;
  if (min) return `From ${min} ${suffix}`;
  return `Up to ${max} ${suffix}`;
}

export async function fetchPublishedJobs(): Promise<ServiceResult<JobPost[]>> {
  const client = getSupabaseClient();
  if (!client) {
    const sampleJobs = getSortedSampleJobs();
    return {
      ok: true,
      data: sampleJobs,
    };
  }

  try {
    const { data, error } = await client
      .from(getJobsTableName())
      .select('*')
      .eq('status', 'published')
      .in('payment_status', ['paid', 'waived'])
      .order('published_at', { ascending: false, nullsFirst: false });

    if (error) {
      return { ok: true, data: getSortedSampleJobs() };
    }

    const rows = (data ?? []) as JobPostRecord[];
    const jobs = rows.map(mapJobRecord).filter(isJobStillPublished);
    if (jobs.length === 0) {
      return { ok: true, data: getSortedSampleJobs() };
    }

    return { ok: true, data: jobs };
  } catch {
    return { ok: true, data: getSortedSampleJobs() };
  }
}

export async function fetchPublishedJobBySlug(slug: string): Promise<ServiceResult<JobPost | null>> {
  const sampleJob = SAMPLE_PUBLISHED_JOBS.find((job) => job.slug === slug) ?? null;
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: true,
      data: sampleJob,
    };
  }

  try {
    const { data, error } = await client
      .from(getJobsTableName())
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .in('payment_status', ['paid', 'waived'])
      .maybeSingle();

    if (error) {
      if (sampleJob) {
        return { ok: true, data: sampleJob };
      }

      return { ok: false, data: null, message: formatServiceError(error, 'Unable to load this job posting.') };
    }

    if (!data) {
      if (sampleJob) {
        return { ok: true, data: sampleJob };
      }

      return { ok: false, data: null, message: 'This job is not available.' };
    }

    const mapped = mapJobRecord(data as JobPostRecord);
    if (!isJobStillPublished(mapped)) {
      if (sampleJob) {
        return { ok: true, data: sampleJob };
      }

      return { ok: false, data: null, message: 'This job is no longer active.' };
    }

    return { ok: true, data: mapped };
  } catch (error) {
    if (sampleJob) {
      return { ok: true, data: sampleJob };
    }

    return { ok: false, data: null, message: formatServiceError(error, 'Unable to load this job posting.') };
  }
}

export async function fetchDraftByIdForCurrentUser(draftId: string): Promise<ServiceResult<JobPost | null>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: null,
      message: 'Job board backend is not configured yet.',
    };
  }

  const identity = await getCurrentUserIdentity();
  if (!identity?.email) {
    return { ok: false, data: null, message: 'Please sign in from your draft access email link first.' };
  }

  try {
    const { data, error } = await client.from(getJobsTableName()).select('*').eq('id', draftId).maybeSingle();

    if (error) {
      return { ok: false, data: null, message: formatServiceError(error, 'Unable to load draft job.') };
    }

    if (!data) {
      return { ok: false, data: null, message: 'Draft not found or access expired.' };
    }

    const row = data as JobPostRecord;
    const isOwner =
      row.posted_by_user_id === identity.userId ||
      row.posted_by_email.toLowerCase() === identity.email.toLowerCase();

    if (!isOwner) {
      return { ok: false, data: null, message: 'This draft belongs to a different email account.' };
    }

    return { ok: true, data: mapJobRecord(row) };
  } catch (error) {
    return { ok: false, data: null, message: formatServiceError(error, 'Unable to load draft job.') };
  }
}

export async function saveJobDraft(
  input: JobDraftInput,
  draftId?: string
): Promise<ServiceResult<JobPost | null>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: null,
      message: 'Job board backend is not configured yet.',
    };
  }

  const validationErrors = validateDraftInput(input);
  if (validationErrors.length > 0) {
    return {
      ok: false,
      data: null,
      message: validationErrors[0],
    };
  }

  const identity = await getCurrentUserIdentity();
  const userId = identity?.userId ?? null;

  let slug = buildSlug(input.title, input.companyName);

  try {
    if (draftId) {
      const { data: existingDraft, error: existingError } = await client
        .from(getJobsTableName())
        .select('slug')
        .eq('id', draftId)
        .maybeSingle();

      if (existingError) {
        return { ok: false, data: null, message: formatServiceError(existingError, 'Unable to update draft.') };
      }

      if (existingDraft?.slug) {
        slug = existingDraft.slug;
      }
    }

    const payload = buildDraftPayload(input, slug, userId);
    const query = client.from(getJobsTableName());

    const { data, error } = draftId
      ? await query.update(payload).eq('id', draftId).select('*').single()
      : await query.insert(payload).select('*').single();

    if (error) {
      return { ok: false, data: null, message: formatServiceError(error, 'Unable to save draft.') };
    }

    void trackAnalyticsEvent('Job draft saved', {
      form_type: 'job_post',
      source: 'jobs-submit',
      draft_id: data.id,
      job_title: payload.title,
      company_name: payload.company_name,
    });

    return { ok: true, data: mapJobRecord(data as JobPostRecord) };
  } catch (error) {
    return { ok: false, data: null, message: formatServiceError(error, 'Unable to save draft.') };
  }
}

export async function sendDraftMagicLink(email: string, draftId: string): Promise<ServiceResult<null>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: null,
      message: 'Job board backend is not configured yet.',
    };
  }

  const normalizedEmail = toTrimmed(email).toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, data: null, message: 'Please enter a valid email address.' };
  }

  const redirectTo = createDraftRedirectUrl(draftId);

  try {
    const { error } = await client.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      return { ok: false, data: null, message: formatServiceError(error, 'Unable to send login link.') };
    }

    void trackAnalyticsEvent('Job draft magic link sent', {
      form_type: 'job_post',
      source: 'jobs-submit',
      email: normalizedEmail,
      draft_id: draftId,
    });

    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, data: null, message: formatServiceError(error, 'Unable to send login link.') };
  }
}

export async function markJobPendingPayment(
  jobId: string,
  packageType: JobPackageType
): Promise<ServiceResult<JobPost | null>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: null,
      message: 'Job board backend is not configured yet.',
    };
  }

  try {
    const { data, error } = await client
      .from(getJobsTableName())
      .update({
        status: 'pending_payment',
        package_type: packageType,
      })
      .eq('id', jobId)
      .select('*')
      .single();

    if (error) {
      return {
        ok: false,
        data: null,
        message: formatServiceError(error, 'Unable to prepare checkout for this job post.'),
      };
    }

    void trackAnalyticsEvent('Job publish requested', {
      form_type: 'job_post',
      source: 'jobs-submit',
      draft_id: jobId,
      package_type: packageType,
    });

    return { ok: true, data: mapJobRecord(data as JobPostRecord) };
  } catch (error) {
    return { ok: false, data: null, message: formatServiceError(error, 'Unable to prepare checkout.') };
  }
}

export async function markJobPaidAndSubmitForReview(
  jobId: string
): Promise<ServiceResult<JobPost | null>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: null,
      message: 'Job board backend is not configured yet.',
    };
  }

  const canManage = await isCurrentUserAdmin();
  if (!canManage) {
    return {
      ok: false,
      data: null,
      message: 'Admin permission is required to mark payment as verified.',
    };
  }

  try {
    const { data, error } = await client
      .from(getJobsTableName())
      .update({
        status: 'pending_review',
        payment_status: 'paid',
      })
      .eq('id', jobId)
      .select('*')
      .single();

    if (error) {
      return {
        ok: false,
        data: null,
        message: formatServiceError(error, 'Unable to submit this paid job for review.'),
      };
    }

    const mapped = mapJobRecord(data as JobPostRecord);

    await createAdminNotification({
      jobPostId: mapped.id,
      eventType: 'job_payment_succeeded',
      title: 'Payment received: job ready for review',
      message: `${mapped.companyName} submitted payment for "${mapped.title}".`,
      recipientScope: 'admin',
      metadata: {
        package_type: mapped.packageType,
        payment_status: mapped.paymentStatus,
      },
    });

    void forwardJobSubmissionForReview(mapped);

    return { ok: true, data: mapped };
  } catch (error) {
    return {
      ok: false,
      data: null,
      message: formatServiceError(error, 'Unable to submit this paid job for review.'),
    };
  }
}

export async function submitJobForReviewWithoutPayment(
  jobId: string,
  packageType: JobPackageType
): Promise<ServiceResult<JobPost | null>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: null,
      message: 'Job board backend is not configured yet.',
    };
  }

  try {
    const { data, error } = await client
      .from(getJobsTableName())
      .update({
        status: 'pending_review',
        package_type: packageType,
        payment_status: 'waived',
      })
      .eq('id', jobId)
      .select('*')
      .single();

    if (error) {
      return {
        ok: false,
        data: null,
        message: formatServiceError(error, 'Unable to submit this job for admin review.'),
      };
    }

    const mapped = mapJobRecord(data as JobPostRecord);

    await createAdminNotification({
      jobPostId: mapped.id,
      eventType: 'job_submitted',
      title: 'New job listing submitted for review',
      message: `${mapped.companyName} submitted "${mapped.title}" (${mapped.packageType ?? packageType}).`,
      recipientScope: 'admin',
      metadata: {
        package_type: mapped.packageType ?? packageType,
        payment_status: 'waived',
      },
    });

    void forwardJobSubmissionForReview(mapped);

    void trackAnalyticsEvent('Job submitted for review (payments disabled)', {
      form_type: 'job_post',
      source: 'jobs-submit',
      draft_id: jobId,
      package_type: packageType,
    });

    return { ok: true, data: mapped };
  } catch (error) {
    return {
      ok: false,
      data: null,
      message: formatServiceError(error, 'Unable to submit this job for admin review.'),
    };
  }
}

export async function fetchAdminJobs(status: JobPost['status'] | 'all' = 'all'): Promise<ServiceResult<JobPost[]>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: [],
      message: 'Job board backend is not configured yet.',
    };
  }

  try {
    let query = client.from(getJobsTableName()).select('*').order('created_at', { ascending: false });
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      return { ok: false, data: [], message: formatServiceError(error, 'Unable to load admin job queue.') };
    }

    return {
      ok: true,
      data: (data ?? []).map((row) => mapJobRecord(row as JobPostRecord)),
    };
  } catch (error) {
    return { ok: false, data: [], message: formatServiceError(error, 'Unable to load admin job queue.') };
  }
}

export async function fetchAdminNotifications(
  limit = 40
): Promise<ServiceResult<JobAdminNotification[]>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: [],
      message: 'Job board backend is not configured yet.',
    };
  }

  try {
    const { data, error } = await client
      .from(getJobAdminNotificationsTableName())
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { ok: false, data: [], message: formatServiceError(error, 'Unable to load admin notifications.') };
    }

    return {
      ok: true,
      data: (data ?? []).map((row) => mapNotificationRecord(row as JobAdminNotificationRecord)),
    };
  } catch (error) {
    return { ok: false, data: [], message: formatServiceError(error, 'Unable to load admin notifications.') };
  }
}

export async function markAdminNotificationRead(notificationId: string): Promise<ServiceResult<null>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: null,
      message: 'Job board backend is not configured yet.',
    };
  }

  try {
    const { error } = await client
      .from(getJobAdminNotificationsTableName())
      .update({
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) {
      return { ok: false, data: null, message: formatServiceError(error, 'Unable to mark notification as read.') };
    }

    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, data: null, message: formatServiceError(error, 'Unable to mark notification as read.') };
  }
}

export async function publishJobFromAdmin(
  jobId: string,
  reviewNote?: string
): Promise<ServiceResult<JobPost | null>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: null,
      message: 'Job board backend is not configured yet.',
    };
  }

  const adminEmail = await getCurrentSupabaseUserEmail();
  const now = new Date();
  const expiresAt = addDays(now, JOB_LISTING_DURATION_DAYS);

  try {
    const { data: existingRow, error: existingError } = await client
      .from(getJobsTableName())
      .select('*')
      .eq('id', jobId)
      .single();

    if (existingError) {
      return { ok: false, data: null, message: formatServiceError(existingError, 'Unable to publish this job.') };
    }

    const existing = existingRow as JobPostRecord;
    const nextPaymentStatus: PaymentStatus =
      existing.payment_status === 'paid' || existing.payment_status === 'waived'
        ? existing.payment_status
        : 'waived';

    const { data, error } = await client
      .from(getJobsTableName())
      .update({
        status: 'published',
        payment_status: nextPaymentStatus,
        published_at: now.toISOString(),
        publish_expires_at: expiresAt.toISOString(),
        review_note: toNullable(reviewNote),
        last_reviewed_by_email: adminEmail,
        last_reviewed_at: now.toISOString(),
      })
      .eq('id', jobId)
      .select('*')
      .single();

    if (error) {
      return { ok: false, data: null, message: formatServiceError(error, 'Unable to publish this job.') };
    }

    const mapped = mapJobRecord(data as JobPostRecord);

    await createAdminNotification({
      jobPostId: mapped.id,
      eventType: 'job_published',
      title: 'Job listing published',
      message: `Your listing "${mapped.title}" is now live on the DAWS job board.`,
      recipientScope: 'poster',
      recipientEmail: mapped.postedByEmail,
      metadata: {
        expires_at: mapped.publishExpiresAt,
      },
    });

    void trackAnalyticsEvent('Job published by admin', {
      source: 'admin-jobs',
      job_id: mapped.id,
      package_type: mapped.packageType,
      payment_status: mapped.paymentStatus,
    });

    return { ok: true, data: mapped };
  } catch (error) {
    return { ok: false, data: null, message: formatServiceError(error, 'Unable to publish this job.') };
  }
}

export async function requestJobChangesFromAdmin(
  jobId: string,
  reviewNote: string
): Promise<ServiceResult<JobPost | null>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: null,
      message: 'Job board backend is not configured yet.',
    };
  }

  const trimmedReviewNote = toTrimmed(reviewNote);
  if (trimmedReviewNote.length < 10) {
    return {
      ok: false,
      data: null,
      message: 'Add a short review note so the poster knows what to update.',
    };
  }

  const adminEmail = await getCurrentSupabaseUserEmail();
  const now = new Date().toISOString();

  try {
    const { data, error } = await client
      .from(getJobsTableName())
      .update({
        status: 'changes_requested',
        review_note: trimmedReviewNote,
        last_reviewed_by_email: adminEmail,
        last_reviewed_at: now,
      })
      .eq('id', jobId)
      .select('*')
      .single();

    if (error) {
      return {
        ok: false,
        data: null,
        message: formatServiceError(error, 'Unable to request changes for this listing.'),
      };
    }

    const mapped = mapJobRecord(data as JobPostRecord);

    await createAdminNotification({
      jobPostId: mapped.id,
      eventType: 'job_changes_requested',
      title: 'Changes requested on your job listing',
      message: trimmedReviewNote,
      recipientScope: 'poster',
      recipientEmail: mapped.postedByEmail,
      metadata: {
        status: mapped.status,
      },
    });

    return { ok: true, data: mapped };
  } catch (error) {
    return {
      ok: false,
      data: null,
      message: formatServiceError(error, 'Unable to request changes for this listing.'),
    };
  }
}

export async function archiveJobFromAdmin(
  jobId: string,
  reviewNote?: string
): Promise<ServiceResult<JobPost | null>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: null,
      message: 'Job board backend is not configured yet.',
    };
  }

  const adminEmail = await getCurrentSupabaseUserEmail();
  const now = new Date().toISOString();

  try {
    const { data, error } = await client
      .from(getJobsTableName())
      .update({
        status: 'archived',
        review_note: toNullable(reviewNote),
        last_reviewed_by_email: adminEmail,
        last_reviewed_at: now,
      })
      .eq('id', jobId)
      .select('*')
      .single();

    if (error) {
      return { ok: false, data: null, message: formatServiceError(error, 'Unable to archive this listing.') };
    }

    const mapped = mapJobRecord(data as JobPostRecord);

    await createAdminNotification({
      jobPostId: mapped.id,
      eventType: 'job_archived',
      title: 'Job listing archived',
      message: `Your listing "${mapped.title}" has been archived.`,
      recipientScope: 'poster',
      recipientEmail: mapped.postedByEmail,
      metadata: {
        archived_at: now,
      },
    });

    return { ok: true, data: mapped };
  } catch (error) {
    return { ok: false, data: null, message: formatServiceError(error, 'Unable to archive this listing.') };
  }
}

export async function extendJobListingFromAdmin(
  jobId: string
): Promise<ServiceResult<JobPost | null>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: null,
      message: 'Job board backend is not configured yet.',
    };
  }

  const adminEmail = await getCurrentSupabaseUserEmail();
  const now = new Date();

  try {
    const { data: existingRow, error: existingError } = await client
      .from(getJobsTableName())
      .select('*')
      .eq('id', jobId)
      .single();

    if (existingError) {
      return { ok: false, data: null, message: formatServiceError(existingError, 'Unable to extend this listing.') };
    }

    const existing = existingRow as JobPostRecord;
    const currentExpiry = existing.publish_expires_at ? new Date(existing.publish_expires_at) : null;
    const baseDate =
      currentExpiry && !Number.isNaN(currentExpiry.getTime()) && currentExpiry.getTime() > now.getTime()
        ? currentExpiry
        : now;
    const nextExpiry = addDays(baseDate, JOB_LISTING_DURATION_DAYS);
    const nextPaymentStatus: PaymentStatus =
      existing.payment_status === 'paid' || existing.payment_status === 'waived'
        ? existing.payment_status
        : 'waived';

    const { data, error } = await client
      .from(getJobsTableName())
      .update({
        status: 'published',
        payment_status: nextPaymentStatus,
        published_at: existing.published_at ?? now.toISOString(),
        publish_expires_at: nextExpiry.toISOString(),
        last_reviewed_by_email: adminEmail,
        last_reviewed_at: now.toISOString(),
      })
      .eq('id', jobId)
      .select('*')
      .single();

    if (error) {
      return { ok: false, data: null, message: formatServiceError(error, 'Unable to extend this listing.') };
    }

    const mapped = mapJobRecord(data as JobPostRecord);

    await createAdminNotification({
      jobPostId: mapped.id,
      eventType: 'job_extended',
      title: 'Job listing extended by 3 months',
      message: `Your listing "${mapped.title}" is now active until ${nextExpiry.toLocaleDateString('en-AU')}.`,
      recipientScope: 'poster',
      recipientEmail: mapped.postedByEmail,
      metadata: {
        expires_at: mapped.publishExpiresAt,
      },
    });

    return { ok: true, data: mapped };
  } catch (error) {
    return { ok: false, data: null, message: formatServiceError(error, 'Unable to extend this listing.') };
  }
}

export async function syncJobExpiryAlerts(): Promise<
  ServiceResult<{ expiringSoon: number; expired: number }>
> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: { expiringSoon: 0, expired: 0 },
      message: 'Job board backend is not configured yet.',
    };
  }

  try {
    const { data, error } = await client
      .from(getJobsTableName())
      .select('*')
      .eq('status', 'published')
      .in('payment_status', ['paid', 'waived']);

    if (error) {
      return {
        ok: false,
        data: { expiringSoon: 0, expired: 0 },
        message: formatServiceError(error, 'Unable to check listing expiry alerts.'),
      };
    }

    const jobs = (data ?? []).map((row) => mapJobRecord(row as JobPostRecord));
    let expiringSoon = 0;
    let expired = 0;
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;

    for (const job of jobs) {
      if (!job.publishExpiresAt) continue;
      const expiry = new Date(job.publishExpiresAt);
      if (Number.isNaN(expiry.getTime())) continue;

      const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / msPerDay);

      if (daysRemaining <= 0) {
        expired += 1;
        const archiveResult = await archiveJobFromAdmin(
          job.id,
          'Listing reached the 3-month limit and was archived. Extend to republish for another 3 months.'
        );

        if (archiveResult.ok) {
          await createAdminNotification({
            jobPostId: job.id,
            eventType: 'job_expired',
            title: 'Job listing expired',
            message: `"${job.title}" has reached its 3-month limit and was archived.`,
            recipientScope: 'admin',
            metadata: {
              job_id: job.id,
            },
            dedupe: true,
          });

          await createAdminNotification({
            jobPostId: job.id,
            eventType: 'job_expired',
            title: 'Your job listing expired',
            message: `"${job.title}" reached its 3-month limit and was archived. You can request a 3-month extension.`,
            recipientScope: 'poster',
            recipientEmail: job.postedByEmail,
            metadata: {
              job_id: job.id,
            },
            dedupe: true,
          });
        }
        continue;
      }

      if (daysRemaining <= JOB_EXPIRING_SOON_WINDOW_DAYS) {
        expiringSoon += 1;
        await createAdminNotification({
          jobPostId: job.id,
          eventType: 'job_expiring_soon',
          title: 'Job listing expiring soon',
          message: `"${job.title}" expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`,
          recipientScope: 'admin',
          metadata: {
            days_remaining: daysRemaining,
          },
          dedupe: true,
        });

        await createAdminNotification({
          jobPostId: job.id,
          eventType: 'job_expiring_soon',
          title: 'Your job listing expires soon',
          message: `"${job.title}" expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Contact DAWS to extend for another 3 months.`,
          recipientScope: 'poster',
          recipientEmail: job.postedByEmail,
          metadata: {
            days_remaining: daysRemaining,
          },
          dedupe: true,
        });
      }
    }

    return {
      ok: true,
      data: { expiringSoon, expired },
    };
  } catch (error) {
    return {
      ok: false,
      data: { expiringSoon: 0, expired: 0 },
      message: formatServiceError(error, 'Unable to check listing expiry alerts.'),
    };
  }
}

export async function publishJobWithoutPaymentForTesting(
  jobId: string,
  packageType: JobPackageType
): Promise<ServiceResult<JobPost | null>> {
  return submitJobForReviewWithoutPayment(jobId, packageType);
}

function withPrefilledEmail(urlValue: string, email: string) {
  try {
    const url = new URL(urlValue);
    if (email) {
      url.searchParams.set('prefilled_email', email);
    }
    return url.toString();
  } catch {
    return urlValue;
  }
}

export async function createPublishCheckoutSession(
  jobId: string,
  packageType: JobPackageType,
  email: string
): Promise<CheckoutResult> {
  const endpoint = import.meta.env.VITE_STRIPE_CHECKOUT_ENDPOINT?.trim();
  const standardPaymentLink = import.meta.env.VITE_STRIPE_STANDARD_PAYMENT_LINK?.trim();
  const amplifiedPaymentLink = import.meta.env.VITE_STRIPE_AMPLIFIED_PAYMENT_LINK?.trim();

  if (endpoint) {
    const successUrl =
      buildAbsoluteAppUrl(`/jobs/submit?draft=${encodeURIComponent(jobId)}&payment=success`) ??
      `/jobs/submit?draft=${encodeURIComponent(jobId)}&payment=success`;
    const cancelUrl =
      buildAbsoluteAppUrl(`/jobs/submit?draft=${encodeURIComponent(jobId)}&payment=cancelled`) ??
      `/jobs/submit?draft=${encodeURIComponent(jobId)}&payment=cancelled`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          packageType,
          email,
          successUrl,
          cancelUrl,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return {
          ok: false,
          message: errorBody || 'Unable to start Stripe checkout right now.',
        };
      }

      const payload = (await response.json()) as { url?: string };
      if (payload.url && /^https?:\/\//i.test(payload.url)) {
        return { ok: true, url: payload.url, mode: 'endpoint' };
      }
    } catch (error) {
      return {
        ok: false,
        message: formatServiceError(error, 'Unable to start Stripe checkout right now.'),
      };
    }
  }

  const paymentLink = packageType === 'standard' ? standardPaymentLink : amplifiedPaymentLink;
  if (paymentLink) {
    return {
      ok: true,
      url: withPrefilledEmail(paymentLink, email),
      mode: 'payment_link',
    };
  }

  return {
    ok: false,
    message:
      'Stripe checkout is not configured yet. Add VITE_STRIPE_CHECKOUT_ENDPOINT or payment link env vars.',
  };
}

export async function submitJobApplication(input: JobApplicationInput): Promise<ServiceResult<null>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: null,
      message: 'Job applications are not configured yet.',
    };
  }

  const applicantName = toTrimmed(input.applicantName);
  const applicantEmail = toTrimmed(input.applicantEmail).toLowerCase();

  if (applicantName.length < 2) {
    return { ok: false, data: null, message: 'Please enter your full name.' };
  }

  if (!isValidEmail(applicantEmail)) {
    return { ok: false, data: null, message: 'Please enter a valid email address.' };
  }

  if (input.linkedinUrl && !isValidUrl(input.linkedinUrl)) {
    return { ok: false, data: null, message: 'LinkedIn URL must start with http:// or https://.' };
  }

  if (input.resumeUrl && !isValidUrl(input.resumeUrl)) {
    return { ok: false, data: null, message: 'Resume URL must start with http:// or https://.' };
  }

  try {
    const { error } = await client.from(getJobApplicationsTableName()).insert({
      job_post_id: input.jobPostId,
      applicant_name: applicantName,
      applicant_email: applicantEmail,
      phone: toNullable(input.phone),
      linkedin_url: toNullable(input.linkedinUrl),
      resume_url: toNullable(input.resumeUrl),
      cover_note: toNullable(input.coverNote),
    });

    if (error) {
      return { ok: false, data: null, message: formatServiceError(error, 'Unable to submit application.') };
    }

    void trackAnalyticsEvent('Job application submitted', {
      form_type: 'easy_apply',
      source: 'job-detail',
      email: applicantEmail,
      job_id: input.jobPostId,
    });

    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, data: null, message: formatServiceError(error, 'Unable to submit application.') };
  }
}

export async function getCurrentSupabaseUserEmail() {
  const identity = await getCurrentUserIdentity();
  return identity?.email ?? null;
}
