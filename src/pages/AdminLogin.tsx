import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AdminStatusMessage } from '../components/AdminStatusMessage';
import { fetchSiteAdminAccess, sendAdminMagicLink, type SiteAdminAccess } from '../services/siteSettings';

const initialAdminAccess: SiteAdminAccess = {
  mode: 'local',
  email: null,
  canManage: false,
};

export function AdminLogin() {
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [adminAccess, setAdminAccess] = useState<SiteAdminAccess>(initialAdminAccess);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const accessResult = await fetchSiteAdminAccess();
      if (!isMounted) {
        return;
      }

      setAdminAccess(accessResult.data);
      setEmail(accessResult.data.email ?? '');

      if (!accessResult.ok && accessResult.message) {
        setStatus({ type: 'error', message: accessResult.message });
      } else if (accessResult.message) {
        setStatus({ type: 'info', message: accessResult.message });
      }

      setLoadingAccess(false);
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

    const result = await sendAdminMagicLink(email, '/admin');
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
      <section className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-accent)]">Admin</p>
          <h1 className="mt-2 text-4xl text-[var(--color-primary)] md:text-5xl">Admin Login</h1>
          <p className="mt-4 max-w-2xl text-[var(--color-text-muted)]">
            Sign in using your admin email. Login is available only via secure magic links.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
          <AdminStatusMessage status={status} />

          {loadingAccess && (
            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <p className="text-sm text-[var(--color-text-muted)]">Checking current admin session...</p>
            </article>
          )}

          {!loadingAccess && adminAccess.canManage && (
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <h2 className="text-xl text-emerald-800">You are already signed in</h2>
              <p className="mt-2 text-sm text-emerald-700">
                Logged in as <span className="font-medium">{adminAccess.email ?? 'admin user'}</span>.
              </p>
              <div className="mt-4">
                <Link
                  to="/admin"
                  className="inline-flex items-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)]"
                >
                  Open Admin
                </Link>
              </div>
            </article>
          )}

          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-7">
            <h2 className="text-xl text-[var(--color-primary)]">Send Magic Link</h2>
            <p className="mt-2 mb-4 text-sm text-[var(--color-text-muted)]">
              Only emails already registered in the admin directory can log in.
            </p>
            <form onSubmit={handleSendMagicLink} className="max-w-md space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm text-[var(--color-text-muted)]">Admin email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={sendingMagicLink}
                className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                  sendingMagicLink
                    ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                    : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]'
                }`}
              >
                {sendingMagicLink ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          </article>
        </div>
      </section>
    </div>
  );
}
