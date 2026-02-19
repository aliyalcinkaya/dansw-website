import { getSupabaseClient } from './supabase';
import type {
  AdminEvent,
  AdminEventTalk,
  AdminEventTalkInput,
  AdminSpeaker,
  UpsertEventInput,
  UpsertSpeakerInput,
} from '../types/eventsAdmin';
import type { EventbriteEvent } from '../types/eventbrite';

const EVENTS_TABLE = 'community_events';
const TALKS_TABLE = 'event_talks';
const SPEAKERS_TABLE = 'speakers';
const EVENTBRITE_FUNCTION_NAME = import.meta.env.VITE_SUPABASE_EVENTBRITE_FUNCTION?.trim() || 'dynamic-worker';
const EVENTBRITE_ORGANIZATION_ID = import.meta.env.VITE_EVENTBRITE_ORGANIZATION_ID || '';
const SAMPLE_SPEAKERS: Array<{
  fullName: string;
  headline: string;
  bio: string;
  photoUrl: string;
  linkedinUrl: string;
  websiteUrl: string;
  isActive: boolean;
}> = [
  {
    fullName: 'Aisha Rahman',
    headline: 'Head of Analytics Engineering, FinNova',
    bio: 'Aisha leads analytics engineering teams and helps organizations build trusted semantic layers and modern ELT workflows.',
    photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    linkedinUrl: 'https://www.linkedin.com/in/aisha-rahman-analytics',
    websiteUrl: 'https://example.com/aisha-rahman',
    isActive: true,
  },
  {
    fullName: 'Liam Chen',
    headline: 'Principal Data Scientist, OrbitPay',
    bio: 'Liam focuses on experimentation, causal inference, and product decision systems for fast-moving consumer products.',
    photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    linkedinUrl: 'https://www.linkedin.com/in/liam-chen-data',
    websiteUrl: 'https://example.com/liam-chen',
    isActive: true,
  },
  {
    fullName: 'Priya Nair',
    headline: 'Director of Product Analytics, ScaleOS',
    bio: 'Priya has built analytics practices across APAC and specializes in product growth, retention strategy, and experimentation culture.',
    photoUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    linkedinUrl: 'https://www.linkedin.com/in/priya-nair-product-analytics',
    websiteUrl: 'https://example.com/priya-nair',
    isActive: true,
  },
  {
    fullName: 'Ethan Wallace',
    headline: 'Staff Data Engineer, CloudPulse',
    bio: 'Ethan designs event-driven data platforms and governance patterns for analytics teams at scale.',
    photoUrl: 'https://randomuser.me/api/portraits/men/71.jpg',
    linkedinUrl: 'https://www.linkedin.com/in/ethan-wallace-data',
    websiteUrl: 'https://example.com/ethan-wallace',
    isActive: true,
  },
  {
    fullName: 'Sofia Martinez',
    headline: 'Analytics Lead, BrightRetail',
    bio: 'Sofia helps retail and ecommerce teams translate customer behavior into actionable growth and lifecycle strategies.',
    photoUrl: 'https://randomuser.me/api/portraits/women/52.jpg',
    linkedinUrl: 'https://www.linkedin.com/in/sofia-martinez-analytics',
    websiteUrl: 'https://example.com/sofia-martinez',
    isActive: true,
  },
];

type ServiceResult<T> = {
  ok: boolean;
  data: T;
  message?: string;
};

interface SpeakerRow {
  id: string;
  full_name: string;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EventTalkRow {
  id: string;
  event_id: string;
  speaker_id: string | null;
  title: string;
  description: string | null;
  sort_order: number | null;
  speakers: SpeakerRow | SpeakerRow[] | null;
}

interface EventRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location_name: string | null;
  timezone: string | null;
  start_at: string;
  end_at: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  eventbrite_event_id: string | null;
  eventbrite_url: string | null;
  sync_status: 'not_synced' | 'synced' | 'sync_error';
  sync_error: string | null;
  last_synced_at: string | null;
  created_by_email: string | null;
  updated_by_email: string | null;
  created_at: string;
  updated_at: string;
  event_talks: EventTalkRow[] | null;
}

interface EventbriteSyncResponse {
  ok?: boolean;
  event?: {
    id?: string;
    url?: string;
  };
  events?: EventbriteEvent[];
  message?: string;
}

