import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAllEvents } from '../hooks/useAllEvents';
import { UpcomingEventsSection } from '../components/UpcomingEventsSection';
import { trackEvent } from '../services/analytics';

export function Events() {
  const { events, loading, error, refetch } = useAllEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const previousEvents = useMemo(
    () => events.filter((event) => !event.isUpcoming),
    [events]
  );

  const filteredPreviousEvents = useMemo(() => {
    if (!searchQuery) {
      return previousEvents;
    }

    const query = searchQuery.toLowerCase();
    return previousEvents.filter((event) => {
      return (
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      );
    });
  }, [previousEvents, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
              Events
            </span>
            <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mt-2 mb-6">
              Upcoming Event + Previous Talks
            </h1>
            <p className="text-lg text-[var(--color-text-muted)] leading-relaxed">
              Register for the next meetup, then browse the archive of talks and topics from previous DAW Sydney events.
            </p>
          </div>
        </div>
      </section>

      <UpcomingEventsSection
        events={events}
        loading={loading}
        error={error}
        onRetry={refetch}
        showArchiveLink={false}
      />

      <section className="py-12 md:py-16 border-t border-[var(--color-border)] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-end md:justify-between mb-6">
            <div>
              <span className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
                Talk Archive
              </span>
              <h2 className="text-3xl text-[var(--color-primary)] mt-1">
                Previous Talks
              </h2>
            </div>
            {!loading && !error && (
              <p className="text-sm text-[var(--color-text-muted)]">
                {filteredPreviousEvents.length} event{filteredPreviousEvents.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="relative w-full md:w-96 mb-8">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search previous talks..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
            />
          </div>

          {loading && (
            <div className="text-center py-16">
              <div className="inline-flex items-center gap-3 text-[var(--color-text-muted)]">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading previous talks...
              </div>
            </div>
          )}

          {!loading && !error && filteredPreviousEvents.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-[var(--color-border)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl text-[var(--color-primary)] mb-2">
                {searchQuery ? 'No talks found' : 'No previous talks yet'}
              </h3>
              <p className="text-[var(--color-text-muted)]">
                {searchQuery ? 'Try adjusting your search.' : 'Check back after our next event!'}
              </p>
            </div>
          )}

          {!loading && !error && filteredPreviousEvents.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--color-border)]">
                  <thead className="bg-[var(--color-surface)]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                        Title / Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                        Speakers
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                        Event Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] bg-white">
                    {filteredPreviousEvents.map((event) => {
                      const speakers = event.talks
                        .reduce<NonNullable<(typeof event.talks)[number]['speaker']>[]>((acc, talk) => {
                          if (!talk.speaker) {
                            return acc;
                          }

                          if (acc.some((speaker) => speaker.id === talk.speaker?.id)) {
                            return acc;
                          }

                          acc.push(talk.speaker);
                          return acc;
                        }, [])
                        .slice(0, 2);

                      return (
                        <tr
                          key={event.id}
                          tabIndex={0}
                          role="link"
                          aria-label={`Open details for ${event.title}`}
                          className="cursor-pointer transition-colors hover:bg-[var(--color-surface)] focus:bg-[var(--color-surface)] focus:outline-none"
                          onClick={() => {
                            trackEvent('events_table_row_click', {
                              event_id: event.id,
                              event_title: event.title,
                            });
                            navigate(`/talks/${event.id}`);
                          }}
                          onKeyDown={(eventKey) => {
                            if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                              eventKey.preventDefault();
                              trackEvent('events_table_row_click', {
                                event_id: event.id,
                                event_title: event.title,
                              });
                              navigate(`/talks/${event.id}`);
                            }
                          }}
                        >
                          <td className="px-4 py-4 align-top">
                            <p className="text-sm font-semibold text-[var(--color-primary)]">{event.title}</p>
                            <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-2">
                              {event.description || 'Details coming soon.'}
                            </p>
                          </td>
                          <td className="px-4 py-4 align-top">
                            {speakers.length > 0 && (
                              <div className="flex items-center -space-x-2">
                                {speakers.map((speaker) => (
                                  speaker.photoUrl ? (
                                    <img
                                      key={speaker.id}
                                      src={speaker.photoUrl}
                                      alt={`${speaker.fullName} profile`}
                                      className="h-9 w-9 rounded-full border-2 border-white object-cover"
                                      loading="lazy"
                                      title={speaker.fullName}
                                    />
                                  ) : (
                                    <div
                                      key={speaker.id}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[var(--color-accent)]/10 text-xs font-semibold text-[var(--color-accent)]"
                                      title={speaker.fullName}
                                    >
                                      {speaker.fullName.slice(0, 1).toUpperCase()}
                                    </div>
                                  )
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-[var(--color-text-muted)]">
                            {event.dayOfMonth} {event.month} {event.year}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-white border-t border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl text-[var(--color-primary)] mb-4">
            Have a story to share?
          </h2>
          <p className="text-[var(--color-text-muted)] mb-6">
            We are always looking for speakers to share experiences and insights with our community.
          </p>
          <Link
            to="/become-a-speaker"
            onClick={() => trackEvent('events_page_cta_click', { cta_id: 'submit_talk_proposal', target: '/become-a-speaker' })}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all"
          >
            Submit a Talk Proposal
          </Link>
        </div>
      </section>
    </div>
  );
}
