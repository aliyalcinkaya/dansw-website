import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAllEvents } from '../hooks/useAllEvents';
import { getGoogleMapsSearchUrl } from '../utils/maps';
import { trackEvent } from '../services/analytics';

export function TalkDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const { events, loading, error, refetch } = useAllEvents();

  const talk = useMemo(() => {
    if (!eventId) {
      return null;
    }

    return events.find((event) => event.id === eventId) ?? null;
  }, [eventId, events]);

  const relatedTalks = useMemo(
    () =>
      events
        .filter((event) => !event.isUpcoming && event.id !== eventId)
        .slice(0, 3),
    [eventId, events]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center">
          <div className="inline-flex items-center gap-3 text-[var(--color-text-muted)]">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading talk details...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-white p-8 text-center">
          <h1 className="mb-3 text-2xl text-[var(--color-primary)]">Unable to load talk details</h1>
          <p className="mb-6 text-sm text-[var(--color-text-muted)]">{error}</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                trackEvent('talk_details_retry_click');
                refetch();
              }}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-accent)] px-5 py-3 font-semibold text-white transition-all hover:bg-[var(--color-accent-light)]"
            >
              Try Again
            </button>
            <Link
              to="/events"
              onClick={() => trackEvent('talk_details_back_to_events_click', { context: 'error_state' })}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] px-5 py-3 font-semibold text-[var(--color-text)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!talk) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center">
          <h1 className="mb-3 text-2xl text-[var(--color-primary)]">Talk Not Found</h1>
          <p className="mb-6 text-sm text-[var(--color-text-muted)]">
            This talk may have been removed or is no longer available.
          </p>
          <Link
            to="/events"
            onClick={() => trackEvent('talk_details_back_to_events_click', { context: 'not_found_state' })}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--color-accent)] px-5 py-3 font-semibold text-white transition-all hover:bg-[var(--color-accent-light)]"
          >
            Browse All Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-accent)]">Talk Details</p>
            <h1 className="mt-3 text-3xl text-[var(--color-primary)] md:text-4xl">{talk.title}</h1>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--color-text-muted)]">
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1">
                {talk.date}
              </span>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1">
                {talk.time}
              </span>
              <a
                href={getGoogleMapsSearchUrl(talk.location)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent('talk_details_location_click', {
                    event_id: talk.id,
                    event_title: talk.title,
                    location: talk.location,
                  })
                }
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                {talk.location}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-8">
              <h2 className="mb-3 text-2xl text-[var(--color-primary)]">Event Overview</h2>
              {talk.description ? (
                <p className="whitespace-pre-line text-[var(--color-text-muted)]">{talk.description}</p>
              ) : (
                <p className="text-[var(--color-text-muted)]">
                  This Eventbrite listing does not include a detailed description yet.
                </p>
              )}
            </article>

            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-8">
              <h2 className="mb-3 text-2xl text-[var(--color-primary)]">Talks & Speakers</h2>
              {talk.talks.length > 0 ? (
                <div className="space-y-4">
                  {talk.talks.map((eventTalk) => (
                    <div
                      key={`${talk.id}-${eventTalk.id}`}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                    >
                      <h3 className="text-lg font-semibold text-[var(--color-primary)]">{eventTalk.title}</h3>
                      {eventTalk.description && (
                        <p className="mt-2 whitespace-pre-line text-sm text-[var(--color-text-muted)]">
                          {eventTalk.description}
                        </p>
                      )}

                      <div className="mt-3 flex items-start gap-3">
                        {eventTalk.speaker?.photoUrl ? (
                          <img
                            src={eventTalk.speaker.photoUrl}
                            alt={`${eventTalk.speaker.fullName} profile`}
                            className="h-12 w-12 rounded-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-sm font-semibold text-[var(--color-accent)]">
                            {(eventTalk.speaker?.fullName || 'S').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-primary)]">
                            {eventTalk.speaker?.fullName || 'Speaker TBC'}
                          </p>
                          {eventTalk.speaker?.headline && (
                            <p className="text-xs text-[var(--color-text-muted)]">{eventTalk.speaker.headline}</p>
                          )}
                          {eventTalk.speaker?.bio && (
                            <p className="mt-1 text-xs text-[var(--color-text-muted)] line-clamp-3">
                              {eventTalk.speaker.bio}
                            </p>
                          )}
                          <div className="mt-2 flex gap-3 text-xs">
                            {eventTalk.speaker?.linkedinUrl && (
                              <a
                                href={eventTalk.speaker.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() =>
                                  trackEvent('talk_details_speaker_link_click', {
                                    event_id: talk.id,
                                    speaker_id: eventTalk.speaker?.id,
                                    link_type: 'linkedin',
                                  })
                                }
                                className="text-[var(--color-accent)] hover:underline"
                              >
                                LinkedIn
                              </a>
                            )}
                            {eventTalk.speaker?.websiteUrl && (
                              <a
                                href={eventTalk.speaker.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() =>
                                  trackEvent('talk_details_speaker_link_click', {
                                    event_id: talk.id,
                                    speaker_id: eventTalk.speaker?.id,
                                    link_type: 'website',
                                  })
                                }
                                className="text-[var(--color-accent)] hover:underline"
                              >
                                Website
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--color-text-muted)]">
                  Talk lineup has not been published yet.
                </p>
              )}
            </article>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-primary)]">Event Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Date</span>
                  <span className="font-medium text-[var(--color-primary)]">{talk.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Time</span>
                  <span className="font-medium text-[var(--color-primary)]">{talk.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">{talk.isUpcoming ? 'Available Seats' : 'Attendees'}</span>
                  <span className="font-medium text-[var(--color-primary)]">
                    {talk.isUpcoming
                      ? talk.seatsRemaining === null
                        ? 'N/A'
                        : talk.seatsRemaining
                      : talk.registrationCount === null
                        ? 'N/A'
                        : talk.registrationCount}
                  </span>
                </div>
              </div>
              {talk.isUpcoming && (
                <div className="mt-5 flex flex-col gap-3">
                  {talk.eventbriteUrl ? (
                    <a
                      href={talk.eventbriteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackEvent('talk_details_eventbrite_click', {
                          event_id: talk.id,
                          event_title: talk.title,
                          target: talk.eventbriteUrl,
                        })
                      }
                      className="inline-flex items-center justify-center rounded-xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-light)]"
                    >
                      Open on Eventbrite
                    </a>
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">
                      Eventbrite link coming soon
                    </span>
                  )}
                  <Link
                    to="/events"
                    onClick={() => trackEvent('talk_details_back_to_events_click', { context: 'upcoming_sidebar' })}
                    className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    Back to Events
                  </Link>
                </div>
              )}
            </section>

            {relatedTalks.length > 0 && (
              <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold text-[var(--color-primary)]">More Talks</h3>
                <div className="space-y-3">
                  {relatedTalks.map((event) => (
                    <Link
                      key={event.id}
                      to={`/talks/${event.id}`}
                      onClick={() =>
                        trackEvent('talk_details_related_talk_click', {
                          source_event_id: talk.id,
                          target_event_id: event.id,
                          target_event_title: event.title,
                        })
                      }
                      className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-all hover:border-[var(--color-accent)]"
                    >
                      <p className="line-clamp-2 text-sm font-medium text-[var(--color-primary)]">{event.title}</p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {event.month} {event.dayOfMonth}, {event.year}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
