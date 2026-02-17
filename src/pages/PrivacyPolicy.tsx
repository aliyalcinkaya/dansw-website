import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
  const updatedAt = 'February 17, 2026';

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] mb-6"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mb-4">Privacy Policy</h1>
          <p className="text-[var(--color-text-muted)]">
            Last updated: {updatedAt}
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-8 space-y-8">
            <article>
              <h2 className="text-2xl text-[var(--color-primary)] mb-3">What We Collect</h2>
              <p className="text-[var(--color-text-muted)] leading-relaxed">
                We collect contact details that you submit through forms on this site, such as name and email address.
                This includes newsletter signups, speaker submissions, sponsor inquiries, member or volunteer applications,
                and job applications.
              </p>
            </article>

            <article>
              <h2 className="text-2xl text-[var(--color-primary)] mb-3">How We Use Your Data</h2>
              <p className="text-[var(--color-text-muted)] leading-relaxed">
                We use submitted data to respond to your requests, manage community events, send newsletter updates,
                and operate community services like the job board.
              </p>
            </article>

            <article>
              <h2 className="text-2xl text-[var(--color-primary)] mb-3">Storage and Access</h2>
              <p className="text-[var(--color-text-muted)] leading-relaxed">
                Form submissions are processed through our service providers and internal admin tools.
                Access is limited to organizers and authorized administrators who need the data for operations.
              </p>
            </article>

            <article>
              <h2 className="text-2xl text-[var(--color-primary)] mb-3">Your Choices</h2>
              <p className="text-[var(--color-text-muted)] leading-relaxed">
                You can unsubscribe from newsletters at any time using the unsubscribe link in email updates.
                For data access, correction, or deletion requests, please contact us directly.
              </p>
            </article>

            <article>
              <h2 className="text-2xl text-[var(--color-primary)] mb-3">Contact</h2>
              <p className="text-[var(--color-text-muted)] leading-relaxed">
                For privacy questions or requests, email{' '}
                <a href="mailto:hello@dawsydney.org.au" className="text-[var(--color-accent)] hover:underline">
                  hello@dawsydney.org.au
                </a>
                .
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
