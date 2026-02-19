import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminTopMenu } from './AdminTopMenu';
import { Navigation } from './Navigation';
import { NewsletterSignup } from './NewsletterSignup';
import { SponsorBanner } from './SponsorBanner';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--color-accent)] focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>
      {isAdminRoute ? <AdminTopMenu /> : <Navigation />}
      <main id="main-content" className="flex-grow">
        {children}
      </main>
      {!isAdminRoute && <NewsletterSignup />}
      {!isAdminRoute && <SponsorBanner />}
      <Footer />
    </div>
  );
}
