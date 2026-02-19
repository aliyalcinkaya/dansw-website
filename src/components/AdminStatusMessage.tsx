interface AdminStatusMessageProps {
  status: {
    type: 'success' | 'error' | 'info';
    message: string;
  } | null;
}

export function AdminStatusMessage({ status }: AdminStatusMessageProps) {
  if (!status) {
    return null;
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        status.type === 'error'
          ? 'border-red-200 bg-red-50 text-red-700'
          : status.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-slate-200 bg-slate-50 text-slate-700'
      }`}
    >
      {status.message}
    </div>
  );
}
