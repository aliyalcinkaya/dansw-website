// Eventbrite API Types

export interface EventbriteVenue {
  id: string;
  name: string;
  address: {
    localized_address_display: string;
    city: string;
    region: string;
    postal_code: string;
    country: string;
  };
}

export interface EventbriteTicketClass {
  name: string;
  quantity_total: number | null;
  quantity_sold: number | null;
  hidden: boolean;
  donation: boolean;
}

export interface EventbriteEvent {
  id: string;
  name: {
    text: string;
    html: string;
  };
  description: {
    text: string;
    html: string;
  };
  url: string;
  start: {
    timezone: string;
    local: string;
    utc: string;
  };
  end: {
    timezone: string;
    local: string;
    utc: string;
  };
  status: 'draft' | 'live' | 'started' | 'ended' | 'completed' | 'canceled';
  capacity?: number | null;
  capacity_is_custom?: boolean;
  venue_id: string | null;
  venue?: EventbriteVenue;
  ticket_classes?: EventbriteTicketClass[];
  logo?: {
    url: string;
    original: {
      url: string;
    };
  };
  is_free: boolean;
}

export interface EventbritePagination {
  object_count: number;
  page_number: number;
  page_size: number;
  page_count: number;
  has_more_items: boolean;
}

export interface EventbriteEventsResponse {
  pagination: EventbritePagination;
  events: EventbriteEvent[];
}

export interface DisplaySpeaker {
  id: string;
  fullName: string;
  headline: string;
  bio: string;
  photoUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
}

export interface DisplayTalk {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  speakerId: string | null;
  speaker: DisplaySpeaker | null;
}

// Transformed event for UI display
export interface DisplayEvent {
  id: string;
  title: string;
  date: string;
  startLocal: string;
  time: string;
  location: string;
  description: string;
  url: string;
  isUpcoming: boolean;
  dayOfMonth: string;
  month: string;
  year: string;
  registrationCount: number | null;
  seatCapacity: number | null;
  seatsRemaining: number | null;
  isLimitedSeats: boolean;
  talks: DisplayTalk[];
  source: 'community' | 'eventbrite';
  eventbriteEventId: string | null;
  eventbriteUrl: string | null;
}
