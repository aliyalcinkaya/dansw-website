import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  clearCachedSiteAdminAccess,
  fetchSiteAdminAccess,
  getCachedSiteAdminAccess,
  type SiteAdminAccess,
} from '../services/siteSettings';
import { getSupabaseClient } from '../services/supabase';
import { Logo } from './Logo';

interface AdminTab {
  name: string;
  href: string;
  isCurrent: (pathname: string) => boolean;
}

const tabs: AdminTab[] = [
  {
    name: 'Home',
    href: '/admin',
    isCurrent: (pathname) => pathname === '/admin',
  },
  {
    name: 'Social Media Posts',
    href: '/admin/social-posts',
    isCurrent: (pathname) => pathname.startsWith('/admin/social-posts'),
  },
  {
    name: 'Jobs',
    href: '/admin/jobs',
    isCurrent: (pathname) => pathname.startsWith('/admin/jobs'),
  },
  {
    name: 'Events',
    href: '/admin/events',
    isCurrent: (pathname) => pathname.startsWith('/admin/events'),
  },
  {
    name: 'Speakers',
    href: '/admin/speakers',
    isCurrent: (pathname) => pathname.startsWith('/admin/speakers'),
  },
];

const initialAdminAccess: SiteAdminAccess = {
  mode: 'local',
  email: null,
  canManage: true,
};

function getProfileInitial(email: string | null) {
  if (!email) {
    return 'A';
  }

  const firstCharacter = email.trim().charAt(0).toUpperCase();
  return firstCharacter || 'A';
}

export function AdminTopMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [adminAccess, setAdminAccess] = useState<SiteAdminAccess>(
    getCachedSiteAdminAccess()?.data ?? initialAdminAccess
  );
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileButtonRef = useRef<HTMLButtonElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const accessResult = await fetchSiteAdminAccess();
      if (!isMounted) {
        return;
      }

      setAdminAccess(accessResult.data);
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const focusables = mobileMenuRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? null;
    const firstFocusable = focusables?.[0];
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const currentFocusables = mobileMenuRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? null;
      if (!currentFocusables || currentFocusables.length === 0) {
        return;
      }

      const first = currentFocusables[0];
      const last = currentFocusables[currentFocusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isProfileOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (profileMenuRef.current?.contains(target) || profileButtonRef.current?.contains(target)) {
        return;
      }

      setIsProfileOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileOpen]);

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const client = getSupabaseClient();
      if (client) {
        await client.auth.signOut();
      }
    } finally {
      setLoggingOut(false);
      setIsOpen(false);
      setIsProfileOpen(false);
      clearCachedSiteAdminAccess();
      setAdminAccess(initialAdminAccess);
      navigate('/admin');
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-lg">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Logo />

          <div className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                to={tab.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab.isCurrent(location.pathname)
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'
                }`}
              >
                {tab.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <button
                ref={profileButtonRef}
                type="button"
                onClick={() => setIsProfileOpen((previous) => !previous)}
                className="flex items-center gap-2 rounded-full p-1 pr-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
                aria-label="Open admin profile menu"
                aria-expanded={isProfileOpen}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-white">
                  {getProfileInitial(adminAccess.email)}
                </span>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 0 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isProfileOpen && (
                <div
                  ref={profileMenuRef}
                  className="absolute right-0 mt-2 w-72 rounded-xl border border-[var(--color-border)] bg-white p-3 shadow-lg"
                >
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Signed in as</p>
                  <p className="mt-1 truncate text-sm font-medium text-[var(--color-text)]">
                    {adminAccess.email ?? 'Not signed in'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={loggingOut}
                    className={`mt-3 inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium ${
                      loggingOut
                        ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                        : 'bg-[var(--color-primary)] text-white hover:bg-slate-800'
                    }`}
                  >
                    {loggingOut ? 'Logging out...' : 'Sign out'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsOpen((previous) => !previous)}
            className="md:hidden p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            aria-controls="mobile-admin-navigation-menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {isOpen && (
          <div
            id="mobile-admin-navigation-menu"
            ref={mobileMenuRef}
            className="md:hidden py-4 border-t border-[var(--color-border)]"
          >
            <div className="flex flex-col gap-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  to={tab.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    tab.isCurrent(location.pathname)
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'
                  }`}
                >
                  {tab.name}
                </Link>
              ))}
              <div className="mt-2 border-t border-[var(--color-border)] pt-3">
                <p className="px-4 text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Signed in as</p>
                <p className="px-4 text-sm font-medium text-[var(--color-text)]">
                  {adminAccess.email ?? 'Not signed in'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                className={`px-4 py-3 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                  loggingOut
                    ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'
                }`}
              >
                {loggingOut ? 'Logging out...' : 'Sign out'}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
