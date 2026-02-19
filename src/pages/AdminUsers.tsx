import { useEffect, useState, type FormEvent } from 'react';
import { AdminBreadcrumbs } from '../components/AdminBreadcrumbs';
import { AdminLoadingCard } from '../components/AdminLoadingCard';
import { AdminMagicLinkCard } from '../components/AdminMagicLinkCard';
import { AdminStatusMessage } from '../components/AdminStatusMessage';
import {
  fetchAdminDirectoryUsers,
  fetchSiteAdminAccess,
  getCachedSiteAdminAccess,
  inviteAdminUser,
  sendAdminMagicLink,
  type AdminDirectoryUser,
  type SiteAdminAccess,
} from '../services/siteSettings';

const initialAdminAccess: SiteAdminAccess = {
  mode: 'local',
  email: null,
  canManage: true,
};

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function AdminUsers() {
  const cachedAdminAccess = getCachedSiteAdminAccess();
  const [loading, setLoading] = useState(!cachedAdminAccess);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [adminAccess, setAdminAccess] = useState<SiteAdminAccess>(cachedAdminAccess?.data ?? initialAdminAccess);
  const [authLinkEmail, setAuthLinkEmail] = useState(cachedAdminAccess?.data.email ?? '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [users, setUsers] = useState<AdminDirectoryUser[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const requiresAdminSignIn = !loading && adminAccess.mode === 'supabase' && !adminAccess.canManage;
  const canShowAdminContent = !loading && !requiresAdminSignIn;

  const refreshUsers = async () => {
    setLoadingUsers(true);
    const result = await fetchAdminDirectoryUsers();
    setLoadingUsers(false);

    if (!result.ok) {
      setUsers([]);
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to load admin users.',
      });
      return;
    }

    setUsers(result.data);
  };

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

      if (!(accessResult.data.mode === 'supabase' && !accessResult.data.canManage)) {
        await refreshUsers();
      }

      setLoading(false);
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSendMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setSendingMagicLink(true);

    const result = await sendAdminMagicLink(authLinkEmail, '/admin/users');
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

  const handleInviteUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setInviting(true);

    const result = await inviteAdminUser(inviteEmail, '/admin');
    setInviting(false);

    if (!result.ok) {
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to invite admin user.',
      });
      return;
    }

    setInviteEmail('');
    await refreshUsers();
    setStatus({
      type: 'success',
      message: result.message ?? 'Admin user invited.',
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
          <AdminBreadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'User Manager', href: '/admin/users' },
            ]}
          />
          <h1 className="mt-4 text-4xl text-[var(--color-primary)] md:text-5xl">User Manager</h1>
          <p className="mt-3 max-w-3xl text-[var(--color-text-muted)]">
            Invite and manage admin users. Access is restricted to existing admin accounts.
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
              description="Sign in with an existing admin email in `job_board_admins` to manage users."
            />
          )}

          {canShowAdminContent && (
            <>
              <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-7">
                <h2 className="text-xl text-[var(--color-primary)]">Invite Admin User</h2>
                <p className="mt-2 mb-4 text-sm text-[var(--color-text-muted)]">
                  Add a new admin email and send a magic login link in one step.
                </p>
                <form onSubmit={handleInviteUser} className="max-w-md space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-sm text-[var(--color-text-muted)]">Email</span>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="new-admin@company.com"
                      autoComplete="email"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={inviting}
                    className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                      inviting
                        ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                        : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]'
                    }`}
                  >
                    {inviting ? 'Inviting...' : 'Invite User'}
                  </button>
                </form>
              </article>

              <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-7">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl text-[var(--color-primary)]">Admin Users</h2>
                  <span className="text-sm text-[var(--color-text-muted)]">{users.length} total</span>
                </div>

                {loadingUsers && <p className="text-sm text-[var(--color-text-muted)]">Loading users...</p>}

                {!loadingUsers && (
                  <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                    <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
                      <thead className="bg-[var(--color-surface)] text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        <tr>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">Added</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)] bg-white">
                        {users.length > 0 ? (
                          users.map((user) => (
                            <tr key={user.email}>
                              <td className="px-4 py-3 text-[var(--color-primary)]">{user.email}</td>
                              <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatCreatedAt(user.createdAt)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="px-4 py-6 text-center text-[var(--color-text-muted)]">
                              No admin users found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