interface EventbriteSyncPayload {
  title: string;
  description: string;
  locationName: string;
  timezone: string;
  startAt: string;
  endAt: string;
  talks: Array<{
    title: string;
    description: string;
    speakerName: string | null;
    speakerHeadline: string | null;
  }>;
}

type EventbriteImportSummary = {
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  totalEventbriteCount: number;
};

export interface EventbriteAttendanceSummary {
  attendees: number | null;
  capacity: number | null;
}

function toTrimmed(value: string | undefined | null) {
  return value?.trim() ?? '';
}

function toNumberOrNull(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function isVisibleTicketClass(ticketClass: NonNullable<EventbriteEvent['ticket_classes']>[number]) {
  return !ticketClass.hidden && !ticketClass.donation;
}

function toEventbriteAttendanceSummary(event: EventbriteEvent): EventbriteAttendanceSummary {
  const ticketClasses = Array.isArray(event.ticket_classes) ? event.ticket_classes : [];
  const visibleTicketClasses = ticketClasses.filter(isVisibleTicketClass);
  const hasVisibleTickets = visibleTicketClasses.length > 0;

  const attendees = hasVisibleTickets
    ? visibleTicketClasses.reduce((sum, ticketClass) => {
        return sum + (toNumberOrNull(ticketClass.quantity_sold) ?? 0);
      }, 0)
    : null;

  const capacityFromEvent = toNumberOrNull(event.capacity);
  const capacityFromTicketClasses = visibleTicketClasses.reduce((sum, ticketClass) => {
    return sum + (toNumberOrNull(ticketClass.quantity_total) ?? 0);
  }, 0);

  const capacity =
    (capacityFromEvent !== null && capacityFromEvent > 0 ? capacityFromEvent : null) ??
    (capacityFromTicketClasses > 0 ? capacityFromTicketClasses : null);

  return {
    attendees,
    capacity,
  };
}

function formatServiceError(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      if (message.toLowerCase().includes('stack depth limit exceeded')) {
        return 'Database policy recursion detected. Run supabase/admin_rls_fix.sql in Supabase SQL Editor, then refresh.';
      }
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    if (error.message.toLowerCase().includes('stack depth limit exceeded')) {
      return 'Database policy recursion detected. Run supabase/admin_rls_fix.sql in Supabase SQL Editor, then refresh.';
    }
    return error.message;
  }

  return fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function buildEventSlug(title: string, startAt: string) {
  const titleSlug = slugify(title) || 'event';
  const dateSlug = new Date(startAt).toISOString().slice(0, 10);
  return `${titleSlug}-${dateSlug}`;
}

function toIsoTimestamp(value: string | undefined | null) {
  const parsed = new Date(toTrimmed(value));
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString();
}

function resolveImportedEndAt(startAtIso: string, rawEndAt: string) {
  const startAt = new Date(startAtIso);
  const endAt = new Date(rawEndAt);

  if (!Number.isNaN(endAt.getTime()) && endAt.getTime() > startAt.getTime()) {
    return endAt.toISOString();
  }

  return new Date(startAt.getTime() + 60 * 60 * 1000).toISOString();
}

function resolveImportedEventStatus(event: EventbriteEvent, startAtIso: string): AdminEvent['status'] {
  if (event.status === 'canceled') {
    return 'archived';
  }

  if (event.status === 'draft') {
    return 'draft';
  }

  return new Date(startAtIso).getTime() > Date.now() ? 'scheduled' : 'published';
}

function resolveImportedLocation(event: EventbriteEvent) {
  const venueAddress = toTrimmed(event.venue?.address?.localized_address_display);
  const venueName = toTrimmed(event.venue?.name);
  return venueAddress || venueName || 'Sydney';
}

function buildImportedEventSlug(event: EventbriteEvent, startAtIso: string) {
  const baseSlug = buildEventSlug(toTrimmed(event.name?.text) || 'event', startAtIso);
  const eventbriteIdSlug = slugify(toTrimmed(event.id)).slice(0, 20) || 'eventbrite';
  return `${baseSlug}-${eventbriteIdSlug}`;
}

function mapSpeakerRow(row: SpeakerRow): AdminSpeaker {
  return {
    id: row.id,
    fullName: row.full_name,
    headline: row.headline ?? '',
    bio: row.bio ?? '',
    photoUrl: row.photo_url,
    linkedinUrl: row.linkedin_url,
    websiteUrl: row.website_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTalkRow(row: EventTalkRow): AdminEventTalk {
  const speakerRow = Array.isArray(row.speakers) ? row.speakers[0] ?? null : row.speakers ?? null;
  return {
    id: row.id,
    eventId: row.event_id,
    speakerId: row.speaker_id,
    title: row.title,
    description: row.description ?? '',
    sortOrder: row.sort_order ?? 0,
    speaker: speakerRow ? mapSpeakerRow(speakerRow) : null,
  };
}

function mapEventRow(row: EventRow): AdminEvent {
  const talks = (row.event_talks ?? []).map(mapTalkRow).sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? '',
    locationName: row.location_name ?? 'Sydney',
    timezone: row.timezone ?? 'Australia/Sydney',
    startAt: row.start_at,
    endAt: row.end_at,
    status: row.status,
    eventbriteEventId: row.eventbrite_event_id,
    eventbriteUrl: row.eventbrite_url,
    syncStatus: row.sync_status,
    syncError: row.sync_error,
    lastSyncedAt: row.last_synced_at,
    createdByEmail: row.created_by_email,
    updatedByEmail: row.updated_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    talks,
  };
}

async function getCurrentUserEmail(client: NonNullable<ReturnType<typeof getSupabaseClient>>) {
  const { data } = await client.auth.getUser();
  return toTrimmed(data.user?.email).toLowerCase() || null;
}

function normalizeTalks(talks: AdminEventTalkInput[]) {
  return talks
    .map((talk, index) => ({
      title: toTrimmed(talk.title),
      description: toTrimmed(talk.description),
      speakerId: toTrimmed(talk.speakerId) || null,
      sortOrder: Number.isFinite(talk.sortOrder) ? talk.sortOrder : index + 1,
    }))
    .filter((talk) => talk.title.length > 0);
}

async function fetchAdminEventById(
  client: NonNullable<ReturnType<typeof getSupabaseClient>>,
  eventId: string
): Promise<ServiceResult<AdminEvent | null>> {
  const { data, error } = await client
    .from(EVENTS_TABLE)
    .select(
      `
      id,
      slug,
      title,
      description,
      location_name,
      timezone,
      start_at,
      end_at,
      status,
      eventbrite_event_id,
      eventbrite_url,
      sync_status,
      sync_error,
      last_synced_at,
      created_by_email,
      updated_by_email,
      created_at,
      updated_at,
      event_talks (
        id,
        event_id,
        speaker_id,
        title,
        description,
        sort_order,
        speakers (
          id,
          full_name,
          headline,
          bio,
          photo_url,
          linkedin_url,
          website_url,
          is_active,
          created_at,
          updated_at
        )
      )
    `
    )
    .eq('id', eventId)
    .single();

  if (error) {
    return {
      ok: false,
      data: null,
      message: formatServiceError(error, 'Unable to load event details.'),
    };
  }

  return {
    ok: true,
    data: mapEventRow(data as EventRow),
  };
}

async function invokeEventbriteFunction(
  client: NonNullable<ReturnType<typeof getSupabaseClient>>,
  payload: Record<string, unknown>
) {
  const functionUrlOverride = import.meta.env.VITE_SUPABASE_EVENTBRITE_FUNCTION_URL?.trim();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!anonKey) {
    return {
      ok: false,
      data: null,
      message: 'Supabase anon key is required to call the Eventbrite sync function.',
    } as const;
  }

  const { data: sessionData } = await client.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    return {
      ok: false,
      data: null,
      message: 'Admin sign-in is required to sync Eventbrite events.',
    } as const;
  }

  const endpoint = functionUrlOverride || (supabaseUrl ? `${supabaseUrl}/functions/v1/${EVENTBRITE_FUNCTION_NAME}` : '');
  if (!endpoint) {
    return {
      ok: false,
      data: null,
      message: 'Supabase URL is required unless VITE_SUPABASE_EVENTBRITE_FUNCTION_URL is set.',
    } as const;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let parsed: EventbriteSyncResponse = {};

    if (responseText) {
      try {
        parsed = JSON.parse(responseText) as EventbriteSyncResponse;
      } catch {
        parsed = {};
      }
    }

    if (!response.ok || parsed.ok === false) {
      return {
        ok: false,
        data: null,
        message:
          parsed.message?.trim() ||
          `Eventbrite function failed with ${response.status} ${response.statusText}.`,
      } as const;
    }

    return {
      ok: true,
      data: parsed,
    } as const;
  } catch (error) {
    return {
      ok: false,
      data: null,
      message: formatServiceError(error, 'Unable to reach Eventbrite sync function.'),
    } as const;
  }
}

