import type { DisplayEvent, DisplaySpeaker, DisplayTalk, EventbriteEvent } from '../types/eventbrite';
import { getSupabaseClient } from './supabase';

const EVENTBRITE_FUNCTION_NAME = import.meta.env.VITE_SUPABASE_EVENTBRITE_FUNCTION?.trim() || 'dynamic-worker';
const ORGANIZATION_ID = import.meta.env.VITE_EVENTBRITE_ORGANIZATION_ID?.trim() || '';
const ENABLE_EVENTBRITE_LIVE_REFRESH = import.meta.env.VITE_ENABLE_EVENTBRITE_LIVE_REFRESH === 'true';
const COMMUNITY_EVENTS_TABLE = 'community_events';
const EVENTS_CACHE_KEY = 'daws_events_cache_v3';
const EVENTS_CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

interface CachedEventsPayload {
  cachedAt: number;
  events: DisplayEvent[];
}

interface EventbriteFunctionResponse {
  ok?: boolean;
  events?: EventbriteEvent[];
  message?: string;
}

interface CommunityEventRow {
  id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  timezone: string | null;
  start_at: string;
  end_at: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  eventbrite_event_id: string | null;
  eventbrite_url: string | null;
  event_talks: CommunityEventTalkRow[] | null;
}

interface CommunityEventTalkRow {
  id: string;
  title: string;
  description: string | null;
  sort_order: number | null;
  speaker_id: string | null;
  speakers: CommunitySpeakerRow | CommunitySpeakerRow[] | null;
}

interface CommunitySpeakerRow {
  id: string;
  full_name: string;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
}

let eventsMemoryCache: CachedEventsPayload | null = null;
let eventsRequestPromise: Promise<DisplayEvent[]> | null = null;

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isCacheFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < EVENTS_CACHE_TTL_MS;
}

function sortByStartDesc(events: DisplayEvent[]): DisplayEvent[] {
  return [...events].sort((a, b) => new Date(b.startLocal).getTime() - new Date(a.startLocal).getTime());
}

function sortByStartAsc(events: DisplayEvent[]): DisplayEvent[] {
  return [...events].sort((a, b) => new Date(a.startLocal).getTime() - new Date(b.startLocal).getTime());
}

