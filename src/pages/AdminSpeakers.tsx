import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdminBreadcrumbs } from '../components/AdminBreadcrumbs';
import { AdminLoadingCard } from '../components/AdminLoadingCard';
import { AdminMagicLinkCard } from '../components/AdminMagicLinkCard';
import { AdminStatusMessage } from '../components/AdminStatusMessage';
import { fetchAdminSpeakers, seedSampleSpeakers, upsertSpeaker } from '../services/eventAdmin';
import {
  fetchSiteAdminAccess,
  getCachedSiteAdminAccess,
  sendAdminMagicLink,
  type SiteAdminAccess,
} from '../services/siteSettings';
import type { AdminSpeaker } from '../types/eventsAdmin';

const initialAdminAccess: SiteAdminAccess = {
  mode: 'local',
  email: null,
  canManage: true,
};

const emptySpeakerForm = {
  id: '',
  fullName: '',
  headline: '',
  bio: '',
  photoUrl: '',
  linkedinUrl: '',
  websiteUrl: '',
  isActive: true,
};

type SpeakerFilter = 'all' | 'active' | 'inactive';

const speakerFilters: Array<{ value: SpeakerFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

function formatUpdatedAt(value: string) {
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

function mapSpeakerToForm(speaker: AdminSpeaker) {
  return {
    id: speaker.id,
    fullName: speaker.fullName,
    headline: speaker.headline,
    bio: speaker.bio,
    photoUrl: speaker.photoUrl ?? '',
    linkedinUrl: speaker.linkedinUrl ?? '',
    websiteUrl: speaker.websiteUrl ?? '',
    isActive: speaker.isActive,
  };
}

type AdminSpeakersMode = 'list' | 'create';

export function AdminSpeakers({ mode = 'list' }: { mode?: AdminSpeakersMode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const cachedAdminAccess = getCachedSiteAdminAccess();
  const [loading, setLoading] = useState(!cachedAdminAccess);
  const [adminAccess, setAdminAccess] = useState<SiteAdminAccess>(cachedAdminAccess?.data ?? initialAdminAccess);
  const [authLinkEmail, setAuthLinkEmail] = useState(cachedAdminAccess?.data.email ?? '');
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [seedingSamples, setSeedingSamples] = useState(false);
  const [savingSpeaker, setSavingSpeaker] = useState(false);
  const [speakers, setSpeakers] = useState<AdminSpeaker[]>([]);
  const [speakerForm, setSpeakerForm] = useState(emptySpeakerForm);
  const [speakerFilter, setSpeakerFilter] = useState<SpeakerFilter>('all');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const isCreateScreen = mode === 'create';
  const selectedSpeakerId = searchParams.get('speakerId');

  const canShowAdminContent = !loading && !(adminAccess.mode === 'supabase' && !adminAccess.canManage);

  const filteredSpeakers = useMemo(() => {
    if (speakerFilter === 'all') {
      return speakers;
    }

    if (speakerFilter === 'active') {
      return speakers.filter((speaker) => speaker.isActive);
    }

    return speakers.filter((speaker) => !speaker.isActive);
  }, [speakerFilter, speakers]);

  const hasSelectedSpeaker = Boolean(speakerForm.id);

  const refreshSpeakers = useCallback(async () => {
    const speakersResult = await fetchAdminSpeakers();
    if (!speakersResult.ok) {
      setStatus({
        type: 'error',
        message: speakersResult.message ?? 'Unable to load speakers.',
      });
      setSpeakers([]);
      return;
    }

    setSpeakers(speakersResult.data);

    if (!isCreateScreen) {
      if (!selectedSpeakerId) {
        setSpeakerForm(emptySpeakerForm);
      } else {
        const selected = speakersResult.data.find((speaker) => speaker.id === selectedSpeakerId);
        setSpeakerForm(selected ? mapSpeakerToForm(selected) : emptySpeakerForm);
      }
    }
  }, [isCreateScreen, selectedSpeakerId]);

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
        await refreshSpeakers();
      }

      setLoading(false);
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [refreshSpeakers]);

  const handleSendMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSendingMagicLink(true);
    setStatus(null);

    const result = await sendAdminMagicLink(
      authLinkEmail,
      isCreateScreen ? '/admin/speakers/new' : '/admin/speakers'
    );
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

  const handleSaveSpeaker = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingSpeaker(true);
    setStatus(null);

    const result = await upsertSpeaker({
      id: speakerForm.id || undefined,
      fullName: speakerForm.fullName,
      headline: speakerForm.headline,
      bio: speakerForm.bio,
      photoUrl: speakerForm.photoUrl,
      linkedinUrl: speakerForm.linkedinUrl,
      websiteUrl: speakerForm.websiteUrl,
      isActive: speakerForm.isActive,
    });

    setSavingSpeaker(false);

    if (!result.ok) {
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to save speaker profile.',
      });
      return;
    }

    await refreshSpeakers();
    setSpeakerForm(result.data ? mapSpeakerToForm(result.data) : emptySpeakerForm);
    setStatus({
      type: 'success',
      message: 'Speaker saved.',
    });
  };

  const handleSelectSpeaker = (speaker: AdminSpeaker) => {
    setSearchParams({ speakerId: speaker.id });
  };

  const handleSeedSampleSpeakers = async () => {
    setSeedingSamples(true);
    setStatus(null);

    const result = await seedSampleSpeakers();
    setSeedingSamples(false);

    if (!result.ok) {
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to seed sample speakers.',
      });
      return;
    }

    await refreshSpeakers();
    setStatus({
      type: 'success',
      message: result.message ?? 'Sample speakers seeded.',
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
          <AdminBreadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Speakers', href: '/admin/speakers' },
              ...(isCreateScreen
                ? [{ label: 'Create' }]
                : hasSelectedSpeaker
                  ? [{ label: speakerForm.fullName || 'Details' }]
                  : []),
            ]}
          />
          <h1 className="mt-4 text-4xl text-[var(--color-primary)] md:text-5xl">Speakers</h1>
          <p className="mt-3 max-w-3xl text-[var(--color-text-muted)]">
            Manage speaker profiles for the event talk lineup.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
          <AdminStatusMessage status={status} />

          {loading && <AdminLoadingCard />}

          {!loading && adminAccess.mode === 'supabase' && !adminAccess.canManage && (
            <AdminMagicLinkCard
              email={authLinkEmail}
              onEmailChange={setAuthLinkEmail}
              onSubmit={handleSendMagicLink}
              sending={sendingMagicLink}
              description="Sign in with an admin email listed in `job_board_admins` to manage speakers."
            />
          )}

          {canShowAdminContent && (
            <>
              {!isCreateScreen && !hasSelectedSpeaker && (
                <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-7">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      {speakerFilters.map((filter) => (
                        <button
                          key={filter.value}
                          type="button"
                          onClick={() => setSpeakerFilter(filter.value)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            speakerFilter === filter.value
                              ? 'bg-[var(--color-accent)] text-white'
                              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSeedSampleSpeakers}
                        disabled={seedingSamples}
                        className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                          seedingSamples
                            ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                            : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
                        }`}
                      >
                        {seedingSamples ? 'Seeding...' : 'Seed Sample Speakers'}
                      </button>
                      <Link
                        to="/admin/speakers/new"
                        className="inline-flex items-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-light)]"
                      >
                        Add New Speaker
                      </Link>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                    <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
                      <thead className="bg-[var(--color-surface)] text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        <tr>
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Headline</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)] bg-white">
                        {filteredSpeakers.length > 0 ? (
                          filteredSpeakers.map((speaker) => (
                            <tr
                              key={speaker.id}
                              onClick={() => handleSelectSpeaker(speaker)}
                              className={`cursor-pointer transition-colors hover:bg-[var(--color-surface)] ${
                                selectedSpeakerId === speaker.id ? 'bg-[var(--color-accent)]/5' : ''
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-[var(--color-primary)]">
                                <div className="flex items-center gap-3">
                                  {speaker.photoUrl ? (
                                    <img
                                      src={speaker.photoUrl}
                                      alt={`${speaker.fullName} profile photo`}
                                      loading="lazy"
                                      className="h-10 w-10 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] object-cover"
                                    />
                                  ) : null}
                                  <span>{speaker.fullName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[var(--color-text-muted)]">{speaker.headline || '-'}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                    speaker.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {speaker.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatUpdatedAt(speaker.updatedAt)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-[var(--color-text-muted)]">
                              No speakers found for this filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              )}

              {(isCreateScreen || hasSelectedSpeaker) && (
                <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-7">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl text-[var(--color-primary)]">
                      {isCreateScreen ? 'Create Speaker' : speakerForm.fullName || 'Edit Speaker'}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                      {isCreateScreen
                        ? 'Create a new speaker profile to use in event talk lineups.'
                        : 'Review and update the selected speaker profile.'}
                    </p>
                  </div>
                  {(isCreateScreen || hasSelectedSpeaker) && (
                    <Link
                      to="/admin/speakers"
                      className="inline-flex items-center rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      Back to Speakers List
                    </Link>
                  )}
                </div>

                <form onSubmit={handleSaveSpeaker} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm text-[var(--color-text-muted)]">Full name</label>
                    <input
                      type="text"
                      value={speakerForm.fullName}
                      onChange={(inputEvent) => setSpeakerForm((current) => ({ ...current, fullName: inputEvent.target.value }))}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      placeholder="Speaker full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[var(--color-text-muted)]">Headline</label>
                    <input
                      type="text"
                      value={speakerForm.headline}
                      onChange={(inputEvent) => setSpeakerForm((current) => ({ ...current, headline: inputEvent.target.value }))}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      placeholder="Role or company"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[var(--color-text-muted)]">Photo URL</label>
                    <input
                      type="url"
                      value={speakerForm.photoUrl}
                      onChange={(inputEvent) => setSpeakerForm((current) => ({ ...current, photoUrl: inputEvent.target.value }))}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm text-[var(--color-text-muted)]">LinkedIn URL</label>
                      <input
                        type="url"
                        value={speakerForm.linkedinUrl}
                        onChange={(inputEvent) =>
                          setSpeakerForm((current) => ({ ...current, linkedinUrl: inputEvent.target.value }))
                        }
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-[var(--color-text-muted)]">Website URL</label>
                      <input
                        type="url"
                        value={speakerForm.websiteUrl}
                        onChange={(inputEvent) => setSpeakerForm((current) => ({ ...current, websiteUrl: inputEvent.target.value }))}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[var(--color-text-muted)]">Bio</label>
                    <textarea
                      value={speakerForm.bio}
                      onChange={(inputEvent) => setSpeakerForm((current) => ({ ...current, bio: inputEvent.target.value }))}
                      className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      rows={4}
                      placeholder="Short speaker bio"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                    <input
                      type="checkbox"
                      checked={speakerForm.isActive}
                      onChange={(inputEvent) => setSpeakerForm((current) => ({ ...current, isActive: inputEvent.target.checked }))}
                      className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                    />
                    Active speaker profile
                  </label>
                  <button
                    type="submit"
                    disabled={savingSpeaker}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium ${
                      savingSpeaker
                        ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                        : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]'
                    }`}
                  >
                    {savingSpeaker ? 'Saving...' : speakerForm.id ? 'Update Speaker' : 'Create Speaker'}
                  </button>
                </form>
                </article>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
