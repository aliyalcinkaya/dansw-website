import { useState, useEffect } from 'react';
import type { DisplayEvent } from '../types/eventbrite';
import { fetchAllEvents } from '../services/eventbrite';

interface UsePastEventsResult {
  events: DisplayEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePastEvents(): UsePastEventsResult {
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const allEvents = await fetchAllEvents(forceRefresh);
      // Filter for past events only
      const pastEvents = allEvents.filter(event => !event.isUpcoming);
      setEvents(pastEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    refetch: () => {
      void fetchEvents(true);
    },
  };
}
