import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EVENTBRITE_API_BASE = 'https://www.eventbriteapi.com/v3';
const DEFAULT_TIMEOUT_MS = 15_000;
const EVENTBRITE_PAGE_SIZE = 50;
const MAX_EVENTBRITE_PAGES = 20;

type Action = 'list' | 'create' | 'update';

interface SyncTalkPayload {
  title?: string;
  description?: string;
  speakerName?: string | null;
  speakerHeadline?: string | null;
}

interface SyncEventPayload {
  title?: string;
  description?: string;
  locationName?: string;
  timezone?: string;
  startAt?: string;
  endAt?: string;
  talks?: SyncTalkPayload[];
}

interface EventbriteFunctionPayload {
  action?: Action;
  organizationId?: string;
  eventbriteEventId?: string;
  event?: SyncEventPayload;
}

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

function resolveAllowedOrigin(request: Request) {
  const configuredOrigins = parseAllowedOrigins(toTrimmed(Deno.env.get('EVENTBRITE_ALLOWED_ORIGIN')));
  if (configuredOrigins.length === 0 || configuredOrigins.includes('*')) {
    return '*';
  }

  const requestOrigin = toTrimmed(request.headers.get('origin')).replace(/\/+$/, '');
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

function getBearerToken(request: Request) {
  const headerValue = toTrimmed(request.headers.get('Authorization'));
  if (!headerValue.toLowerCase().startsWith('bearer ')) {
    return '';
  }
  return toTrimmed(headerValue.slice(7));
}

async function requireAdmin(request: Request): Promise<{ ok: true } | { ok: false; response: Response }> {
  const token = getBearerToken(request);
  if (!token) {
    return { ok: false, response: errorResponse(request, 401, 'Missing auth token.') };
  }

  const supabaseUrl = toTrimmed(Deno.env.get('SUPABASE_URL'));
  const serviceRoleKey = toTrimmed(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  if (!supabaseUrl || !serviceRoleKey) {
    return {
      ok: false,
      response: errorResponse(request, 500, 'Supabase service role credentials are not configured.'),
    };
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const userResult = await client.auth.getUser(token);
  if (userResult.error || !userResult.data.user) {
    return { ok: false, response: errorResponse(request, 401, 'Invalid auth token.') };
  }

  const userEmail = toTrimmed(userResult.data.user.email).toLowerCase();
  if (!userEmail) {
    return { ok: false, response: errorResponse(request, 403, 'Admin access is not available for this account.') };
  }

  const adminLookup = await client
    .from('job_board_admins')
    .select('email')
    .eq('email', userEmail)
    .maybeSingle();

  if (adminLookup.error) {
    return {
      ok: false,
      response: errorResponse(request, 500, `Unable to verify admin access: ${adminLookup.error.message}`),
    };
  }

  if (!adminLookup.data) {
    return { ok: false, response: errorResponse(request, 403, 'Admin access is required for this action.') };
  }

  return { ok: true };
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function toUtcTimestamp(input: string) {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toISOString().replace('.000Z', 'Z');
}

function buildDescriptionHtml(payload: SyncEventPayload) {
  const eventDescription = toTrimmed(payload.description);
  const location = toTrimmed(payload.locationName);
  const talks = Array.isArray(payload.talks) ? payload.talks : [];

  const talkMarkup = talks
    .map((talk) => {
      const title = escapeHtml(toTrimmed(talk.title) || 'Talk');
      const description = escapeHtml(toTrimmed(talk.description));
      const speakerName = escapeHtml(toTrimmed(talk.speakerName ?? undefined));
      const speakerHeadline = escapeHtml(toTrimmed(talk.speakerHeadline ?? undefined));
      const speakerLine = speakerName
        ? `<p><strong>${speakerName}</strong>${speakerHeadline ? ` - ${speakerHeadline}` : ''}</p>`
        : '';

      return `
        <div>
          <h3>${title}</h3>
          ${speakerLine}
          ${description ? `<p>${description}</p>` : ''}
        </div>
      `;
    })
    .join('\n');

  return `
    ${eventDescription ? `<p>${escapeHtml(eventDescription)}</p>` : ''}
    ${location ? `<p><strong>Location:</strong> ${escapeHtml(location)}</p>` : ''}
    ${talkMarkup ? `<h2>Talk Lineup</h2>${talkMarkup}` : ''}
  `.trim();
}

function buildEventbriteFormPayload(payload: SyncEventPayload) {
  const title = toTrimmed(payload.title);
  const timezone = toTrimmed(payload.timezone) || 'Australia/Sydney';
  const startUtc = toUtcTimestamp(toTrimmed(payload.startAt));
  const endUtc = toUtcTimestamp(toTrimmed(payload.endAt));
  const descriptionHtml = buildDescriptionHtml(payload);

  if (!title || !startUtc || !endUtc) {
    return { ok: false, message: 'Event title, startAt, and endAt are required.' } as const;
  }

  const params = new URLSearchParams();
  params.set('event.name.html', title);
  params.set('event.description.html', descriptionHtml || title);
  params.set('event.start.utc', startUtc);
  params.set('event.start.timezone', timezone);
  params.set('event.end.utc', endUtc);
  params.set('event.end.timezone', timezone);
  params.set('event.currency', 'AUD');
  params.set('event.online_event', 'true');
  params.set('event.listed', 'true');

  return { ok: true, data: params } as const;
}

async function eventbriteRequest(
  token: string,
  endpoint: string,
  options: {
    method?: 'GET' | 'POST';
    body?: URLSearchParams;
  } = {}
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      body: options.body ? options.body.toString() : undefined,
      signal: controller.signal,
    });

    const responseText = await response.text();
    let json: Record<string, unknown> = {};
    if (responseText) {
      try {
        json = JSON.parse(responseText) as Record<string, unknown>;
      } catch {
        json = {};
      }
    }

    if (!response.ok) {
      const errorDescription =
        toTrimmed((json.error_description as string | undefined) ?? '') ||
        toTrimmed((json.error as string | undefined) ?? '') ||
        response.statusText;
      return {
        ok: false,
        status: response.status,
        message: `Eventbrite API error: ${errorDescription}`,
      } as const;
    }

    return { ok: true, data: json } as const;
  } catch (error) {
    const timeoutError = error instanceof DOMException && error.name === 'AbortError';
    return {
      ok: false,
      status: timeoutError ? 504 : 502,
      message: timeoutError ? 'Eventbrite request timed out.' : 'Unable to reach Eventbrite API.',
    } as const;
  } finally {
    clearTimeout(timeoutId);
  }
}

function toPositiveInteger(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.trunc(parsed);
    }
  }

  return null;
}

