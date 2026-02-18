import { getAnalyticsAnonymousId, trackAnalyticsEvent } from './analytics';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PAYLOAD_SIZE = 10 * 1024; // 10 KB
const REQUEST_TIMEOUT_MS = 12_000;

export type SubmitResult = {
  ok: boolean;
  message?: string;
};

type FormType = 'member' | 'speaker' | 'sponsor' | 'newsletter';
type Profession = 'student' | 'professional' | 'looking';

interface BaseInput {
  website?: string;
  source: string;
}

export interface MemberSubmissionInput extends BaseInput {
  name: string;
  email: string;
  profession: Profession;
  institution?: string;
  goals: string;
}

export interface SpeakerSubmissionInput extends BaseInput {
  name: string;
  email: string;
  phone: string;
  topic: string;
  topicUndecided: boolean;
  existingTalksUrl?: string;
  bio: string;
}

export interface SponsorSubmissionInput extends BaseInput {
  name: string;
  email: string;
  company: string;
  sponsorshipType: string;
  message?: string;
}

export interface NewsletterSubmissionInput extends BaseInput {
  email: string;
}

interface NormalizedRecord {
  type: FormType;
  source: string;
  email: string;
  name?: string;
  company?: string;
  message?: string;
  newsletter?: boolean;
  website?: string;
  mixpanel_anonymous_id: string;
  user_agent?: string;
  page_path: string;
  payload: Record<string, unknown>;
  received_at: string;
}

type SubmissionTarget = 'forms' | 'newsletter';
type MailchimpSyncStatus = 'synced' | 'already_subscribed' | 'failed';

interface MailchimpSyncResponse {
  ok: boolean;
  status?: MailchimpSyncStatus;
  message?: string;
}

function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  const formsTable = import.meta.env.VITE_SUPABASE_FORMS_TABLE?.trim() || 'form_submissions';
  const newsletterTable =
    import.meta.env.VITE_SUPABASE_NEWSLETTER_TABLE?.trim() || 'newsletter_subscriptions';

  if (!url || !anonKey) return null;
  return { url, anonKey, formsTable, newsletterTable };
}

function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value);
}

function toTrimmed(value: string | undefined) {
  return value?.trim() ?? '';
}

function getPagePath() {
  if (typeof window === 'undefined') return '';
  const { pathname, hash, search } = window.location;
  return `${pathname}${search}${hash}`;
}

function getUserAgent() {
  if (typeof navigator === 'undefined') return undefined;
  return navigator.userAgent;
}

function buildMissingFieldsMessage(missingFields: string[]) {
  if (missingFields.length === 0) return 'Please complete the required fields.';
  if (missingFields.length === 1) return `Please provide ${missingFields[0]}.`;
  return `Please provide: ${missingFields.join(', ')}.`;
}

function validateCommon(type: FormType, input: BaseInput & { email: string }) {
  const missingFields: string[] = [];

  if (!toTrimmed(input.email) || !isValidEmail(toTrimmed(input.email))) {
    missingFields.push('a valid email');
  }

  if (missingFields.length > 0) {
    void trackAnalyticsEvent('Form submit failed', {
      form_type: type,
      source: input.source,
      failure_reason: 'validation',
      missing_fields: missingFields.join(','),
    });

    return {
      ok: false,
      message: buildMissingFieldsMessage(missingFields),
    } satisfies SubmitResult;
  }

  return { ok: true } satisfies SubmitResult;
}

function validatePayloadSize(record: NormalizedRecord) {
  const payloadSize = new TextEncoder().encode(JSON.stringify(record)).length;
  if (payloadSize <= MAX_PAYLOAD_SIZE) return { ok: true } as const;

  void trackAnalyticsEvent('Form submit failed', {
    form_type: record.type,
    source: record.source,
    failure_reason: 'payload_too_large',
    payload_size: payloadSize,
  });

  return {
    ok: false,
    message: 'Your submission is too large. Please shorten your response and try again.',
  } as const;
}

function mapErrorMessage(status: number, responseBody: string, tableName: string) {
  if (status === 401) {
    return 'Form backend authentication failed. Check Supabase keys and table policy.';
  }

  if (status === 403) {
    return 'Submission was blocked by table permissions or RLS policy. Check Supabase policies for this table.';
  }

  if (status === 404) {
    return `Supabase table "${tableName}" was not found. Run the SQL setup first.`;
  }

  if (status === 413) {
    return 'Your submission is too large. Please shorten your response and try again.';
  }

  if (status === 429) {
    return 'Too many requests. Please wait a moment and submit again.';
  }

  if (responseBody) {
    return 'Unable to submit right now. Please try again shortly.';
  }

  return 'Unable to submit right now. Please try again.';
}

