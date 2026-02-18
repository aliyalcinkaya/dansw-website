import { Link } from 'react-router-dom';

export function About() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Header */}
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
              Who We Are
            </span>
            <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mt-2 mb-6">
              Digital Analytics NSW Inc.
            </h1>
            <p className="text-lg text-[var(--color-text-muted)] leading-relaxed">
              The incorporated association behind Data & Analytics Wednesday Sydney 
              and MeasureCamp Sydney.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-8">
                <h2 className="text-2xl text-[var(--color-primary)] mb-4">Our Mission</h2>
                <p className="text-[var(--color-text-muted)] leading-relaxed mb-4">
                  Digital Analytics NSW Inc. exists to promote and enhance the data and analytics 
                  industry in Sydney and across Australia. We're made up of a diverse group of 
                  enthusiasts and professionals who are passionate about sharing knowledge and 
                  building community.
                </p>
                <p className="text-[var(--color-text-muted)] leading-relaxed">
                  Our primary activities include running Data & Analytics Wednesday Sydney (DAWS) 
                  - a monthly meetup series, and MeasureCamp Sydney - an annual unconference for 
                  the analytics community.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-8">
                <h2 className="text-2xl text-[var(--color-primary)] mb-4">What We Do</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-primary)] mb-1">Monthly Meetups</h3>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        We host talks on the last Wednesday of every month, featuring speakers from 
                        across the industry sharing insights, case studies, and best practices.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-chart-2)]/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-primary)] mb-1">MeasureCamp Sydney</h3>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        An annual "unconference" where the agenda is created by attendees on the day. 
                        It's a unique format that encourages participation and knowledge sharing.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-chart-3)]/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[var(--color-chart-3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-primary)] mb-1">Community Building</h3>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        Beyond events, we foster connections through networking opportunities, 
                        online discussions, and community resources.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-8">
                <h2 className="text-2xl text-[var(--color-primary)] mb-4">Our History</h2>
                <p className="text-[var(--color-text-muted)] leading-relaxed mb-4">
                  Data & Analytics Wednesday Sydney started over a decade ago as a small gathering 
                  of analytics enthusiasts. What began as informal meetups has grown into one of 
                  Sydney's most active professional communities in the data space.
                </p>
                <p className="text-[var(--color-text-muted)] leading-relaxed">
                  We became an incorporated association to better serve our community, provide 
                  structure for our events, and ensure the longevity of the community we've built 
                  together.
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Membership CTA */}
              <div className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-chart-2)] rounded-2xl p-6 text-white">
                <h3 className="text-xl font-semibold mb-3">Want to Contribute?</h3>
                <p className="text-white text-sm mb-4">
                  Join Digital Analytics NSW Inc. and help shape the future of our community.
                </p>
                <Link
                  to="/become-a-member"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[var(--color-accent)] font-semibold text-sm hover:bg-white/90 transition-colors"
                >
                  Volunteer
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              {/* Constitution */}
              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-3">Constitution</h3>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                  Our constitution governs how we operate and make decisions.
                </p>
                <a
                  href="/pdfs/model_constitution.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[var(--color-accent)] text-sm font-medium hover:gap-3 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </a>
              </div>

              {/* Contact */}
              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-3">Get in Touch</h3>
                <div className="space-y-3">
                  <a
                    href="mailto:commitee@wawsydney.com"
                    className="flex items-center gap-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    commitee@wawsydney.com
                  </a>
                  <a
                    href="https://www.linkedin.com/company/data-and-analytics-wednesday-sydney/posts/?feedView=all"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    LinkedIn
                  </a>
                  <a
                    href="https://www.meetup.com/data-and-analytics-wednesday-sydney/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Meetup Group
                  </a>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-[var(--color-surface-alt)] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4">Community Stats</h3>
                <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--color-text-muted)]">Years Running</span>
                    <span className="font-semibold text-[var(--color-primary)]">10+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--color-text-muted)]">Events Hosted</span>
                    <span className="font-semibold text-[var(--color-primary)]">100+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--color-text-muted)]">Community Members</span>
                    <span className="font-semibold text-[var(--color-primary)]">7900+</span>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