async function listOrganizationEvents(token: string, organizationId: string) {
  const allEvents: unknown[] = [];
  let page = 1;

  while (page <= MAX_EVENTBRITE_PAGES) {
    const params = new URLSearchParams({
      order_by: 'start_desc',
      expand: 'venue,ticket_classes',
      page: String(page),
      page_size: String(EVENTBRITE_PAGE_SIZE),
    });

    const listResult = await eventbriteRequest(
      token,
      `${EVENTBRITE_API_BASE}/organizations/${organizationId}/events/?${params.toString()}`
    );

    if (!listResult.ok) {
      return listResult;
    }

    const pageEvents = Array.isArray(listResult.data.events) ? listResult.data.events : [];
    allEvents.push(...pageEvents);

    const pagination =
      typeof listResult.data.pagination === 'object' && listResult.data.pagination !== null
        ? (listResult.data.pagination as Record<string, unknown>)
        : {};

    const hasMoreItems = Boolean(pagination.has_more_items);
    const pageNumber = toPositiveInteger(pagination.page_number) ?? page;
    const pageCount = toPositiveInteger(pagination.page_count) ?? pageNumber;

    if (!hasMoreItems || pageNumber >= pageCount) {
      return {
        ok: true,
        data: allEvents,
      } as const;
    }

    page += 1;
  }

  return {
    ok: false,
    status: 502,
    message: `Eventbrite returned more than ${MAX_EVENTBRITE_PAGES} pages of events.`,
  } as const;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return errorResponse(request, 405, 'Method not allowed.');
  }

  let payload: EventbriteFunctionPayload;
  try {
    payload = (await request.json()) as EventbriteFunctionPayload;
  } catch {
    return errorResponse(request, 400, 'Invalid request payload.');
  }

  const action = payload.action;
  if (!action || !['list', 'create', 'update'].includes(action)) {
    return errorResponse(request, 400, 'Action must be one of: list, create, update.');
  }

  const privateToken = toTrimmed(Deno.env.get('EVENTBRITE_PRIVATE_TOKEN'));
  const defaultOrganizationId = toTrimmed(Deno.env.get('EVENTBRITE_ORGANIZATION_ID'));
  const organizationId = toTrimmed(payload.organizationId) || defaultOrganizationId;

  if (!privateToken) {
    return errorResponse(request, 500, 'Eventbrite private token is not configured.');
  }

  if (action === 'list') {
    if (!organizationId) {
      return errorResponse(request, 400, 'Organization ID is required for list action.');
    }

    const listResult = await listOrganizationEvents(privateToken, organizationId);

    if (!listResult.ok) {
      return errorResponse(request, listResult.status, listResult.message);
    }

    const seenEventIds = new Set<string>();
    const events = (Array.isArray(listResult.data) ? listResult.data : []).filter((event) => {
      if (typeof event !== 'object' || event === null) {
        return false;
      }

      const eventId = toTrimmed((event as { id?: string }).id);
      if (!eventId || seenEventIds.has(eventId)) {
        return false;
      }

      seenEventIds.add(eventId);
      return true;
    });

    return jsonResponse(request, 200, { ok: true, events });
  }

  const adminGate = await requireAdmin(request);
  if (!adminGate.ok) {
    return adminGate.response;
  }

  if (!organizationId) {
    return errorResponse(request, 400, 'Organization ID is required for create/update actions.');
  }

  const eventPayload = payload.event;
  if (!eventPayload) {
    return errorResponse(request, 400, 'Event payload is required.');
  }

  const formPayloadResult = buildEventbriteFormPayload(eventPayload);
  if (!formPayloadResult.ok) {
    return errorResponse(request, 400, formPayloadResult.message);
  }

  const endpoint =
    action === 'create'
      ? `${EVENTBRITE_API_BASE}/organizations/${organizationId}/events/`
      : `${EVENTBRITE_API_BASE}/events/${encodeURIComponent(toTrimmed(payload.eventbriteEventId))}/`;

  if (action === 'update' && !toTrimmed(payload.eventbriteEventId)) {
    return errorResponse(request, 400, 'eventbriteEventId is required for update action.');
  }

  const syncResult = await eventbriteRequest(privateToken, endpoint, {
    method: 'POST',
    body: formPayloadResult.data,
  });

  if (!syncResult.ok) {
    return errorResponse(request, syncResult.status, syncResult.message);
  }

  const eventId = toTrimmed(syncResult.data.id as string | undefined);
  const eventUrl = toTrimmed(syncResult.data.url as string | undefined) || null;

  return jsonResponse(request, 200, {
    ok: true,
    event: {
      id: eventId || null,
      url: eventUrl,
    },
  });
});
