import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getLinkedInEmbedPostsFromInputs, parseLinkedInPostInputs } from '../services/linkedin';
import {
  fetchLinkedInPostUrls,
  fetchSiteAdminAccess,
  saveLinkedInPostUrls,
  sendAdminMagicLink,
  type SiteAdminAccess,
} from '../services/siteSettings';

const initialAdminAccess: SiteAdminAccess = {
  mode: 'local',
  email: null,
  canManage: true,
};

export function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [adminAccess, setAdminAccess] = useState<SiteAdminAccess>(initialAdminAccess);
  const [authLinkEmail, setAuthLinkEmail] = useState('');
  const [linkedInInput, setLinkedInInput] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setLoading(true);
      const [accessResult, linksResult] = await Promise.all([
        fetchSiteAdminAccess(),
        fetchLinkedInPostUrls(),
      ]);

      if (!isMounted) {
        return;
      }

      setAdminAccess(accessResult.data);
      setAuthLinkEmail(accessResult.data.email ?? '');
      setLinkedInInput(linksResult.data.join('\n'));

      if (!accessResult.ok && accessResult.message) {
        setStatus({ type: 'error', message: accessResult.message });
      } else if (accessResult.message) {
        setStatus({ type: 'info', message: accessResult.message });
      } else if (linksResult.message) {
        setStatus({ type: 'info', message: linksResult.message });
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

  const parsedInputUrls = useMemo(() => parseLinkedInPostInputs(linkedInInput), [linkedInInput]);
  const previewPosts = useMemo(
    () => getLinkedInEmbedPostsFromInputs(parsedInputUrls, 3),
    [parsedInputUrls]
  );
  const invalidInputCount = Math.max(0, parsedInputUrls.length - previewPosts.length);
  const saveDisabled = saving || (adminAccess.mode === 'supabase' && !adminAccess.canManage);
  const requiresAdminSignIn = !loading && adminAccess.mode === 'supabase' && !adminAccess.canManage;
  const canShowAdminContent = !loading && !requiresAdminSignIn;

  const handleSaveLinkedInSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setSaving(true);

    const result = await saveLinkedInPostUrls(linkedInInput);
    setSaving(false);

    if (!result.ok) {
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to save LinkedIn links.',
      });
      return;
    }

    setLinkedInInput(result.data.join('\n'));
    setStatus({
      type: 'success',
      message: result.message ?? 'LinkedIn links updated.',
    });
  };

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
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-18">
          <span className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
            Admin
          </span>
          <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mt-2 mb-4">Website Control Panel</h1>
          <p className="text-[var(--color-text-muted)] max-w-3xl">
            Manage website modules from one place. Jobs moderation remains available, and homepage LinkedIn post
            links can now be updated without code edits.
          </p>
          <div className="mt-4 space-y-1 text-xs text-[var(--color-text-muted)]">
            <p>
              Mode:{' '}
              <span className="font-medium text-[var(--color-text)]">
                {adminAccess.mode === 'supabase' ? 'Supabase' : 'Local Browser'}
              </span>
            </p>
            <p>
              Signed in as:{' '}
              <span className="font-medium text-[var(--color-text)]">{adminAccess.email ?? 'Not signed in'}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          {status && (
            <div
              className={`rounded-xl border p-4 ${
                status.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : status.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              {status.message}
            </div>
          )}

          {loading && (
            <article className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
              <p className="text-sm text-[var(--color-text-muted)]">Checking admin access...</p>
            </article>
          )}

          {requiresAdminSignIn && (
            <article className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
              <h2 className="text-xl text-[var(--color-primary)]">Admin sign-in required</h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-2 mb-4">
                Sign in with an admin email listed in `job_board_admins` to access admin content.
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
            </article>
          )}

          {canShowAdminContent && (
            <>
              <div className="grid md:grid-cols-2 gap-5">
                <article className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
                  <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-semibold">
                    Website Content
                  </p>
                  <h2 className="text-2xl text-[var(--color-primary)] mt-2">Homepage LinkedIn Feed</h2>
                  <p className="text-sm text-[var(--color-text-muted)] mt-2">
                    Edit the LinkedIn post URLs used in the 3-card news section on the homepage.
                  </p>
                </article>

                <article className="bg-white rounded-2xl border border-[var(--color-border)] p-6 flex flex-col">
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">
                    Jobs
                  </p>
                  <h2 className="text-2xl text-[var(--color-primary)] mt-2">Moderation Queue</h2>
                  <p className="text-sm text-[var(--color-text-muted)] mt-2 flex-grow">
                    Review submitted roles, publish listings, and manage expiry actions.
                  </p>
                  <div className="mt-5">
                    <Link
                      to="/admin/jobs"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-light)]"
                    >
                      Open Jobs Moderation
                    </Link>
                  </div>
                </article>
              </div>

              <article className="bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl text-[var(--color-primary)]">LinkedIn Post Links</h2>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                      Enter one URL per line. The homepage uses the first 3 valid LinkedIn post links.
                    </p>
                  </div>
                  <span className="text-xs rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] px-3 py-1 whitespace-nowrap">
                    {previewPosts.length}/3 valid for homepage
                  </span>
                </div>

                <form className="mt-5 space-y-4" onSubmit={handleSaveLinkedInSettings}>
                  <textarea
                    value={linkedInInput}
                    onChange={(event) => setLinkedInInput(event.target.value)}
                    rows={7}
                    placeholder="https://www.linkedin.com/posts/...\nhttps://www.linkedin.com/feed/update/urn:li:activity:...\nurn:li:activity:..."
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Parsed entries: {parsedInputUrls.length}. Invalid or duplicate entries: {invalidInputCount}.
                    </p>
                    <button
                      type="submit"
                      disabled={saveDisabled}
                      className={`inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium ${
                        saveDisabled
                          ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                          : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]'
                      }`}
                    >
                      {saving ? 'Saving...' : 'Save LinkedIn Links'}
                    </button>
                  </div>
                </form>

                <div className="mt-6 grid md:grid-cols-3 gap-3">
                  {previewPosts.length > 0 ? (
                    previewPosts.map((post) => (
                      <article
                        key={post.id}
                        className="rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-surface)]"
                      >
                        <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Preview</p>
                        <p className="text-sm font-medium text-[var(--color-primary)] break-all">{post.id}</p>
                        <a
                          href={post.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-[var(--color-accent)] hover:underline mt-2"
                        >
                          Open source link
                        </a>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      No valid LinkedIn post links yet. Add URLs above and save to update homepage cards.
                    </p>
                  )}
                </div>
              </article>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
