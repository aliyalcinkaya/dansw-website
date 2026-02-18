import { Link } from 'react-router-dom';

import canvaLogo from '../assets/sponsor_logos/canva.png';
import funnelLogo from '../assets/sponsor_logos/funnel.png';
import imwtLogo from '../assets/sponsor_logos/imwt.webp';
import metriclabsLogo from '../assets/sponsor_logos/metriclabs.png';
import snowplowLogo from '../assets/sponsor_logos/snowplow.png';

const sponsors = [
  { name: 'Canva', href: 'https://www.canva.com', logo: canvaLogo },
  { name: 'Funnel', href: 'https://funnel.io', logo: funnelLogo },
  { name: 'In Marketing We Trust', href: 'https://inmarketingwetrust.com.au/', logo: imwtLogo },
  { name: 'Metric Labs', href: 'https://www.metriclabs.com.au', logo: metriclabsLogo },
  { name: 'Snowplow', href: 'https://www.snowplow.io', logo: snowplowLogo },
];

export function SponsorBanner() {
  return (
    <section className="py-14 bg-white border-b border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
              Proudly supported by
            </p>
            <h2 className="text-2xl text-[var(--color-primary)]">Our Sponsors</h2>
          </div>
          <Link
            to="/become-a-sponsor"
            className="inline-flex items-center gap-2 text-[var(--color-accent)] font-semibold hover:gap-3 transition-all"
          >
            Become a Sponsor
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.name}
              href={sponsor.href}
              target="_blank"
              rel="noopener noreferrer"
              className="grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all"
            >
              <img src={sponsor.logo} alt={sponsor.name} className="h-10 w-auto" loading="lazy" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
