import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { submitNewsletterSubscription } from '../services/forms';
import { trackEvent } from '../services/analytics';

export function NewsletterSignup() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');
    setStatusMessage('');
    trackEvent('newsletter_subscribe_submit', {
      source: 'newsletter_section',
    });

    try {
      const result = await submitNewsletterSubscription({
        source: 'newsletter-section',
        email: newsletterEmail,
        website,
      });

      if (!result.ok) {
        setStatus('error');
        setStatusMessage(result.message ?? 'Unable to subscribe right now.');
        trackEvent('newsletter_subscribe_error', {
          source: 'newsletter_section',
          message: result.message ?? 'Unable to subscribe right now.',
        });
        return;
      }

      setStatus('success');
      setStatusMessage(result.message ?? 'Subscribed. You will receive updates on events and community news.');
      setNewsletterEmail('');
      setWebsite('');
      trackEvent('newsletter_subscribe_success', {
        source: 'newsletter_section',
      });
    } catch {
      setStatus('error');
      setStatusMessage('Network error while subscribing. Please try again.');
      trackEvent('newsletter_subscribe_error', {
        source: 'newsletter_section',
        message: 'Network error while subscribing. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="newsletter-signup" className="bg-[var(--color-surface)] py-16 sm:py-24 lg:py-32 border-y border-[var(--color-border)]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 lg:grid-cols-12 lg:gap-8 lg:px-8">
        <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight text-[var(--color-primary)] sm:text-4xl lg:col-span-7">
        Sign up for our newsletter to get notified about our upcoming events
        </h2>
        <form className="w-full max-w-md lg:col-span-5 lg:pt-2" onSubmit={handleNewsletterSubmit}>
          <input
            type="text"
            name="website"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          <div className="flex gap-x-4">
            <label htmlFor="email-address" className="sr-only">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              required
              placeholder="Enter your email"
              autoComplete="email"
              value={newsletterEmail}
              onChange={(event) => setNewsletterEmail(event.target.value)}
              className="min-w-0 flex-auto rounded-md bg-white px-3.5 py-2 text-base text-[var(--color-text)] outline outline-1 -outline-offset-1 outline-[var(--color-border)] placeholder:text-[var(--color-text-muted)] focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-[var(--color-accent)] sm:text-sm/6"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-none rounded-md bg-[var(--color-accent)] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-accent-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Subscribe'}
            </button>
          </div>

          <p className="mt-4 text-sm/6 text-[var(--color-text)]">
            We care about your privacy Read our{' '}
            <Link
              to="/privacy-policy"
              onClick={() => trackEvent('newsletter_privacy_policy_click', { source: 'newsletter_section' })}
              className="whitespace-nowrap font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-light)]"
            >
              privacy policy
            </Link>
            .
          </p>

          {status !== 'idle' && (
            <p
              className={`text-sm mt-2 ${status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}
              role="status"
            >
              {statusMessage}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
