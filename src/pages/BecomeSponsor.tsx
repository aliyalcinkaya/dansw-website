import { useState, type FormEvent } from 'react';
import { submitSponsorInquiry } from '../services/forms';
import { trackEvent } from '../services/analytics';

interface FormData {
  name: string;
  email: string;
  company: string;
  sponsorshipType: string;
  message: string;
}

const sponsorshipTiers = [
  {
    name: 'Venue Host',
    description: 'Host one of our monthly meetups at your office',
    benefits: [
      'Logo on event page & promotion',
      '5-minute company introduction',
      'Networking with 50-100 attendees',
      'Social media recognition',
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    gradient: 'from-[var(--color-accent)] to-[var(--color-chart-2)]',
  },
  {
    name: 'Event Sponsor',
    description: 'Sponsor food, drinks, or event materials',
    benefits: [
      'Logo on all event materials',
      'Mentioned in event announcements',
      'Banner/signage at the event',
      'Distribute company swag',
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-[var(--color-chart-2)] to-[var(--color-chart-3)]',
  },
  {
    name: 'MeasureCamp Partner',
    description: 'Be a major sponsor of our annual unconference',
    benefits: [
      'Premium logo placement',
      'Dedicated sponsor booth',
      'Speaking opportunity',
      'Access to 200+ attendees',
      'Year-round recognition',
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    gradient: 'from-[var(--color-chart-3)] to-[var(--color-chart-4)]',
  },
];

const whySponsor = [
  {
    stat: '7,900+',
    label: 'Community Members',
    description: 'Reach a large, engaged audience of data professionals',
  },
  {
    stat: '133+',
    label: 'Events Hosted',
    description: 'Proven track record of successful community events',
  },
  {
    stat: '10+',
    label: 'Years Running',
    description: 'Established and trusted in the Sydney analytics scene',
  },
];

export function BecomeSponsor() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    sponsorshipType: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [website, setWebsite] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    trackEvent('sponsor_inquiry_submit', {
      source: '/become-a-sponsor',
      sponsorship_type: formData.sponsorshipType || 'unknown',
    });

    try {
      const result = await submitSponsorInquiry({
        source: '/become-a-sponsor',
        website,
        ...formData,
      });

      if (!result.ok) {
        setSubmitError(result.message ?? 'Unable to submit right now. Please try again.');
        trackEvent('sponsor_inquiry_error', {
          source: '/become-a-sponsor',
          message: result.message ?? 'Unable to submit right now. Please try again.',
        });
        return;
      }

      setIsSubmitted(true);
      trackEvent('sponsor_inquiry_success', {
        source: '/become-a-sponsor',
      });
    } catch {
      setSubmitError('Unable to submit right now. Please try again.');
      trackEvent('sponsor_inquiry_error', {
        source: '/become-a-sponsor',
        message: 'Unexpected submit error',
      });
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
          <h2 className="text-3xl text-[var(--color-primary)] mb-4">Thank you for your interest!</h2>
          <p className="text-[var(--color-text-muted)] mb-8">
            We've received your sponsorship inquiry and will be in touch within 2-3 business days to discuss partnership opportunities.
          </p>
          <a
            href="/"
            onClick={() => trackEvent('sponsor_inquiry_return_home_click')}
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
              Partner With Us
            </span>
            <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mt-2 mb-6">
              Become a Sponsor
            </h1>
            <p className="text-lg text-[var(--color-text-muted)] leading-relaxed">
              Support Sydney's premier data and analytics community. Connect with talented 
              professionals, showcase your brand, and help us continue delivering amazing events.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-8">
                <h2 className="text-2xl text-[var(--color-primary)] mb-3">Why Partner With Us?</h2>
                <p className="text-[var(--color-text-muted)] leading-relaxed">
                  Sponsor Data & Analytics Wednesday Sydney to connect directly with a highly engaged local
                  audience of analysts, engineers, marketers, and data leaders.
                </p>
                <div className="grid sm:grid-cols-3 gap-6 mt-6">
                  {whySponsor.map((item, index) => (
                    <div key={index} className="rounded-xl bg-[var(--color-surface-alt)] p-4">
                      <div className="text-3xl font-bold text-[var(--color-accent)] mb-1">{item.stat}</div>
                      <div className="text-sm font-semibold text-[var(--color-primary)] mb-1">{item.label}</div>
                      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-8">
                <h2 className="text-2xl text-[var(--color-primary)] mb-3">Sponsorship Opportunities</h2>
                <p className="text-[var(--color-text-muted)] mb-6">
                  Choose a package that aligns with your goals, or contact us to create a custom partnership.
                </p>

                <div className="divide-y divide-[var(--color-border)]">
                  {sponsorshipTiers.map((tier, index) => (
                    <div key={index} className="py-6 first:pt-0 last:pb-0">
                      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-white flex-shrink-0`}>
                          {tier.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-2">
                            {tier.name}
                          </h3>
                          <p className="text-[var(--color-text-muted)] mb-4">
                            {tier.description}
                          </p>
                          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                            {tier.benefits.map((benefit, benefitIndex) => (
                              <li key={benefitIndex} className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
                                <svg className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm p-6 md:p-8">
                <h2 className="text-2xl text-[var(--color-primary)] mb-2">
                  Get in Touch
                </h2>
                <p className="text-[var(--color-text-muted)] mb-8">
                  Interested in sponsoring? Fill out the form below and we'll get back to you.
                </p>

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

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
                        placeholder="John Smith"
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
                        className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                      Company *
                    </label>
                    <input
                      type="text"
                      id="company"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
                      placeholder="Acme Corporation"
                    />
                  </div>

                  <div>
                    <label htmlFor="sponsorshipType" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                      Interested In *
                    </label>
                    <select
                      id="sponsorshipType"
                      required
                      value={formData.sponsorshipType}
                      onChange={(e) => setFormData({ ...formData, sponsorshipType: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
                    >
                      <option value="">Select an option</option>
                      <option value="venue">Venue Hosting</option>
                      <option value="event">Event Sponsorship</option>
                      <option value="measurecamp">MeasureCamp Partnership</option>
                      <option value="custom">Custom Partnership</option>
                      <option value="other">Other / Not Sure</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                      Tell us more about your goals
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all resize-none"
                      placeholder="What are you hoping to achieve through sponsorship? Any specific events or timing in mind?"
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
                        Sending...
                      </>
                    ) : (
                      <>
                        Submit Inquiry
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
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-chart-2)] rounded-2xl p-6 text-white">
                <h3 className="text-xl font-semibold mb-3">Sponsor Pack</h3>
                <p className="text-white text-sm mb-4">
                  Download our sponsorship pack for package options, benefits, and pricing details.
                </p>
                <a
                  href="/pdfs/2025_daw_sponsor_pack.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent('sponsor_pack_download_click', {
                      target: '/pdfs/2025_daw_sponsor_pack.pdf',
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[var(--color-accent)] font-semibold text-sm hover:bg-white/90 transition-colors"
                >
                  Download PDF
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </a>
              </div>

              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-3">Need Help Choosing?</h3>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                  Tell us your goals and budget, and we can recommend the best sponsorship option.
                </p>
                <a
                  href="mailto:commitee@wawsydney.com"
                  onClick={() =>
                    trackEvent('sponsor_contact_click', {
                      target: 'mailto:commitee@wawsydney.com',
                    })
                  }
                  className="inline-flex items-center gap-2 text-[var(--color-accent)] text-sm font-medium hover:gap-3 transition-all"
                >
                  Contact the team
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>

              <div className="bg-[var(--color-surface-alt)] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4">Community Snapshot</h3>
                <div className="space-y-4">
                  {whySponsor.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-[var(--color-text-muted)]">{item.label}</span>
                      <span className="font-semibold text-[var(--color-primary)]">{item.stat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-3">Join Our Sponsors</h3>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                  These amazing companies help make our community events possible.
                </p>
                <a
                  href="/"
                  onClick={() => trackEvent('sponsor_view_current_sponsors_click', { target: '/' })}
                  className="inline-flex items-center gap-2 text-[var(--color-accent)] text-sm font-medium hover:gap-3 transition-all"
                >
                  View current sponsors
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