function buildEventbritePayload(event: AdminEvent): EventbriteSyncPayload {
  return {
    title: event.title,
    description: event.description,
    locationName: event.locationName,
    timezone: event.timezone || 'Australia/Sydney',
    startAt: event.startAt,
    endAt: event.endAt,
    talks: event.talks.map((talk) => ({
      title: talk.title,
      description: talk.description,
      speakerName: talk.speaker?.fullName ?? null,
      speakerHeadline: talk.speaker?.headline ?? null,
    })),
  };
}

export async function fetchAdminSpeakers(): Promise<ServiceResult<AdminSpeaker[]>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: [],
      message: 'Supabase backend is not configured.',
    };
  }

  try {
    const { data, error } = await client.from(SPEAKERS_TABLE).select('*').order('full_name', { ascending: true });
    if (error) {
      return {
        ok: false,
        data: [],
        message: formatServiceError(error, 'Unable to load speakers.'),
      };
    }

    return {
      ok: true,
      data: (data ?? []).map((row) => mapSpeakerRow(row as SpeakerRow)),
    };
  } catch (error) {
    return {
      ok: false,
      data: [],
      message: formatServiceError(error, 'Unable to load speakers.'),
    };
  }
}

export async function fetchAdminEventWorkspace(): Promise<
  ServiceResult<{ speakers: AdminSpeaker[]; events: AdminEvent[] }>
> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: { speakers: [], events: [] },
      message: 'Supabase backend is not configured.',
    };
  }

  try {
    const [speakersResult, eventsResult] = await Promise.all([
      client.from(SPEAKERS_TABLE).select('*').order('full_name', { ascending: true }),
      client
        .from(EVENTS_TABLE)
        .select(
          `
          id,
          slug,
          title,
          description,
          location_name,
          timezone,
          start_at,
          end_at,
          status,
          eventbrite_event_id,
          eventbrite_url,
          sync_status,
          sync_error,
          last_synced_at,
          created_by_email,
          updated_by_email,
          created_at,
          updated_at,
          event_talks (
            id,
            event_id,
            speaker_id,
            title,
            description,
            sort_order,
            speakers (
              id,
              full_name,
              headline,
              bio,
              photo_url,
              linkedin_url,
              website_url,
              is_active,
              created_at,
              updated_at
            )
          )
        `
        )
        .order('start_at', { ascending: false }),
    ]);

    if (speakersResult.error) {
      return {
        ok: false,
        data: { speakers: [], events: [] },
        message: formatServiceError(speakersResult.error, 'Unable to load speakers.'),
      };
    }

    if (eventsResult.error) {
      return {
        ok: false,
        data: { speakers: [], events: [] },
        message: formatServiceError(eventsResult.error, 'Unable to load events.'),
      };
    }

    const speakers = (speakersResult.data ?? []).map((row) => mapSpeakerRow(row as SpeakerRow));
    const events = (eventsResult.data ?? []).map((row) => mapEventRow(row as EventRow));

    return {
      ok: true,
      data: { speakers, events },
    };
  } catch (error) {
    return {
      ok: false,
      data: { speakers: [], events: [] },
      message: formatServiceError(error, 'Unable to load events workspace.'),
    };
  }
}

export async function upsertSpeaker(input: UpsertSpeakerInput): Promise<ServiceResult<AdminSpeaker | null>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: null,
      message: 'Supabase backend is not configured.',
    };
  }

  const fullName = toTrimmed(input.fullName);
  if (fullName.length < 2) {
    return {
      ok: false,
      data: null,
      message: 'Speaker name must be at least 2 characters.',
    };
  }

  const payload = {
    full_name: fullName,
    headline: toTrimmed(input.headline) || null,
    bio: toTrimmed(input.bio) || null,
    photo_url: toTrimmed(input.photoUrl) || null,
    linkedin_url: toTrimmed(input.linkedinUrl) || null,
    website_url: toTrimmed(input.websiteUrl) || null,
    is_active: input.isActive ?? true,
  };

  try {
    const query = input.id
      ? client.from(SPEAKERS_TABLE).update(payload).eq('id', input.id)
      : client.from(SPEAKERS_TABLE).insert(payload);

    const { data, error } = await query.select('*').single();
    if (error) {
      return {
        ok: false,
        data: null,
        message: formatServiceError(error, 'Unable to save speaker profile.'),
      };
    }

    return {
      ok: true,
      data: mapSpeakerRow(data as SpeakerRow),
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      message: formatServiceError(error, 'Unable to save speaker profile.'),
    };
  }
}

