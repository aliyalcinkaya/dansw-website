import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl font-bold text-[var(--color-accent)]/20 mb-4">404</div>
        <h1 className="text-3xl text-[var(--color-primary)] mb-4">Page Not Found</h1>
        <p className="text-[var(--color-text-muted)] mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all"
          >
            Go Home
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <Link
            to="/events"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] font-semibold hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all"
          >
            View Events
          </Link>
        </div>
      </div>
    </div>
  );
}
