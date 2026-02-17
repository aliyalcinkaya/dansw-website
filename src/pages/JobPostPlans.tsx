import { Link } from 'react-router-dom';
import { JOB_PACKAGES } from '../services/jobs';

export function JobPostPlans() {
  const paymentsDisabled = import.meta.env.VITE_JOBS_DISABLE_PAYMENTS?.trim().toLowerCase() === 'true';

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <Link
            to="/jobs"
            className="flex w-fit items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] mb-6"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to jobs
          </Link>

          <span className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
            Posting Jobs at DAW Sydney
          </span>
          <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mt-2 mb-5">
            Reach the Data & Analytics Community
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] leading-relaxed max-w-3xl">
            Choose a plan first, then continue to your job listing form. Every submitted listing is reviewed and
            approved within 48 hours.
          </p>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="grid md:grid-cols-2 gap-5">
            {JOB_PACKAGES.map((pkg) => (
              <article
                key={pkg.type}
                className="bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-7 flex flex-col"
              >
                <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">{pkg.title}</p>
                <p className="text-4xl text-[var(--color-primary)] mb-2">${pkg.priceAUD}</p>
                <p className="text-sm text-[var(--color-text-muted)] mb-5">{pkg.description}</p>

                <ul className="space-y-2 mb-6">
                  {pkg.benefits.map((benefit) => (
                    <li key={benefit} className="text-sm text-[var(--color-text-muted)] flex items-start gap-2">
                      <span className="text-[var(--color-accent)] mt-1">•</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/jobs/submit?plan=${pkg.type}`}
                  className="mt-auto inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all"
                >
                  Select Plan
                </Link>
              </article>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-8 space-y-4">
            <h2 className="text-2xl text-[var(--color-primary)]">How it works</h2>
            <ol className="grid md:grid-cols-4 gap-4 text-sm text-[var(--color-text-muted)]">
              <li className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
                1. Choose a plan.
              </li>
              <li className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
                2. Payment step {paymentsDisabled ? 'is currently skipped.' : 'is completed securely via Stripe.'}
              </li>
              <li className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
                3. Add your role details and submit.
              </li>
              <li className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
                4. Admin review and approval within 48 hours.
              </li>
            </ol>
            {paymentsDisabled && (
              <p className="text-xs text-[var(--color-text-muted)]">
                Test mode is active. Stripe checkout is skipped and your listing can be submitted directly for review.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
