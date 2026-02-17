import { Link } from 'react-router-dom';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-3 group ${className}`}>
      <img
        src="/Data-and-analytics-notext-whitebg.png"
        alt="Data & Analytics Wednesday Sydney logo"
        className="h-12 robject-contain"
      />
      
      {/* Text */}
      <div className="flex flex-col">
        <span className="text-lg font-semibold leading-tight text-[var(--color-primary)] tracking-tight">
          Data & Analytics Wednesday
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          Sydney
        </span>
      </div>
    </Link>
  );
}



