import { Link } from 'react-router-dom';
import { JOB_PACKAGES } from '../services/jobs';
import { trackEvent } from '../services/analytics';

export function JobPostPlans() {
  const paymentsDisabled = import.meta.env.VITE_JOBS_DISABLE_PAYMENTS?.trim().toLowerCase() === 'true';

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <Link
            to="/jobs"
            onClick={() => trackEvent('job_post_plans_back_click', { target: '/jobs' })}
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
            Reach Sydney’s Most Engaged Data & Analytics Talent
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] leading-relaxed max-w-5xl">
          Connect with a high-intent community of experienced professionals, career switchers, and emerging graduates actively looking for their next opportunity.
          Choose a plan and publish your role. 
          </p>
          <h2 className="text-2xl md:text-3xl text-[var(--color-primary)] mt-10 mb-6">
            Why post with DAWS
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-5xl">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-1">Targeted, high-quality audience</h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                Your role is seen by people who are already part of the data &amp; analytics ecosystem — not a generic job board.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-1">Active job seekers</h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                Our members attend events, subscribe to the newsletter, and regularly engage with the community to find their next role.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-1">All experience levels</h3>
              <ul className="text-[var(--color-text-muted)] text-sm leading-relaxed space-y-1 mt-1">
                <li className="flex items-start gap-2"><span className="text-[var(--color-accent)] mt-0.5">•</span>Senior practitioners and hiring-ready specialists</li>
                <li className="flex items-start gap-2"><span className="text-[var(--color-accent)] mt-0.5">•</span>Mid-career professionals growing into leadership roles</li>
                <li className="flex items-start gap-2"><span className="text-[var(--color-accent)] mt-0.5">•</span>New graduates and structured career switchers into data</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-1">Local and relevant</h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                Reach Sydney-based candidates who can attend meetups, start quickly, and become long-term contributors to your team.
              </p>
            </div>
            <div className="sm:col-span-2">
              <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-1">Trusted community signal</h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                Roles shared through DAWS carry credibility because they are curated and reviewed.
              </p>
            </div>
          </div>
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
                  onClick={() =>
                    trackEvent('job_post_plan_select', {
                      plan_type: pkg.type,
                      plan_price_aud: pkg.priceAUD,
                    })
                  }
                  className="mt-auto inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all"
                >
                  Select Plan
                </Link>
              </article>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-8 space-y-6">
            <h2 className="text-2xl text-[var(--color-primary)]">How it works</h2>
            <ol className="grid md:grid-cols-4 gap-0 md:gap-0">
              {[
                { step: '1', title: 'Choose a plan', desc: 'Pick the package that suits your hiring needs.' },
                { step: '2', title: 'Complete payment', desc: paymentsDisabled ? 'Payment step is currently skipped.' : 'Quick, secure checkout via Stripe.' },
                { step: '3', title: 'Submit your role', desc: 'Add the job details — title, description, and how to apply.' },
                { step: '4', title: 'Go live', desc: 'Admin review and approval within 48 hours.' },
              ].map((item, i) => (
                <li key={item.step} className="relative flex md:flex-col items-start gap-4 md:gap-0 md:items-center md:text-center p-4 md:px-5 md:py-6">
                  {i < 3 && (
                    <div className="hidden md:block absolute top-10 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-px border-t-2 border-dashed border-[var(--color-border)]" />
                  )}
                  <span className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </span>
                  <div className="md:mt-3">
                    <p className="text-sm font-semibold text-[var(--color-primary)]">{item.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            {paymentsDisabled && (
              <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] rounded-lg px-4 py-2 border border-[var(--color-border)]">
                Test mode is active. Stripe checkout is skipped and your listing can be submitted directly for review.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
