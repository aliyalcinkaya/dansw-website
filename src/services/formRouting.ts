import { fetchSiteAdminAccess } from './siteSettings';
import { getSupabaseClient } from './supabase';

const DEFAULT_FORM_ROUTING_TABLE = 'form_email_routing';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FormRoutingKind = 'general' | 'speaker' | 'member' | 'sponsor' | 'job';

export interface FormRoutingRule {
  formKind: FormRoutingKind;
  formLabel: string;
  toEmails: string[];
  ccEmails: string[];
  enabled: boolean;
  updatedByEmail: string | null;
  updatedAt: string | null;
}

interface ServiceResult<T> {
  ok: boolean;
  data: T;
  message?: string;
}

const FORM_KIND_ORDER: FormRoutingKind[] = ['general', 'speaker', 'member', 'sponsor', 'job'];

const DEFAULT_FORM_LABELS: Record<FormRoutingKind, string> = {
  general: 'General enquiries',
  speaker: 'Speaker requests',
  member: 'Member form',
  sponsor: 'Sponsor form',
  job: 'Job form',
};

interface FormRoutingRecord {
  form_kind: string;
  form_label: string | null;
  to_emails: string[] | null;
  cc_emails: string[] | null;
  enabled: boolean | null;
  updated_by_email: string | null;
  updated_at: string | null;
}

function getFormRoutingTableName() {
  return import.meta.env.VITE_SUPABASE_FORM_ROUTING_TABLE?.trim() || DEFAULT_FORM_ROUTING_TABLE;
}

function formatServiceError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

function toTrimmed(value: string | undefined | null) {
  return value?.trim() ?? '';
}

function normalizeEmailList(rawInput: string | string[]) {
  const candidates = Array.isArray(rawInput) ? rawInput : rawInput.split(/[\n,;]/);

  const normalized = candidates
    .map((entry) => toTrimmed(entry).toLowerCase())
    .filter((entry) => EMAIL_REGEX.test(entry));

  return Array.from(new Set(normalized));
}

function toFormKind(value: string): FormRoutingKind | null {
  if (FORM_KIND_ORDER.includes(value as FormRoutingKind)) {
    return value as FormRoutingKind;
  }

  return null;
}

function getDefaultRules() {
  return FORM_KIND_ORDER.map((formKind) => ({
    formKind,
    formLabel: DEFAULT_FORM_LABELS[formKind],
    toEmails: [],
    ccEmails: [],
    enabled: true,
    updatedByEmail: null,
    updatedAt: null,
  })) satisfies FormRoutingRule[];
}

function sortRules(input: FormRoutingRule[]) {
  const orderMap = new Map(FORM_KIND_ORDER.map((kind, index) => [kind, index]));

  return [...input].sort((left, right) => {
    const leftOrder = orderMap.get(left.formKind) ?? 99;
    const rightOrder = orderMap.get(right.formKind) ?? 99;
    return leftOrder - rightOrder;
  });
}

function mapRecordToRule(record: FormRoutingRecord): FormRoutingRule | null {
  const formKind = toFormKind(toTrimmed(record.form_kind));
  if (!formKind) {
    return null;
  }

  return {
    formKind,
    formLabel: toTrimmed(record.form_label) || DEFAULT_FORM_LABELS[formKind],
    toEmails: normalizeEmailList(record.to_emails ?? []),
    ccEmails: normalizeEmailList(record.cc_emails ?? []),
    enabled: Boolean(record.enabled ?? true),
    updatedByEmail: toTrimmed(record.updated_by_email) || null,
    updatedAt: toTrimmed(record.updated_at) || null,
  };
}

function mergeWithDefaults(rules: FormRoutingRule[]) {
  const byKind = new Map<FormRoutingKind, FormRoutingRule>();
  for (const rule of rules) {
    byKind.set(rule.formKind, rule);
  }

  const merged = FORM_KIND_ORDER.map((formKind) => {
    const existing = byKind.get(formKind);
    if (existing) {
      return existing;
    }

    return {
      formKind,
      formLabel: DEFAULT_FORM_LABELS[formKind],
      toEmails: [],
      ccEmails: [],
      enabled: true,
      updatedByEmail: null,
      updatedAt: null,
    } satisfies FormRoutingRule;
  });

  return sortRules(merged);
}

