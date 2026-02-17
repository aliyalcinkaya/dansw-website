import { useEffect, useState } from 'react';
import type { DisplayEvent } from '../types/eventbrite';
import { fetchAllEvents } from '../services/eventbrite';

interface UseAllEventsResult {
  events: DisplayEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAllEvents(): UseAllEventsResult {
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const allEvents = await fetchAllEvents(forceRefresh);
      setEvents(allEvents);
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
