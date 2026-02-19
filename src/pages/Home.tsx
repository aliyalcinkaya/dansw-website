import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEventbriteEvents } from '../hooks/useEventbriteEvents';
import { getLinkedInEmbedPosts, getLinkedInEmbedPostsFromInputs } from '../services/linkedin';
import { fetchLinkedInPostUrls } from '../services/siteSettings';
import { UpcomingEventsSection } from '../components/UpcomingEventsSection';
import { trackEvent } from '../services/analytics';

const eventPhotoPaths = Object.values(
  import.meta.glob('../assets/event_photos/*.{jpg,jpeg,png,webp,avif,gif}', { eager: true, import: 'default' }),
).filter((value): value is string => typeof value === 'string');

const avatarImagePaths = Object.keys(
  import.meta.glob('/public/avatar/*.{jpg,jpeg,webp,avif,gif}'),
).map((path) => path.replace('/public', ''));

const heroEventPhotos = eventPhotoPaths.length > 0 ? [...eventPhotoPaths].sort() : ['/member_photos/1000022844.jpg'];

const heroCollagePhotoClasses = [
  'absolute left-1/2 top-1/2 w-64 h-64 lg:w-72 lg:h-72 rounded-2xl overflow-hidden shadow-2xl -rotate-6 z-20 -translate-x-[96%] -translate-y-[72%] bg-[var(--color-surface-alt)]',
  'absolute left-1/2 top-1/2 w-72 h-72 lg:w-80 lg:h-80 rounded-2xl overflow-hidden shadow-2xl rotate-4 z-30 -translate-x-[6%] -translate-y-[60%] bg-[var(--color-surface-alt)]',
  'absolute left-1/2 top-1/2 w-60 h-60 lg:w-[17rem] lg:h-[17rem] rounded-2xl overflow-hidden shadow-2xl -rotate-3 z-10 -translate-x-[56%] -translate-y-[2%] bg-[var(--color-surface-alt)]',
];

function pickRandomPhotos(images: string[], count: number) {
  const shuffled = [...images];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled.slice(0, Math.max(0, count));
}

