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
            <article className="rounded-2xl border border-[var(--color-border)] bg-white">
              <div className="divide-y divide-[var(--color-border)]">
                <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl text-[var(--color-primary)]">Jobs Moderation Queue</h2>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                      Review submitted roles, publish listings, and manage expiry actions.
                    </p>
                  </div>
                  <Link
                    to="/admin/jobs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)]"
                  >
                    Open Jobs
                  </Link>
                </div>

                <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl text-[var(--color-primary)]">Events Manager</h2>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                      Create events, manage talk lineups, and sync updates to Eventbrite.
                    </p>
                  </div>
                  <Link
                    to="/admin/events"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)]"
                  >
                    Open Events
                  </Link>
                </div>

                <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl text-[var(--color-primary)]">Speaker Profiles</h2>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                      Create and maintain speaker bios, photos, and profile links.
                    </p>
                  </div>
                  <Link
                    to="/admin/speakers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)]"
                  >
                    Open Speakers
                  </Link>
                </div>

                <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl text-[var(--color-primary)]">Social Media Posts</h2>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                      Update LinkedIn post links shown on the homepage.
                    </p>
                  </div>
                  <Link
                    to="/admin/social-posts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)]"
                  >
                    Open Social Media
                  </Link>
                </div>

                <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl text-[var(--color-primary)]">Form Routing</h2>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                      Choose who receives and CCs website form submissions.
                    </p>
                  </div>
                  <Link
                    to="/admin/form-routing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)]"
                  >
                    Open Form Routing
                  </Link>
                </div>

                <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl text-[var(--color-primary)]">User Management</h2>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                      Invite additional admin users and manage admin directory access.
                    </p>
                  </div>
                  <Link
                    to="/admin/users"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)]"
                  >
                    Open User Manager
                  </Link>
                </div>
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