export async function seedSampleSpeakers(): Promise<
  ServiceResult<{ inserted: number; updated: number; failed: number }>
> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: { inserted: 0, updated: 0, failed: 0 },
      message: 'Supabase backend is not configured.',
    };
  }

  const editorEmail = await getCurrentUserEmail(client);
  if (!editorEmail) {
    return {
      ok: false,
      data: { inserted: 0, updated: 0, failed: 0 },
      message: 'Admin sign-in is required to seed sample speakers.',
    };
  }

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const sampleSpeaker of SAMPLE_SPEAKERS) {
    const { data: existingRows, error: lookupError } = await client
      .from(SPEAKERS_TABLE)
      .select('id')
      .eq('full_name', sampleSpeaker.fullName)
      .limit(1);

    if (lookupError) {
      failed += 1;
      continue;
    }

    const existingId = (existingRows?.[0] as { id: string } | undefined)?.id;
    const payload = {
      full_name: sampleSpeaker.fullName,
      headline: sampleSpeaker.headline,
      bio: sampleSpeaker.bio,
      photo_url: sampleSpeaker.photoUrl,
      linkedin_url: sampleSpeaker.linkedinUrl,
      website_url: sampleSpeaker.websiteUrl,
      is_active: sampleSpeaker.isActive,
    };

    if (existingId) {
      const { error: updateError } = await client
        .from(SPEAKERS_TABLE)
        .update(payload)
        .eq('id', existingId);

      if (updateError) {
        failed += 1;
        continue;
      }

      updated += 1;
      continue;
    }

    const { error: insertError } = await client.from(SPEAKERS_TABLE).insert(payload);
    if (insertError) {
      failed += 1;
      continue;
    }

    inserted += 1;
  }

  return {
    ok: failed === 0,
    data: { inserted, updated, failed },
    message: `Sample speakers seeded. Inserted ${inserted}, updated ${updated}, failed ${failed}.`,
  };
}

export async function upsertEvent(input: UpsertEventInput): Promise<ServiceResult<AdminEvent | null>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: null,
      message: 'Supabase backend is not configured.',
    };
  }

  const title = toTrimmed(input.title);
  const locationName = toTrimmed(input.locationName);
  const description = toTrimmed(input.description);
  const timezone = toTrimmed(input.timezone) || 'Australia/Sydney';
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);

  if (title.length < 4) {
    return { ok: false, data: null, message: 'Event title must be at least 4 characters.' };
  }

  if (!locationName) {
    return { ok: false, data: null, message: 'Event location is required.' };
  }

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return { ok: false, data: null, message: 'Start and end date/time are required.' };
  }

  if (endAt.getTime() <= startAt.getTime()) {
    return { ok: false, data: null, message: 'Event end time must be after start time.' };
  }

  const normalizedTalks = normalizeTalks(input.talks);
  if (normalizedTalks.length === 0) {
    return { ok: false, data: null, message: 'Add at least one talk before saving.' };
  }

  const editorEmail = await getCurrentUserEmail(client);

  try {
    const eventPayload = {
      slug: input.id ? undefined : buildEventSlug(title, startAt.toISOString()),
      title,
      description: description || '',
      location_name: locationName,
      timezone,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      status: input.status,
      sync_status: 'not_synced' as const,
      sync_error: null,
      updated_by_email: editorEmail,
      created_by_email: input.id ? undefined : editorEmail,
    };

    const eventQuery = input.id
      ? client.from(EVENTS_TABLE).update(eventPayload).eq('id', input.id)
      : client.from(EVENTS_TABLE).insert(eventPayload);

    const { data: savedEventData, error: saveEventError } = await eventQuery.select('id').single();
    if (saveEventError) {
      return {
        ok: false,
        data: null,
        message: formatServiceError(saveEventError, 'Unable to save event details.'),
      };
    }

    const eventId = (savedEventData as { id: string }).id;

    const { error: deleteTalksError } = await client.from(TALKS_TABLE).delete().eq('event_id', eventId);
    if (deleteTalksError) {
      return {
        ok: false,
        data: null,
        message: formatServiceError(deleteTalksError, 'Unable to update event talks.'),
      };
    }

    const talksPayload = normalizedTalks.map((talk, index) => ({
      event_id: eventId,
      speaker_id: talk.speakerId,
      title: talk.title,
      description: talk.description,
      sort_order: index + 1,
    }));

    const { error: insertTalksError } = await client.from(TALKS_TABLE).insert(talksPayload);
    if (insertTalksError) {
      return {
        ok: false,
        data: null,
        message: formatServiceError(insertTalksError, 'Unable to save talk lineup.'),
      };
    }

    return fetchAdminEventById(client, eventId);
  } catch (error) {
    return {
      ok: false,
      data: null,
      message: formatServiceError(error, 'Unable to save event details.'),
    };
  }
}

