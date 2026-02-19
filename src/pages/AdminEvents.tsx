import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdminBreadcrumbs } from '../components/AdminBreadcrumbs';
import { AdminLoadingCard } from '../components/AdminLoadingCard';
import { AdminMagicLinkCard } from '../components/AdminMagicLinkCard';
import { AdminStatusMessage } from '../components/AdminStatusMessage';
import {
  createEventInEventbrite,
  deleteEvent,
  fetchAdminEventWorkspace,
  fetchEventbriteAttendanceByEventId,
  importEventbriteEventsToBackend,
  syncEventToEventbrite,
  type EventbriteAttendanceSummary,
  upsertEvent,
} from '../services/eventAdmin';
import {
  fetchSiteAdminAccess,
  getCachedSiteAdminAccess,
  sendAdminMagicLink,
  type SiteAdminAccess,
} from '../services/siteSettings';
import type { AdminEvent, AdminEventStatus, AdminSpeaker } from '../types/eventsAdmin';

const initialAdminAccess: SiteAdminAccess = {
  mode: 'local',
  email: null,
  canManage: true,
};

const emptyTalk = {
  title: '',
  description: '',
  speakerId: '',
};

const emptyEventForm = {
  id: '',
  title: '',
  description: '',
  locationName: 'Sydney',
  timezone: 'Australia/Sydney',
  startAtLocal: '',
  endAtLocal: '',
  status: 'draft' as AdminEventStatus,
  eventbriteEventId: null as string | null,
  eventbriteUrl: null as string | null,
  lastSyncedAt: null as string | null,
  syncStatus: 'not_synced' as 'not_synced' | 'synced' | 'sync_error',
  syncError: null as string | null,
  talks: [{ ...emptyTalk }, { ...emptyTalk }],
};

type EventFilter = 'all' | AdminEventStatus;

const eventFilters: Array<{ value: EventFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

function isoToLocalInput(isoValue: string | null) {
  if (!isoValue) {
    return '';
  }

  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (value: number) => String(value).padStart(2, '0');
  const localYear = date.getFullYear();
  const localMonth = pad(date.getMonth() + 1);
  const localDay = pad(date.getDate());
  const localHour = pad(date.getHours());
  const localMinute = pad(date.getMinutes());
  return `${localYear}-${localMonth}-${localDay}T${localHour}:${localMinute}`;
}

function localInputToIso(localValue: string) {
  const parsed = new Date(localValue);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString();
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function mapEventToForm(event: AdminEvent) {
  const mappedTalks = event.talks.length > 0
    ? event.talks
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((talk) => ({
          title: talk.title,
          description: talk.description,
          speakerId: talk.speakerId ?? '',
        }))
    : [{ ...emptyTalk }, { ...emptyTalk }];

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    locationName: event.locationName,
    timezone: event.timezone,
    startAtLocal: isoToLocalInput(event.startAt),
    endAtLocal: isoToLocalInput(event.endAt),
    status: event.status,
    eventbriteEventId: event.eventbriteEventId,
    eventbriteUrl: event.eventbriteUrl,
    lastSyncedAt: event.lastSyncedAt,
    syncStatus: event.syncStatus,
    syncError: event.syncError,
    talks: mappedTalks,
  };
}

function statusBadgeClass(status: AdminEventStatus) {
  if (status === 'published') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'scheduled') {
    return 'bg-indigo-100 text-indigo-700';
  }

  if (status === 'archived') {
    return 'bg-slate-200 text-slate-700';
  }

  return 'bg-amber-100 text-amber-700';
}

function formatAttendance(summary: EventbriteAttendanceSummary | null | undefined) {
  if (!summary) {
    return 'N/A';
  }

  const attendees = summary.attendees;
  const capacity = summary.capacity;

  if (attendees === null && capacity === null) {
    return 'N/A';
  }

  return `${attendees ?? 'N/A'}/${capacity ?? 'N/A'}`;
}

type AdminEventsMode = 'list' | 'create';

