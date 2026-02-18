import type { EventbriteEvent, EventbriteEventsResponse, DisplayEvent } from '../types/eventbrite';

// API configuration from environment variables
const EVENTBRITE_API_BASE = 'https://www.eventbriteapi.com/v3';
const PRIVATE_TOKEN = import.meta.env.VITE_EVENTBRITE_PRIVATE_TOKEN;
const ORGANIZATION_ID = import.meta.env.VITE_EVENTBRITE_ORGANIZATION_ID || '8179498448';
const ALL_EVENTS_CACHE_KEY = 'eventbrite_all_events_cache_v1';
const ALL_EVENTS_CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

interface CachedEventsPayload {
  cachedAt: number;
  events: DisplayEvent[];
}

let allEventsMemoryCache: CachedEventsPayload | null = null;
let allEventsRequestPromise: Promise<DisplayEvent[]> | null = null;

/**
 * Formats a date string for display
 */
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

/**
 * Formats a time string for display
 */
function formatEventTime(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startTime = start.toLocaleTimeString('en-AU', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  const endTime = end.toLocaleTimeString('en-AU', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
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

/**
 * Transforms an Eventbrite event to our display format
 */
function transformEvent(event: EventbriteEvent): DisplayEvent {
  const { formatted, dayOfMonth, month, year } = formatEventDate(event.start.local);
  const now = new Date();
  const eventDate = new Date(event.start.local);
  const isUpcoming = eventDate > now;
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
  };
}

/**
 * Detects whether browser storage is available.
 */
function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isCacheFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < ALL_EVENTS_CACHE_TTL_MS;
}

function sortByStartDesc(events: DisplayEvent[]): DisplayEvent[] {
  return [...events].sort(
    (a, b) => new Date(b.startLocal).getTime() - new Date(a.startLocal).getTime()
  );
}

function sortByStartAsc(events: DisplayEvent[]): DisplayEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.startLocal).getTime() - new Date(b.startLocal).getTime()
  );
}

/**
 * Recomputes upcoming status on read so cached data does not go stale
 * as time passes.
 */
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

function readAllEventsFromStorage(): CachedEventsPayload | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(ALL_EVENTS_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedEventsPayload;
    if (!parsed || !Array.isArray(parsed.events) || typeof parsed.cachedAt !== 'number') {
      return null;
    }

    const hasInvalidEventShape = parsed.events.some(
      (event) => !event || typeof event.startLocal !== 'string'
    );
    if (hasInvalidEventShape) {
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

function writeAllEventsToStorage(payload: CachedEventsPayload): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(ALL_EVENTS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage write failures (private mode / quota exceeded).
  }
}

async function fetchAllEventsFromApi(): Promise<DisplayEvent[]> {
  const params = new URLSearchParams({
    order_by: 'start_desc',
    expand: 'venue,ticket_classes',
  });

  const response = await fetch(
    `${EVENTBRITE_API_BASE}/organizations/${ORGANIZATION_ID}/events/?${params}`,
    {
      headers: {
        Authorization: `Bearer ${PRIVATE_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Eventbrite API error: ${response.status} ${response.statusText}`);
  }

  const data: EventbriteEventsResponse = await response.json();
  return sortByStartDesc(data.events.map(transformEvent));
}

async function getAllEventsCached(forceRefresh = false): Promise<DisplayEvent[]> {
  if (!forceRefresh) {
    if (allEventsMemoryCache && isCacheFresh(allEventsMemoryCache.cachedAt)) {
      return withCurrentUpcomingStatus(allEventsMemoryCache.events);
    }

    const storedCache = readAllEventsFromStorage();
    if (storedCache) {
      allEventsMemoryCache = storedCache;
      return withCurrentUpcomingStatus(storedCache.events);
    }

    if (allEventsRequestPromise) {
      const inFlightEvents = await allEventsRequestPromise;
      return withCurrentUpcomingStatus(inFlightEvents);
    }
  }

  try {
    allEventsRequestPromise = fetchAllEventsFromApi()
      .then((events) => {
        const payload: CachedEventsPayload = {
          cachedAt: Date.now(),
          events,
        };
        allEventsMemoryCache = payload;
        writeAllEventsToStorage(payload);
        return payload.events;
      })
      .finally(() => {
        allEventsRequestPromise = null;
      });

    const events = await allEventsRequestPromise;
    return withCurrentUpcomingStatus(events);
  } catch (error) {
    console.error('Failed to fetch Eventbrite events:', error);
    throw error;
  }
}

/**
 * Fetches upcoming events from Eventbrite.
 * Uses cached event list and returns upcoming events sorted soonest first.
 */
export async function fetchUpcomingEvents(forceRefresh = false): Promise<DisplayEvent[]> {
  if (!PRIVATE_TOKEN) {
    console.warn('Eventbrite API token not configured');
    return [];
  }

  try {
    const allEvents = await fetchAllEvents(forceRefresh);
    const upcomingEvents = sortByStartAsc(allEvents.filter((event) => event.isUpcoming));
    return upcomingEvents;
  } catch (error) {
    console.error('Failed to fetch Eventbrite events:', error);
    throw error;
  }
}

/**
 * Fetches all events (including past) from Eventbrite.
 */
export async function fetchAllEvents(forceRefresh = false): Promise<DisplayEvent[]> {
  if (!PRIVATE_TOKEN) {
    console.warn('Eventbrite API token not configured');
    return [];
  }

  try {
    const events = await getAllEventsCached(forceRefresh);
    return sortByStartDesc(events);
  } catch (error) {
    console.error('Failed to fetch Eventbrite events:', error);
    throw error;
  }
}