export async function deleteEvent(eventId: string): Promise<ServiceResult<null>> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, data: null, message: 'Supabase backend is not configured.' };
  }

  const trimmedEventId = toTrimmed(eventId);
  if (!trimmedEventId) {
    return { ok: false, data: null, message: 'Event ID is required.' };
  }

  try {
    const { error } = await client.from(EVENTS_TABLE).delete().eq('id', trimmedEventId);
    if (error) {
      return {
        ok: false,
        data: null,
        message: formatServiceError(error, 'Unable to delete event.'),
      };
    }

    return { ok: true, data: null };
  } catch (error) {
    return {
      ok: false,
      data: null,
      message: formatServiceError(error, 'Unable to delete event.'),
    };
  }
}

export async function importEventbriteEventsToBackend(): Promise<ServiceResult<EventbriteImportSummary>> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: {
        importedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        totalEventbriteCount: 0,
      },
      message: 'Supabase backend is not configured.',
    };
  }

  const editorEmail = await getCurrentUserEmail(client);
  if (!editorEmail) {
    return {
      ok: false,
      data: {
        importedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        totalEventbriteCount: 0,
      },
      message: 'Admin sign-in is required to import Eventbrite events.',
    };
  }

  const listResult = await invokeEventbriteFunction(client, {
    action: 'list',
    organizationId: EVENTBRITE_ORGANIZATION_ID || undefined,
  });

  if (!listResult.ok || !listResult.data) {
    return {
      ok: false,
      data: {
        importedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        totalEventbriteCount: 0,
      },
      message: listResult.message ?? 'Unable to load events from Eventbrite.',
    };
  }

  const rawEvents = Array.isArray(listResult.data.events) ? listResult.data.events : [];
  if (rawEvents.length === 0) {
    return {
      ok: true,
      data: {
        importedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        totalEventbriteCount: 0,
      },
      message: 'No Eventbrite events found to import.',
    };
  }

  const uniqueEvents: EventbriteEvent[] = [];
  const seenEventbriteIds = new Set<string>();
  let skippedCount = 0;

  rawEvents.forEach((event) => {
    const eventbriteEventId = toTrimmed(event.id);
    if (!eventbriteEventId || seenEventbriteIds.has(eventbriteEventId)) {
      skippedCount += 1;
      return;
    }

    seenEventbriteIds.add(eventbriteEventId);
    uniqueEvents.push(event);
  });

  const eventbriteIds = uniqueEvents.map((event) => toTrimmed(event.id)).filter((value) => value.length > 0);

  if (eventbriteIds.length === 0) {
    return {
      ok: true,
      data: {
        importedCount: 0,
        updatedCount: 0,
        skippedCount: rawEvents.length,
        totalEventbriteCount: rawEvents.length,
      },
      message: 'No valid Eventbrite event IDs were returned for import.',
    };
  }

  const { data: existingRows, error: existingRowsError } = await client
    .from(EVENTS_TABLE)
    .select('eventbrite_event_id, slug, status, created_by_email')
    .in('eventbrite_event_id', eventbriteIds);

  if (existingRowsError) {
    return {
      ok: false,
      data: {
        importedCount: 0,
        updatedCount: 0,
        skippedCount,
        totalEventbriteCount: rawEvents.length,
      },
      message: formatServiceError(existingRowsError, 'Unable to load existing imported events.'),
    };
  }

  type ExistingImportRow = Pick<EventRow, 'eventbrite_event_id' | 'slug' | 'status' | 'created_by_email'>;

  const existingByEventbriteId = new Map<string, ExistingImportRow>();
  (existingRows ?? []).forEach((row) => {
    const typedRow = row as ExistingImportRow;
    const eventbriteEventId = toTrimmed(typedRow.eventbrite_event_id);
    if (eventbriteEventId) {
      existingByEventbriteId.set(eventbriteEventId, typedRow);
    }
  });

  const importedAt = new Date().toISOString();
  let importedCount = 0;
  let updatedCount = 0;

  const upsertPayload: Array<{
    slug: string;
    title: string;
    description: string;
    location_name: string;
    timezone: string;
    start_at: string;
    end_at: string;
    status: EventRow['status'];
    eventbrite_event_id: string;
    eventbrite_url: string | null;
    sync_status: EventRow['sync_status'];
    sync_error: string | null;
    last_synced_at: string;
    created_by_email: string | null;
    updated_by_email: string | null;
  }> = [];

  uniqueEvents.forEach((event) => {
    const eventbriteEventId = toTrimmed(event.id);
    if (!eventbriteEventId) {
      skippedCount += 1;
      return;
    }

    const title = toTrimmed(event.name?.text);
    const startAt = toIsoTimestamp(event.start?.utc || event.start?.local);
    if (!title || !startAt) {
      skippedCount += 1;
      return;
    }

    const rawEndAt = toIsoTimestamp(event.end?.utc || event.end?.local);
    const endAt = resolveImportedEndAt(startAt, rawEndAt);
    const existingRow = existingByEventbriteId.get(eventbriteEventId);

    upsertPayload.push({
      slug: existingRow?.slug ?? buildImportedEventSlug(event, startAt),
      title,
      description: toTrimmed(event.description?.text),
      location_name: resolveImportedLocation(event),
      timezone: toTrimmed(event.start?.timezone) || toTrimmed(event.end?.timezone) || 'Australia/Sydney',
      start_at: startAt,
      end_at: endAt,
      status: existingRow?.status ?? resolveImportedEventStatus(event, startAt),
      eventbrite_event_id: eventbriteEventId,
      eventbrite_url: toTrimmed(event.url) || null,
      sync_status: 'synced',
      sync_error: null,
      last_synced_at: importedAt,
      created_by_email: existingRow?.created_by_email ?? editorEmail,
      updated_by_email: editorEmail,
    });

    if (existingRow) {
      updatedCount += 1;
      return;
    }

    importedCount += 1;
  });

  if (upsertPayload.length === 0) {
    return {
      ok: true,
      data: {
        importedCount,
        updatedCount,
        skippedCount,
        totalEventbriteCount: rawEvents.length,
      },
      message: 'No valid Eventbrite events were available to import.',
    };
  }

  const { error: upsertError } = await client.from(EVENTS_TABLE).upsert(upsertPayload, {
    onConflict: 'eventbrite_event_id',
  });

  if (upsertError) {
    return {
      ok: false,
      data: {
        importedCount: 0,
        updatedCount: 0,
        skippedCount,
        totalEventbriteCount: rawEvents.length,
      },
      message: formatServiceError(upsertError, 'Unable to import Eventbrite events into backend storage.'),
    };
  }

  return {
    ok: true,
    data: {
      importedCount,
      updatedCount,
      skippedCount,
      totalEventbriteCount: rawEvents.length,
    },
    message: `Imported ${importedCount} new events and updated ${updatedCount} existing events from Eventbrite.`,
  };
}

