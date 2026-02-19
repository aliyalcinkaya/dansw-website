import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { DisplayEvent } from '../types/eventbrite';
import { getGoogleMapsSearchUrl } from '../utils/maps';

const eventbriteOrgUrl = 'https://www.eventbrite.com.au/o/data-analytics-wednesday-sydney-8179498448';

interface UpcomingEventsSectionProps {
  events: DisplayEvent[];
  loading: boolean;
  error: string | null;
  showArchiveLink?: boolean;
  onRetry?: () => void;
}

export function UpcomingEventsSection({
  events,
  loading,
  error,
  showArchiveLink = true,
  onRetry,
}: UpcomingEventsSectionProps) {
  const upcomingEvents = useMemo(
    () =>
      events
        .filter((event) => event.isUpcoming)
        .sort((a, b) => new Date(a.startLocal).getTime() - new Date(b.startLocal).getTime()),
    [events]
  );

  const getTicketStatus = (event: DisplayEvent) => {
    if (event.seatCapacity !== null && event.seatsRemaining !== null) {
      if (event.seatsRemaining <= 0) {
        return {
          label: 'Booked Out',
          className: 'text-red-600',
        };
      }

      if (event.seatCapacity > 0 && event.seatsRemaining / event.seatCapacity < 0.2) {
        return {
          label: 'Limited Spots',
          className: 'text-amber-600',
        };
      }
    }

    return {
      label: 'Tickets Available',
      className: 'text-emerald-600',
    };
  };

  return (
    <section className="py-20 bg-[var(--color-surface)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-3xl md:text-4xl text-[var(--color-primary)]">Upcoming Events</h2>
          <p className="text-[var(--color-text-muted)] max-w-2xl mx-auto">
          Attendance is free, but registration is required as spaces are limited. Secure your ticket for the next meetup. 
          </p>
        </div>

        <div className="grid gap-6">
          {loading && (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8 text-center">
              <div className="inline-flex items-center gap-3 text-[var(--color-text-muted)]">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading upcoming events...
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="bg-white rounded-2xl border border-red-200 p-8">
              <div className="text-center">
                <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-[var(--color-text-muted)] mb-4">Unable to load events at the moment.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-light)] transition-all"
                    >
                      Try Again
                    </button>
                  )}
                  <a
                    href={eventbriteOrgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-[var(--color-text)] border border-[var(--color-border)] font-medium hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all"
                  >
                    View Events on Eventbrite
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          )} 

          {!loading && !error && upcomingEvents.length === 0 && (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8">
              <div className="text-center">
                <svg className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg text-[var(--color-primary)] mb-2">No upcoming events scheduled</p>
                <p className="text-[var(--color-text-muted)] mb-6">
                  <a
                    href="#newsletter-signup"
                    className="font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-light)] transition-colors"
                  >
                    Sign Up to Our Newsletter
                  </a>{' '}
                  for announcements.
                </p>
              </div>
            </div>
          )}

          {!loading && !error && upcomingEvents.map((event) => {
            const ticketUrl = event.eventbriteUrl || (event.url !== '#' ? event.url : null);

            return (
              <div
                key={event.id}
                className="relative bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-8 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center text-white event-gradient">
                    <span className="text-2xl font-bold">{event.dayOfMonth}</span>
                    <span className="text-xs uppercase tracking-wider opacity-80">{event.month}</span>
                  </div>

                  <div className="flex-grow">
                    <h3 className="text-xl md:text-2xl text-[var(--color-primary)] mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {event.time}
                      </span>
                      <a
                        href={getGoogleMapsSearchUrl(event.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-[var(--color-accent)] hover:underline transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </a>
                    </div>
                    {event.description && (
                      <p className="mt-3 text-[var(--color-text-muted)] whitespace-pre-line">{event.description}</p>
                    )}

                    {event.talks.length > 0 && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {event.talks.slice(0, 2).map((talk) => (
                          <article
                            key={`${event.id}-${talk.id}`}
                            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                          >
                            <p className="text-sm font-semibold text-[var(--color-primary)] line-clamp-1">{talk.title}</p>
                            <div className="mt-2 flex items-center gap-2">
                              {talk.speaker?.photoUrl ? (
                                <img
                                  src={talk.speaker.photoUrl}
                                  alt={`${talk.speaker.fullName} profile`}
                                  className="h-8 w-8 rounded-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-xs font-semibold text-[var(--color-accent)]">
                                  {(talk.speaker?.fullName || 'T').slice(0, 1).toUpperCase()}
                                </div>
                              )}
                              <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">
                                {talk.speaker?.fullName || 'Speaker TBC'}
                              </p>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <div className="flex flex-col items-center gap-2">
                      {ticketUrl ? (
                        <a
                          href={ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]"
                        >
                          <svg className="w-[1.3rem] h-[1.3rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                          Get Tickets
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium bg-slate-200 text-slate-600">
                          Ticket link coming soon
                        </span>
                      )}
                      <p className={`text-xs font-semibold text-center ${getTicketStatus(event).className}`}>
                        {getTicketStatus(event).label}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showArchiveLink && !loading && !error && (
          <div className="mt-6 text-center">
            <Link
              to="/previous-talks"
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:underline"
            >
              See old events
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