export async function fetchFormRoutingRules(): Promise<ServiceResult<FormRoutingRule[]>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: true,
      data: getDefaultRules(),
      message: 'Supabase is not configured. Showing local defaults only.',
    };
  }

  const access = await fetchSiteAdminAccess();
  if (!access.data.canManage) {
    return {
      ok: false,
      data: [],
      message: 'Admin sign-in is required to manage form forwarding rules.',
    };
  }

  try {
    const { data, error } = await client
      .from(getFormRoutingTableName())
      .select('form_kind,form_label,to_emails,cc_emails,enabled,updated_by_email,updated_at');

    if (error) {
      const errorCode = (error as { code?: string }).code;
      const details =
        errorCode === '42P01'
          ? ' The form_email_routing table is missing; run the latest supabase/jobs.sql migration.'
          : '';

      return {
        ok: false,
        data: [],
        message: `${formatServiceError(error, 'Unable to load form forwarding rules.')}${details}`,
      };
    }

    const mapped = (Array.isArray(data) ? data : [])
      .map((row) => mapRecordToRule(row as FormRoutingRecord))
      .filter((rule): rule is FormRoutingRule => rule !== null);

    return {
      ok: true,
      data: mergeWithDefaults(mapped),
    };
  } catch (error) {
    return {
      ok: false,
      data: [],
      message: formatServiceError(error, 'Unable to load form forwarding rules.'),
    };
  }
}

export async function saveFormRoutingRules(
  inputRules: FormRoutingRule[]
): Promise<ServiceResult<FormRoutingRule[]>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: getDefaultRules(),
      message: 'Supabase is not configured in this environment.',
    };
  }

  const access = await fetchSiteAdminAccess();
  if (!access.data.canManage) {
    return {
      ok: false,
      data: [],
      message: 'Admin sign-in is required to save form forwarding rules.',
    };
  }

  const normalizedRules = mergeWithDefaults(
    inputRules.map((rule) => ({
      ...rule,
      formLabel: toTrimmed(rule.formLabel) || DEFAULT_FORM_LABELS[rule.formKind],
      toEmails: normalizeEmailList(rule.toEmails),
      ccEmails: normalizeEmailList(rule.ccEmails),
      enabled: Boolean(rule.enabled),
    }))
  );

  try {
    const { data: userData, error: userError } = await client.auth.getUser();
    const editorEmail = toTrimmed(userData.user?.email).toLowerCase();

    if (userError || !editorEmail) {
      return {
        ok: false,
        data: normalizedRules,
        message: 'Sign in with an admin account to save routing rules.',
      };
    }

    const payload = normalizedRules.map((rule) => ({
      form_kind: rule.formKind,
      form_label: rule.formLabel,
      to_emails: rule.toEmails,
      cc_emails: rule.ccEmails,
      enabled: rule.enabled,
      updated_by_email: editorEmail,
    }));

    const { error } = await client.from(getFormRoutingTableName()).upsert(payload, {
      onConflict: 'form_kind',
    });

    if (error) {
      const errorCode = (error as { code?: string }).code;
      const details =
        errorCode === '42P01'
          ? ' The form_email_routing table is missing; run the latest supabase/jobs.sql migration.'
          : '';

      return {
        ok: false,
        data: normalizedRules,
        message: `${formatServiceError(error, 'Unable to save form forwarding rules.')}${details}`,
      };
    }

    return {
      ok: true,
      data: normalizedRules.map((rule) => ({
        ...rule,
        updatedByEmail: editorEmail,
        updatedAt: new Date().toISOString(),
      })),
    };
  } catch (error) {
    return {
      ok: false,
      data: normalizedRules,
      message: formatServiceError(error, 'Unable to save form forwarding rules.'),
    };
  }
}
