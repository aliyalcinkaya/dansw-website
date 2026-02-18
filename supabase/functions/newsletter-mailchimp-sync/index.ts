const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_TIMEOUT_MS = 12_000;

type SyncResponseStatus = 'synced' | 'already_subscribed' | 'failed';

interface SyncResponseBody {
  ok: boolean;
  status: SyncResponseStatus;
  message?: string;
}

interface SyncRequestBody {
  email?: string;
}

function toTrimmed(value: string | undefined | null) {
  return value?.trim() ?? '';
}

function parseBoolean(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return fallback;
}

function parseTags(input: string | undefined) {
  if (!input) return [] as string[];
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getDataCenter(apiKey: string, override: string | undefined) {
  const overrideValue = toTrimmed(override);
  if (overrideValue) return overrideValue;

  const suffix = apiKey.split('-').pop();
  return toTrimmed(suffix);
}

function getCorsHeaders() {
  const allowedOrigin = toTrimmed(Deno.env.get('MAILCHIMP_ALLOWED_ORIGIN')) || '*';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  } as const;
}

function jsonResponse(status: number, body: SyncResponseBody) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function errorResponse(status: number, message: string) {
  return jsonResponse(status, { ok: false, status: 'failed', message });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders() });
  }

  if (request.method !== 'POST') {
    return errorResponse(405, 'Method not allowed.');
  }

  let payload: SyncRequestBody;
  try {
    payload = (await request.json()) as SyncRequestBody;
  } catch {
    return errorResponse(400, 'Invalid request payload.');
  }

  const email = toTrimmed(payload.email).toLowerCase();
  if (!email || !EMAIL_REGEX.test(email)) {
    return errorResponse(400, 'A valid email address is required.');
  }

  const apiKey = toTrimmed(Deno.env.get('MAILCHIMP_API_KEY'));
  const audienceId = toTrimmed(Deno.env.get('MAILCHIMP_AUDIENCE_ID'));
  const dataCenter = getDataCenter(apiKey, Deno.env.get('MAILCHIMP_SERVER_PREFIX'));
  const tags = parseTags(Deno.env.get('MAILCHIMP_DEFAULT_TAGS'));
  const doubleOptIn = parseBoolean(Deno.env.get('MAILCHIMP_DOUBLE_OPT_IN'));
  const timeoutMs = Number(Deno.env.get('MAILCHIMP_TIMEOUT_MS') ?? DEFAULT_TIMEOUT_MS);

  if (!apiKey || !audienceId || !dataCenter) {
    return errorResponse(
      500,
      'Mailchimp sync is not configured. Set MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID. MAILCHIMP_SERVER_PREFIX is optional if your API key includes the data-center suffix (for example -us21).'
    );
  }

  const endpoint = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${encodeURIComponent(audienceId)}/members`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_TIMEOUT_MS);
  const status = doubleOptIn ? 'pending' : 'subscribed';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`supabase:${apiKey}`)}`,
      },
      body: JSON.stringify({
        email_address: email,
        status,
        ...(tags.length > 0 ? { tags } : {}),
      }),
      signal: controller.signal,
    });

    const responseText = await response.text();
    let errorTitle = '';
    let errorDetail = '';

    if (responseText) {
      try {
        const parsed = JSON.parse(responseText) as { title?: unknown; detail?: unknown };
        errorTitle = typeof parsed.title === 'string' ? parsed.title : '';
        errorDetail = typeof parsed.detail === 'string' ? parsed.detail : '';
      } catch {
        // Ignore parse failures and return generic fallback below.
      }
    }

    if (response.ok) {
      return jsonResponse(200, { ok: true, status: 'synced' });
    }

    const isAlreadySubscribed =
      response.status === 400 &&
      (errorTitle === 'Member Exists' || /already a list member/i.test(errorDetail));

    if (isAlreadySubscribed) {
      return jsonResponse(200, { ok: true, status: 'already_subscribed' });
    }

    return errorResponse(
      response.status,
      errorDetail || errorTitle || 'Mailchimp API request failed.'
    );
  } catch (error) {
    const timeoutError = error instanceof DOMException && error.name === 'AbortError';
    return errorResponse(
      timeoutError ? 504 : 502,
      timeoutError ? 'Mailchimp request timed out.' : 'Unable to reach Mailchimp API.'
    );
  } finally {
    clearTimeout(timeoutId);
  }
});
