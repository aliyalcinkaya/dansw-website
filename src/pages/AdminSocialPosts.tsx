import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminBreadcrumbs } from '../components/AdminBreadcrumbs';
import { AdminLoadingCard } from '../components/AdminLoadingCard';
import { AdminMagicLinkCard } from '../components/AdminMagicLinkCard';
import { AdminStatusMessage } from '../components/AdminStatusMessage';
import { getLinkedInEmbedPostsFromInputs, parseLinkedInPostInputs } from '../services/linkedin';
import {
  fetchLinkedInPostUrls,
  fetchSiteAdminAccess,
  getCachedSiteAdminAccess,
  saveLinkedInPostUrls,
  sendAdminMagicLink,
  type SiteAdminAccess,
} from '../services/siteSettings';

const initialAdminAccess: SiteAdminAccess = {
  mode: 'local',
  email: null,
  canManage: true,
};

type AdminSocialPostsMode = 'list' | 'create' | 'edit';

interface LinkedInPostRow {
  index: number;
  url: string;
  postId: string;
  sourceUrl: string;
  isValid: boolean;
}

function mapLinkedInPostRow(url: string, index: number): LinkedInPostRow {
  const preview = getLinkedInEmbedPostsFromInputs([url], 1)[0] ?? null;

  return {
    index,
    url,
    postId: preview?.id ?? 'Invalid Link',
    sourceUrl: preview?.sourceUrl ?? url,
    isValid: Boolean(preview),
  };
}

