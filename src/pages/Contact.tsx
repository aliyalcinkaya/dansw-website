import { useState, type FormEvent } from 'react';
import { Toast } from '../components/Toast';
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
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title?: string; message: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setToast(null);

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
        setToast({
          type: 'error',
          title: 'Message not sent',
          message: result.message ?? 'Could not send your message right now. Please try again.',
        });
        return;
      }

      setToast({
        type: 'success',
        title: 'Message sent',
        message: 'Message received. Thanks for reaching out. We will reply by email shortly.',
      });
      setFormState(initialFormState);
      setWebsite('');
    } catch {
      setToast({
        type: 'error',
        title: 'Message not sent',
        message: 'Could not send your message right now. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <Toast
        open={Boolean(toast)}
        type={toast?.type ?? 'info'}
        title={toast?.title}
        message={toast?.message ?? ''}
        onClose={() => setToast(null)}
      />
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
