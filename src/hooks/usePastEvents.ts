import { useCallback, useEffect, useRef, useState } from 'react';
import type { DisplayEvent } from '../types/eventbrite';
import { fetchAllEvents, getCachedPastEventsSnapshot } from '../services/eventbrite';
import { shouldForceEventbriteRefreshOnInitialLoad } from './useEventbriteRefreshMode';

interface UsePastEventsResult {
  events: DisplayEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePastEvents(): UsePastEventsResult {
  const initialEvents = getCachedPastEventsSnapshot();
  const hadInitialEvents = useRef(initialEvents.length > 0);
  const [events, setEvents] = useState<DisplayEvent[]>(initialEvents);
  const [loading, setLoading] = useState(initialEvents.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (forceRefresh = false, showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    // Always clear previous errors on fetch attempt, even for background refetches
    setError(null);

    try {
      const allEvents = await fetchAllEvents(forceRefresh);
      const pastEvents = allEvents.filter((event) => !event.isUpcoming);
      setEvents(pastEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      if (showLoading) {
        setEvents([]);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const forceRefresh = shouldForceEventbriteRefreshOnInitialLoad();
    const showLoading = !hadInitialEvents.current || forceRefresh;
    void fetchEvents(forceRefresh, showLoading);
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch: () => {
      void fetchEvents(true);
    },
  };
}
