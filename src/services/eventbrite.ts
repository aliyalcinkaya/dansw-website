import type { EventbriteEvent, EventbriteEventsResponse, DisplayEvent } from '../types/eventbrite';

// API configuration from environment variables
const EVENTBRITE_API_BASE = 'https://www.eventbriteapi.com/v3';
const PRIVATE_TOKEN = import.meta.env.VITE_EVENTBRITE_PRIVATE_TOKEN;
const ORGANIZATION_ID = import.meta.env.VITE_EVENTBRITE_ORGANIZATION_ID || '8179498448';

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

/**
 * Transforms an Eventbrite event to our display format
 */
function transformEvent(event: EventbriteEvent): DisplayEvent {
  const { formatted, dayOfMonth, month, year } = formatEventDate(event.start.local);
  const now = new Date();
  const eventDate = new Date(event.start.local);
  
  return {
    id: event.id,
    title: event.name.text,
    date: formatted,
    time: formatEventTime(event.start.local, event.end.local),
    location: event.venue?.address?.localized_address_display || 'Sydney CBD',
    description: event.description.text?.substring(0, 200) + (event.description.text?.length > 200 ? '...' : '') || '',
    url: event.url,
    isUpcoming: eventDate > now,
    dayOfMonth,
    month,
    year,
  };
}

/**
 * Fetches upcoming events from Eventbrite
 * Includes live, started, and draft events that are in the future
 * Falls back to showing most recent past events if no upcoming events
 */
export async function fetchUpcomingEvents(): Promise<DisplayEvent[]> {
  if (!PRIVATE_TOKEN) {
    console.warn('Eventbrite API token not configured');
    return [];
  }

  try {
    // First try to get live/upcoming events
    const params = new URLSearchParams({
      status: 'live,started,draft',
      order_by: 'start_asc',
      expand: 'venue',
    });

    const response = await fetch(
      `${EVENTBRITE_API_BASE}/organizations/${ORGANIZATION_ID}/events/?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${PRIVATE_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Eventbrite API error: ${response.status} ${response.statusText}`);
    }

    const data: EventbriteEventsResponse = await response.json();
    
    // Filter for upcoming events only (future dates)
    const upcomingEvents = data.events
      .map(transformEvent)
      .filter(event => event.isUpcoming);
    
    // If we have upcoming events, return them
    if (upcomingEvents.length > 0) {
      return upcomingEvents;
    }

    // No upcoming events - fetch the most recent past event to show
    const allParams = new URLSearchParams({
      order_by: 'start_desc',
      expand: 'venue',
    });

    const allResponse = await fetch(
      `${EVENTBRITE_API_BASE}/organizations/${ORGANIZATION_ID}/events/?${allParams}`,
      {
        headers: {
          'Authorization': `Bearer ${PRIVATE_TOKEN}`,
        },
      }
    );

    if (!allResponse.ok) {
      return [];
    }

    const allData: EventbriteEventsResponse = await allResponse.json();
    
    // Return the most recent event (even if past) so users can see what events look like
    return allData.events.slice(0, 1).map(transformEvent);
  } catch (error) {
    console.error('Failed to fetch Eventbrite events:', error);
    throw error;
  }
}

/**
 * Fetches all events (including past) from Eventbrite
 */
export async function fetchAllEvents(): Promise<DisplayEvent[]> {
  if (!PRIVATE_TOKEN) {
    console.warn('Eventbrite API token not configured');
    return [];
  }

  try {
    const params = new URLSearchParams({
      order_by: 'start_desc',
      expand: 'venue',
    });

    const response = await fetch(
      `${EVENTBRITE_API_BASE}/organizations/${ORGANIZATION_ID}/events/?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${PRIVATE_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Eventbrite API error: ${response.status} ${response.statusText}`);
    }

    const data: EventbriteEventsResponse = await response.json();
    return data.events.map(transformEvent);
  } catch (error) {
    console.error('Failed to fetch Eventbrite events:', error);
    throw error;
  }
}