async function postSubmission(
  record: NormalizedRecord,
  target: SubmissionTarget = 'forms'
): Promise<SubmitResult> {
  const config = getSupabaseConfig();
  if (!config) {
    return {
      ok: false,
      message: 'Form backend is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  const payloadSizeCheck = validatePayloadSize(record);
  if (!payloadSizeCheck.ok) {
    return payloadSizeCheck;
  }

  const honeypotValue = toTrimmed(record.website);
  if (honeypotValue) {
    void trackAnalyticsEvent('Form submit blocked', {
      form_type: record.type,
      source: record.source,
      reason: 'honeypot_triggered',
    });

    return { ok: true };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const tableName = target === 'newsletter' ? config.newsletterTable : config.formsTable;
  const endpoint = new URL(`${config.url}/rest/v1/${encodeURIComponent(tableName)}`);

  try {
    const response = await fetch(endpoint.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(record),
      signal: controller.signal,
    });

    if (response.status === 409 && target === 'newsletter') {
      // Duplicate email means already subscribed; treat as a successful outcome.
      void trackAnalyticsEvent('Newsletter already subscribed', {
        form_type: record.type,
        source: record.source,
        email: record.email,
      });

      return { ok: true, message: 'You are already subscribed.' };
    }

    if (!response.ok) {
      const errorBody = await response.text();
      if (import.meta.env.DEV) {
        console.error(`Supabase insert failed (${response.status}) on ${tableName}: ${errorBody}`);
      }

      void trackAnalyticsEvent('Form submit failed', {
        form_type: record.type,
        source: record.source,
        status_code: response.status,
        failure_reason: 'supabase_insert_failed',
      });

      return {
        ok: false,
        message: mapErrorMessage(response.status, errorBody, tableName),
      };
    }

    void trackAnalyticsEvent('Form submitted', {
      form_type: record.type,
      source: record.source,
      email: record.email,
    });

    return { ok: true };
  } catch (error) {
    const timeoutError = error instanceof DOMException && error.name === 'AbortError';

    void trackAnalyticsEvent('Form submit failed', {
      form_type: record.type,
      source: record.source,
      failure_reason: timeoutError ? 'timeout' : 'network_error',
    });

    return {
      ok: false,
      message: timeoutError
        ? 'Submission timed out. Please check your connection and try again.'
        : 'Network error while submitting. Please try again.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function syncNewsletterToMailchimp(record: NormalizedRecord): Promise<void> {
  const config = getSupabaseConfig();
  const functionName = import.meta.env.VITE_SUPABASE_NEWSLETTER_MAILCHIMP_FUNCTION?.trim();

  if (!config || !functionName) {
    return;
  }

  const endpoint = new URL(`${config.url}/functions/v1/${encodeURIComponent(functionName)}`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
      body: JSON.stringify({
        email: record.email,
        source: record.source,
        page_path: record.page_path,
        received_at: record.received_at,
      }),
      signal: controller.signal,
    });

    const responseText = await response.text();
    let payload: MailchimpSyncResponse | null = null;

    if (responseText) {
      try {
        payload = JSON.parse(responseText) as MailchimpSyncResponse;
      } catch {
        payload = null;
      }
    }

    if (!response.ok || payload?.ok === false) {
      if (import.meta.env.DEV) {
        console.error(`Mailchimp sync failed (${response.status}): ${responseText}`);
      }

      void trackAnalyticsEvent('Newsletter Mailchimp sync failed', {
        form_type: record.type,
        source: record.source,
        email: record.email,
        status_code: response.status,
        failure_reason: 'mailchimp_sync_failed',
      });
      return;
    }

    void trackAnalyticsEvent('Newsletter Mailchimp synced', {
      form_type: record.type,
      source: record.source,
      email: record.email,
      sync_status: payload?.status ?? 'synced',
    });
  } catch (error) {
    const timeoutError = error instanceof DOMException && error.name === 'AbortError';

    void trackAnalyticsEvent('Newsletter Mailchimp sync failed', {
      form_type: record.type,
      source: record.source,
      email: record.email,
      failure_reason: timeoutError ? 'timeout' : 'network_error',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildBaseRecord(input: BaseInput & { email: string }, type: FormType) {
  return {
    type,
    source: input.source,
    email: toTrimmed(input.email).toLowerCase(),
    website: toTrimmed(input.website) || undefined,
    mixpanel_anonymous_id: getAnalyticsAnonymousId(),
    user_agent: getUserAgent(),
    page_path: getPagePath(),
    received_at: new Date().toISOString(),
  };
}

export async function submitMemberApplication(input: MemberSubmissionInput): Promise<SubmitResult> {
  const commonValidation = validateCommon('member', input);
  if (!commonValidation.ok) return commonValidation;

  const missingFields: string[] = [];
  const name = toTrimmed(input.name);
  const goals = toTrimmed(input.goals);
  const institution = toTrimmed(input.institution);

  if (!name) missingFields.push('name');
  if (!input.profession) missingFields.push('profession');
  if (!goals) missingFields.push('community goals');
  if (input.profession !== 'looking' && !institution) missingFields.push('organization');

  if (missingFields.length > 0) {
    void trackAnalyticsEvent('Form submit failed', {
      form_type: 'member',
      source: input.source,
      failure_reason: 'validation',
      missing_fields: missingFields.join(','),
    });

    return {
      ok: false,
      message: buildMissingFieldsMessage(missingFields),
    };
  }

  return postSubmission({
    ...buildBaseRecord(input, 'member'),
    newsletter: false,
    name,
    message: goals,
    payload: {
      profession: input.profession,
      institution: institution || null,
      goals,
    },
  });
}

export async function submitSpeakerApplication(input: SpeakerSubmissionInput): Promise<SubmitResult> {
  const commonValidation = validateCommon('speaker', input);
  if (!commonValidation.ok) return commonValidation;

  const missingFields: string[] = [];
  const name = toTrimmed(input.name);
  const phone = toTrimmed(input.phone);
  const bio = toTrimmed(input.bio);
  const topic = toTrimmed(input.topic);
  const existingTalksUrl = toTrimmed(input.existingTalksUrl);

  if (!name) missingFields.push('name');
  if (!phone) missingFields.push('phone');
  if (!bio) missingFields.push('bio');
  if (!input.topicUndecided && !topic) missingFields.push('topic');

  if (missingFields.length > 0) {
    void trackAnalyticsEvent('Form submit failed', {
      form_type: 'speaker',
      source: input.source,
      failure_reason: 'validation',
      missing_fields: missingFields.join(','),
    });

    return {
      ok: false,
      message: buildMissingFieldsMessage(missingFields),
    };
  }

  return postSubmission({
    ...buildBaseRecord(input, 'speaker'),
    newsletter: false,
    name,
    message: bio,
    payload: {
      phone,
      topic: topic || null,
      topic_undecided: input.topicUndecided,
      existing_talks_url: existingTalksUrl || null,
      bio,
    },
  });
}

export async function submitSponsorInquiry(input: SponsorSubmissionInput): Promise<SubmitResult> {
  const commonValidation = validateCommon('sponsor', input);
  if (!commonValidation.ok) return commonValidation;

  const missingFields: string[] = [];
  const name = toTrimmed(input.name);
  const company = toTrimmed(input.company);
  const sponsorshipType = toTrimmed(input.sponsorshipType);
  const message = toTrimmed(input.message);

  if (!name) missingFields.push('name');
  if (!company) missingFields.push('company');
  if (!sponsorshipType) missingFields.push('sponsorship type');

  if (missingFields.length > 0) {
    void trackAnalyticsEvent('Form submit failed', {
      form_type: 'sponsor',
      source: input.source,
      failure_reason: 'validation',
      missing_fields: missingFields.join(','),
    });

    return {
      ok: false,
      message: buildMissingFieldsMessage(missingFields),
    };
  }

  return postSubmission({
    ...buildBaseRecord(input, 'sponsor'),
    newsletter: false,
    name,
    company,
    message: message || undefined,
    payload: {
      sponsorship_type: sponsorshipType,
      message: message || null,
    },
  });
}

export async function submitNewsletterSubscription(
  input: NewsletterSubmissionInput
): Promise<SubmitResult> {
  const commonValidation = validateCommon('newsletter', input);
  if (!commonValidation.ok) return commonValidation;
  const record: NormalizedRecord = {
    ...buildBaseRecord(input, 'newsletter'),
    payload: {
      subscription: 'newsletter',
    },
  };

  const result = await postSubmission(record, 'newsletter');
  if (result.ok && !toTrimmed(input.website)) {
    void syncNewsletterToMailchimp(record);
  }

  return result;
}
