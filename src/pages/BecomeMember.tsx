import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { submitMemberApplication } from '../services/forms';

type Profession = 'student' | 'professional' | 'looking' | '';

interface FormData {
  name: string;
  email: string;
  profession: Profession;
  institution: string; // company or school
  goals: string;
}

const volunteerOpportunities = [
  {
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-[var(--color-accent)] to-[var(--color-chart-2)]',
    checkColor: 'text-[var(--color-accent)]',
    title: 'Help Organise Events',
    description: 'Join our organising committee and help plan, coordinate, and run our monthly meetups and special events.',
    tasks: ['Venue coordination', 'Event promotion', 'On-the-day support'],
  },
  {
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    gradient: 'from-[var(--color-chart-2)] to-[var(--color-chart-3)]',
    checkColor: 'text-[var(--color-accent)]',
    title: 'Find Speakers',
    description: 'Help us discover and recruit talented speakers from across the industry to share their knowledge.',
    tasks: ['Network outreach', 'Topic curation', 'Speaker support'],
  },
  {
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-[var(--color-chart-3)] to-[var(--color-chart-4)]',
    checkColor: 'text-[var(--color-chart-3)]',
    title: 'Sponsor Relations',
    description: 'Help us build relationships with companies who want to support our community.',
    tasks: ['Partner outreach', 'Relationship management', 'Sponsor recognition'],
  },
  {
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
    gradient: 'from-[var(--color-chart-4)] to-[var(--color-chart-5)]',
    checkColor: 'text-[var(--color-chart-4)]',
    title: 'Content & Social',
    description: 'Help us create content, manage social media, and share our community\'s stories.',
    tasks: ['Social media posts', 'Event photography', 'Video editing'],
  },
  {
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    gradient: 'from-[var(--color-chart-5)] to-[var(--color-accent)]',
    checkColor: 'text-[var(--color-chart-5)]',
    title: 'Tech & Website',
    description: 'Put your technical skills to use by helping maintain and improve our digital infrastructure.',
    tasks: ['Website updates', 'Tool integrations', 'Analytics setup'],
  },
  {
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    gradient: 'from-[var(--color-accent)] to-[var(--color-chart-3)]',
    checkColor: 'text-[var(--color-accent)]',
    title: 'MeasureCamp Sydney',
    description: 'Join the dedicated team that organises our annual unconference - a full-day event.',
    tasks: ['Event planning', 'Volunteer coordination', 'Session facilitation'],
  },
];