export async function fetchEventbriteAttendanceByEventId(): Promise<
  ServiceResult<Record<string, EventbriteAttendanceSummary>>
> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      data: {},
      message: 'Supabase backend is not configured.',
    };
  }

  const listResult = await invokeEventbriteFunction(client, {
    action: 'list',
    organizationId: EVENTBRITE_ORGANIZATION_ID || undefined,
  });

  if (!listResult.ok || !listResult.data) {
    return {
      ok: false,
      data: {},
      message: listResult.message ?? 'Unable to load Eventbrite attendance data.',
    };
  }

  const rawEvents = Array.isArray(listResult.data.events) ? listResult.data.events : [];
  const attendanceByEventId: Record<string, EventbriteAttendanceSummary> = {};

  rawEvents.forEach((event) => {
    const eventId = toTrimmed(event.id);
    if (!eventId) {
      return;
    }

    attendanceByEventId[eventId] = toEventbriteAttendanceSummary(event);
  });

  return {
    ok: true,
    data: attendanceByEventId,
  };
}

export async function createEventInEventbrite(eventId: string): Promise<ServiceResult<AdminEvent | null>> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, data: null, message: 'Supabase backend is not configured.' };
  }

  const eventResult = await fetchAdminEventById(client, eventId);
  if (!eventResult.ok || !eventResult.data) {
    return eventResult;
  }

  const event = eventResult.data;
  if (event.eventbriteEventId) {
    return {
      ok: false,
      data: event,
      message: 'This event is already linked to Eventbrite. Use Sync instead.',
    };
  }

  const syncPayload = buildEventbritePayload(event);
  const syncResult = await invokeEventbriteFunction(client, {
    action: 'create',
    organizationId: EVENTBRITE_ORGANIZATION_ID || undefined,
    event: syncPayload,
  });

  if (!syncResult.ok || !syncResult.data) {
    await client
      .from(EVENTS_TABLE)
      .update({ sync_status: 'sync_error', sync_error: syncResult.message ?? 'Unknown sync error.' })
      .eq('id', eventId);

    return {
      ok: false,
      data: event,
      message: syncResult.message ?? 'Unable to create event in Eventbrite.',
    };
  }

  const eventbriteEventId = toTrimmed(syncResult.data.event?.id);
  const eventbriteUrl = toTrimmed(syncResult.data.event?.url) || null;
  if (!eventbriteEventId) {
    return {
      ok: false,
      data: event,
      message: 'Eventbrite did not return an event ID.',
    };
  }

  const { error: updateError } = await client
    .from(EVENTS_TABLE)
    .update({
      eventbrite_event_id: eventbriteEventId,
      eventbrite_url: eventbriteUrl,
      sync_status: 'synced',
      sync_error: null,
      last_synced_at: new Date().toISOString(),
    })
    .eq('id', eventId);

  if (updateError) {
    return {
      ok: false,
      data: event,
      message: formatServiceError(updateError, 'Event created in Eventbrite but local sync state failed to update.'),
    };
  }

  return fetchAdminEventById(client, eventId);
}