export function Home() {
  const { events, loading, error, refetch } = useEventbriteEvents();
  const slackInviteUrl = 'https://digitalanalyticsnsw.slack.com/join/shared_invite/zt-3mmkotolj-ph8HO7SAO9Z5lx1RDClEZQ?mc_cid=855b22f969&mc_eid=4f57692826#/shared-invite/email';
  const linkedinCompanyUrl = 'https://www.linkedin.com/company/data-and-analytics-wednesday-sydney/posts/?feedView=all';
  const heroAvatars = useMemo(
    () => pickRandomPhotos(avatarImagePaths.length > 0 ? avatarImagePaths : heroEventPhotos, 8),
    [],
  );
  const heroCollagePhotos = useMemo(
    () => pickRandomPhotos(heroEventPhotos, heroCollagePhotoClasses.length),
    [],
  );
  const rotatingEventPhotos = useMemo(
    () => pickRandomPhotos(heroEventPhotos, heroEventPhotos.length),
    [],
  );
  const [memberPhotoIndex, setMemberPhotoIndex] = useState(0);
  const [linkedinPosts, setLinkedinPosts] = useState(() => getLinkedInEmbedPosts(3));

  useEffect(() => {
    let cancelled = false;

    const loadLinkedInPosts = async () => {
      const result = await fetchLinkedInPostUrls();
      if (cancelled) {
        return;
      }

      setLinkedinPosts(getLinkedInEmbedPostsFromInputs(result.data, 3));
    };

    void loadLinkedInPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (rotatingEventPhotos.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setMemberPhotoIndex((current) => (current + 1) % rotatingEventPhotos.length);
    }, 3500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [rotatingEventPhotos]);

  const currentMemberPhoto =
    rotatingEventPhotos[memberPhotoIndex] ?? heroEventPhotos[0];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-surface)] via-white to-[var(--color-brand-mint-soft)]">
        {/* Background decoration */}
        <div className="absolute inset-0 data-dots"></div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
            <div className="max-w-2xl relative z-30">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent)]"></span>
                </span>
                <Link
                  to="/jobs"
                  onClick={() => trackEvent('home_cta_click', { cta_id: 'hero_job_board_badge', target: '/jobs' })}
                  className="text-[var(--color-accent)] hover:underline"
                >
                  Job Board is Live! See Open Roles
                </Link>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl text-[var(--color-primary)] mb-6">
                Join Sydney's biggest {' '}
                <span className="italic text-[var(--color-accent)]"> analytics</span>{' '}
                community
              </h1>

              <p className="text-lg md:text-xl text-[var(--color-text-muted)] mb-8 leading-relaxed">
                Informal meetup for web analytics, digital marketing optimization, digital advertising and related types to meet and catch up. Second Wednesday of each month.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/events"
                  onClick={() => trackEvent('home_cta_click', { cta_id: 'hero_join_next_event', target: '/events' })}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all shadow-lg shadow-[var(--color-accent)]/25"
                >
                  Join our Next Event
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <a
                  href={slackInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('home_cta_click', { cta_id: 'hero_join_slack', target: 'slack_invite' })}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-[var(--color-text)] font-semibold border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all"
                >
                  Join Slack
                  <img src="/slack_logo.png" alt="" aria-hidden="true" className="ml-2 w-5 h-5 object-contain" />
                </a>
              </div>

              {heroAvatars.length > 0 && (
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex -space-x-4">
                    {heroAvatars.map((avatarSrc, index) => (
                      <img
                        key={`${avatarSrc}-${index}`}
                        src={avatarSrc}
                        alt="Community member"
                        className="h-11 w-11 rounded-full border-2 border-white object-cover shadow-sm"
                        style={{ zIndex: heroAvatars.length - index }}
                        loading={index < 4 ? 'eager' : 'lazy'}
                        fetchPriority={index < 2 ? 'high' : 'auto'}
                      />
                    ))}
                    <div className="flex h-11 w-16 items-center justify-center rounded-full border-2 border-white bg-[var(--color-surface-alt)] px-2 text-xs font-semibold text-[var(--color-primary)] shadow-sm">
                      +7823
                    </div>
                  </div>
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">
                    community members
                  </p>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center justify-center">
              <div className="relative w-full max-w-[38rem] h-[34rem]">
                {heroCollagePhotoClasses.map((className, index) => {
                  const photoSrc = heroCollagePhotos[index];

                  if (!photoSrc) {
                    return null;
                  }

                  return (
                    <div key={`${photoSrc}-${index}`} className={className}>
                      <img
                        src={photoSrc}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover"
                        loading="eager"
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <UpcomingEventsSection events={events} loading={loading} error={error} onRetry={refetch} />

      {/* LinkedIn News Section */}
      <section className="py-20 bg-gradient-to-b from-white to-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <span className="inline-flex items-center gap-2 text-[#0A66C2] text-sm font-semibold uppercase tracking-wider">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#0A66C2] text-[10px] font-bold text-white">
                  in
                </span>
                Community News
              </span>
              <h2 className="text-3xl md:text-4xl text-[var(--color-primary)] mt-2 mb-3">
                Latest from LinkedIn
              </h2>
              <p className="text-[var(--color-text-muted)] max-w-2xl">
                Fresh updates from our LinkedIn page, including meetup recaps and speaker announcements.
              </p>
            </div>
            <a
              href={linkedinCompanyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('home_cta_click', { cta_id: 'linkedin_follow', target: linkedinCompanyUrl })}
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-[#bfd6ee] bg-white text-[#0A66C2] font-semibold hover:border-[#0A66C2] transition-all"
            >
              Follow on LinkedIn
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {linkedinPosts.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => {
                const post = linkedinPosts[index];

                if (!post) {
                  return (
                    <article
                      key={`linkedin-placeholder-${index + 1}`}
                      className="overflow-hidden rounded-2xl border border-dashed border-[#bfd6ee] bg-[#f8fbff]"
                    >
                      <div className="flex h-[420px] items-center justify-center px-6 text-center">
                        <p className="text-sm text-[var(--color-text-muted)]">
                          Add another LinkedIn post URL in the admin panel to fill this card.
                        </p>
                      </div>
                    </article>
                  );
                }

                return (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-2xl border border-[#d7e2ef] bg-white shadow-[0_8px_26px_rgba(15,23,42,0.06)]"
                  >
                    <iframe
                      src={post.embedUrl}
                      title={`LinkedIn post ${post.id}`}
                      className="w-full h-[420px] border-0 bg-white"
                      loading="lazy"
                      allowFullScreen
                    />
                    <div className="border-t border-[#e2e8f0] bg-[#f8fbff] px-4 py-3">
                      <a
                        href={post.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackEvent('home_linkedin_post_click', {
                            post_id: post.id,
                            target: post.sourceUrl,
                          })
                        }
                        className="inline-flex items-center text-sm font-semibold text-[#0A66C2] hover:underline"
                      >
                        View full post on LinkedIn
                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8">
              <p className="text-[var(--color-primary)] mb-3">
                LinkedIn embeds are ready. Add links in the admin panel (`/admin`) or set
                `VITE_LINKEDIN_POST_URLS` as a fallback.
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Use comma-separated URLs (or URNs), for example:
              </p>
              <code className="block mt-3 p-3 rounded-lg bg-white border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] overflow-x-auto">
                VITE_LINKEDIN_POST_URLS=https://www.linkedin.com/feed/update/urn:li:activity:123...,https://www.linkedin.com/posts/your-page_activity-456...
              </code>
            </div>
          )}
        </div>
      </section>

      {/* About Preview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
                About Us
              </span>
              <h2 className="text-3xl md:text-4xl text-[var(--color-primary)] mt-2 mb-6">
                Digital Analytics NSW Inc.
              </h2>
              <p className="text-[var(--color-text-muted)] mb-6 leading-relaxed">
                We are the incorporated association that runs Data & Analytics Wednesday Sydney 
                and MeasureCamp Sydney. Our community is made up of a diverse group of data and 
                analytics enthusiasts and professionals.
              </p>
              <p className="text-[var(--color-text-muted)] mb-8 leading-relaxed">
                Our mission is to promote and enhance our industry by running amazing events, 
                fostering connections, and sharing knowledge across the Sydney analytics community.
              </p>
              <Link
                to="/about"
                onClick={() => trackEvent('home_cta_click', { cta_id: 'about_learn_more', target: '/about' })}
                className="inline-flex items-center text-[var(--color-accent)] font-semibold hover:gap-3 transition-all gap-2"
              >
                Learn more about us
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            
            {/* Visual element */}
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-xl border border-[var(--color-border)] bg-white">
                <img
                  src={currentMemberPhoto}
                  alt="DAW Sydney event photo"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Do a Talk Section */}
      <section className="py-20 bg-gradient-to-br from-[var(--color-primary)] to-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex items-center rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90">
                Do a Talk
              </span>
              <h2 className="mt-5 text-3xl md:text-4xl">
                Share practical analytics lessons with the community
              </h2>
              <p className="mt-4 max-w-2xl text-white/80">
                We welcome both first-time and experienced speakers. Sessions are practical, friendly, and built for
                people who want real examples they can use the next day.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/become-a-speaker"
                  onClick={() =>
                    trackEvent('home_cta_click', { cta_id: 'do_a_talk_submit', target: '/become-a-speaker' })
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-[var(--color-primary)] transition-all hover:bg-[var(--color-accent)] hover:text-white"
                >
                  Submit a Talk
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  to="/events"
                  onClick={() =>
                    trackEvent('home_cta_click', { cta_id: 'do_a_talk_view_sessions', target: '/events' })
                  }
                  className="inline-flex items-center justify-center rounded-xl border border-white/40 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
                >
                  View Upcoming Sessions
                </Link>
              </div>
            </div>

            <aside className="rounded-3xl border border-white/15 bg-white/10 p-6 md:p-8">
              <h3 className="text-2xl">Speaking At DAW Sydney</h3>
              <p className="mt-3 text-sm text-white/80">
              We prioritize inclusive, non-salesy talks with practical examples that help attendees level up.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-white/90">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[var(--color-primary)]">1</span>
                  Time: Typically 15-20 minutes plus Q&A
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[var(--color-primary)]">2</span>
                    Format: Slides, demos, case studies, panels, and conversations
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[var(--color-primary)]">3</span>
                  Audience: Analysts, marketers, engineers, product teams, and leaders
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[var(--color-primary)]">4</span>
                  Support: Our team helps with timing, setup checks, and talk flow
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

    </div>
  );
}
