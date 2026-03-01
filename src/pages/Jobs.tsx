import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useCompanyBranding } from '../hooks/useCompanyBranding';
import { getReadableTextColor } from '../services/brandfetch';
import { fetchPublishedJobs, formatSalaryRange } from '../services/jobs';
import { trackEvent } from '../services/analytics';
import type { EmploymentType, JobPost, LocationMode } from '../types/jobs';
import { stripMarkdown } from '../utils/markdown';

type EmploymentFilter = 'all' | EmploymentType;
type LocationFilter = 'all' | LocationMode;

function formatPostedDate(dateValue: string | null) {
  const fallback = 'Recently posted';
  if (!dateValue) return fallback;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return fallback;

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Posted today';
  if (diffDays === 1) return 'Posted yesterday';
  if (diffDays < 30) return `Posted ${diffDays} days ago`;

  return `Posted ${date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function getEmploymentLabel(value: EmploymentType) {
  const labels: Record<EmploymentType, string> = {
    'full-time': 'Full-time',
    'part-time': 'Part-time',
    contract: 'Contract',
    internship: 'Internship',
    temporary: 'Temporary',
  };
  return labels[value];
}

function getLocationLabel(value: LocationMode) {
  const labels: Record<LocationMode, string> = {
    remote: 'Remote',
    hybrid: 'Hybrid',
    onsite: 'On-site',
  };
  return labels[value];
}

function buildUnifiedRoleContent(job: JobPost) {
  const parts = [job.summary, job.responsibilities, job.requirements, job.niceToHave ?? '']
    .map((value) => value.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return '';
  }

  return Array.from(new Set(parts)).join('\n\n');
}

function getCompanyInitials(companyName: string) {
  return companyName
    .split(/\s+/)
    .map((token) => token.trim().charAt(0))
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function JobListingCard({ job }: { job: JobPost }) {
  const shouldLookupBranding = Boolean(
    job.companyWebsite && (!job.brandLogoUrl || !job.brandPrimaryColor || !job.brandSecondaryColor)
  );
  const { branding: detectedBranding } = useCompanyBranding(shouldLookupBranding ? job.companyWebsite : null);

  const logoUrl = job.brandLogoUrl ?? detectedBranding?.logoUrl ?? null;
  const primaryColor = job.brandPrimaryColor ?? detectedBranding?.primaryColor ?? '#0f172a';
  const secondaryColor =
    job.brandSecondaryColor ??
    detectedBranding?.secondaryColor ??
    job.brandPrimaryColor ??
    detectedBranding?.primaryColor ??
    '#1e293b';

  const roleContentPreview = stripMarkdown(buildUnifiedRoleContent(job) || job.summary);
  const hasSalary = job.salaryMin != null || job.salaryMax != null;
  const headerTextColor = getReadableTextColor(primaryColor);
  const isLightHeaderText = headerTextColor === '#ffffff';
  const headerStyle: CSSProperties = {
    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
    color: headerTextColor,
  };

  return (
    <article className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-all">
      <Link
        to={`/jobs/${job.slug}`}
        onClick={() =>
          trackEvent('jobs_view_details_click', {
            job_id: job.id,
            job_slug: job.slug,
            company_name: job.companyName,
            click_area: 'card_header',
          })
        }
        className="block p-4 hover:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        style={headerStyle}
        aria-label={`View ${job.title} at ${job.companyName}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${job.companyName} logo`}
                className="h-18 w-18 rounded-lg bg-white object-contain p-1"
                loading="lazy"
              />
            ) : (
              <div
                className={`h-12 w-12 rounded-lg flex items-center justify-center text-sm font-semibold ${
                  isLightHeaderText ? 'bg-white/20 text-white' : 'bg-black/10 text-black/80'
                }`}
                aria-hidden="true"
              >
                {getCompanyInitials(job.companyName)}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-sm font-medium opacity-85 truncate">{job.companyName}</p>
              <h2 className="text-2xl mt-0.5 leading-tight">{job.title}</h2>
              {hasSalary && <p className="text-sm text-white">{formatSalaryRange(job)}</p>}
              <div className="mt-2">
                <span
                  className={`text-xs rounded-full px-2.5 py-1 border ${
                    isLightHeaderText ? 'bg-white/15 border-white/25 text-white' : 'bg-black/10 border-black/15 text-black/80'
                  }`}
                >
                  {getEmploymentLabel(job.employmentType)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs rounded-full px-3 py-1 bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            {getLocationLabel(job.locationMode)}
          </span>
          <span className="text-xs rounded-full px-3 py-1 bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]">
            {getEmploymentLabel(job.employmentType)}
          </span>
          <span className="text-xs rounded-full px-3 py-1 bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]">
            {job.locationText}
          </span>
        </div>

        <p className="text-[var(--color-text-muted)] mb-4 line-clamp-4">{roleContentPreview || job.summary}</p>

        <div className="flex items-center justify-between gap-3">
          <p className={`text-xs rounded-full whitespace-nowrap ${isLightHeaderText && 'text-[var(--color-text-muted)]'}`}>
            {formatPostedDate(job.publishedAt)}
          </p>
          <Link
            to={`/jobs/${job.slug}`}
            onClick={() =>
              trackEvent('jobs_view_details_click', {
                job_id: job.id,
                job_slug: job.slug,
                company_name: job.companyName,
                click_area: 'card_footer',
              })
            }
            className="inline-flex items-center text-sm font-medium text-[var(--color-accent)] hover:underline"
          >
            View details
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

export function Jobs() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [employmentFilter, setEmploymentFilter] = useState<EmploymentFilter>('all');
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');

  useEffect(() => {
    let isMounted = true;

    const loadJobs = async () => {
      setLoading(true);
      const result = await fetchPublishedJobs();

      if (!isMounted) return;

      if (!result.ok) {
        setError(result.message ?? 'Unable to load jobs right now.');
        setJobs(result.data);
      } else {
        setError(null);
        setJobs(result.data);
      }

      setLoading(false);
    };

    void loadJobs();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return jobs.filter((job) => {
      const roleContent = buildUnifiedRoleContent(job).toLowerCase();
      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.companyName.toLowerCase().includes(query) ||
        roleContent.includes(query) ||
        job.locationText.toLowerCase().includes(query);

      const matchesEmployment = employmentFilter === 'all' || job.employmentType === employmentFilter;
      const matchesLocation = locationFilter === 'all' || job.locationMode === locationFilter;

      return matchesSearch && matchesEmployment && matchesLocation;
    });
  }, [jobs, searchQuery, employmentFilter, locationFilter]);

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-3xl">
              <span className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
                DAWS Job Board
              </span>
              <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mt-2 mb-5">
                Data & Analytics Roles in the Community
              </h1>
              <p className="text-lg text-[var(--color-text-muted)] leading-relaxed">
                Discover roles shared with the DAWS audience. Listings focus on clear scope, practical
                requirements, and transparent role expectations inspired by leading job platforms.
              </p>
            </div>

            <div className="flex-shrink-0">
              <Link
                to="/jobs/post"
                onClick={() => trackEvent('jobs_submit_job_post_click', { source: 'hero' })}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all"
              >
                Submit a Job Post
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-16 z-30 bg-white/90 backdrop-blur-lg border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid md:grid-cols-4 gap-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search role, company, location..."
              className="md:col-span-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <select
              value={employmentFilter}
              onChange={(event) => setEmploymentFilter(event.target.value as EmploymentFilter)}
              className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              <option value="all">All employment types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="temporary">Temporary</option>
            </select>
            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value as LocationFilter)}
              className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              <option value="all">All locations</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {!loading && (
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} available
            </p>
          )}

          {loading && (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8 text-center">
              <div className="inline-flex items-center gap-3 text-[var(--color-text-muted)]">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading job listings...
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center mb-8">
              <p className="text-[var(--color-text-muted)] mb-3">{error}</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                You can still submit a listing while we configure published job feeds.
              </p>
            </div>
          )}

          {!loading && filteredJobs.length === 0 && (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-10 text-center">
              <h2 className="text-2xl text-[var(--color-primary)] mb-3">No matching roles right now</h2>
              <p className="text-[var(--color-text-muted)] mb-6">
                Try a broader filter, or post a role to reach the DAWS community.
              </p>
              <Link
                to="/jobs/post"
                onClick={() => trackEvent('jobs_submit_job_post_click', { source: 'empty_state' })}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all"
              >
                Post a Job
              </Link>
            </div>
          )}

          {!loading && filteredJobs.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredJobs.map((job) => (
                <JobListingCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
