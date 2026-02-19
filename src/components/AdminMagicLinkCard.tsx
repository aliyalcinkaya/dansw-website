import type { FormEventHandler } from 'react';

interface AdminMagicLinkCardProps {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  sending: boolean;
  description: string;
  title?: string;
  buttonLabel?: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function AdminMagicLinkCard({
  email,
  onEmailChange,
  onSubmit,
  sending,
  description,
  title = 'Admin sign-in required',
  buttonLabel = 'Send Admin Magic Link',
  className = 'p-6',
  titleClassName = 'text-xl text-[var(--color-primary)]',
  descriptionClassName = 'mt-2 mb-4 text-sm text-[var(--color-text-muted)]',
}: AdminMagicLinkCardProps) {
  return (
    <article className={`rounded-2xl border border-[var(--color-border)] bg-white ${className}`}>
      <h2 className={titleClassName}>{title}</h2>
      <p className={descriptionClassName}>{description}</p>
      <form onSubmit={onSubmit} className="max-w-md space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm text-[var(--color-text-muted)]">Admin email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </label>
        <button
          type="submit"
          disabled={sending}
          className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
            sending
              ? 'cursor-not-allowed bg-slate-300 text-slate-600'
              : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]'
          }`}
        >
          {sending ? 'Sending...' : buttonLabel}
        </button>
      </form>
    </article>
  );
}
