import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { submitGeneralInquiry } from '../services/forms';

interface ContactFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const initialFormState: ContactFormState = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

export function Contact() {
  const [formState, setFormState] = useState<ContactFormState>(initialFormState);
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await submitGeneralInquiry({
        source: '/contact',
        website,
        name: formState.name,
        email: formState.email,
        subject: formState.subject,
        message: formState.message,
      });

      if (!result.ok) {
        setSubmitError(result.message ?? 'Unable to submit your message right now. Please try again.');
        return;
      }

      setIsSubmitted(true);
      setFormState(initialFormState);
      setWebsite('');
    } catch {
      setSubmitError('Unable to submit your message right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl text-[var(--color-primary)] mb-4">Message received</h2>
          <p className="text-[var(--color-text-muted)] mb-8">
            Thanks for reaching out. We will get back to you shortly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text)] font-semibold hover:border-[var(--color-accent)] transition-all"
            >
              Send another message
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <p className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">Contact</p>
          <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mt-2 mb-4">Get in touch</h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-3xl leading-relaxed">
            Questions about events, partnerships, membership, or the community? Send us a message and we will route it
            to the right team.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-7">
              <h2 className="text-2xl text-[var(--color-primary)]">Before you submit</h2>
              <ul className="mt-4 space-y-3 text-sm text-[var(--color-text-muted)]">
                <li>Use a clear subject so we can route your inquiry quickly.</li>
                <li>Include relevant links and context in your message.</li>
                <li>For urgent event issues, add your preferred contact method.</li>
              </ul>
              <p className="mt-6 text-sm text-[var(--color-text-muted)]">
                Prefer email? You can also reach us at{' '}
                <a href="mailto:commitee@wawsydney.com" className="text-[var(--color-accent)] hover:underline">
                  commitee@wawsydney.com
                </a>
                .
              </p>
            </article>

            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-8">
              <h2 className="text-2xl text-[var(--color-primary)] mb-2">Contact form</h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-6">
                We typically respond within 1-2 business days.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
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

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[var(--color-text)]">Name *</span>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      placeholder="Your name"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[var(--color-text)]">Email *</span>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      placeholder="you@example.com"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--color-text)]">Subject *</span>
                  <input
                    type="text"
                    required
                    value={formState.subject}
                    onChange={(event) => setFormState((current) => ({ ...current, subject: event.target.value }))}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    placeholder="How can we help?"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--color-text)]">Message *</span>
                  <textarea
                    required
                    rows={6}
                    value={formState.message}
                    onChange={(event) => setFormState((current) => ({ ...current, message: event.target.value }))}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    placeholder="Tell us more..."
                  />
                </label>

                {submitError && <p className="text-sm text-red-600">{submitError}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold ${
                    isSubmitting
                      ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                      : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]'
                  }`}
                >
                  {isSubmitting ? 'Sending...' : 'Send message'}
                </button>
              </form>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
