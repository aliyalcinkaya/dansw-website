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
  venue_id: string | null;
  venue?: EventbriteVenue;
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
}
