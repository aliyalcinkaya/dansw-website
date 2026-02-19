import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdminBreadcrumbs } from '../components/AdminBreadcrumbs';
import { AdminMagicLinkCard } from '../components/AdminMagicLinkCard';
import { AdminStatusMessage } from '../components/AdminStatusMessage';
import { useCompanyBranding } from '../hooks/useCompanyBranding';
import {
  archiveJobFromAdmin,
  extendJobListingFromAdmin,
  fetchAdminJobs,
  fetchAdminNotifications,
  getCurrentSupabaseUserEmail,
  markAdminNotificationRead,
  publishJobFromAdmin,
  requestJobChangesFromAdmin,
  syncJobExpiryAlerts,
} from '../services/jobs';
import { sendAdminMagicLink } from '../services/siteSettings';
import type { JobAdminNotification, JobPost } from '../types/jobs';

type AdminStatusFilter = 'all' | JobPost['status'];
type JobModerationAction = 'publish' | 'changes' | 'archive' | 'extend';

const statusFilters: Array<{ value: AdminStatusFilter; label: string }> = [
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'changes_requested', label: 'Changes Requested' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'draft', label: 'Drafts' },
  { value: 'all', label: 'All' },
];

function formatDate(dateValue: string | null) {
  if (!dateValue) return 'N/A';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateValue: string | null) {
  if (!dateValue) return 'N/A';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isJobExpired(job: JobPost) {
  if (job.status !== 'published' || !job.publishExpiresAt) {
    return false;
  }

  const expiryTime = new Date(job.publishExpiresAt).getTime();
  return Number.isFinite(expiryTime) && expiryTime <= Date.now();
}

function getStatusLabel(status: JobPost['status']) {
  const labels: Record<JobPost['status'], string> = {
    draft: 'Draft',
    pending_payment: 'Pending Payment',
    pending_review: 'Pending Review',
    changes_requested: 'Changes Requested',
    published: 'Published',
    archived: 'Archived',
  };
  return labels[status];
}

function getStatusBadgeClass(status: JobPost['status']) {
  const styles: Record<JobPost['status'], string> = {
    draft: 'bg-slate-100 text-slate-700',
    pending_payment: 'bg-amber-100 text-amber-800',
    pending_review: 'bg-indigo-100 text-indigo-800',
    changes_requested: 'bg-orange-100 text-orange-800',
    published: 'bg-emerald-100 text-emerald-800',
    archived: 'bg-slate-200 text-slate-700',
  };
  return styles[status];
}

function getModerationOptions(status: JobPost['status']): Array<{ value: JobModerationAction; label: string }> {
  if (status === 'archived') {
    return [{ value: 'extend', label: 'Republish +3 Months' }];
  }

  if (status === 'published') {
    return [
      { value: 'extend', label: 'Extend +3 Months' },
      { value: 'archive', label: 'Archive' },
    ];
  }

  return [
    { value: 'publish', label: 'Publish' },
    { value: 'changes', label: 'Request Changes' },
    { value: 'archive', label: 'Archive' },
  ];
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

function JobCompanyAvatar({ job, size = 'sm' }: { job: JobPost; size?: 'sm' | 'md' }) {
  const shouldLookupBranding = Boolean(job.companyWebsite && !job.brandLogoUrl);
  const { branding: detectedBranding } = useCompanyBranding(shouldLookupBranding ? job.companyWebsite : null);
  const logoUrl = job.brandLogoUrl ?? detectedBranding?.logoUrl ?? null;

  const dimensions = size === 'md' ? 'h-10 w-10 rounded-lg' : 'h-8 w-8 rounded-md';
  const fallbackTextSize = size === 'md' ? 'text-sm' : 'text-xs';

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${job.companyName} logo`}
        loading="lazy"
        className={`${dimensions} shrink-0 border border-[var(--color-border)] bg-white object-contain p-1`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${dimensions} ${fallbackTextSize} shrink-0 flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] font-semibold text-[var(--color-text-muted)]`}
    >
      {getCompanyInitials(job.companyName || 'Company')}
    </div>
  );
}

