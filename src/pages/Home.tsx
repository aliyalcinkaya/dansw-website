import { Link } from 'react-router-dom';

// Import event photos
import eventPhoto1 from '../assets/event_photos/eb6zidzueaajfa4-orig_orig.jpg';
import eventPhoto2 from '../assets/event_photos/pxl-20240214-073532395_orig.jpg';

// Import sponsor logos
import canvaLogo from '../assets/sponsor_logos/canva.png';
import imwtLogo from '../assets/sponsor_logos/imwt.webp';
import metriclabsLogo from '../assets/sponsor_logos/metriclabs.png';
import snowplowLogo from '../assets/sponsor_logos/snowplow.png';

// Placeholder for Eventbrite integration
const upcomingEvents = [
  {
    id: 1,
    title: 'Upcoming Talk - Coming Soon',
    date: 'TBA',
    time: 'TBA',
    location: 'Sydney CBD',
    description: 'Stay tuned for our next exciting talk!',
    isPlaceholder: true,
  },
];

export function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-surface)] via-white to-blue-50">
        {/* Background decoration */}
        <div className="absolute inset-0 data-dots"></div>
        {/* Event photos collage */}
        <div className="absolute top-0 right-0 w-1/2 h-full hidden md:flex items-center justify-center p-8">
          <div className="relative w-full max-w-md">
            <div className="absolute -top-4 -right-4 w-48 h-48 lg:w-64 lg:h-64 rounded-2xl overflow-hidden shadow-2xl rotate-6 animate-fade-in-up">
              <img src={eventPhoto1} alt="DAW Sydney Event" className="w-full h-full object-cover" />
            </div>
            <div className="absolute top-20 -left-8 w-56 h-56 lg:w-72 lg:h-72 rounded-2xl overflow-hidden shadow-2xl -rotate-3 animate-fade-in-up animate-delay-200">
              <img src={eventPhoto2} alt="DAW Sydney Event" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-sm font-medium mb-6 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent)]"></span>
              </span>
              Sydney's Premier Analytics Community
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl text-[var(--color-primary)] mb-6 animate-fade-in-up animate-delay-100">
              Join Sydney's biggest{' '}
              <span className="italic text-[var(--color-accent)]">analytics</span>{' '}
              community
            </h1>
            
            <p className="text-lg md:text-xl text-[var(--color-text-muted)] mb-8 leading-relaxed animate-fade-in-up animate-delay-200">
              Data & Analytics Wednesday brings together professionals, students, 
              and enthusiasts every month to share knowledge, network, and grow together.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animate-delay-300">
              <Link
                to="/join"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all hover:scale-105 shadow-lg shadow-[var(--color-accent)]/25"
              >
                Join the Community
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                to="/previous-talks"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-[var(--color-text)] font-semibold border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all"
              >
                View Previous Talks
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-20 bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl text-[var(--color-primary)] mb-4">
              Upcoming Events
            </h2>
            <p className="text-[var(--color-text-muted)] max-w-2xl mx-auto">
              Don't miss our next meetup! We host events on the last Wednesday of every month.
            </p>
          </div>

          <div className="grid gap-6">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="relative bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-8 shadow-sm hover:shadow-md transition-all group"
              >
                {event.isPlaceholder && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                    Coming Soon
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Date badge */}
                  <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-chart-2)] flex flex-col items-center justify-center text-white">
                    <span className="text-2xl font-bold">TBA</span>
                    <span className="text-xs uppercase tracking-wider opacity-80">2024</span>
                  </div>
                  
                  {/* Event details */}
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
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </span>
                    </div>
                    <p className="mt-3 text-[var(--color-text-muted)]">{event.description}</p>
                  </div>
                  
                  {/* CTA */}
                  <div className="flex-shrink-0">
                    <a
                      href="https://www.eventbrite.com.au/o/data-analytics-wednesday-sydney-8179498448"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-surface-alt)] text-[var(--color-text)] font-medium hover:bg-[var(--color-accent)] hover:text-white transition-all"
                    >
                      View on Eventbrite
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Eventbrite integration note */}
          <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-700 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Note:</strong> Events will be automatically pulled from Eventbrite once the integration is configured.
                For now, check our{' '}
                <a 
                  href="https://www.eventbrite.com.au/o/data-analytics-wednesday-sydney-8179498448" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  Eventbrite page
                </a>{' '}
                for the latest events.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
                About Us
              </span>
              <h2 className="text-3xl md:text-4xl text-[var(--color-primary)] mt-2 mb-6">
                Digital Analytics NSW Inc.
              </h2>
              <p className="text-[var(--color-text-muted)] mb-6 leading-relaxed">
                We are the incorporated association that runs Data & Analytics Wednesday Sydney 
                and MeasureCamp Sydney. Our community is made up of a diverse group of data and 
                analytics enthusiasts and professionals.
              </p>
              <p className="text-[var(--color-text-muted)] mb-8 leading-relaxed">
                Our mission is to promote and enhance our industry by running amazing events, 
                fostering connections, and sharing knowledge across the Sydney analytics community.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center text-[var(--color-accent)] font-semibold hover:gap-3 transition-all gap-2"
              >
                Learn more about us
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            
            {/* Visual element */}
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-[var(--color-accent)]/10 via-[var(--color-chart-2)]/10 to-[var(--color-chart-3)]/10 p-8">
                <div className="w-full h-full rounded-2xl bg-white shadow-xl p-6 flex flex-col justify-center">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-[var(--color-chart-1)]"></div>
                      <div className="flex-grow h-4 rounded bg-[var(--color-chart-1)]/20"></div>
                      <span className="text-sm font-mono text-[var(--color-text-muted)]">45%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-[var(--color-chart-2)]"></div>
                      <div className="flex-grow h-4 rounded bg-[var(--color-chart-2)]/20" style={{ width: '70%' }}></div>
                      <span className="text-sm font-mono text-[var(--color-text-muted)]">32%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-[var(--color-chart-3)]"></div>
                      <div className="flex-grow h-4 rounded bg-[var(--color-chart-3)]/20" style={{ width: '50%' }}></div>
                      <span className="text-sm font-mono text-[var(--color-text-muted)]">23%</span>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Community Growth</p>
                    <p className="text-2xl font-bold text-[var(--color-primary)]">+127% <span className="text-sm font-normal text-[var(--color-success)]">YoY</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[var(--color-primary)] to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl mb-6">
            Ready to share your knowledge?
          </h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            We're always looking for passionate speakers to share their insights, 
            experiences, and expertise with our community.
          </p>
          <Link
            to="/become-a-speaker"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-[var(--color-primary)] font-semibold hover:bg-[var(--color-accent)] hover:text-white transition-all hover:scale-105"
          >
            Become a Speaker
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="py-16 bg-white border-y border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-[var(--color-text-muted)] uppercase tracking-wider mb-8">
            Proudly supported by
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <a href="https://www.canva.com" target="_blank" rel="noopener noreferrer" className="grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all">
              <img src={canvaLogo} alt="Canva" className="h-10 w-auto" />
            </a>
            <a href="https://www.yoursite.com" target="_blank" rel="noopener noreferrer" className="grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all">
              <img src={imwtLogo} alt="IMWT" className="h-10 w-auto" />
            </a>
            <a href="https://www.metriclabs.com.au" target="_blank" rel="noopener noreferrer" className="grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all">
              <img src={metriclabsLogo} alt="Metric Labs" className="h-10 w-auto" />
            </a>
            <a href="https://www.snowplow.io" target="_blank" rel="noopener noreferrer" className="grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all">
              <img src={snowplowLogo} alt="Snowplow" className="h-10 w-auto" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

