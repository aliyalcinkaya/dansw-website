import { useState, useEffect } from 'react';
import type { DisplayEvent } from '../types/eventbrite';
import { fetchUpcomingEvents } from '../services/eventbrite';
import { shouldForceEventbriteRefreshOnInitialLoad } from './useEventbriteRefreshMode';

interface UseEventbriteEventsResult {
  events: DisplayEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEventbriteEvents(): UseEventbriteEventsResult {
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const upcomingEvents = await fetchUpcomingEvents(forceRefresh);
      setEvents(upcomingEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEvents(shouldForceEventbriteRefreshOnInitialLoad());
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