export function AdminJobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [notifications, setNotifications] = useState<JobAdminNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<AdminStatusFilter>('all');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [approvalSelections, setApprovalSelections] = useState<Record<string, JobModerationAction>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioningJobId, setActioningJobId] = useState<string | null>(null);
  const [authLinkEmail, setAuthLinkEmail] = useState('');
  const [sendingMagicLink, setSendingMagicLink] = useState(false);

  const refreshData = async (email: string | null, runExpirySync = true) => {
    if (!email) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const [jobsResult, notificationsResult, expiryResult] = await Promise.all([
      fetchAdminJobs('all'),
      fetchAdminNotifications(50),
      runExpirySync ? syncJobExpiryAlerts() : Promise.resolve({ ok: true, data: { expiringSoon: 0, expired: 0 } }),
    ]);

    if (!jobsResult.ok) {
      setStatusType('error');
      setStatusMessage(jobsResult.message ?? 'Unable to load admin jobs.');
      setJobs([]);
    } else {
      setJobs(jobsResult.data);
    }

    if (!notificationsResult.ok) {
      setStatusType('error');
      setStatusMessage(notificationsResult.message ?? 'Unable to load notifications.');
      setNotifications([]);
    } else {
      setNotifications(notificationsResult.data);
    }

    if (
      runExpirySync &&
      expiryResult.ok &&
      (expiryResult.data.expiringSoon > 0 || expiryResult.data.expired > 0)
    ) {
      setStatusType('success');
      setStatusMessage(
        `Expiry check: ${expiryResult.data.expiringSoon} expiring soon, ${expiryResult.data.expired} moved offline.`
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const email = await getCurrentSupabaseUserEmail();
      if (!isMounted) return;
      setAdminEmail(email);
      setAuthLinkEmail(email ?? '');
      await refreshData(email, true);
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    if (activeFilter === 'all') return jobs;
    return jobs.filter((job) => job.status === activeFilter);
  }, [activeFilter, jobs]);

  const selectedJobId = searchParams.get('jobId');

  const selectedJob = useMemo(() => {
    if (!selectedJobId) {
      return null;
    }

    return jobs.find((job) => job.id === selectedJobId) ?? null;
  }, [jobs, selectedJobId]);

  const counts = useMemo(() => {
    const base: Record<AdminStatusFilter, number> = {
      all: jobs.length,
      draft: 0,
      pending_payment: 0,
      pending_review: 0,
      changes_requested: 0,
      published: 0,
      archived: 0,
    };

    for (const job of jobs) {
      base[job.status] += 1;
    }

    return base;
  }, [jobs]);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => notification.status === 'unread'),
    [notifications]
  );

  const selectedJobApprovalOptions = useMemo(() => {
    if (!selectedJob) {
      return [];
    }

    return getModerationOptions(selectedJob.status);
  }, [selectedJob]);

  const selectedApprovalAction = useMemo(() => {
    if (!selectedJob) {
      return null;
    }

    return approvalSelections[selectedJob.id] ?? selectedJobApprovalOptions[0]?.value ?? null;
  }, [approvalSelections, selectedJob, selectedJobApprovalOptions]);

  const handleAction = async (job: JobPost, action: JobModerationAction) => {
    setStatusMessage(null);
    setStatusType(null);
    setActioningJobId(job.id);

    const reviewNote = (reviewNotes[job.id] ?? job.reviewNote ?? '').trim();
    const result =
      action === 'publish'
        ? await publishJobFromAdmin(job.id, reviewNote)
        : action === 'changes'
          ? await requestJobChangesFromAdmin(job.id, reviewNote)
          : action === 'archive'
            ? await archiveJobFromAdmin(job.id, reviewNote)
            : await extendJobListingFromAdmin(job.id);

    if (!result.ok) {
      setStatusType('error');
      setStatusMessage(result.message ?? 'Admin action failed.');
      setActioningJobId(null);
      return;
    }

    const label =
      action === 'publish'
        ? 'Listing published.'
        : action === 'changes'
          ? 'Changes requested from poster.'
          : action === 'archive'
            ? 'Listing archived.'
            : 'Listing extended by 3 months.';

    setStatusType('success');
    setStatusMessage(label);
    setActioningJobId(null);
    await refreshData(adminEmail, true);
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    const result = await markAdminNotificationRead(notificationId);
    if (!result.ok) {
      setStatusType('error');
      setStatusMessage(result.message ?? 'Unable to mark notification as read.');
      return;
    }

    await refreshData(adminEmail, true);
  };

  const handleSendMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setStatusType(null);
    setSendingMagicLink(true);

    const result = await sendAdminMagicLink(authLinkEmail, '/admin/jobs');
    setSendingMagicLink(false);

    if (!result.ok) {
      setStatusType('error');
      setStatusMessage(result.message ?? 'Unable to send admin login link.');
      return;
    }

    setStatusType('success');
    setStatusMessage(result.message ?? 'Admin magic link sent.');
  };

  const handleApplySelectedAction = async () => {
    if (!selectedJob || !selectedApprovalAction) {
      return;
    }

    await handleAction(selectedJob, selectedApprovalAction);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
          <AdminBreadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Jobs', href: '/admin/jobs' },
              ...(selectedJob ? [{ label: selectedJob.title }] : []),
            ]}
          />
          <h1 className="mt-4 text-4xl text-[var(--color-primary)] md:text-5xl">
            Job Moderation Dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-[var(--color-text-muted)]">
            Review incoming listings, approve updates, and keep expired jobs offline.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
          <AdminStatusMessage
            status={
              statusMessage
                ? {
                    type: statusType === 'error' ? 'error' : 'success',
                    message: statusMessage,
                  }
                : null
            }
          />

          {!adminEmail && (
            <AdminMagicLinkCard
              email={authLinkEmail}
              onEmailChange={setAuthLinkEmail}
              onSubmit={handleSendMagicLink}
              sending={sendingMagicLink}
              description="Use your Supabase magic-link session for an admin email listed in `job_board_admins`."
              className="p-8"
              titleClassName="mb-2 text-2xl text-[var(--color-primary)]"
              descriptionClassName="mb-4 text-[var(--color-text-muted)]"
            />
          )}

          {adminEmail && (
            <>
              {!selectedJob && (
                <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-7">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl text-[var(--color-primary)]">Notifications</h2>
                    <span className="rounded-full bg-[var(--color-accent)]/10 px-2.5 py-1 text-xs text-[var(--color-accent)]">
                      {unreadNotifications.length} unread
                    </span>
                  </div>

                  <div className="space-y-3">
                    {notifications.length === 0 && (
                      <p className="text-sm text-[var(--color-text-muted)]">No notifications yet.</p>
                    )}

                    {notifications.map((notification) => (
                      <article
                        key={notification.id}
                        className={`rounded-lg border p-3 ${
                          notification.status === 'unread'
                            ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                        }`}
                      >
                        <h3 className="mb-1 text-sm font-semibold text-[var(--color-primary)]">{notification.title}</h3>
                        <p className="mb-2 text-xs text-[var(--color-text-muted)]">{notification.message}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[var(--color-text-muted)]">
                            {formatDate(notification.createdAt)}
                          </span>
                          {notification.status === 'unread' && (
                            <button
                              type="button"
                              onClick={() => void handleMarkNotificationRead(notification.id)}
                              className="text-xs text-[var(--color-accent)] hover:underline"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              )}

              {!selectedJob && (
                <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-7">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      {statusFilters.map((filter) => (
                        <button
                          key={filter.value}
                          type="button"
                          onClick={() => setActiveFilter(filter.value)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            activeFilter === filter.value
                              ? 'bg-[var(--color-accent)] text-white'
                              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                          }`}
                        >
                          {filter.label} ({counts[filter.value]})
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void refreshData(adminEmail, true)}
                        aria-label="Refresh queue"
                        title="Refresh queue"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </button>
                      <Link
                        to="/jobs/post"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)]"
                      >
                        Add New Job
                      </Link>
                    </div>
                  </div>

                  {loading && <p className="py-2 text-sm text-[var(--color-text-muted)]">Loading admin queue...</p>}

                  {!loading && (
                    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                      <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
                        <thead className="bg-[var(--color-surface)] text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                          <tr>
                            <th className="px-4 py-3 font-medium">Title</th>
                            <th className="px-4 py-3 font-medium">Company</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Payment</th>
                            <th className="px-4 py-3 font-medium">Expires</th>
                            <th className="px-4 py-3 font-medium">Updated</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)] bg-white">
                          {filteredJobs.length > 0 ? (
                            filteredJobs.map((job) => {
                              const expired = isJobExpired(job);
                              const statusLabel = expired ? 'Offline (Expired)' : getStatusLabel(job.status);
                              const statusClass = expired
                                ? 'bg-slate-200 text-slate-700'
                                : getStatusBadgeClass(job.status);

                              return (
                                <tr
                                  key={job.id}
                                  onClick={() => setSearchParams({ jobId: job.id })}
                                  className={`cursor-pointer transition-colors hover:bg-[var(--color-surface)] ${
                                    selectedJobId === job.id ? 'bg-[var(--color-accent)]/5' : ''
                                  }`}
                                >
                                  <td className="px-4 py-3 font-medium text-[var(--color-primary)]">{job.title}</td>
                                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                                    <div className="flex items-center gap-3">
                                      <JobCompanyAvatar job={job} />
                                      <span>{job.companyName}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass}`}>
                                      {statusLabel}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{job.paymentStatus}</td>
                                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatDate(job.publishExpiresAt)}</td>
                                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatDate(job.updatedAt)}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-4 py-6 text-center text-[var(--color-text-muted)]">
                                No jobs found for this filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              )}

              {selectedJob && (
                <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-7">
                  <h2 className="text-2xl text-[var(--color-primary)]">Job Details</h2>
                  <p className="mt-2 mb-5 text-sm text-[var(--color-text-muted)]">
                    Review and moderate the selected listing.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Company</p>
                      <div className="mt-1 flex items-center gap-3">
                        <JobCompanyAvatar job={selectedJob} size="md" />
                        <p className="text-sm text-[var(--color-text)]">{selectedJob.companyName}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Poster</p>
                      <p className="text-sm text-[var(--color-text)]">{selectedJob.postedByEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Location</p>
                      <p className="text-sm text-[var(--color-text)]">{selectedJob.locationText}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Expiry Date</p>
                      <p className="text-sm text-[var(--color-text)]">{formatDate(selectedJob.publishExpiresAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Package</p>
                      <p className="text-sm text-[var(--color-text)]">{selectedJob.packageType ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Payment</p>
                      <p className="text-sm text-[var(--color-text)]">{selectedJob.paymentStatus}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Last Updated</p>
                      <p className="text-sm text-[var(--color-text)]">{formatDateTime(selectedJob.updatedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Status</p>
                      <p className="text-sm text-[var(--color-text)]">
                        {isJobExpired(selectedJob) ? 'Offline (Expired)' : getStatusLabel(selectedJob.status)}
                      </p>
                    </div>
                  </div>

                  {isJobExpired(selectedJob) && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                      This job has passed its expiry date and is treated as offline.
                    </div>
                  )}

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:col-span-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                        Summary
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-text)]">{selectedJob.summary}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:col-span-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                        Responsibilities
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-text)]">
                        {selectedJob.responsibilities}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:col-span-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                        Requirements
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-text)]">
                        {selectedJob.requirements}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="mb-1 block text-sm text-[var(--color-text-muted)]">Admin review note</label>
                    <textarea
                      value={reviewNotes[selectedJob.id] ?? selectedJob.reviewNote ?? ''}
                      onChange={(event) =>
                        setReviewNotes((current) => ({ ...current, [selectedJob.id]: event.target.value }))
                      }
                      placeholder="Required for request changes, optional for publish/archive"
                      rows={4}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <label className="min-w-[220px] flex-1">
                      <span className="mb-1 block text-sm text-[var(--color-text-muted)]">Job approval action</span>
                      <select
                        value={selectedApprovalAction ?? ''}
                        onChange={(event) =>
                          setApprovalSelections((current) => ({
                            ...current,
                            [selectedJob.id]: event.target.value as JobModerationAction,
                          }))
                        }
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      >
                        {selectedJobApprovalOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() => void handleApplySelectedAction()}
                      disabled={actioningJobId === selectedJob.id || !selectedApprovalAction}
                      className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                    >
                      {actioningJobId === selectedJob.id ? 'Applying...' : 'Apply Action'}
                    </button>

                    <Link
                      to={`/jobs/${selectedJob.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      Open Public Page
                    </Link>
                  </div>
                </article>
              )}

            </>
          )}
        </div>
      </section>
    </div>
  );
}
