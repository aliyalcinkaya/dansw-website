import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
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

function formatDate(dateValue: string | null) {
  if (!dateValue) return 'N/A';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
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

export function AdminJobs() {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [notifications, setNotifications] = useState<JobAdminNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<AdminStatusFilter>('pending_review');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioningJobId, setActioningJobId] = useState<string | null>(null);
  const [authLinkEmail, setAuthLinkEmail] = useState('');
  const [sendingMagicLink, setSendingMagicLink] = useState(false);

  const refreshData = async (email: string | null, runExpirySync = false) => {
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
        `Expiry check: ${expiryResult.data.expiringSoon} expiring soon, ${expiryResult.data.expired} archived as expired.`
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

  const handleAction = async (
    job: JobPost,
    action: 'publish' | 'changes' | 'archive' | 'extend'
  ) => {
    setStatusMessage(null);
    setStatusType(null);
    setActioningJobId(job.id);

    const reviewNote = reviewNotes[job.id]?.trim() ?? '';
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
    await refreshData(adminEmail, false);
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    const result = await markAdminNotificationRead(notificationId);
    if (!result.ok) {
      setStatusType('error');
      setStatusMessage(result.message ?? 'Unable to mark notification as read.');
      return;
    }

    await refreshData(adminEmail, false);
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

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-18">
          <Link
            to="/admin"
            className="inline-flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] mb-5"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Admin Panel
          </Link>
          <span className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
            Admin
          </span>
          <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mt-2 mb-4">
            Job Moderation Dashboard
          </h1>
          <p className="text-[var(--color-text-muted)] max-w-3xl">
            Review incoming listings, publish approved roles, request changes, and manage expiry/extension cycles.
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-4">
            Signed in as: <span className="font-medium">{adminEmail ?? 'Not signed in'}</span>
          </p>
          {adminEmail && (
            <button
              type="button"
              onClick={() => void refreshData(adminEmail, true)}
              className="mt-4 inline-flex items-center px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Refresh Queue + Run Expiry Check
            </button>
          )}
        </div>
      </section>

      <section className="py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          {statusMessage && (
            <div
              className={`rounded-xl border p-4 ${
                statusType === 'error'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              {statusMessage}
            </div>
          )}

          {!adminEmail && (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8">
              <h2 className="text-2xl text-[var(--color-primary)] mb-2">Admin sign-in required</h2>
              <p className="text-[var(--color-text-muted)] mb-4">
                Use your Supabase magic-link session for an admin email listed in `job_board_admins`.
              </p>
              <form onSubmit={handleSendMagicLink} className="space-y-3 max-w-md">
                <label className="block">
                  <span className="block text-sm text-[var(--color-text-muted)] mb-1">Admin email</span>
                  <input
                    type="email"
                    value={authLinkEmail}
                    onChange={(event) => setAuthLinkEmail(event.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={sendingMagicLink}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                    sendingMagicLink
                      ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                      : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]'
                  }`}
                >
                  {sendingMagicLink ? 'Sending...' : 'Send Admin Magic Link'}
                </button>
              </form>
            </div>
          )}

          {adminEmail && (
            <>
              <div className="grid lg:grid-cols-[1fr_360px] gap-6">
                <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    {(
                      [
                        ['pending_review', 'Pending Review'],
                        ['changes_requested', 'Changes Requested'],
                        ['published', 'Published'],
                        ['archived', 'Archived'],
                        ['pending_payment', 'Pending Payment'],
                        ['draft', 'Drafts'],
                        ['all', 'All'],
                      ] as Array<[AdminStatusFilter, string]>
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setActiveFilter(value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          activeFilter === value
                            ? 'bg-[var(--color-accent)] text-white'
                            : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                        }`}
                      >
                        {label} ({counts[value]})
                      </button>
                    ))}
                  </div>

                  {loading && (
                    <p className="text-sm text-[var(--color-text-muted)]">Loading admin queue...</p>
                  )}

                  {!loading && filteredJobs.length === 0 && (
                    <p className="text-sm text-[var(--color-text-muted)]">No jobs in this queue.</p>
                  )}

                  <div className="space-y-4">
                    {filteredJobs.map((job) => (
                      <article
                        key={job.id}
                        className="rounded-xl border border-[var(--color-border)] p-4 md:p-5"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                          <div>
                            <h3 className="text-xl text-[var(--color-primary)]">{job.title}</h3>
                            <p className="text-sm text-[var(--color-text-muted)]">{job.companyName}</p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                              Poster: {job.postedByEmail}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(job.status)}`}
                          >
                            {getStatusLabel(job.status)}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-3 text-xs text-[var(--color-text-muted)] mb-3">
                          <p>
                            Package: <span className="font-medium text-[var(--color-text)]">{job.packageType ?? 'N/A'}</span>
                          </p>
                          <p>
                            Payment: <span className="font-medium text-[var(--color-text)]">{job.paymentStatus}</span>
                          </p>
                          <p>
                            Expires: <span className="font-medium text-[var(--color-text)]">{formatDate(job.publishExpiresAt)}</span>
                          </p>
                        </div>

                        <textarea
                          value={reviewNotes[job.id] ?? job.reviewNote ?? ''}
                          onChange={(event) =>
                            setReviewNotes((current) => ({ ...current, [job.id]: event.target.value }))
                          }
                          placeholder="Admin review note (required for request changes, optional for publish/archive)"
                          rows={3}
                          className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        />

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          {(job.status === 'pending_review' ||
                            job.status === 'changes_requested' ||
                            job.status === 'pending_payment') && (
                            <>
                              <button
                                type="button"
                                onClick={() => void handleAction(job, 'publish')}
                                disabled={actioningJobId === job.id}
                                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
                              >
                                Publish
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleAction(job, 'changes')}
                                disabled={actioningJobId === job.id}
                                className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-60"
                              >
                                Request Changes
                              </button>
                            </>
                          )}

                          {job.status === 'published' && (
                            <button
                              type="button"
                              onClick={() => void handleAction(job, 'extend')}
                              disabled={actioningJobId === job.id}
                              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
                            >
                              Extend +3 Months
                            </button>
                          )}

                          {job.status === 'archived' && (
                            <button
                              type="button"
                              onClick={() => void handleAction(job, 'extend')}
                              disabled={actioningJobId === job.id}
                              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
                            >
                              Republish +3 Months
                            </button>
                          )}

                          {job.status !== 'archived' && (
                            <button
                              type="button"
                              onClick={() => void handleAction(job, 'archive')}
                              disabled={actioningJobId === job.id}
                              className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-60"
                            >
                              Archive
                            </button>
                          )}

                          <Link
                            to={`/jobs/${job.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                          >
                            Open Public Page
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <aside className="bg-white rounded-2xl border border-[var(--color-border)] p-6 h-fit">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl text-[var(--color-primary)]">Notifications</h2>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
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
                        <h3 className="text-sm font-semibold text-[var(--color-primary)] mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] mb-2">{notification.message}</p>
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
                </aside>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
