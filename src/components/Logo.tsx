import { Link } from 'react-router-dom';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-3 group ${className}`}>
      {/* Data-inspired logo mark */}
      <div className="relative w-10 h-10">
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="8" fill="url(#logoGrad)" />
          <g fill="white">
            {/* Bar chart */}
            <rect x="7" y="22" width="5" height="11" rx="1.5" />
            <rect x="14" y="17" width="5" height="16" rx="1.5" />
            <rect x="21" y="12" width="5" height="21" rx="1.5" />
            <rect x="28" y="7" width="5" height="26" rx="1.5" opacity="0.7" />
          </g>
        </svg>
      </div>
      
      {/* Text */}
      <div className="flex flex-col">
        <span className="text-lg font-semibold leading-tight text-[var(--color-primary)] tracking-tight">
          DAW Sydney
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          Data & Analytics
        </span>
      </div>
    </Link>
  );
}