export function AdminEvents({ mode = 'list' }: { mode?: AdminEventsMode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const cachedAdminAccess = getCachedSiteAdminAccess();
  const [loading, setLoading] = useState(!cachedAdminAccess);
  const [adminAccess, setAdminAccess] = useState<SiteAdminAccess>(cachedAdminAccess?.data ?? initialAdminAccess);
  const [authLinkEmail, setAuthLinkEmail] = useState(cachedAdminAccess?.data.email ?? '');
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const [speakers, setSpeakers] = useState<AdminSpeaker[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [savingEvent, setSavingEvent] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [syncingEvent, setSyncingEvent] = useState<'create' | 'sync' | null>(null);
  const [importingFromEventbrite, setImportingFromEventbrite] = useState(false);
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [eventbriteAttendanceById, setEventbriteAttendanceById] = useState<Record<string, EventbriteAttendanceSummary>>(
    {}
  );
  const isCreateScreen = mode === 'create';
  const selectedEventId = searchParams.get('eventId');

  const canShowAdminContent = !loading && !(adminAccess.mode === 'supabase' && !adminAccess.canManage);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()),
    [events]
  );

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') {
      return sortedEvents;
    }

    return sortedEvents.filter((event) => event.status === eventFilter);
  }, [eventFilter, sortedEvents]);

  const hasSelectedEvent = Boolean(eventForm.id);

  const refreshWorkspace = useCallback(async () => {
    const [workspaceResult, attendanceResult] = await Promise.all([
      fetchAdminEventWorkspace(),
      fetchEventbriteAttendanceByEventId(),
    ]);

    if (!workspaceResult.ok) {
      setStatus({
        type: 'error',
        message: workspaceResult.message ?? 'Unable to load events workspace.',
      });
      setSpeakers([]);
      setEvents([]);
      setEventbriteAttendanceById({});
      return;
    }

    setSpeakers(workspaceResult.data.speakers);
    setEvents(workspaceResult.data.events);
    setEventbriteAttendanceById(attendanceResult.ok ? attendanceResult.data : {});

    if (!isCreateScreen) {
      if (!selectedEventId) {
        setEventForm(emptyEventForm);
      } else {
        const selected = workspaceResult.data.events.find((event) => event.id === selectedEventId);
        setEventForm(selected ? mapEventToForm(selected) : emptyEventForm);
      }
    }
  }, [isCreateScreen, selectedEventId]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const accessResult = await fetchSiteAdminAccess();
      if (!isMounted) {
        return;
      }

      setAdminAccess(accessResult.data);
      setAuthLinkEmail(accessResult.data.email ?? '');

      if (!accessResult.ok && accessResult.message) {
        setStatus({ type: 'error', message: accessResult.message });
      } else if (accessResult.message) {
        setStatus({ type: 'info', message: accessResult.message });
      } else {
        setStatus(null);
      }

      if (!(accessResult.data.mode === 'supabase' && !accessResult.data.canManage)) {
        await refreshWorkspace();
      }

      setLoading(false);
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [refreshWorkspace]);

  const handleSendMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSendingMagicLink(true);
    setStatus(null);

    const result = await sendAdminMagicLink(
      authLinkEmail,
      isCreateScreen ? '/admin/events/new' : '/admin/events'
    );
    setSendingMagicLink(false);

    if (!result.ok) {
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to send admin login link.',
      });
      return;
    }

    setStatus({
      type: 'success',
      message: result.message ?? 'Admin magic link sent.',
    });
  };

  const handleSaveEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingEvent(true);
    setStatus(null);

    const startAt = localInputToIso(eventForm.startAtLocal);
    const endAt = localInputToIso(eventForm.endAtLocal);

    const result = await upsertEvent({
      id: eventForm.id || undefined,
      title: eventForm.title,
      description: eventForm.description,
      locationName: eventForm.locationName,
      timezone: eventForm.timezone,
      startAt,
      endAt,
      status: eventForm.status,
      talks: eventForm.talks.map((talk, index) => ({
        title: talk.title,
        description: talk.description,
        speakerId: talk.speakerId || null,
        sortOrder: index + 1,
      })),
    });

    setSavingEvent(false);

    if (!result.ok || !result.data) {
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to save event.',
      });
      return;
    }

    await refreshWorkspace();
    setEventForm(mapEventToForm(result.data));
    setStatus({
      type: 'success',
      message: 'Event saved.',
    });
  };

  const handleDeleteEvent = async () => {
    if (!eventForm.id) {
      return;
    }

    const shouldDelete = window.confirm(
      eventForm.eventbriteEventId
        ? 'Delete this event from the website? This will not remove the linked Eventbrite event.'
        : 'Delete this event from the website?'
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingEvent(true);
    setStatus(null);

    const result = await deleteEvent(eventForm.id);
    setDeletingEvent(false);

    if (!result.ok) {
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to delete event.',
      });
      return;
    }

    await refreshWorkspace();
    setEventForm(emptyEventForm);
    setStatus({
      type: 'success',
      message: 'Event deleted.',
    });
  };

  const handleCreateInEventbrite = async () => {
    if (!eventForm.id) {
      setStatus({ type: 'error', message: 'Save the event first before creating it in Eventbrite.' });
      return;
    }

    setSyncingEvent('create');
    setStatus(null);

    const result = await createEventInEventbrite(eventForm.id);
    setSyncingEvent(null);

    if (!result.ok || !result.data) {
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to create event in Eventbrite.',
      });
      return;
    }

    await refreshWorkspace();
    setEventForm(mapEventToForm(result.data));
    setStatus({
      type: 'success',
      message: 'Event created in Eventbrite and linked.',
    });
  };

  const handleSyncToEventbrite = async () => {
    if (!eventForm.id) {
      setStatus({ type: 'error', message: 'Save the event first before syncing.' });
      return;
    }

    setSyncingEvent('sync');
    setStatus(null);

    const result = await syncEventToEventbrite(eventForm.id);
    setSyncingEvent(null);

    if (!result.ok || !result.data) {
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to sync event changes to Eventbrite.',
      });
      return;
    }

    await refreshWorkspace();
    setEventForm(mapEventToForm(result.data));
    setStatus({
      type: 'success',
      message: 'Event details synced to Eventbrite.',
    });
  };

  const handleImportFromEventbrite = async () => {
    setImportingFromEventbrite(true);
    setStatus(null);

    const result = await importEventbriteEventsToBackend();
    setImportingFromEventbrite(false);

    if (!result.ok) {
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to import events from Eventbrite.',
      });
      return;
    }

    await refreshWorkspace();
    setStatus({
      type: 'success',
      message:
        result.message ??
        `Imported ${result.data.importedCount} new events, updated ${result.data.updatedCount}, skipped ${result.data.skippedCount}.`,
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
          <AdminBreadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Events', href: '/admin/events' },
              ...(isCreateScreen
                ? [{ label: 'Create' }]
                : hasSelectedEvent
                  ? [{ label: eventForm.title || 'Details' }]
                  : []),
            ]}
          />
          <h1 className="mt-4 text-4xl text-[var(--color-primary)] md:text-5xl">Events</h1>
          <p className="mt-3 max-w-3xl text-[var(--color-text-muted)]">
            Create and edit events, define talk lineups, and sync approved event details to Eventbrite.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
          <AdminStatusMessage status={status} />

          {loading && <AdminLoadingCard />}

          {!loading && adminAccess.mode === 'supabase' && !adminAccess.canManage && (
            <AdminMagicLinkCard
              email={authLinkEmail}
              onEmailChange={setAuthLinkEmail}
              onSubmit={handleSendMagicLink}
              sending={sendingMagicLink}
              description="Sign in with an admin email listed in `job_board_admins` to manage events."
            />
          )}

          {canShowAdminContent && (
            <>
              {!isCreateScreen && !hasSelectedEvent && (
                <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-7">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      {eventFilters.map((filter) => (
                        <button
                          key={filter.value}
                          type="button"
                          onClick={() => setEventFilter(filter.value)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            eventFilter === filter.value
                              ? 'bg-[var(--color-accent)] text-white'
                              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleImportFromEventbrite}
                        disabled={importingFromEventbrite}
                        className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                          importingFromEventbrite
                            ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                            : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
                        }`}
                      >
                        {importingFromEventbrite ? 'Importing...' : 'Import from Eventbrite'}
                      </button>

                      <Link
                        to="/admin/events/new"
                        className="inline-flex items-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)]"
                      >
                        Add New Event
                      </Link>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                    <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
                      <thead className="bg-[var(--color-surface)] text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        <tr>
                          <th className="px-4 py-3 font-medium">Title</th>
                          <th className="px-4 py-3 font-medium">Start</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Attendance</th>
                          <th className="px-4 py-3 font-medium">Sync</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)] bg-white">
                        {filteredEvents.length > 0 ? (
                          filteredEvents.map((event) => (
                            <tr
                              key={event.id}
                              onClick={() => setSearchParams({ eventId: event.id })}
                              className={`cursor-pointer transition-colors hover:bg-[var(--color-surface)] ${
                                selectedEventId === event.id ? 'bg-[var(--color-accent)]/5' : ''
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-[var(--color-primary)]">{event.title}</td>
                              <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatDateTime(event.startAt)}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(event.status)}`}
                                >
                                  {event.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[var(--color-text-muted)]">
                                {formatAttendance(
                                  event.eventbriteEventId ? eventbriteAttendanceById[event.eventbriteEventId] : null
                                )}
                              </td>
                              <td className="px-4 py-3 text-[var(--color-text-muted)]">{event.syncStatus}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-text-muted)]">
                              No events found for this filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              )}

              {(isCreateScreen || hasSelectedEvent) && (
                <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl text-[var(--color-primary)]">
                      {isCreateScreen ? 'Create Event' : 'Event Details'}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                      {isCreateScreen
                        ? 'Create a new event, add the talk lineup, then sync to Eventbrite.'
                        : 'Review and update the selected event details.'}
                    </p>
                  </div>
                  {isCreateScreen && (
                    <Link
                      to="/admin/events"
                      className="inline-flex items-center rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      Back to Events List
                    </Link>
                  )}
                </div>

                <form onSubmit={handleSaveEvent} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm text-[var(--color-text-muted)]">Event title</label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(inputEvent) => setEventForm((current) => ({ ...current, title: inputEvent.target.value }))}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      placeholder="DAW Sydney - Month Year"
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm text-[var(--color-text-muted)]">Start</label>
                      <input
                        type="datetime-local"
                        value={eventForm.startAtLocal}
                        onChange={(inputEvent) => setEventForm((current) => ({ ...current, startAtLocal: inputEvent.target.value }))}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-[var(--color-text-muted)]">End</label>
                      <input
                        type="datetime-local"
                        value={eventForm.endAtLocal}
                        onChange={(inputEvent) => setEventForm((current) => ({ ...current, endAtLocal: inputEvent.target.value }))}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm text-[var(--color-text-muted)]">Location</label>
                      <input
                        type="text"
                        value={eventForm.locationName}
                        onChange={(inputEvent) => setEventForm((current) => ({ ...current, locationName: inputEvent.target.value }))}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-[var(--color-text-muted)]">Status</label>
                      <select
                        value={eventForm.status}
                        onChange={(inputEvent) =>
                          setEventForm((current) => ({ ...current, status: inputEvent.target.value as AdminEventStatus }))
                        }
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      >
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[var(--color-text-muted)]">Event description</label>
                    <textarea
                      value={eventForm.description}
                      onChange={(inputEvent) => setEventForm((current) => ({ ...current, description: inputEvent.target.value }))}
                      className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      rows={4}
                      placeholder="Overview of the event and audience value."
                    />
                  </div>

                  <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                        Talk Lineup
                      </h3>
                      <div className="flex items-center gap-3">
                        <Link to="/admin/speakers" className="text-xs text-[var(--color-accent)] hover:underline">
                          Manage Speakers
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            setEventForm((current) => ({
                              ...current,
                              talks: [...current.talks, { ...emptyTalk }],
                            }))
                          }
                          className="text-xs text-[var(--color-accent)] hover:underline"
                        >
                          Add Talk
                        </button>
                      </div>
                    </div>
                    {eventForm.talks.map((talk, index) => (
                      <div key={`talk-${index}`} className="space-y-2 rounded-lg border border-[var(--color-border)] bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                            Talk {index + 1}
                          </p>
                          {eventForm.talks.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setEventForm((current) => ({
                                  ...current,
                                  talks: current.talks.filter((_, talkIndex) => talkIndex !== index),
                                }))
                              }
                              className="text-xs text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={talk.title}
                          onChange={(inputEvent) =>
                            setEventForm((current) => ({
                              ...current,
                              talks: current.talks.map((currentTalk, talkIndex) =>
                                talkIndex === index ? { ...currentTalk, title: inputEvent.target.value } : currentTalk
                              ),
                            }))
                          }
                          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                          placeholder="Talk title"
                        />
                        <select
                          value={talk.speakerId}
                          onChange={(inputEvent) =>
                            setEventForm((current) => ({
                              ...current,
                              talks: current.talks.map((currentTalk, talkIndex) =>
                                talkIndex === index ? { ...currentTalk, speakerId: inputEvent.target.value } : currentTalk
                              ),
                            }))
                          }
                          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        >
                          <option value="">Select speaker</option>
                          {speakers
                            .filter((speaker) => speaker.isActive)
                            .map((speaker) => (
                              <option key={speaker.id} value={speaker.id}>
                                {speaker.fullName}
                              </option>
                            ))}
                        </select>
                        <textarea
                          value={talk.description}
                          onChange={(inputEvent) =>
                            setEventForm((current) => ({
                              ...current,
                              talks: current.talks.map((currentTalk, talkIndex) =>
                                talkIndex === index ? { ...currentTalk, description: inputEvent.target.value } : currentTalk
                              ),
                            }))
                          }
                          className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                          rows={3}
                          placeholder="Talk abstract"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="submit"
                      disabled={savingEvent}
                      className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium ${
                        savingEvent
                          ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                          : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]'
                      }`}
                    >
                      {savingEvent ? 'Saving...' : eventForm.id ? 'Update Event' : 'Create Event'}
                    </button>
                    {eventForm.id && (
                      <button
                        type="button"
                        onClick={handleDeleteEvent}
                        disabled={deletingEvent}
                        className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium ${
                          deletingEvent
                            ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {deletingEvent ? 'Deleting...' : 'Delete Event'}
                      </button>
                    )}
                  </div>
                  {eventForm.id && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Note: deleting here removes the event from this website only. It does not delete the Eventbrite event.
                    </p>
                  )}
                </form>

                {eventForm.id && (
                  <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Eventbrite Sync
                    </h3>
                    <div className="mt-2 space-y-1 text-xs text-[var(--color-text-muted)]">
                      <p>Sync status: {eventForm.syncStatus}</p>
                      <p>
                        Last synced:{' '}
                        {eventForm.lastSyncedAt
                          ? new Date(eventForm.lastSyncedAt).toLocaleString('en-AU')
                          : 'Not synced yet'}
                      </p>
                      {eventForm.syncError && <p className="text-red-600">Last error: {eventForm.syncError}</p>}
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      {!eventForm.eventbriteEventId ? (
                        <button
                          type="button"
                          onClick={handleCreateInEventbrite}
                          disabled={syncingEvent !== null}
                          className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium ${
                            syncingEvent
                              ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                              : 'bg-[var(--color-primary)] text-white hover:bg-slate-800'
                          }`}
                        >
                          {syncingEvent === 'create' ? 'Creating...' : 'Create Event in Eventbrite'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSyncToEventbrite}
                          disabled={syncingEvent !== null}
                          className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium ${
                            syncingEvent
                              ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                              : 'bg-[var(--color-primary)] text-white hover:bg-slate-800'
                          }`}
                        >
                          {syncingEvent === 'sync' ? 'Syncing...' : 'Sync Content Changes to Eventbrite'}
                        </button>
                      )}

                      {eventForm.eventbriteUrl && (
                        <a
                          href={eventForm.eventbriteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                        >
                          Open Eventbrite Event
                        </a>
                      )}
                    </div>
                  </div>
                )}
                </article>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
