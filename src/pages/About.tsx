import { Link } from 'react-router-dom';

const slackInviteUrl =
  'https://digitalanalyticsnsw.slack.com/join/shared_invite/zt-3mmkotolj-ph8HO7SAO9Z5lx1RDClEZQ?mc_cid=855b22f969&mc_eid=4f57692826#/shared-invite/email';

const impactMetrics = [
  { label: 'Years Running', value: '10+' },
  { label: 'Events Hosted', value: '100+' },
  { label: 'Community Members', value: '7,900+' },
  { label: 'Average Yearly Meetups', value: '10-12' },
];

const committeeRoles = [
  {
    title: 'Organisers',
    description: 'Coordinate venues, schedules, and event operations across the year.',
  },
  {
    title: 'Speaker Wranglers',
    description: 'Source, support, and coach speakers through topic selection and prep.',
  },
  {
    title: 'Community & Partnerships',
    description: 'Grow relationships with members, volunteers, and sponsor partners.',
  },
  {
    title: 'Digital & Content',
    description: 'Run website, social updates, newsletter distribution, and event recaps.',
  },
];

export function About() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <div className="max-w-3xl">
            <span className="text-sm font-semibold uppercase tracking-wider text-[var(--color-accent)]">
              Who We Are
            </span>
            <h1 className="mt-2 text-4xl text-[var(--color-primary)] md:text-5xl">
              Digital Analytics NSW Inc.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[var(--color-text-muted)]">
              We are the incorporated association behind Data & Analytics Wednesday Sydney and MeasureCamp Sydney.
              Our goal is simple: build a practical, welcoming community where analytics professionals learn, share,
              and connect.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-8">
              <h2 className="mb-4 text-2xl text-[var(--color-primary)]">Our Mission</h2>
              <p className="mb-4 leading-relaxed text-[var(--color-text-muted)]">
                We exist to strengthen the analytics profession in Sydney by creating consistent, high-quality spaces
                for learning and collaboration. We support everyone from early-career practitioners to experienced
                leaders.
              </p>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                Through regular events and community initiatives, we help people build technical capability, expand
                professional networks, and share practical examples from real-world teams.
              </p>
            </article>

            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-8">
              <h2 className="mb-4 text-2xl text-[var(--color-primary)]">What We Do</h2>
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)]">Monthly DAW Meetups</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    Practical talks and networking sessions covering analytics strategy, implementation, reporting,
                    experimentation, and career growth.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)]">MeasureCamp Sydney</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    Our annual unconference where attendees shape the agenda on the day and share expertise in an open
                    format.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)]">Community Development</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    Ongoing volunteer contributions across speaker support, event logistics, partnerships, and digital
                    channels.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-8">
              <h2 className="mb-4 text-2xl text-[var(--color-primary)]">Our Journey</h2>
              <p className="mb-5 leading-relaxed text-[var(--color-text-muted)]">
                DAW Sydney began as a small meetup for analytics practitioners and has grown into one of Sydney&apos;s
                most active analytics communities.
              </p>
              <ul className="space-y-3 text-sm text-[var(--color-text-muted)]">
                <li className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  Built a recurring meetup rhythm focused on practical, community-led sessions.
                </li>
                <li className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  Expanded from monthly events to include MeasureCamp and broader collaboration opportunities.
                </li>
                <li className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  Incorporated as Digital Analytics NSW Inc. to support long-term sustainability and governance.
                </li>
              </ul>
            </article>

            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-8">
              <h2 className="mb-4 text-2xl text-[var(--color-primary)]">Our Team</h2>
              <p className="mb-6 text-sm leading-relaxed text-[var(--color-text-muted)]">
                DAW Sydney is volunteer-led. We are a working committee of practitioners contributing time each month
                to keep events consistent, inclusive, and high quality.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {committeeRoles.map((role) => (
                  <div key={role.title} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <h3 className="text-base font-semibold text-[var(--color-primary)]">{role.title}</h3>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">{role.description}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <h3 className="mb-1 text-lg font-semibold text-[var(--color-primary)]">Impact Snapshot</h3>
              <p className="mb-4 text-xs text-[var(--color-text-muted)]">As of February 2026</p>
              <div className="space-y-3">
                {impactMetrics.map((metric) => (
                  <div key={metric.label} className="flex items-center justify-between rounded-lg bg-[var(--color-surface)] px-3 py-2">
                    <span className="text-sm text-[var(--color-text-muted)]">{metric.label}</span>
                    <span className="font-semibold text-[var(--color-primary)]">{metric.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <h3 className="mb-3 text-lg font-semibold text-[var(--color-primary)]">Contact & Community</h3>
              <div className="space-y-3 text-sm">
                <a
                  href="mailto:commitee@wawsydney.com"
                  className="flex items-center gap-3 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  commitee@wawsydney.com
                </a>
                <a
                  href="https://www.linkedin.com/company/data-and-analytics-wednesday-sydney/posts/?feedView=all"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  LinkedIn Page
                </a>
                <a
                  href={slackInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
                >
                  <img src="/slack_logo.png" alt="" aria-hidden="true" className="h-5 w-5" />
                  Slack Community
                </a>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <h3 className="mb-3 text-lg font-semibold text-[var(--color-primary)]">Governance</h3>
              <p className="mb-4 text-sm text-[var(--color-text-muted)]">
                Review our constitution, standards, and member expectations.
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="/pdfs/model_constitution.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] transition-all hover:gap-3"
                >
                  Download Constitution
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </a>
                <Link to="/code-of-conduct" className="text-sm text-[var(--color-accent)] hover:underline">
                  Read Code of Conduct
                </Link>
              </div>
            </section>

            <section className="rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-chart-2)] p-6 text-white">
              <h3 className="text-xl font-semibold">Want to Contribute?</h3>
              <p className="mt-3 text-sm text-white/95">
                Our volunteer team is always looking for help across events, speakers, operations, and digital.
              </p>
              <Link
                to="/join"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:bg-white/90"
              >
                View Volunteer Roles
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}
