import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AdminBreadcrumbs } from '../components/AdminBreadcrumbs';
import { AdminLoadingCard } from '../components/AdminLoadingCard';
import { AdminMagicLinkCard } from '../components/AdminMagicLinkCard';
import { AdminStatusMessage } from '../components/AdminStatusMessage';
import {
  fetchSiteAdminAccess,
  getCachedSiteAdminAccess,
  sendAdminMagicLink,
  type SiteAdminAccess,
} from '../services/siteSettings';

const initialAdminAccess: SiteAdminAccess = {
  mode: 'local',
  email: null,
  canManage: true,
};

export function AdminPanel() {
  const cachedAdminAccess = getCachedSiteAdminAccess();
  const [loading, setLoading] = useState(!cachedAdminAccess);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [adminAccess, setAdminAccess] = useState<SiteAdminAccess>(cachedAdminAccess?.data ?? initialAdminAccess);
  const [authLinkEmail, setAuthLinkEmail] = useState(cachedAdminAccess?.data.email ?? '');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const accessResult = await fetchSiteAdminAccess();

      if (!isMounted) {
        return;
      }

      setAdminAccess(accessResult.data);
      setAuthLinkEmail(accessResult.data.email ?? '');

      if (!accessResult.ok && accessResult.message) {
        setStatus({ type: 'error', message: accessResult.message });
      } else if (accessResult.message) {
        setStatus({ type: 'info', message: accessResult.message });
      } else {
        setStatus(null);
      }

      setLoading(false);
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const requiresAdminSignIn = !loading && adminAccess.mode === 'supabase' && !adminAccess.canManage;
  const canShowAdminContent = !loading && !requiresAdminSignIn;

  const handleSendMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setSendingMagicLink(true);

    const result = await sendAdminMagicLink(authLinkEmail, '/admin');
    setSendingMagicLink(false);

    if (!result.ok) {
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to send admin login link.',
      });
      return;
    }

    setStatus({
      type: 'success',
      message: result.message ?? 'Admin magic link sent.',
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
          <AdminBreadcrumbs items={[{ label: 'Admin' }]} />
          <h1 className="mt-4 text-4xl text-[var(--color-primary)] md:text-5xl">Website Control Panel</h1>
          <p className="mt-3 max-w-3xl text-[var(--color-text-muted)]">
            Manage website modules from one place. Use each admin section for detailed updates.
          </p>
          <p className="mt-4 text-xs text-[var(--color-text-muted)]">
            Mode:{' '}
            <span className="font-medium text-[var(--color-text)]">
              {adminAccess.mode === 'supabase' ? 'Supabase' : 'Local Browser'}
            </span>
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
          <AdminStatusMessage status={status} />

          {loading && <AdminLoadingCard />}

          {requiresAdminSignIn && (
            <AdminMagicLinkCard
              email={authLinkEmail}
              onEmailChange={setAuthLinkEmail}
              onSubmit={handleSendMagicLink}
              sending={sendingMagicLink}
              description="Sign in with an admin email listed in `job_board_admins` to access admin content."
            />
          )}

          {canShowAdminContent && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
              <article className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                  Homepage
                </p>
                <h2 className="mt-2 text-2xl text-[var(--color-primary)]">Overview</h2>
                <p className="mt-2 flex-grow text-sm text-[var(--color-text-muted)]">
                  Manage website sections from dedicated admin pages.
                </p>
              </article>

              <article className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Jobs</p>
                <h2 className="mt-2 text-2xl text-[var(--color-primary)]">Moderation Queue</h2>
                <p className="mt-2 flex-grow text-sm text-[var(--color-text-muted)]">
                  Review submitted roles, publish listings, and manage expiry actions.
                </p>
                <div className="mt-5">
                  <Link
                    to="/admin/jobs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)]"
                  >
                    Open Jobs
                  </Link>
                </div>
              </article>

              <article className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Events</p>
                <h2 className="mt-2 text-2xl text-[var(--color-primary)]">Events Manager</h2>
                <p className="mt-2 flex-grow text-sm text-[var(--color-text-muted)]">
                  Create events, manage talk lineups, and sync updates to Eventbrite.
                </p>
                <div className="mt-5">
                  <Link
                    to="/admin/events"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)]"
                  >
                    Open Events
                  </Link>
                </div>
              </article>

              <article className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Speakers</p>
                <h2 className="mt-2 text-2xl text-[var(--color-primary)]">Speaker Profiles</h2>
                <p className="mt-2 flex-grow text-sm text-[var(--color-text-muted)]">
                  Create and maintain speaker bios, photos, and profile links.
                </p>
                <div className="mt-5">
                  <Link
                    to="/admin/speakers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)]"
                  >
                    Open Speakers
                  </Link>
                </div>
              </article>

              <article className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Social Media
                </p>
                <h2 className="mt-2 text-2xl text-[var(--color-primary)]">Posts</h2>
                <p className="mt-2 flex-grow text-sm text-[var(--color-text-muted)]">
                  Update LinkedIn post links shown on the homepage.
                </p>
                <div className="mt-5">
                  <Link
                    to="/admin/social-posts"
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)]"
                  >
                    Open Social Posts
                  </Link>
                </div>
              </article>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
