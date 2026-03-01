const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_REQUEST_BYTES = 8_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 15;

type SyncResponseStatus = 'synced' | 'already_subscribed' | 'failed';

interface SyncResponseBody {
  ok: boolean;
  status: SyncResponseStatus;
  message?: string;
}

interface SyncRequestBody {
  email?: string;
}

interface RateLimitBucket {
  count: number;
  windowStart: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

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
  return parseAllowedOrigins(toTrimmed(Deno.env.get('MAILCHIMP_ALLOWED_ORIGIN')));
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
  const allowedOrigin = resolveAllowedOrigin(request);
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  } as const;
}

function jsonResponse(request: Request, status: number, body: SyncResponseBody) {
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
  return jsonResponse(request, status, { ok: false, status: 'failed', message });
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
  let payload: SyncRequestBody;
  try {
    rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).length > MAX_REQUEST_BYTES) {
      return errorResponse(request, 413, 'Request payload is too large.');
    }
    payload = JSON.parse(rawBody) as SyncRequestBody;
  } catch {
    return errorResponse(request, 400, 'Invalid request payload.');
  }

  const email = toTrimmed(payload.email).toLowerCase();
  if (!email || !EMAIL_REGEX.test(email)) {
    return errorResponse(request, 400, 'A valid email address is required.');
  }

  const apiKey = toTrimmed(Deno.env.get('MAILCHIMP_API_KEY'));
  const audienceId = toTrimmed(Deno.env.get('MAILCHIMP_AUDIENCE_ID'));
  const dataCenter = getDataCenter(apiKey, Deno.env.get('MAILCHIMP_SERVER_PREFIX'));
  const tags = parseTags(Deno.env.get('MAILCHIMP_DEFAULT_TAGS'));
  const doubleOptIn = parseBoolean(Deno.env.get('MAILCHIMP_DOUBLE_OPT_IN'));
  const timeoutMs = Number(Deno.env.get('MAILCHIMP_TIMEOUT_MS') ?? DEFAULT_TIMEOUT_MS);

  if (!apiKey || !audienceId || !dataCenter) {
    return errorResponse(
      request,
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
      return jsonResponse(request, 200, { ok: true, status: 'synced' });
    }

    const isAlreadySubscribed =
      response.status === 400 &&
      (errorTitle === 'Member Exists' || /already a list member/i.test(errorDetail));

    if (isAlreadySubscribed) {
      return jsonResponse(request, 200, { ok: true, status: 'already_subscribed' });
    }

    return errorResponse(
      request,
      response.status,
      errorDetail || errorTitle || 'Mailchimp API request failed.'
    );
  } catch (error) {
    const timeoutError = error instanceof DOMException && error.name === 'AbortError';
    return errorResponse(
      request,
      timeoutError ? 504 : 502,
      timeoutError ? 'Mailchimp request timed out.' : 'Unable to reach Mailchimp API.'
    );
  } finally {
    clearTimeout(timeoutId);
  }
});