function readEventsFromStorage(): CachedEventsPayload | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(EVENTS_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedEventsPayload;
    if (!parsed || !Array.isArray(parsed.events) || typeof parsed.cachedAt !== 'number') {
      return null;
    }

    if (!isCacheFresh(parsed.cachedAt)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeEventsToStorage(payload: CachedEventsPayload): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}

function formatEventDate(dateString: string): { formatted: string; dayOfMonth: string; month: string; year: string } {
  const date = new Date(dateString);

  const dayOfMonth = date.getDate().toString();
  const month = date.toLocaleDateString('en-AU', { month: 'short' }).toUpperCase();
  const year = date.getFullYear().toString();

  const formatted = date.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return { formatted, dayOfMonth, month, year };
}

function formatEventTime(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startTime = start.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const endTime = end.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${startTime} - ${endTime}`;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function isVisibleTicketClass(ticketClass: {
  hidden?: boolean;
  donation?: boolean;
  quantity_total?: number | null;
}) {
  return !ticketClass.hidden && !ticketClass.donation && toNumberOrNull(ticketClass.quantity_total) !== null;
}

function calculateRegistrationStats(event: EventbriteEvent): {
  registrationCount: number | null;
  seatCapacity: number | null;
  seatsRemaining: number | null;
} {
  const seatCapacityFromEvent = toNumberOrNull(event.capacity);
  const ticketClasses = Array.isArray(event.ticket_classes) ? event.ticket_classes : [];
  const visibleTicketClasses = ticketClasses.filter(isVisibleTicketClass);

  const soldFromTicketClasses = visibleTicketClasses.reduce((sum, ticketClass) => {
    return sum + (toNumberOrNull(ticketClass.quantity_sold) ?? 0);
  }, 0);

  const totalFromTicketClasses = visibleTicketClasses.reduce((sum, ticketClass) => {
    return sum + (toNumberOrNull(ticketClass.quantity_total) ?? 0);
  }, 0);

  const registrationCount = visibleTicketClasses.length > 0 ? soldFromTicketClasses : null;
  const seatCapacity =
    (seatCapacityFromEvent && seatCapacityFromEvent > 0 ? seatCapacityFromEvent : null) ??
    (totalFromTicketClasses > 0 ? totalFromTicketClasses : null);

  if (seatCapacity === null || registrationCount === null) {
    return {
      registrationCount,
      seatCapacity,
      seatsRemaining: null,
    };
  }

  return {
    registrationCount,
    seatCapacity,
    seatsRemaining: Math.max(0, seatCapacity - registrationCount),
  };
}

function isLimitedSeatsStatus(input: {
  isUpcoming: boolean;
  seatCapacity: number | null;
  seatsRemaining: number | null;
}) {
  if (!input.isUpcoming || input.seatCapacity === null || input.seatCapacity <= 0 || input.seatsRemaining === null) {
    return false;
  }

  return input.seatsRemaining / input.seatCapacity < 0.2;
}

function mapSpeaker(row: CommunitySpeakerRow | null): DisplaySpeaker | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    fullName: row.full_name,
    headline: row.headline ?? '',
    bio: row.bio ?? '',
    photoUrl: row.photo_url,
    linkedinUrl: row.linkedin_url,
    websiteUrl: row.website_url,
  };
}

function mapTalk(row: CommunityEventTalkRow): DisplayTalk {
  const speakerValue = Array.isArray(row.speakers) ? row.speakers[0] ?? null : row.speakers ?? null;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    sortOrder: row.sort_order ?? 0,
    speakerId: row.speaker_id,
    speaker: mapSpeaker(speakerValue),
  };
}

function mapCommunityEvent(row: CommunityEventRow): DisplayEvent {
  const { formatted, dayOfMonth, month, year } = formatEventDate(row.start_at);
  const isUpcoming = new Date(row.start_at).getTime() > Date.now();
  const talks = (row.event_talks ?? [])
    .map(mapTalk)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: row.id,
    title: row.title,
    date: formatted,
    startLocal: row.start_at,
    time: formatEventTime(row.start_at, row.end_at),
    location: row.location_name?.trim() || 'Sydney',
    description: row.description?.trim() || '',
    url: row.eventbrite_url ?? '#',
    isUpcoming,
    dayOfMonth,
    month,
    year,
    registrationCount: null,
    seatCapacity: null,
    seatsRemaining: null,
    isLimitedSeats: false,
    talks,
    source: 'community',
    eventbriteEventId: row.eventbrite_event_id,
    eventbriteUrl: row.eventbrite_url,
  };
}

function mapEventbriteEvent(event: EventbriteEvent): DisplayEvent {
  const { formatted, dayOfMonth, month, year } = formatEventDate(event.start.local);
  const isUpcoming = new Date(event.start.local).getTime() > Date.now();
  const { registrationCount, seatCapacity, seatsRemaining } = calculateRegistrationStats(event);
  const description = event.description.text?.trim() || '';

  return {
    id: event.id,
    title: event.name.text,
    date: formatted,
    startLocal: event.start.local,
    time: formatEventTime(event.start.local, event.end.local),
    location: event.venue?.address?.localized_address_display || 'Sydney CBD',
    description,
    url: event.url,
    isUpcoming,
    dayOfMonth,
    month,
    year,
    registrationCount,
    seatCapacity,
    seatsRemaining,
    isLimitedSeats: isLimitedSeatsStatus({ isUpcoming, seatCapacity, seatsRemaining }),
    talks: [],
    source: 'eventbrite',
    eventbriteEventId: event.id,
    eventbriteUrl: event.url,
  };
}

function withCurrentUpcomingStatus(events: DisplayEvent[]): DisplayEvent[] {
  const now = Date.now();
  return events.map((event) => {
    const isUpcoming = new Date(event.startLocal).getTime() > now;
    const seatsRemaining =
      event.seatsRemaining ??
      (event.seatCapacity !== null && event.registrationCount !== null
        ? Math.max(0, event.seatCapacity - event.registrationCount)
        : null);

    return {
      ...event,
      isUpcoming,
      seatsRemaining,
      isLimitedSeats: isLimitedSeatsStatus({
        isUpcoming,
        seatCapacity: event.seatCapacity,
        seatsRemaining,
      }),
    };
  });
}

function getFreshCachedEventsPayload(): CachedEventsPayload | null {
  if (eventsMemoryCache && isCacheFresh(eventsMemoryCache.cachedAt)) {
    return eventsMemoryCache;
  }

  const storedCache = readEventsFromStorage();
  if (storedCache) {
    eventsMemoryCache = storedCache;
    return storedCache;
  }

  return null;
}

function mergeEventSources(communityEvents: DisplayEvent[], eventbriteEvents: DisplayEvent[]): DisplayEvent[] {
  if (communityEvents.length === 0) {
    return eventbriteEvents;
  }

  if (eventbriteEvents.length === 0) {
    return communityEvents;
  }

  const communityEventIds = new Set(communityEvents.map((event) => event.id));
  const linkedEventbriteIds = new Set(
    communityEvents
      .map((event) => event.eventbriteEventId)
      .filter((eventbriteEventId): eventbriteEventId is string => Boolean(eventbriteEventId))
  );

  const unmatchedEventbriteEvents = eventbriteEvents.filter((eventbriteEvent) => {
    return !communityEventIds.has(eventbriteEvent.id) && !linkedEventbriteIds.has(eventbriteEvent.id);
  });

  return [...communityEvents, ...unmatchedEventbriteEvents];
}

function applyEventbriteStatsToCommunityEvents(
  communityEvents: DisplayEvent[],
  eventbriteEvents: DisplayEvent[]
): DisplayEvent[] {
  if (communityEvents.length === 0 || eventbriteEvents.length === 0) {
    return communityEvents;
  }

  const eventbriteById = new Map(eventbriteEvents.map((event) => [event.id, event]));

  return communityEvents.map((communityEvent) => {
    const linkedEventbriteId = communityEvent.eventbriteEventId;
    if (!linkedEventbriteId) {
      return communityEvent;
    }

    const matchingEventbriteEvent = eventbriteById.get(linkedEventbriteId);
    if (!matchingEventbriteEvent) {
      return communityEvent;
    }

    const registrationCount = matchingEventbriteEvent.registrationCount ?? communityEvent.registrationCount;
    const seatCapacity = matchingEventbriteEvent.seatCapacity ?? communityEvent.seatCapacity;
    const seatsRemaining =
      matchingEventbriteEvent.seatsRemaining ??
      (seatCapacity !== null && registrationCount !== null
        ? Math.max(0, seatCapacity - registrationCount)
        : communityEvent.seatsRemaining);

    return {
      ...communityEvent,
      url: communityEvent.url !== '#' ? communityEvent.url : matchingEventbriteEvent.url,
      eventbriteUrl: communityEvent.eventbriteUrl ?? matchingEventbriteEvent.eventbriteUrl,
      registrationCount,
      seatCapacity,
      seatsRemaining,
      isLimitedSeats: isLimitedSeatsStatus({
        isUpcoming: communityEvent.isUpcoming,
        seatCapacity,
        seatsRemaining,
      }),
    };
  });
}

function getFunctionConfig() {
  const functionUrlOverride = import.meta.env.VITE_SUPABASE_EVENTBRITE_FUNCTION_URL?.trim();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!anonKey) {
    return null;
  }

  if (functionUrlOverride) {
    return {
      endpoint: functionUrlOverride,
      anonKey,
    };
  }

  if (!supabaseUrl) {
    return null;
  }

  return {
    endpoint: `${supabaseUrl}/functions/v1/${EVENTBRITE_FUNCTION_NAME}`,
    anonKey,
  };
}

async function callEventbriteFunction(payload: Record<string, unknown>) {
  const config = getFunctionConfig();
  if (!config) {
    throw new Error('Supabase config is required to load Eventbrite events securely.');
  }

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.anonKey,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let parsed: EventbriteFunctionResponse = {};
  if (responseText) {
    try {
      parsed = JSON.parse(responseText) as EventbriteFunctionResponse;
    } catch {
      parsed = {};
    }
  }

  if (!response.ok || parsed.ok === false) {
    const message =
      parsed.message?.trim() ||
      `Eventbrite function request failed with ${response.status} ${response.statusText}.`;
    throw new Error(message);
  }

  return parsed;
}

async function fetchCommunityEventsFromSupabase(): Promise<DisplayEvent[]> {
  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from(COMMUNITY_EVENTS_TABLE)
    .select(
      `
      id,
      title,
      description,
      location_name,
      timezone,
      start_at,
      end_at,
      status,
      eventbrite_event_id,
      eventbrite_url,
      event_talks (
        id,
        title,
        description,
        sort_order,
        speaker_id,
        speakers (
          id,
          full_name,
          headline,
          bio,
          photo_url,
          linkedin_url,
          website_url
        )
      )
    `
    )
    .in('status', ['scheduled', 'published'])
    .order('start_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Unable to load community events.');
  }

  return ((data ?? []) as CommunityEventRow[]).map(mapCommunityEvent);
}

async function fetchEventbriteEventsFromFunction(): Promise<DisplayEvent[]> {
  const response = await callEventbriteFunction({
    action: 'list',
    organizationId: ORGANIZATION_ID || undefined,
  });

  const events = Array.isArray(response.events) ? response.events : [];
  return sortByStartDesc(events.map(mapEventbriteEvent));
}

async function fetchAllEventsInternal(): Promise<DisplayEvent[]> {
  const communityEvents = await fetchCommunityEventsFromSupabase();
  let eventbriteEvents: DisplayEvent[] = [];
  try {
    eventbriteEvents = await fetchEventbriteEventsFromFunction();
  } catch (error) {
    console.warn('Eventbrite refresh failed, using backend community events only.', error);
  }

  const enrichedCommunityEvents = applyEventbriteStatsToCommunityEvents(communityEvents, eventbriteEvents);

  if (!ENABLE_EVENTBRITE_LIVE_REFRESH) {
    return sortByStartDesc(enrichedCommunityEvents);
  }

  if (eventbriteEvents.length > 0) {
    return sortByStartDesc(mergeEventSources(enrichedCommunityEvents, eventbriteEvents));
  }

  return sortByStartDesc(enrichedCommunityEvents);
}

async function getAllEventsCached(forceRefresh = false): Promise<DisplayEvent[]> {
  if (!forceRefresh) {
    const cachedPayload = getFreshCachedEventsPayload();
    if (cachedPayload) {
      return withCurrentUpcomingStatus(cachedPayload.events);
    }

    if (eventsRequestPromise) {
      const inFlightEvents = await eventsRequestPromise;
      return withCurrentUpcomingStatus(inFlightEvents);
    }
  }

  try {
    eventsRequestPromise = fetchAllEventsInternal()
      .then((events) => {
        const payload: CachedEventsPayload = {
          cachedAt: Date.now(),
          events,
        };
        eventsMemoryCache = payload;
        writeEventsToStorage(payload);
        return events;
      })
      .finally(() => {
        eventsRequestPromise = null;
      });

    const events = await eventsRequestPromise;
    return withCurrentUpcomingStatus(events);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
}

export function getCachedAllEventsSnapshot(): DisplayEvent[] {
  const cachedPayload = getFreshCachedEventsPayload();
  if (!cachedPayload) {
    return [];
  }

  return sortByStartDesc(withCurrentUpcomingStatus(cachedPayload.events));
}

export function getCachedUpcomingEventsSnapshot(): DisplayEvent[] {
  return sortByStartAsc(getCachedAllEventsSnapshot().filter((event) => event.isUpcoming));
}

export function getCachedPastEventsSnapshot(): DisplayEvent[] {
  return sortByStartDesc(getCachedAllEventsSnapshot().filter((event) => !event.isUpcoming));
}

export async function fetchUpcomingEvents(forceRefresh = false): Promise<DisplayEvent[]> {
  try {
    const allEvents = await fetchAllEvents(forceRefresh);
    return sortByStartAsc(allEvents.filter((event) => event.isUpcoming));
  } catch (error) {
    console.error('Failed to fetch upcoming events:', error);
    throw error;
  }
}

export async function fetchAllEvents(forceRefresh = false): Promise<DisplayEvent[]> {
  try {
    const events = await getAllEventsCached(forceRefresh);
    return sortByStartDesc(events);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
}
