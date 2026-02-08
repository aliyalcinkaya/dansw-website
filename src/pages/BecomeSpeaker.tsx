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
      {/* Header */}
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
              Share Your Knowledge
            </span>
            <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mt-2 mb-6">
              Become a Speaker
            </h1>
            <p className="text-lg text-[var(--color-text-muted)] leading-relaxed">
              Have insights to share? We're always looking for passionate speakers 
              to inspire and educate our community. All experience levels welcome!
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Info */}
            <div className="order-2 lg:order-1">
              <h2 className="text-2xl text-[var(--color-primary)] mb-6">
                What We're Looking For
              </h2>
              
              <div className="space-y-4 mb-8">
                {[
                  {
                    icon: '📊',
                    title: 'Industry Insights',
                    description: 'Share trends, best practices, and lessons learned from your analytics journey.',
                  },
                  {
                    icon: '🔧',
                    title: 'Technical Deep-Dives',
                    description: 'Walk through implementations, tools, and technical solutions.',
                  },
                  {
                    icon: '💡',
                    title: 'Case Studies',
                    description: 'Real-world examples of analytics solving business problems.',
                  },
                  {
                    icon: '🚀',
                    title: 'Emerging Technologies',
                    description: 'Explore new tools, platforms, and methodologies shaping our field.',
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-4 rounded-xl bg-white border border-[var(--color-border)]"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h3 className="font-semibold text-[var(--color-primary)] mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Talk format */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-chart-2)]/10 border border-[var(--color-accent)]/20">
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4">
                  Talk Format
                </h3>
                <ul className="text-sm text-[var(--color-text-muted)] space-y-2">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    20-30 minute presentation
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    5-10 minute Q&A session
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Networking opportunity after the event
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Recording shared with our community
                  </li>
                </ul>
              </div>

              {/* Quote */}
              <blockquote className="mt-8 p-6 rounded-2xl bg-white border-l-4 border-[var(--color-accent)]">
                <p className="text-[var(--color-text)] italic mb-4">
                  "Speaking at DAWSydney was a great experience. The audience was engaged, 
                  asked thoughtful questions, and I made some valuable connections."
                </p>
                <footer className="text-sm text-[var(--color-text-muted)]">
                  — Previous Speaker
                </footer>
              </blockquote>
            </div>

            {/* Form */}
            <div className="order-1 lg:order-2">
              <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm p-6 md:p-8">
                <h2 className="text-2xl text-[var(--color-primary)] mb-6">
                  Speaker Application
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

                  {/* Name */}
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
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Email */}
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
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
                      placeholder="you@example.com"
                    />
                  </div>

                  {/* Phone */}
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
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
                      placeholder="+61 400 000 000"
                    />
                  </div>

                  {/* Topic */}
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
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                        I don't know yet - I'd like to discuss options
                      </span>
                    </label>
                  </div>

                  {/* Existing Talks URL */}
                  <div>
                    <label htmlFor="existingTalksUrl" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                      Link to Existing Talks (Optional)
                    </label>
                    <input
                      type="url"
                      id="existingTalksUrl"
                      value={formData.existingTalksUrl}
                      onChange={(e) => setFormData({ ...formData, existingTalksUrl: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
                      placeholder="https://youtube.com/... or https://slideshare.net/..."
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      YouTube, Vimeo, SlideShare, or any other platform with your previous presentations
                    </p>
                  </div>

                  {/* Bio */}
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
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all resize-none"
                      placeholder="Tell us about yourself, your experience, and why you'd like to speak..."
                    />
                  </div>

                  {/* Submit */}
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
                    <a href="mailto:hello@dawsydney.org.au" className="text-[var(--color-accent)] hover:underline">
                      hello@dawsydney.org.au
                    </a>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
