import { parseLinkedInPostInputs } from './linkedin';
import { getSupabaseClient } from './supabase';

const DEFAULT_SITE_SETTINGS_TABLE = 'site_settings';
const LINKEDIN_POSTS_KEY = 'home_linkedin_posts';
const LOCAL_SETTINGS_STORAGE_KEY = 'daws_site_settings_v1';
const MAX_LINKEDIN_POST_URLS = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ServiceResult<T> {
  ok: boolean;
  data: T;
  message?: string;
}

interface SiteSettingRecord {
  key: string;
  value: unknown;
}

interface LocalSiteSettings {
  linkedinPostUrls?: string[];
}

export interface SiteAdminAccess {
  mode: 'supabase' | 'local';
  email: string | null;
  canManage: boolean;
}

function getSiteSettingsTableName() {
  return import.meta.env.VITE_SUPABASE_SITE_SETTINGS_TABLE?.trim() || DEFAULT_SITE_SETTINGS_TABLE;
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function formatServiceError(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value);
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

function isLinkedInInput(value: string) {
  if (value.startsWith('urn:li:')) {
    return true;
  }

  try {
    const parsed = new URL(value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`);
    return parsed.hostname.toLowerCase().includes('linkedin.com');
  } catch {
    return false;
  }
}

function normalizeLinkedInUrls(raw: string | string[] | undefined) {
  const candidates = parseLinkedInPostInputs(raw);
  const normalized = candidates.filter(isLinkedInInput);
  const unique = Array.from(new Set(normalized));
  return unique.slice(0, MAX_LINKEDIN_POST_URLS);
}

function readLocalLinkedInUrls() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as LocalSiteSettings;
    return normalizeLinkedInUrls(parsed.linkedinPostUrls ?? []);
  } catch {
    return [];
  }
}

function writeLocalLinkedInUrls(urls: string[]) {
  if (!canUseStorage()) {
    return;
  }

  try {
    const payload: LocalSiteSettings = { linkedinPostUrls: urls };
    window.localStorage.setItem(LOCAL_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage write failures.
  }
}

function readLinkedInUrlsFromSettingValue(value: unknown) {
  if (Array.isArray(value)) {
    return normalizeLinkedInUrls(value.map((entry) => String(entry ?? '')));
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const record = value as Record<string, unknown>;
  if (Array.isArray(record.postUrls)) {
    return normalizeLinkedInUrls(record.postUrls.map((entry) => String(entry ?? '')));
  }

  if (Array.isArray(record.urls)) {
    return normalizeLinkedInUrls(record.urls.map((entry) => String(entry ?? '')));
  }

  return [];
}

function readEnvLinkedInUrls() {
  const raw = import.meta.env.VITE_LINKEDIN_POST_URLS as string | undefined;
  return normalizeLinkedInUrls(raw);
}

function getLinkedInUrlFallback() {
  const localUrls = readLocalLinkedInUrls();
  if (localUrls.length > 0) {
    return localUrls;
  }

  return readEnvLinkedInUrls();
}

export async function fetchSiteAdminAccess(): Promise<ServiceResult<SiteAdminAccess>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: true,
      data: {
        mode: 'local',
        email: null,
        canManage: true,
      },
      message: 'Supabase is not configured. Admin edits are saved only in this browser.',
    };
  }

  try {
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) {
      return {
        ok: false,
        data: { mode: 'supabase', email: null, canManage: false },
        message: formatServiceError(userError, 'Unable to check current admin session.'),
      };
    }

    const email = userData.user?.email?.toLowerCase() ?? null;
    if (!email) {
      return {
        ok: true,
        data: {
          mode: 'supabase',
          email: null,
          canManage: false,
        },
      };
    }

    const adminEmailCheck = await client.rpc('is_job_admin_email', {
      candidate_email: email,
    });

    if (!adminEmailCheck.error && typeof adminEmailCheck.data === 'boolean') {
      return {
        ok: true,
        data: {
          mode: 'supabase',
          email,
          canManage: adminEmailCheck.data,
        },
      };
    }

    // Fallback for environments where is_job_admin_email is not deployed yet.
    if ((adminEmailCheck.error?.code ?? '') === 'PGRST202') {
      const adminCheck = await client.rpc('is_job_admin');
      if (!adminCheck.error && typeof adminCheck.data === 'boolean') {
        return {
          ok: true,
          data: {
            mode: 'supabase',
            email,
            canManage: adminCheck.data,
          },
        };
      }
    }

    const reason =
      adminEmailCheck.error?.code === 'PGRST202'
        ? 'Admin email check function is missing. Run the latest Supabase SQL migration.'
        : formatServiceError(adminEmailCheck.error, 'Unable to verify admin access.');

    return {
      ok: true,
      data: {
        mode: 'supabase',
        email,
        canManage: false,
      },
      message: reason,
    };
  } catch (error) {
    return {
      ok: false,
      data: { mode: 'supabase', email: null, canManage: false },
      message: formatServiceError(error, 'Unable to determine admin access.'),
    };
  }
}

export async function fetchLinkedInPostUrls(): Promise<ServiceResult<string[]>> {
  const fallbackUrls = getLinkedInUrlFallback();
  const client = getSupabaseClient();

  if (!client) {
    return { ok: true, data: fallbackUrls };
  }

  try {
    const { data, error } = await client
      .from(getSiteSettingsTableName())
      .select('key,value')
      .eq('key', LINKEDIN_POSTS_KEY)
      .maybeSingle();

    if (error) {
      return {
        ok: true,
        data: fallbackUrls,
        message: formatServiceError(error, 'Unable to read LinkedIn post settings.'),
      };
    }

    const row = (data ?? null) as SiteSettingRecord | null;
    if (!row) {
      return { ok: true, data: fallbackUrls };
    }

    const urls = readLinkedInUrlsFromSettingValue(row.value);
    writeLocalLinkedInUrls(urls);

    return {
      ok: true,
      data: urls,
    };
  } catch (error) {
    return {
      ok: true,
      data: fallbackUrls,
      message: formatServiceError(error, 'Unable to read LinkedIn post settings.'),
    };
  }
}

export async function saveLinkedInPostUrls(
  rawInput: string | string[]
): Promise<ServiceResult<string[]>> {
  const normalizedUrls = normalizeLinkedInUrls(rawInput);

  const client = getSupabaseClient();
  if (!client) {
    writeLocalLinkedInUrls(normalizedUrls);
    return {
      ok: true,
      data: normalizedUrls,
      message: 'Saved locally in this browser (Supabase not configured).',
    };
  }

  try {
    const { data: userData, error: userError } = await client.auth.getUser();
    const editorEmail = userData.user?.email?.toLowerCase() ?? null;

    if (userError || !editorEmail) {
      return {
        ok: false,
        data: normalizedUrls,
        message: 'Sign in with an admin account to save website settings.',
      };
    }

    const { error } = await client.from(getSiteSettingsTableName()).upsert(
      {
        key: LINKEDIN_POSTS_KEY,
        value: { postUrls: normalizedUrls },
        updated_by_email: editorEmail,
      },
      { onConflict: 'key' }
    );

    if (error) {
      const code = (error as { code?: string }).code;
      const details =
        code === '42P01'
          ? ' The site_settings table is missing; run the latest Supabase SQL migration.'
          : '';

      return {
        ok: false,
        data: normalizedUrls,
        message: `${formatServiceError(error, 'Unable to save LinkedIn post settings.')}${details}`,
      };
    }

    writeLocalLinkedInUrls(normalizedUrls);
    return {
      ok: true,
      data: normalizedUrls,
    };
  } catch (error) {
    return {
      ok: false,
      data: normalizedUrls,
      message: formatServiceError(error, 'Unable to save LinkedIn post settings.'),
    };
  }
}

export async function sendAdminMagicLink(
  email: string,
  redirectPath = '/admin/jobs'
): Promise<ServiceResult<null>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: null,
      message: 'Supabase auth is not configured in this environment.',
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    return {
      ok: false,
      data: null,
      message: 'Enter a valid email address.',
    };
  }

  const adminLookup = await client.rpc('is_job_admin_email', {
    candidate_email: normalizedEmail,
  });

  if (adminLookup.error) {
    const isMissingFunction = (adminLookup.error.code ?? '') === '42883';
    return {
      ok: false,
      data: null,
      message: isMissingFunction
        ? 'Admin email check is not deployed yet. Run the latest supabase/jobs.sql migration.'
        : formatServiceError(adminLookup.error, 'Unable to verify admin email access.'),
    };
  }

  if (!adminLookup.data) {
    return {
      ok: false,
      data: null,
      message: 'This email is not registered as a website admin yet.',
    };
  }

  const redirectTo = buildAbsoluteAppUrl(redirectPath);

  try {
    const { error } = await client.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      return {
        ok: false,
        data: null,
        message: formatServiceError(error, 'Unable to send admin login link.'),
      };
    }

    return {
      ok: true,
      data: null,
      message: `Magic link sent to ${normalizedEmail}. Open it to finish admin sign-in.`,
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      message: formatServiceError(error, 'Unable to send admin login link.'),
    };
  }
}