export async function syncEventToEventbrite(eventId: string): Promise<ServiceResult<AdminEvent | null>> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, data: null, message: 'Supabase backend is not configured.' };
  }

  const eventResult = await fetchAdminEventById(client, eventId);
  if (!eventResult.ok || !eventResult.data) {
    return eventResult;
  }

  const event = eventResult.data;
  if (!event.eventbriteEventId) {
    return {
      ok: false,
      data: event,
      message: 'Create this event in Eventbrite first, then sync updates.',
    };
  }

  const syncPayload = buildEventbritePayload(event);
  const syncResult = await invokeEventbriteFunction(client, {
    action: 'update',
    organizationId: EVENTBRITE_ORGANIZATION_ID || undefined,
    eventbriteEventId: event.eventbriteEventId,
    event: syncPayload,
  });

  if (!syncResult.ok || !syncResult.data) {
    await client
      .from(EVENTS_TABLE)
      .update({ sync_status: 'sync_error', sync_error: syncResult.message ?? 'Unknown sync error.' })
      .eq('id', eventId);

    return {
      ok: false,
      data: event,
      message: syncResult.message ?? 'Unable to sync event changes to Eventbrite.',
    };
  }

  const eventbriteUrl = toTrimmed(syncResult.data.event?.url) || event.eventbriteUrl;

  const { error: updateError } = await client
    .from(EVENTS_TABLE)
    .update({
      eventbrite_url: eventbriteUrl,
      sync_status: 'synced',
      sync_error: null,
      last_synced_at: new Date().toISOString(),
    })
    .eq('id', eventId);

  if (updateError) {
    return {
      ok: false,
      data: event,
      message: formatServiceError(updateError, 'Event sync succeeded but local sync state failed to update.'),
    };
  }

  return fetchAdminEventById(client, eventId);
}
