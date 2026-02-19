import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  clearCachedSiteAdminAccess,
  fetchSiteAdminAccess,
  getCachedSiteAdminAccess,
  type SiteAdminAccess,
} from '../services/siteSettings';
import { getSupabaseClient } from '../services/supabase';
import { Logo } from './Logo';

const initialAdminAccess: SiteAdminAccess = {
  mode: 'local',
  email: null,
  canManage: true,
};

export function AdminTopMenu() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [adminAccess, setAdminAccess] = useState<SiteAdminAccess>(
    getCachedSiteAdminAccess()?.data ?? initialAdminAccess
  );

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
  }, [pathname]);

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
      clearCachedSiteAdminAccess();
      setAdminAccess(initialAdminAccess);
      navigate('/admin');
    }
  };

  const isSignedIn = Boolean(adminAccess.email);

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-lg">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Logo />

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <>
                <span className="hidden text-sm text-[var(--color-text-muted)] sm:inline">{adminAccess.email}</span>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={loggingOut}
                  className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                    loggingOut
                      ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                      : 'bg-[var(--color-primary)] text-white hover:bg-slate-800'
                  }`}
                >
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <Link
                to="/admin-login"
                className="inline-flex items-center rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
