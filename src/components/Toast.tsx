import { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  open: boolean;
  type: ToastType;
  message: string;
  onClose: () => void;
  durationMs?: number;
  title?: string;
}

function getToastStyles(type: ToastType) {
  if (type === 'success') {
    return {
      container: 'border-emerald-200 text-emerald-900',
      iconWrap: 'bg-emerald-100 text-emerald-700',
      closeHover: 'hover:bg-emerald-100',
      title: 'Submission received',
    };
  }

  if (type === 'error') {
    return {
      container: 'border-red-200 text-red-900',
      iconWrap: 'bg-red-100 text-red-700',
      closeHover: 'hover:bg-red-100',
      title: 'Could not submit',
    };
  }

  return {
    container: 'border-[var(--color-border)] text-[var(--color-primary)]',
    iconWrap: 'bg-[var(--color-surface-alt)] text-[var(--color-accent)]',
    closeHover: 'hover:bg-[var(--color-surface-alt)]',
    title: 'Notice',
  };
}

export function Toast({ open, type, message, onClose, durationMs = 5200, title }: ToastProps) {
  useEffect(() => {
    if (!open || durationMs <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, durationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [durationMs, onClose, open]);

  if (!open) {
    return null;
  }

  const styles = getToastStyles(type);
  const heading = title ?? styles.title;
  const liveMode = type === 'error' ? 'assertive' : 'polite';

  return (
    <div className="pointer-events-none fixed inset-x-4 top-[4.75rem] z-[130] sm:inset-auto sm:bottom-6 sm:right-6 sm:top-auto sm:w-full sm:max-w-md">
      <div
        className={`pointer-events-auto rounded-2xl border bg-white/95 px-4 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.12)] backdrop-blur supports-[backdrop-filter]:bg-white/85 ${styles.container}`}
        role="status"
        aria-live={liveMode}
      >
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${styles.iconWrap}`}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : type === 'error' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-5">{heading}</p>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-md p-1 text-[var(--color-text-muted)] transition-colors ${styles.closeHover}`}
            aria-label="Close notification"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
