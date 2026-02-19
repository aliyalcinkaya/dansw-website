import { Link } from 'react-router-dom';
import { trackEvent } from '../services/analytics';

export function Footer() {
  const trackFooterLink = (label: string, target: string) => {
    trackEvent('footer_link_click', {
      link_label: label,
      link_target: target,
    });
  };

  const trackFooterSocial = (platform: string, target: string) => {
    trackEvent('footer_social_click', {
      platform,
      link_target: target,
    });
  };

  return (
    <footer className="bg-[var(--color-primary)] text-white mt-auto">
      {/* Main footer content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/Data-and-analytics-transparent.png"
                alt="Data & Analytics Wednesday Sydney logo"
                className="h-14 rounded-md object-contain"
              />
              <div>
                <span className="text-lg font-semibold">Data & Analytics Wednesday</span>
                <p className="text-xs text-white/60 uppercase tracking-wider">Sydney</p>
              </div>
            </div>
            <p className="text-white/70 text-sm max-w-sm leading-relaxed">
              Sydney's premier community for data and analytics professionals. 
              Join us for monthly meetups, knowledge sharing, and networking opportunities.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-white/90">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/jobs"
                  onClick={() => trackFooterLink('Jobs', '/jobs')}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Jobs
                </Link>
              </li>
              <li>
                <Link
                  to="/events"
                  onClick={() => trackFooterLink('Events', '/events')}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  to="/become-a-speaker"
                  onClick={() => trackFooterLink('Become a Speaker', '/become-a-speaker')}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Become a Speaker
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  onClick={() => trackFooterLink('Contact', '/contact')}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/become-a-sponsor"
                  onClick={() => trackFooterLink('Become a Sponsor', '/become-a-sponsor')}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Become a Sponsor
                </Link>
              </li>
              <li>
                <Link
                  to="/join"
                  onClick={() => trackFooterLink('Volunteer', '/join')}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Volunteer
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-white/90">
              About
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  onClick={() => trackFooterLink('About Us', '/about')}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/code-of-conduct"
                  onClick={() => trackFooterLink('Code of Conduct', '/code-of-conduct')}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Code of Conduct
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  onClick={() => trackFooterLink('Privacy Policy', '/privacy-policy')}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/admin-login"
                  onClick={() => trackFooterLink('Admin Login', '/admin-login')}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} Digital Analytics NSW Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {/* Social links */}
              <a
                href="https://www.linkedin.com/company/data-and-analytics-wednesday-sydney/posts/?feedView=all"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackFooterSocial(
                    'linkedin',
                    'https://www.linkedin.com/company/data-and-analytics-wednesday-sydney/posts/?feedView=all'
                  )
                }
                className="text-white/50 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a
                href="https://www.youtube.com/channel/UC4W56NwdqJ6tFmW-JWwLrNg/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackFooterSocial(
                    'youtube',
                    'https://www.youtube.com/channel/UC4W56NwdqJ6tFmW-JWwLrNg/'
                  )
                }
                className="text-white/50 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a
                href="https://x.com/DAW_Syd"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackFooterSocial('x', 'https://x.com/DAW_Syd')}
                className="text-white/50 hover:text-white transition-colors"
                aria-label="X (Twitter)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://www.meetup.com/data-and-analytics-wednesday-sydney/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackFooterSocial(
                    'meetup',
                    'https://www.meetup.com/data-and-analytics-wednesday-sydney/'
                  )
                }
                className="text-white/50 hover:text-white transition-colors"
                aria-label="Meetup"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512">
                  <path d="M103.17 66.372c72.78-29.995 206.275-64.453 300.464-37.674 48.44 13.771 92.41 65.892 100.84 121.418 6.982 46.012-10.863 98.615-35.527 125.234-1.81 1.952-2.772 4.541-2.59 7.197.063.938.28 1.892.618 2.766 34.073 87.607-19.385 129.919-80.296 141.804-62.374 12.171-123.282 33.055-181.862 57.455h-.005l-.003.003c-60.04 25.055-146.057-.792-175.106-65.15-16.422-36.388-4.82-89.32 8.426-126.796 1.611-4.556.688-9.614-2.251-13.45-10.904-14.233-19.474-31.152-24.808-50.232-20.952-74.966 25.624-135.179 92.1-162.575zm214.193 99.404c-17.246-19.067-47.744-22.127-70.836-.76-4.478 4.144-12.685 3.187-16.98-1.148-13.798-13.926-39.054-16.85-60.273-8.336-17.538 7.038-31.625 23.16-40.112 47.901 0 0-15.38 59.215-28.54 95.25-20.83 61.703 70.195 79.477 88.112 21.645l25.832-90.606c4.078-13.142 10.25-24.441 22.646-21.293 12.397 3.15 13.06 15.885 8.18 29.582l-12.089 49.994c-11.055 39.928 45.097 50.708 56.982 14.112l19.386-72.395c3.86-13.917 10.799-22.08 20.842-19.982 10.046 2.098 13.098 10.709 9.128 24.604l-10.684 42.18c-7.022 24.257-.685 44.42 23.76 48.34 26.651 4.273 43.395-6.925 49.102-11.66 1.499-1.236 2.37-3.015 2.692-4.934.64-3.789-2.293-7.192-6.123-7.3-10.095-.274-16.284-1.82-18.52-8.327-1.71-4.974-2.311-10.351.773-21.175 2.678-9.4 9.483-33.842 14.47-51.792 5.567-20.04 13.31-42.922-5.213-58.764-15.55-13.301-39.755-9.482-58.684 6.131-4.033 3.33-10.34 2.615-13.85-1.267zM348.197 499.938c75.614-1.955 96.11-48.22 78.498-51.673-48.036-9.42-249.115 56.089-78.498 51.673zM88.1 12.683C36.057 16.735 19.974 68.258 32.53 68.258c33.333 0 169.341-64.428 55.572-55.575z" fillRule="nonzero"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
