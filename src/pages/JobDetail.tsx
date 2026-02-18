import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MarkdownContent, stripMarkdown } from '../components/MarkdownContent';
import { useCompanyBranding } from '../hooks/useCompanyBranding';
import { getReadableTextColor } from '../services/brandfetch';
import { fetchPublishedJobBySlug, formatSalaryRange, submitJobApplication } from '../services/jobs';
import type { JobPost } from '../types/jobs';

interface ApplicationFormState {
  applicantName: string;
  applicantEmail: string;
  linkedinUrl: string;
  resumeUrl: string;
  coverNote: string;
}

const initialApplicationState: ApplicationFormState = {
  applicantName: '',
  applicantEmail: '',
  linkedinUrl: '',
  resumeUrl: '',
  coverNote: '',
};

function formatDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildUnifiedRoleContent(job: JobPost | null) {
  if (!job) {
    return '';
  }

  const parts = [job.summary, job.responsibilities, job.requirements, job.niceToHave ?? '']
    .map((value) => value.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return '';
  }

  return Array.from(new Set(parts)).join('\n\n');
}

export function JobDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [job, setJob] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationForm, setApplicationForm] = useState<ApplicationFormState>(initialApplicationState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEasyApplyModalOpen, setIsEasyApplyModalOpen] = useState(false);
  const [applyStatus, setApplyStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const shouldLookupBranding = Boolean(
    job?.companyWebsite && (!job.brandLogoUrl || !job.brandPrimaryColor || !job.brandSecondaryColor)
  );
  const { branding: detectedBranding } = useCompanyBranding(
    shouldLookupBranding ? (job?.companyWebsite ?? null) : null
  );

  useEffect(() => {
    let isMounted = true;

    const loadJob = async () => {
      if (!slug) {
        setError('Missing job listing URL.');
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await fetchPublishedJobBySlug(slug);

      if (!isMounted) return;

      if (!result.ok) {
        setError(result.message ?? 'This job listing is unavailable.');
        setJob(null);
      } else {
        setError(null);
        setJob(result.data);
      }

      setLoading(false);
    };

    void loadJob();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const roleContent = useMemo(() => buildUnifiedRoleContent(job), [job]);
  const roleSummary = useMemo(() => stripMarkdown(job?.summary ?? ''), [job?.summary]);
  const resolvedBranding = useMemo(
    () => ({
      logoUrl: job?.brandLogoUrl ?? detectedBranding?.logoUrl ?? null,
      primaryColor: job?.brandPrimaryColor ?? detectedBranding?.primaryColor ?? '#0f172a',
      secondaryColor:
        job?.brandSecondaryColor ??
        detectedBranding?.secondaryColor ??
        job?.brandPrimaryColor ??
        detectedBranding?.primaryColor ??
        '#1e293b',
    }),
    [detectedBranding?.logoUrl, detectedBranding?.primaryColor, detectedBranding?.secondaryColor, job]
  );

  const headerTextColor = getReadableTextColor(resolvedBranding.primaryColor);
  const isLightHeaderText = headerTextColor === '#ffffff';
  const heroStyle = useMemo(
    () => ({
      background: `linear-gradient(135deg, ${resolvedBranding.primaryColor} 0%, ${resolvedBranding.secondaryColor} 100%)`,
      color: headerTextColor,
    }),
    [headerTextColor, resolvedBranding.primaryColor, resolvedBranding.secondaryColor]
  );

  const supportsEasyApply = job?.applicationMode === 'easy_apply' || job?.applicationMode === 'both';
  const supportsExternalApply = job?.applicationMode === 'external_apply' || job?.applicationMode === 'both';
  const hasSalary = job ? job.salaryMin != null || job.salaryMax != null : false;
  const easyApplyFields = useMemo(
    () =>
      job?.easyApplyFields ?? {
        collectName: true,
        collectEmail: true,
        collectCv: true,
        collectLinkedin: true,
        collectCoverLetter: true,
      },
    [job?.easyApplyFields]
  );
  const openEasyApplyModal = () => {
    setApplyStatus(null);
    setIsEasyApplyModalOpen(true);
  };

  const handleApplicationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!job) return;

    setIsSubmitting(true);
    setApplyStatus(null);

    const result = await submitJobApplication({
      jobPostId: job.id,
      applicantName: easyApplyFields.collectName ? applicationForm.applicantName : 'Applicant',
      applicantEmail: applicationForm.applicantEmail,
      linkedinUrl: easyApplyFields.collectLinkedin ? applicationForm.linkedinUrl : undefined,
      resumeUrl: easyApplyFields.collectCv ? applicationForm.resumeUrl : undefined,
      coverNote: easyApplyFields.collectCoverLetter ? applicationForm.coverNote : undefined,
    });

    if (!result.ok) {
      setApplyStatus({ type: 'error', message: result.message ?? 'Unable to submit application.' });
      setIsSubmitting(false);
      return;
    }

    setApplyStatus({
      type: 'success',
      message: 'Application submitted successfully. The hiring team has been notified.',
    });
    setApplicationForm(initialApplicationState);
    setIsSubmitting(false);
    setIsEasyApplyModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8 text-center">
            <div className="inline-flex items-center gap-3 text-[var(--color-text-muted)]">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading job details...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8 text-center">
            <h1 className="text-2xl text-[var(--color-primary)] mb-3">Job Listing Unavailable</h1>
            <p className="text-[var(--color-text-muted)] mb-6">{error ?? 'This job listing could not be found.'}</p>
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <Link to="/jobs" className="inline-flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] mb-6">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to job board
          </Link>

          <div className="rounded-3xl border border-[var(--color-border)] overflow-hidden bg-white">
            <div className="p-6 md:p-8" style={heroStyle}>
              <div className="flex flex-col lg:flex-row gap-6 lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3 mb-4">
                    {resolvedBranding.logoUrl ? (
                      <img
                        src={resolvedBranding.logoUrl}
                        alt={`${job.companyName} logo`}
                        className="h-12 w-12 rounded-lg bg-white object-contain p-1"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-white/20" aria-hidden="true" />
                    )}
                    <p className="text-sm font-semibold uppercase tracking-wider opacity-85">
                      {job.companyName}
                    </p>
                  </div>

                  <h1 className="text-4xl md:text-5xl mb-5">{job.title}</h1>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span
                      className={`text-xs rounded-full px-3 py-1 border ${
                        isLightHeaderText ? 'bg-white/15 border-white/25 text-white' : 'bg-black/10 border-black/15 text-black/80'
                      }`}
                    >
                      {job.locationMode}
                    </span>
                    <span
                      className={`text-xs rounded-full px-3 py-1 border ${
                        isLightHeaderText ? 'bg-white/15 border-white/25 text-white' : 'bg-black/10 border-black/15 text-black/80'
                      }`}
                    >
                      {job.employmentType}
                    </span>
                    <span
                      className={`text-xs rounded-full px-3 py-1 border ${
                        isLightHeaderText ? 'bg-white/15 border-white/25 text-white' : 'bg-black/10 border-black/15 text-black/80'
                      }`}
                    >
                      {job.seniorityLevel}
                    </span>
                  </div>
                  <p className="leading-relaxed opacity-95">{roleSummary || 'See role content below.'}</p>
                  {applyStatus && (
                    <p
                      className={`mt-4 text-sm ${applyStatus.type === 'success' ? 'text-emerald-200' : 'text-red-200'}`}
                      role="status"
                    >
                      {applyStatus.message}
                    </p>
                  )}

                  <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    {supportsExternalApply && job.externalApplyUrl && (
                      <a
                        href={job.externalApplyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto sm:max-w-xs flex-1 inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-black font-semibold hover:bg-slate-100 transition-all"
                      >
                        Apply on Company Website
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                    {supportsEasyApply && (
                      <button
                        type="button"
                        onClick={openEasyApplyModal}
                        className="w-full sm:w-auto sm:max-w-xs flex-1 inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-slate-800 transition-all"
                      >
                        Easy Apply
                      </button>
                    )}
                  </div>
                </div>

                <aside className="bg-white/95 rounded-2xl border border-white/60 p-6 min-w-[280px] text-[var(--color-text)]">
                  {hasSalary && (
                    <>
                      <p className="text-sm text-[var(--color-text-muted)] mb-2">Compensation</p>
                      <p className="text-lg text-[var(--color-primary)] font-semibold mb-5">{formatSalaryRange(job)}</p>
                    </>
                  )}
                  <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
                    <p>
                      <span className="font-medium text-[var(--color-text)]">Location:</span> {job.locationText}
                    </p>
                    {formatDate(job.applicationDeadline) && (
                      <p>
                        <span className="font-medium text-[var(--color-text)]">Apply by:</span> {formatDate(job.applicationDeadline)}
                      </p>
                    )}
                    {formatDate(job.publishedAt ?? job.createdAt) && (
                      <p>
                        <span className="font-medium text-[var(--color-text)]">Posted:</span>{' '}
                        {formatDate(job.publishedAt ?? job.createdAt)}
                      </p>
                    )}
                  </div>
                </aside>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] bg-white p-6 md:p-8">
              <h2 className="text-2xl text-[var(--color-primary)] mb-4">Role Content</h2>
              <MarkdownContent content={roleContent} />
            </div>
          </div>
        </div>
      </section>

      {supportsEasyApply && isEasyApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="max-w-xl mx-auto mt-8 md:mt-16 bg-white rounded-2xl border border-[var(--color-border)] shadow-xl">
            <div className="p-6 border-b border-[var(--color-border)] flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl text-[var(--color-primary)]">Easy Apply</h2>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Apply for {job.title} at {job.companyName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEasyApplyModalOpen(false)}
                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
                aria-label="Close easy apply form"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="p-6 space-y-3" onSubmit={handleApplicationSubmit}>
              {easyApplyFields.collectName && (
                <input
                  type="text"
                  value={applicationForm.applicantName}
                  onChange={(event) => setApplicationForm((current) => ({ ...current, applicantName: event.target.value }))}
                  placeholder="Name"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              )}

              {easyApplyFields.collectEmail && (
                <input
                  type="email"
                  value={applicationForm.applicantEmail}
                  onChange={(event) => setApplicationForm((current) => ({ ...current, applicantEmail: event.target.value }))}
                  placeholder="Email"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              )}

              {easyApplyFields.collectCv && (
                <input
                  type="url"
                  value={applicationForm.resumeUrl}
                  onChange={(event) => setApplicationForm((current) => ({ ...current, resumeUrl: event.target.value }))}
                  placeholder="CV URL (Drive, Notion, PDF link)"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              )}

              {easyApplyFields.collectLinkedin && (
                <input
                  type="url"
                  value={applicationForm.linkedinUrl}
                  onChange={(event) => setApplicationForm((current) => ({ ...current, linkedinUrl: event.target.value }))}
                  placeholder="LinkedIn profile URL"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              )}

              {easyApplyFields.collectCoverLetter && (
                <textarea
                  value={applicationForm.coverNote}
                  onChange={(event) => setApplicationForm((current) => ({ ...current, coverNote: event.target.value }))}
                  placeholder="Cover letter"
                  rows={5}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
                />
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEasyApplyModalOpen(false)}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-text)] font-medium hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-slate-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
