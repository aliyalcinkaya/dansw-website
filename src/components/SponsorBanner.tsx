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
    <section className="pt-14 pb-20 bg-white border-b border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-8 text-center">
          Proudly supported by
        </p>

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