export function BecomeMember() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    profession: '',
    institution: '',
    goals: '',
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
      if (!formData.profession) {
        setSubmitError('Please select what best describes you.');
        return;
      }

      const result = await submitMemberApplication({
        source: '/join',
        website,
        name: formData.name,
        email: formData.email,
        profession: formData.profession,
        institution: formData.institution,
        goals: formData.goals,
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

  const getInstitutionLabel = () => {
    switch (formData.profession) {
      case 'student':
        return 'School / University';
      case 'professional':
        return 'Company';
      case 'looking':
        return 'Previous Company (Optional)';
      default:
        return 'Organization';
    }
  };

  const getInstitutionPlaceholder = () => {
    switch (formData.profession) {
      case 'student':
        return 'e.g., University of Sydney';
      case 'professional':
        return 'e.g., Acme Corporation';
      case 'looking':
        return 'e.g., Previous employer';
      default:
        return 'Enter your organization';
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
          <h2 className="text-3xl text-[var(--color-primary)] mb-4">Thanks for volunteering!</h2>
          <p className="text-[var(--color-text-muted)] mb-8">
            Thank you for applying to volunteer with DAWSydney. We will be in touch soon.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all"
          >
            Return Home
          </Link>
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
              Volunteer
            </span>
            <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mt-2 mb-6">
              Volunteer With DAWSydney
            </h1>
            <p className="text-lg text-[var(--color-text-muted)] leading-relaxed">
              Help run events, support speakers, and grow Sydney's data and analytics community.
              Choose where you can contribute and apply below.
            </p>
          </div>
        </div>
      </section>

      {/* Get Involved Section */}
      <section id="volunteer" className="py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
              Volunteer With Us
            </span>
            <h2 className="text-3xl md:text-4xl text-[var(--color-primary)] mt-2 mb-4">
              Get Involved
            </h2>
            <p className="text-[var(--color-text-muted)] max-w-2xl mx-auto">
              Help us build Sydney's best data and analytics community. 
              There are many ways to contribute, regardless of your experience level.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {volunteerOpportunities.map((opportunity, index) => (
              <div
                key={index}
                className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 hover:shadow-lg transition-shadow"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${opportunity.gradient} flex items-center justify-center mb-4`}>
                  {opportunity.icon}
                </div>
                <h3 className="text-xl text-[var(--color-primary)] mb-3">
                  {opportunity.title}
                </h3>
                <p className="text-[var(--color-text-muted)] mb-4">
                  {opportunity.description}
                </p>
                <ul className="text-sm text-[var(--color-text-muted)] space-y-2">
                  {opportunity.tasks.map((task, taskIndex) => (
                    <li key={taskIndex} className="flex items-start gap-2">
                      <svg className={`w-4 h-4 ${opportunity.checkColor} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div id="volunteer-application" className="mt-12 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm p-6 md:p-8">
              <h3 className="text-2xl text-[var(--color-primary)] mb-2">
                Apply to become a volunteer
              </h3>
              <p className="text-[var(--color-text-muted)] mb-6">
                Tell us a little about yourself and how you would like to help.
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

                <div>
                  <label htmlFor="profession" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    What best describes you? *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: 'student', label: 'Student', icon: '🎓' },
                      { value: 'professional', label: 'Professional', icon: '💼' },
                      { value: 'looking', label: 'Job Seeking', icon: '🔍' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, profession: option.value as Profession, institution: '' })}
                        className={`p-4 rounded-lg border text-center transition-all ${
                          formData.profession === option.value
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 ring-2 ring-[var(--color-accent)]'
                            : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/50'
                        }`}
                      >
                        <span className="text-2xl mb-2 block">{option.icon}</span>
                        <span className={`text-sm font-medium ${
                          formData.profession === option.value
                            ? 'text-[var(--color-accent)]'
                            : 'text-[var(--color-text)]'
                        }`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.profession && (
                  <div className="animate-fade-in-up">
                    <label htmlFor="institution" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                      {getInstitutionLabel()} {formData.profession !== 'looking' && '*'}
                    </label>
                    <input
                      type="text"
                      id="institution"
                      required={formData.profession !== 'looking'}
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
                      placeholder={getInstitutionPlaceholder()}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="goals" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    How would you like to contribute? *
                  </label>
                  <textarea
                    id="goals"
                    required
                    rows={4}
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all resize-none"
                    placeholder="e.g., Helping with event logistics, content, sponsors, or website updates..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !formData.profession}
                  className="w-full py-4 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Submit Volunteer Application
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
                  By submitting this form, you agree to our{' '}
                  <a href="/code-of-conduct" className="text-[var(--color-accent)] hover:underline">
                    Code of Conduct
                  </a>.
                </p>
              </form>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-br from-[var(--color-primary)] to-slate-800 rounded-3xl p-8 md:p-12 text-white">
              <h3 className="text-2xl md:text-3xl mb-4">
                Want to share your story on stage?
              </h3>
              <p className="text-white/70 mb-8 max-w-2xl mx-auto">
                Speaking is one of the best ways to contribute to the community. Volunteer applications are open too.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/become-a-speaker"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all"
                >
                  Become a Speaker
                </Link>
                <a
                  href="#volunteer-application"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-white/40 text-white font-semibold hover:bg-white/10 transition-all"
                >
                  Apply to Volunteer
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
