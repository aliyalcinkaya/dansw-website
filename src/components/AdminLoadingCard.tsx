interface AdminLoadingCardProps {
  message?: string;
}

export function AdminLoadingCard({ message = 'Checking admin access...' }: AdminLoadingCardProps) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
    </article>
  );
}