export function AdminSocialPosts({ mode = 'list' }: { mode?: AdminSocialPostsMode }) {
  const navigate = useNavigate();
  const params = useParams<{ postIndex: string }>();

  const cachedAdminAccess = getCachedSiteAdminAccess();
  const [loading, setLoading] = useState(!cachedAdminAccess);
  const [saving, setSaving] = useState(false);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [adminAccess, setAdminAccess] = useState<SiteAdminAccess>(cachedAdminAccess?.data ?? initialAdminAccess);
  const [authLinkEmail, setAuthLinkEmail] = useState(cachedAdminAccess?.data.email ?? '');
  const [postUrls, setPostUrls] = useState<string[]>([]);
  const [linkFormValue, setLinkFormValue] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const isListScreen = mode === 'list';
  const isCreateScreen = mode === 'create';
  const isEditScreen = mode === 'edit';

  const editIndex = useMemo(() => {
    if (!isEditScreen) {
      return null;
    }

    const parsed = Number(params.postIndex ?? '');
    if (!Number.isInteger(parsed) || parsed < 0) {
      return null;
    }

    return parsed;
  }, [isEditScreen, params.postIndex]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const [accessResult, linksResult] = await Promise.all([fetchSiteAdminAccess(), fetchLinkedInPostUrls()]);

      if (!isMounted) {
        return;
      }

      setAdminAccess(accessResult.data);
      setAuthLinkEmail(accessResult.data.email ?? '');
      setPostUrls(linksResult.data);

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

  const editRowExists = isEditScreen && editIndex !== null && postUrls[editIndex] !== undefined;
  const rows = useMemo(() => postUrls.map((url, index) => mapLinkedInPostRow(url, index)), [postUrls]);
  const validCount = useMemo(() => rows.filter((row) => row.isValid).length, [rows]);
  const defaultLinkValue = isEditScreen && editRowExists ? postUrls[editIndex] : '';
  const activeLinkValue = linkFormValue ?? defaultLinkValue;
  const currentPreview = useMemo(
    () => getLinkedInEmbedPostsFromInputs([activeLinkValue], 1)[0] ?? null,
    [activeLinkValue]
  );

  const requiresAdminSignIn = !loading && adminAccess.mode === 'supabase' && !adminAccess.canManage;
  const canShowAdminContent = !loading && !requiresAdminSignIn;
  const saveDisabled = saving || (adminAccess.mode === 'supabase' && !adminAccess.canManage);

  const handleSendMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setSendingMagicLink(true);

    const redirectPath = isEditScreen && editIndex !== null
      ? `/admin/social-posts/edit/${editIndex}`
      : isCreateScreen
        ? '/admin/social-posts/new'
        : '/admin/social-posts';

    const result = await sendAdminMagicLink(authLinkEmail, redirectPath);
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

  const handleSaveLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedInput = parseLinkedInPostInputs(activeLinkValue)[0] ?? '';
    if (!parsedInput) {
      setStatus({ type: 'error', message: 'LinkedIn URL or URN is required.' });
      return;
    }

    const preview = getLinkedInEmbedPostsFromInputs([parsedInput], 1)[0] ?? null;
    if (!preview) {
      setStatus({ type: 'error', message: 'Enter a valid LinkedIn post URL or URN.' });
      return;
    }

    let nextUrls: string[] = [];
    if (isCreateScreen) {
      nextUrls = [...postUrls, parsedInput];
    } else if (isEditScreen && editIndex !== null && postUrls[editIndex] !== undefined) {
      nextUrls = postUrls.map((url, index) => (index === editIndex ? parsedInput : url));
    } else {
      setStatus({ type: 'error', message: 'Invalid post selection for editing.' });
      return;
    }

    setSaving(true);
    setStatus(null);

    const result = await saveLinkedInPostUrls(nextUrls);
    setSaving(false);

    if (!result.ok) {
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to save LinkedIn links.',
      });
      return;
    }

    setPostUrls(result.data);
    setStatus({
      type: 'success',
      message: result.message ?? 'LinkedIn links updated.',
    });

    navigate('/admin/social-posts');
  };

  const handleDeleteLink = async () => {
    if (!isEditScreen || editIndex === null || !postUrls[editIndex]) {
      return;
    }

    const shouldDelete = window.confirm('Delete this LinkedIn post link?');
    if (!shouldDelete) {
      return;
    }

    const nextUrls = postUrls.filter((_, index) => index !== editIndex);

    setSaving(true);
    setStatus(null);

    const result = await saveLinkedInPostUrls(nextUrls);
    setSaving(false);

    if (!result.ok) {
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to delete LinkedIn link.',
      });
      return;
    }

    setPostUrls(result.data);
    setStatus({
      type: 'success',
      message: result.message ?? 'LinkedIn link deleted.',
    });

    navigate('/admin/social-posts');
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
          <AdminBreadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Social Media Posts', href: '/admin/social-posts' },
              ...(isCreateScreen
                ? [{ label: 'Create' }]
                : isEditScreen
                  ? [{ label: editRowExists ? 'Edit' : 'Not Found' }]
                  : []),
            ]}
          />
          <h1 className="mt-4 text-4xl text-[var(--color-primary)] md:text-5xl">Social Media Posts</h1>
          <p className="mt-3 max-w-3xl text-[var(--color-text-muted)]">
            Manage LinkedIn post URLs used by the homepage social feed cards.
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
              description="Sign in with an admin email listed in `job_board_admins` to manage social media posts."
            />
          )}

          {canShowAdminContent && isListScreen && (
            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-7">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--color-text-muted)]">
                  {rows.length} links total, {validCount} valid for display. Homepage uses the first 3 valid links.
                </p>
                <Link
                  to="/admin/social-posts/new"
                  className="inline-flex items-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)]"
                >
                  Add New Link
                </Link>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
                  <thead className="bg-[var(--color-surface)] text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Post</th>
                      <th className="px-4 py-3 font-medium">Link</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] bg-white">
                    {rows.length > 0 ? (
                      rows.map((row) => (
                        <tr
                          key={`${row.index}-${row.url}`}
                          onClick={() => navigate(`/admin/social-posts/edit/${row.index}`)}
                          className="cursor-pointer transition-colors hover:bg-[var(--color-surface)]"
                        >
                          <td className="px-4 py-3 font-medium text-[var(--color-primary)]">{row.postId}</td>
                          <td className="px-4 py-3 text-[var(--color-text-muted)]">
                            <span className="line-clamp-1">{row.url}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                row.isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {row.isValid ? 'Valid' : 'Invalid'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-[var(--color-text-muted)]">
                          No LinkedIn links yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          )}

          {canShowAdminContent && (isCreateScreen || isEditScreen) && (
            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-7">
              {isEditScreen && !editRowExists ? (
                <>
                  <h2 className="text-2xl text-[var(--color-primary)]">LinkedIn Link Not Found</h2>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    The selected link could not be found. It may have been removed or re-ordered.
                  </p>
                  <div className="mt-4">
                    <Link
                      to="/admin/social-posts"
                      className="inline-flex items-center rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      Back to Posts List
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl text-[var(--color-primary)]">
                        {isCreateScreen ? 'Create LinkedIn Link' : 'Edit LinkedIn Link'}
                      </h2>
                      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                        Paste a LinkedIn post URL or URN (for example: `urn:li:activity:...`).
                      </p>
                    </div>
                    <Link
                      to="/admin/social-posts"
                      className="inline-flex items-center rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      Back to Posts List
                    </Link>
                  </div>

                  <form onSubmit={handleSaveLink} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm text-[var(--color-text-muted)]">LinkedIn URL or URN</label>
                      <input
                        type="text"
                        value={activeLinkValue}
                        onChange={(event) => setLinkFormValue(event.target.value)}
                        placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        required
                      />
                    </div>

                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-muted)]">
                      {currentPreview ? (
                        <div className="space-y-3">
                          <p>
                            Post ID: <span className="font-medium text-[var(--color-text)]">{currentPreview.id}</span>
                          </p>
                          <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
                            <iframe
                              src={currentPreview.embedUrl}
                              title={`LinkedIn preview ${currentPreview.id}`}
                              className="h-[420px] w-full border-0 bg-white"
                              loading="lazy"
                              allowFullScreen
                            />
                          </div>
                          <a
                            href={currentPreview.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[var(--color-accent)] hover:underline"
                          >
                            Open LinkedIn post
                          </a>
                        </div>
                      ) : (
                        <p>Preview unavailable until a valid LinkedIn URL or URN is entered.</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={saveDisabled}
                        className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium ${
                          saveDisabled
                            ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                            : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]'
                        }`}
                      >
                        {saving ? 'Saving...' : isCreateScreen ? 'Create Link' : 'Update Link'}
                      </button>

                      {isEditScreen && (
                        <button
                          type="button"
                          onClick={handleDeleteLink}
                          disabled={saveDisabled}
                          className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium ${
                            saveDisabled
                              ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          Delete Link
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
