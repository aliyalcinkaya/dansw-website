export function CodeOfConduct() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Header */}
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
              Community Guidelines
            </span>
            <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mt-2 mb-6">
              Code of Conduct
            </h1>
            <p className="text-lg text-[var(--color-text-muted)] leading-relaxed">
              We are dedicated to providing a harassment-free experience for everyone, 
              regardless of gender, gender identity and expression, age, sexual orientation, 
              disability, physical appearance, body size, race, ethnicity, religion, 
              or technology choices.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
            <div className="p-6 md:p-10 space-y-8">
              {/* Quick Summary */}
              <div className="p-6 rounded-xl bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20">
                <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-3">
                  The Quick Version
                </h2>
                <p className="text-[var(--color-text-muted)]">
                  Be respectful, be professional, be kind. We're all here to learn and grow together. 
                  If someone asks you to stop a behavior, please do so. If you witness harassment, 
                  report it to an organizer immediately.
                </p>
              </div>

              {/* Expected Behavior */}
              <div>
                <h2 className="text-2xl text-[var(--color-primary)] mb-4 flex items-center gap-3">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  Expected Behavior
                </h2>
                <ul className="space-y-3 text-[var(--color-text-muted)]">
                  {[
                    'Be welcoming and inclusive to all participants',
                    'Be respectful of different viewpoints and experiences',
                    'Gracefully accept constructive criticism',
                    'Focus on what is best for the community',
                    'Show empathy towards other community members',
                    'Use welcoming and inclusive language',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[var(--color-success)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Unacceptable Behavior */}
              <div>
                <h2 className="text-2xl text-[var(--color-primary)] mb-4 flex items-center gap-3">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-chart-5)]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--color-chart-5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                  Unacceptable Behavior
                </h2>
                <ul className="space-y-3 text-[var(--color-text-muted)]">
                  {[
                    'Harassment, intimidation, or discrimination in any form',
                    'Verbal abuse, including comments related to gender, sexual orientation, disability, physical appearance, race, or religion',
                    'Sexual language and imagery in any venue or communication',
                    'Sustained disruption of talks or other events',
                    'Inappropriate physical contact or unwelcome sexual attention',
                    'Advocating for or encouraging any of the above behaviors',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[var(--color-chart-5)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Reporting */}
              <div className="p-6 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
                <h2 className="text-xl text-[var(--color-primary)] mb-4">
                  Reporting Violations
                </h2>
                <p className="text-[var(--color-text-muted)] mb-4">
                  If you experience or witness unacceptable behavior, or have any other concerns, 
                  please report it by contacting an event organizer or emailing us directly.
                </p>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a 
                    href="mailto:hello@dawsydney.org.au" 
                    className="text-[var(--color-accent)] font-medium hover:underline"
                  >
                    hello@dawsydney.org.au
                  </a>
                </div>
              </div>

              {/* Consequences */}
              <div>
                <h2 className="text-2xl text-[var(--color-primary)] mb-4">
                  Consequences
                </h2>
                <p className="text-[var(--color-text-muted)] mb-4">
                  Participants asked to stop any harassing behavior are expected to comply immediately. 
                  Organizers may take any action they deem appropriate, including:
                </p>
                <ul className="space-y-2 text-[var(--color-text-muted)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-text-muted)]">•</span>
                    Warning the offender
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-text-muted)]">•</span>
                    Expulsion from the event without refund
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-text-muted)]">•</span>
                    Banning from future events
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-text-muted)]">•</span>
                    Reporting to appropriate authorities if necessary
                  </li>
                </ul>
              </div>

              {/* Scope */}
              <div>
                <h2 className="text-2xl text-[var(--color-primary)] mb-4">
                  Scope
                </h2>
                <p className="text-[var(--color-text-muted)]">
                  This Code of Conduct applies to all DAWSydney and Digital Analytics NSW Inc. 
                  community spaces, both online and offline, including our monthly meetups, 
                  MeasureCamp Sydney, social events, and any other events we organize. 
                  It also applies to one-on-one communications in the context of community business.
                </p>
              </div>

              {/* Attribution */}
              <div className="pt-6 border-t border-[var(--color-border)]">
                <p className="text-sm text-[var(--color-text-muted)]">
                  This Code of Conduct is adapted from the{' '}
                  <a 
                    href="https://www.contributor-covenant.org/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    Contributor Covenant
                  </a>
                  {' '}and the{' '}
                  <a 
                    href="https://confcodeofconduct.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    Conference Code of Conduct
                  </a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}




