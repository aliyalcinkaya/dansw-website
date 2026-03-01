import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_TIMEOUT_MS = 12_000;
const RESEND_API_URL = 'https://api.resend.com/emails';
const FORM_ROUTING_TABLE = toTrimmed(Deno.env.get('FORM_EMAIL_ROUTING_TABLE')) || 'form_email_routing';
const MAX_REQUEST_BYTES = 32_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

type FormKind = 'general' | 'speaker' | 'member' | 'sponsor' | 'job';

interface ForwardRequestBody {
  form_kind?: string;
  formKind?: string;
  submission?: Record<string, unknown>;
}

interface RoutingRow {
  form_label: string;
  to_emails: string[] | null;
  cc_emails: string[] | null;
  enabled: boolean;
}

interface RateLimitBucket {
  count: number;
  windowStart: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function toTrimmed(value: string | undefined | null) {
  return value?.trim() ?? '';
}

function isValidAllowedOrigin(origin: string) {
  if (origin === '*') {
    return true;
  }

  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseAllowedOrigins(rawValue: string) {
  return rawValue
    .split(/[\n,]/)
    .map((origin) => origin.trim())
    .map((origin) => (origin === '*' ? origin : origin.replace(/\/+$/, '')))
    .filter((origin) => origin.length > 0 && isValidAllowedOrigin(origin));
}

function getConfiguredAllowedOrigins() {
  return parseAllowedOrigins(toTrimmed(Deno.env.get('FORM_FORWARDER_ALLOWED_ORIGIN')));
}

function extractRequestOrigin(request: Request) {
  return toTrimmed(request.headers.get('origin')).replace(/\/+$/, '');
}

function isRequestOriginAllowed(request: Request) {
  const configuredOrigins = getConfiguredAllowedOrigins();
  if (configuredOrigins.length === 0 || configuredOrigins.includes('*')) {
    return true;
  }

  const requestOrigin = extractRequestOrigin(request);
  if (!requestOrigin) {
    return false;
  }

  return configuredOrigins.includes(requestOrigin);
}

function resolveAllowedOrigin(request: Request) {
  const configuredOrigins = getConfiguredAllowedOrigins();
  if (configuredOrigins.length === 0 || configuredOrigins.includes('*')) {
    return '*';
  }

  const requestOrigin = extractRequestOrigin(request);
  if (!requestOrigin) {
    return configuredOrigins[0];
  }

  return configuredOrigins.includes(requestOrigin) ? requestOrigin : configuredOrigins[0];
}

function getCorsHeaders(request: Request) {
  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(request),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  } as const;
}

function jsonResponse(request: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(request),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function errorResponse(request: Request, status: number, message: string) {
  return jsonResponse(request, status, { ok: false, message });
}

function isFormKind(value: string): value is FormKind {
  return ['general', 'speaker', 'member', 'sponsor', 'job'].includes(value);
}

function normalizeEmailList(value: unknown) {
  const rawValues: string[] = Array.isArray(value)
    ? value.map((entry) => String(entry ?? ''))
    : typeof value === 'string'
      ? value.split(/[\n,;]/)
      : [];

  const normalized = rawValues
    .map((entry) => toTrimmed(entry).toLowerCase())
    .filter((entry) => EMAIL_REGEX.test(entry));

  return Array.from(new Set(normalized));
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function toDisplayValue(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function pickSenderEmail(submission: Record<string, unknown>) {
  const candidate = toTrimmed(String(submission.email ?? '')).toLowerCase();
  return EMAIL_REGEX.test(candidate) ? candidate : '';
}

function pickSenderName(submission: Record<string, unknown>) {
  return toTrimmed(String(submission.name ?? ''));
}

function buildSubject(formLabel: string, submission: Record<string, unknown>) {
  const senderName = pickSenderName(submission);
  const senderEmail = pickSenderEmail(submission);
  const sender = senderName || senderEmail || 'Unknown sender';
  return `[DAWS] ${formLabel}: ${sender}`;
}

function formatSubmissionEntries(submission: Record<string, unknown>) {
  const orderedKeys = ['name', 'email', 'source', 'subject', 'company', 'message', 'page_path', 'received_at'];
  const seen = new Set<string>();
  const entries: Array<[string, string]> = [];

  for (const key of orderedKeys) {
    if (key in submission) {
      entries.push([key, toDisplayValue(submission[key])]);
      seen.add(key);
    }
  }

  for (const [key, rawValue] of Object.entries(submission)) {
    if (seen.has(key)) {
      continue;
    }

    entries.push([key, toDisplayValue(rawValue)]);
  }

  return entries.filter(([, value]) => value.length > 0);
}

function buildHtmlBody(formLabel: string, entries: Array<[string, string]>) {
  const rows = entries
    .map(([key, value]) => {
      const formattedValue = escapeHtml(value).replaceAll('\n', '<br>');
      return `<tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">${escapeHtml(key)}</td><td style="padding:8px;border:1px solid #e2e8f0;">${formattedValue}</td></tr>`;
    })
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;">
      <h2 style="margin:0 0 12px;">${escapeHtml(formLabel)} submission</h2>
      <table style="border-collapse:collapse;width:100%;max-width:760px;">
        <tbody>${rows}</tbody>
      </table>
    </div>
  `.trim();
}

function buildTextBody(formLabel: string, entries: Array<[string, string]>) {
  const lines = entries.map(([key, value]) => `${key}: ${value}`);
  return `${formLabel} submission\n\n${lines.join('\n')}`;
}

function parseFormKind(payload: ForwardRequestBody) {
  const candidate = toTrimmed(payload.form_kind ?? payload.formKind ?? '').toLowerCase();
  return isFormKind(candidate) ? candidate : null;
}

function formatResendError(rawResponse: string) {
  if (!rawResponse) {
    return 'Resend API request failed.';
  }

  try {
    const parsed = JSON.parse(rawResponse) as { message?: unknown; error?: unknown };
    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message;
    }

    if (typeof parsed.error === 'string' && parsed.error.trim()) {
      return parsed.error;
    }
  } catch {
    // Ignore parse errors and use fallback below.
  }

  return 'Resend API request failed.';
}

function getRequestIpAddress(request: Request) {
  const forwardedFor = toTrimmed(request.headers.get('x-forwarded-for'));
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  const realIp = toTrimmed(request.headers.get('x-real-ip'));
  return realIp || 'unknown';
}

function isRateLimited(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const existing = rateLimitBuckets.get(key);

  if (!existing || now - existing.windowStart >= windowMs) {
    rateLimitBuckets.set(key, {
      count: 1,
      windowStart: now,
    });
    return false;
  }

  if (existing.count >= maxRequests) {
    return true;
  }

  existing.count += 1;
  rateLimitBuckets.set(key, existing);
  return false;
}

async function fetchRoutingRule(
  formKind: FormKind
): Promise<{ ok: true; data: RoutingRow | null } | { ok: false; message: string }> {
  const supabaseUrl = toTrimmed(Deno.env.get('SUPABASE_URL'));
  const serviceRoleKey = toTrimmed(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      ok: false,
      message: 'Supabase service role credentials are not configured.',
    };
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await client
    .from(FORM_ROUTING_TABLE)
    .select('form_label,to_emails,cc_emails,enabled')
    .eq('form_kind', formKind)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: `Unable to load form routing settings: ${error.message}`,
    };
  }

  return {
    ok: true,
    data: (data as RoutingRow | null) ?? null,
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return errorResponse(request, 405, 'Method not allowed.');
  }

  if (!isRequestOriginAllowed(request)) {
    return errorResponse(request, 403, 'Origin is not allowed.');
  }

  const clientIp = getRequestIpAddress(request);
  if (isRateLimited(clientIp, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS)) {
    return errorResponse(request, 429, 'Too many requests. Please try again shortly.');
  }

  let rawBody = '';
  let payload: ForwardRequestBody;
  try {
    rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).length > MAX_REQUEST_BYTES) {
      return errorResponse(request, 413, 'Request payload is too large.');
    }
    payload = JSON.parse(rawBody) as ForwardRequestBody;
  } catch {
    return errorResponse(request, 400, 'Invalid request payload.');
  }

  const formKind = parseFormKind(payload);
  if (!formKind) {
    return errorResponse(request, 400, 'form_kind must be one of: general, speaker, member, sponsor, job.');
  }

  const submission =
    payload.submission && typeof payload.submission === 'object' ? payload.submission : ({} as Record<string, unknown>);

  const routingResult = await fetchRoutingRule(formKind);
  if (!routingResult.ok) {
    return errorResponse(request, 500, routingResult.message);
  }

  const routing = routingResult.data;
  if (!routing || !routing.enabled) {
    return jsonResponse(request, 200, {
      ok: true,
      skipped: true,
      message: 'No active routing rule found for this form type.',
    });
  }

  const recipients = normalizeEmailList(routing.to_emails);
  const defaultCc = normalizeEmailList(toTrimmed(Deno.env.get('FORM_FORWARDER_DEFAULT_CC')));
  const ccRecipients = Array.from(new Set([...normalizeEmailList(routing.cc_emails), ...defaultCc]));

  if (recipients.length === 0) {
    return jsonResponse(request, 200, {
      ok: true,
      skipped: true,
      message: 'Routing rule does not have any valid To recipients.',
    });
  }

  const resendApiKey = toTrimmed(Deno.env.get('RESEND_API_KEY'));
  if (!resendApiKey) {
    return errorResponse(request, 500, 'RESEND_API_KEY is not configured.');
  }

  const fromEmail = toTrimmed(Deno.env.get('FORM_FORWARDER_FROM_EMAIL')) || 'DAWS Website <onboarding@resend.dev>';
  const timeoutMs = Number(Deno.env.get('FORM_FORWARDER_TIMEOUT_MS') ?? DEFAULT_TIMEOUT_MS);
  const entries = formatSubmissionEntries(submission);
  const formLabel = toTrimmed(routing.form_label) || formKind;
  const senderEmail = pickSenderEmail(submission);
  const subject = buildSubject(formLabel, submission);

  const requestPayload = {
    from: fromEmail,
    to: recipients,
    ...(ccRecipients.length > 0 ? { cc: ccRecipients } : {}),
    ...(senderEmail ? { reply_to: senderEmail } : {}),
    subject,
    html: buildHtmlBody(formLabel, entries),
    text: buildTextBody(formLabel, entries),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_TIMEOUT_MS
  );

  try {
    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    const resendText = await resendResponse.text();
    if (!resendResponse.ok) {
      return errorResponse(request, resendResponse.status, formatResendError(resendText));
    }

    let resendId = '';
    if (resendText) {
      try {
        const parsed = JSON.parse(resendText) as { id?: unknown };
        resendId = toTrimmed(typeof parsed.id === 'string' ? parsed.id : '');
      } catch {
        resendId = '';
      }
    }

    return jsonResponse(request, 200, {
      ok: true,
      message: 'Email forwarded successfully.',
      provider: 'resend',
      ...(resendId ? { id: resendId } : {}),
    });
  } catch (error) {
    const timeoutError = error instanceof DOMException && error.name === 'AbortError';
    return errorResponse(
      request,
      timeoutError ? 504 : 502,
      timeoutError ? 'Form forwarding request timed out.' : 'Unable to reach email provider.'
    );
  } finally {
    clearTimeout(timeoutId);
  }
});
