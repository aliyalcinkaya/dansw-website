import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePastEvents } from '../hooks/usePastEvents';
import { getGoogleMapsSearchUrl } from '../utils/maps';

export function PreviousTalks() {
  const { events, loading, error } = usePastEvents();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter(event => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Header */}
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
              Event Archive
            </span>
            <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mt-2 mb-6">
              Previous Events
            </h1>
            <p className="text-lg text-[var(--color-text-muted)] leading-relaxed">
              Explore our past Data & Analytics Wednesday events. 
              From technical deep-dives to networking sessions, see what our community has been up to.
            </p>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="sticky top-16 z-40 bg-white/80 backdrop-blur-lg border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
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
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
              />
            </div>

            {/* Event count */}
            <div className="text-sm text-[var(--color-text-muted)]">
              {!loading && `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <div className="inline-flex items-center gap-3 text-[var(--color-text-muted)]">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading past events...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-xl text-[var(--color-primary)] mb-2">Unable to load events</h3>
              <p className="text-[var(--color-text-muted)] mb-4">{error}</p>
              <a
                href="https://www.eventbrite.com.au/o/data-analytics-wednesday-sydney-8179498448"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[var(--color-accent)] font-medium hover:underline"
              >
                View events on Eventbrite
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {/* No Events */}
          {!loading && !error && filteredEvents.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-[var(--color-border)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl text-[var(--color-primary)] mb-2">
                {searchQuery ? 'No events found' : 'No past events yet'}
              </h3>
              <p className="text-[var(--color-text-muted)]">
                {searchQuery ? 'Try adjusting your search.' : 'Check back after our next event!'}
              </p>
            </div>
          )}

          {/* Events List */}
          {!loading && !error && filteredEvents.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, index) => (
                <article
                  key={event.id}
                  className="group bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Colored header */}
                  <div className="h-2 event-gradient"></div>
                  
                  <div className="p-6">
                    {/* Date badge */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-xl event-gradient flex flex-col items-center justify-center text-white">
                        <span className="text-lg font-bold leading-none">{event.dayOfMonth}</span>
                        <span className="text-[10px] uppercase tracking-wider opacity-80">{event.month}</span>
                      </div>
                      <div>
                        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                          {event.year}
                        </span>
                        <p className="text-sm text-[var(--color-text-muted)]">{event.time}</p>
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl text-[var(--color-primary)] mb-3 group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    
                    {/* Location */}
                    <a
                      href={getGoogleMapsSearchUrl(event.location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-3 hover:text-[var(--color-accent)] hover:underline transition-colors"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{event.location}</span>
                    </a>
                    
                    {/* Description */}
                    {event.description && (
                      <p className="text-sm text-[var(--color-text-muted)] mb-4 line-clamp-3">
                        {event.description}
                      </p>
                    )}
                    
                    {/* Action */}
                    <a 
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View on Eventbrite
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to action */}
      <section className="py-16 bg-white border-t border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl text-[var(--color-primary)] mb-4">
            Have a story to share?
          </h2>
          <p className="text-[var(--color-text-muted)] mb-6">
            We're always looking for speakers to share their experiences and insights with our community.
          </p>
          <Link
            to="/become-a-speaker"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all"
          >
            Submit a Talk Proposal
          </Link>
        </div>
      </section>
    </div>
  );
}
