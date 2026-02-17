import { useState, type FormEvent } from 'react';
import { submitSpeakerApplication } from '../services/forms';

interface FormData {
  name: string;
  email: string;
  phone: string;
  topic: string;
  topicUndecided: boolean;
  existingTalksUrl: string;
  bio: string;
}

const formatNotes = [
  'DAW is informal, with short talks and plenty of social time.',
  'Aim for 15-20 minutes of prepared material to leave room for questions.',
  'Audience interjections and discussion during talks are common.',
  'Formats can include slides, live demos, fireside chats, panels, or workshops.',
];

const audienceNotes = [
  'Attendees include new graduates, job seekers, managers, analysts, scientists, marketers, and product managers.',
  'People attend to learn best practices, meet potential employers or hires, and build industry connections.',
];

const setupNotes = [
  'Event starts at 18:00 on the second Wednesday of each month. Please arrive early.',
  'Talk slots are typically around 30 minutes including Q&A, with a 20-minute wrap-up cue.',
  'Available setup includes microphone, projector, and laptop connections (HDMI, VGA, 16:9).',
  'Bring your own internet if possible, and bring your laptop or send slides in PDF ahead of time.',
];

export function BecomeSpeaker() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    topic: '',
    topicUndecided: false,
    existingTalksUrl: '',
    bio: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [website, setWebsite] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await submitSpeakerApplication({
        source: '/become-a-speaker',
        website,
        ...formData,
      });

      if (!result.ok) {
        setSubmitError(result.message ?? 'Unable to submit right now. Please try again.');
        return;
      }

      setIsSubmitted(true);
    } catch {
      setSubmitError('Unable to submit right now. Please try again.');
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
          <h2 className="text-3xl text-[var(--color-primary)] mb-4">Proposal Received!</h2>
          <p className="text-[var(--color-text-muted)] mb-8">
            Thank you for your interest in speaking at DAWSydney.
            Our team will review your proposal and get back to you soon.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-4xl">
            <p className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
              Data & Analytics Wednesday
            </p>
            <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mt-2">
              Speaker Information
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-4">
              Updated on Feb 17, 2025
            </p>
            <p className="text-lg text-[var(--color-text-muted)] leading-relaxed mt-6">
              Share practical lessons and real stories with the DAW community in a relaxed, highly interactive event.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <article id="speaker-application" className="bg-white border border-[var(--color-border)] rounded-2xl p-6 md:p-8 space-y-8">
            <section>
              <h2 className="text-2xl md:text-3xl text-[var(--color-primary)] mb-4">
                Speaking at DAW
              </h2>
              <p className="text-[var(--color-text-muted)] leading-relaxed mb-4">
                We welcome speakers from all backgrounds, from first-time presenters to experienced conference speakers.
                The goal is practical learning, open discussion, and strong networking.
              </p>

              <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-2">Format and flow</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--color-text-muted)] mb-5">
                {formatNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>

              <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-2">Audience expectations</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--color-text-muted)] mb-5">
                {audienceNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>

              <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-2">Talk guidance</h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-5">
                Keep talks mostly non-commercial. DAW is an inclusive environment, so avoid inappropriate or
                discriminatory content. If in doubt, check with organizers before the event.
              </p>

              <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-2">Timing and technical setup</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--color-text-muted)]">
                {setupNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>

            <hr className="my-10 border-[var(--color-border)]" />

            <section>
              <h2 className="text-2xl md:text-3xl text-[var(--color-primary)] mb-3">
                Apply to Become a Speaker
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
                    placeholder="+61 400 000 000"
                  />
                </div>

                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Proposed Talk Topic {!formData.topicUndecided && '*'}
                  </label>
                  <input
                    type="text"
                    id="topic"
                    required={!formData.topicUndecided}
                    disabled={formData.topicUndecided}
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g., Building Real-Time Analytics Dashboards"
                  />
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.topicUndecided}
                      onChange={(e) => setFormData({ ...formData, topicUndecided: e.target.checked, topic: e.target.checked ? '' : formData.topic })}
                      className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                    />
                    <span className="text-sm text-[var(--color-text-muted)]">
                      I do not know yet. I would like to discuss options.
                    </span>
                  </label>
                </div>

                <div>
                  <label htmlFor="existingTalksUrl" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Link to Existing Talks (Optional)
                  </label>
                  <input
                    type="url"
                    id="existingTalksUrl"
                    value={formData.existingTalksUrl}
                    onChange={(e) => setFormData({ ...formData, existingTalksUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
                    placeholder="https://youtube.com/... or https://slideshare.net/..."
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    YouTube, Vimeo, SlideShare, or any other platform with your previous presentations.
                  </p>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Brief Bio *
                  </label>
                  <textarea
                    id="bio"
                    required
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all resize-none"
                    placeholder="Tell us about yourself, your experience, and why you would like to speak..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Proposal
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>

                {submitError && (
                  <p className="text-sm text-red-600 text-center" role="status">
                    {submitError}
                  </p>
                )}

                <p className="text-xs text-[var(--color-text-muted)] text-center">
                  We typically respond within 2 weeks. Questions? Contact us at{' '}
                  <a href="mailto:commitee@wawsydney.com" className="text-[var(--color-accent)] hover:underline">
                    commitee@wawsydney.com
                  </a>
                </p>
              </form>
            </section>
          </article>
        </div>
      </section>
    </div>
  );
}
