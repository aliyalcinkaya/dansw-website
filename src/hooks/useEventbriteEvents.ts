import { useState, useEffect } from 'react';
import type { DisplayEvent } from '../types/eventbrite';
import { fetchUpcomingEvents, getCachedUpcomingEventsSnapshot } from '../services/eventbrite';
import { shouldForceEventbriteRefreshOnInitialLoad } from './useEventbriteRefreshMode';

interface UseEventbriteEventsResult {
  events: DisplayEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEventbriteEvents(): UseEventbriteEventsResult {
  const initialEvents = getCachedUpcomingEventsSnapshot();
  const [events, setEvents] = useState<DisplayEvent[]>(initialEvents);
  const [loading, setLoading] = useState(initialEvents.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async (forceRefresh = false, showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const upcomingEvents = await fetchUpcomingEvents(forceRefresh);
      setEvents(upcomingEvents);
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
  };

  useEffect(() => {
    const forceRefresh = shouldForceEventbriteRefreshOnInitialLoad();
    const showLoading = initialEvents.length === 0 || forceRefresh;
    void fetchEvents(forceRefresh, showLoading);
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
