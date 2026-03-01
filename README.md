# Data & Analytics Wednesday Sydney Website

A modern, responsive website for Sydney's premier data and analytics community.

## Features

- **Upcoming Events**: Live Eventbrite integration showing upcoming meetups
- **Job Board**: Community job listings, role details, and apply flows
- **LinkedIn News**: Embedded LinkedIn posts on the homepage
- **Previous Talks**: Archive of past presentations with search and filtering
- **Become a Member**: Membership application form with conditional fields
- **Become a Speaker**: Speaker proposal submission form
- **Become a Sponsor**: Sponsorship tiers and inquiry form
- **Contact**: General enquiries form and contact page
- **About**: Information about Digital Analytics NSW Inc.
- **Code of Conduct**: Community guidelines
- **Get Involved**: Volunteer opportunities
- **404 Page**: Custom not found page
- **Accessibility**: Skip navigation, semantic HTML, ARIA labels
- **SEO**: Meta tags, Open Graph, Twitter cards
- **Performance**: Lazy-loaded routes, optimized bundle
- **Form Forwarding**: Admin-configurable To/CC email routing for website forms

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Vite 7** - Build tool
- **React Router 7** - Client-side routing

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Environment Variables

Create a `.env` file in the root directory:

```bash
VITE_EVENTBRITE_ORGANIZATION_ID=8179498448 # optional if EVENTBRITE_ORGANIZATION_ID is set as function secret
VITE_SUPABASE_EVENTBRITE_FUNCTION=eventbrite-events
VITE_SUPABASE_EVENTBRITE_FUNCTION_URL=https://your-project-ref.supabase.co/functions/v1/eventbrite-events # optional endpoint override
VITE_LINKEDIN_POST_URLS=https://www.linkedin.com/feed/update/urn:li:activity:123...,https://www.linkedin.com/posts/your-page_activity-456...
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_FORMS_TABLE=form_submissions
VITE_SUPABASE_NEWSLETTER_TABLE=newsletter_subscriptions
VITE_SUPABASE_NEWSLETTER_MAILCHIMP_FUNCTION=newsletter-mailchimp-sync           # optional
VITE_SUPABASE_FORM_FORWARDER_FUNCTION=form-forwarder                              # optional (default: form-forwarder)
VITE_SUPABASE_FORM_FORWARDER_FUNCTION_URL=https://your-project-ref.supabase.co/functions/v1/form-forwarder # optional override
VITE_SUPABASE_JOBS_TABLE=job_posts
VITE_SUPABASE_JOB_APPLICATIONS_TABLE=job_applications
VITE_SUPABASE_JOB_ADMIN_NOTIFICATIONS_TABLE=job_admin_notifications
VITE_SUPABASE_SITE_SETTINGS_TABLE=site_settings
VITE_SUPABASE_FORM_ROUTING_TABLE=form_email_routing
VITE_STRIPE_CHECKOUT_ENDPOINT=https://your-api.example.com/create-job-checkout # optional
VITE_STRIPE_STANDARD_PAYMENT_LINK=https://buy.stripe.com/your_standard_link     # optional fallback
VITE_STRIPE_AMPLIFIED_PAYMENT_LINK=https://buy.stripe.com/your_amplified_link   # optional fallback
VITE_BRANDFETCH_API_KEY=your_brandfetch_api_key_here                              # optional (job branding)
VITE_MIXPANEL_TOKEN=your_mixpanel_project_token_here # optional
```

Set Eventbrite private credentials as Supabase Edge Function secrets (not `VITE_*` vars):

```bash
EVENTBRITE_PRIVATE_TOKEN=your_eventbrite_private_token
EVENTBRITE_ORGANIZATION_ID=your_eventbrite_organization_id
EVENTBRITE_ALLOWED_ORIGIN=http://localhost:5173,https://www.dawsydney.org.au
```

### Installation

```bash
# Clone the repository
git clone https://github.com/aliyalcinkaya/dansw-website.git
cd dansw-website

# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at `http://localhost:5173/`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🚀 Deployment

GitHub Actions now runs a build-only workflow and uploads the `dist/` artifact (`website-dist`) on push to `main`.

Deploy that artifact to your target platform (for example Vercel, Netlify, Cloudflare Pages, S3/CloudFront, or your own hosting pipeline).

## Configuration

### Eventbrite Integration

The site fetches events through the Supabase Edge Function `eventbrite-events`. Website-managed events and speaker/talk data are stored in Supabase and can be synced to Eventbrite from `/admin/events`.

1. Run `supabase/events.sql` in Supabase SQL Editor.
2. Add frontend env vars:

```bash
VITE_SUPABASE_EVENTBRITE_FUNCTION=eventbrite-events
VITE_SUPABASE_EVENTBRITE_FUNCTION_URL=https://your-project-ref.supabase.co/functions/v1/eventbrite-events # optional endpoint override
VITE_EVENTBRITE_ORGANIZATION_ID=8179498448 # optional override
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

3. Set Edge Function secrets:

```bash
supabase secrets set \
  EVENTBRITE_PRIVATE_TOKEN=your_eventbrite_private_token \
  EVENTBRITE_ORGANIZATION_ID=your_eventbrite_organization_id \
  EVENTBRITE_ALLOWED_ORIGIN=http://localhost:5173,https://www.dawsydney.org.au
```

4. Deploy the function:

```bash
supabase functions deploy eventbrite-events
```

Do not expose the Eventbrite private token in `VITE_*` variables.

### LinkedIn News Embeds

The homepage LinkedIn section can be managed in the admin panel (`/admin`) or via
`VITE_LINKEDIN_POST_URLS` as fallback. Provide comma-separated post URLs (or `urn:li` values):

```bash
VITE_LINKEDIN_POST_URLS=https://www.linkedin.com/feed/update/urn:li:activity:123...,https://www.linkedin.com/posts/your-page_activity-456...
```

### Supabase Form Backend

Website forms submit to Supabase using two tables:
- `form_submissions`: contact/member/speaker/sponsor forms
- `newsletter_subscriptions`: footer newsletter form

1. Create or open a Supabase project.
2. In SQL Editor, run `supabase/forms.sql`.
3. Add these env vars:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_FORMS_TABLE=form_submissions
VITE_SUPABASE_NEWSLETTER_TABLE=newsletter_subscriptions
```

Optional (for form submit analytics to Mixpanel):

```bash
VITE_MIXPANEL_TOKEN=your_mixpanel_project_token_here
```

Optional (mirror newsletter subscribers to Mailchimp via Supabase Edge Functions):

```bash
# Frontend env (calls the function after successful newsletter insert)
VITE_SUPABASE_NEWSLETTER_MAILCHIMP_FUNCTION=newsletter-mailchimp-sync

# Supabase Edge Function secrets (set in Supabase, not in Vite env)
MAILCHIMP_API_KEY=your_mailchimp_api_key
MAILCHIMP_AUDIENCE_ID=your_mailchimp_audience_id
# Optional if your API key includes suffix like -us21
MAILCHIMP_SERVER_PREFIX=us21
# Optional
MAILCHIMP_DOUBLE_OPT_IN=false
MAILCHIMP_DEFAULT_TAGS=DAWS Website
MAILCHIMP_ALLOWED_ORIGIN=https://your-site-domain.com
```

Example secret setup command:

```bash
supabase secrets set \
  MAILCHIMP_API_KEY=your_mailchimp_api_key \
  MAILCHIMP_AUDIENCE_ID=your_mailchimp_audience_id \
  MAILCHIMP_SERVER_PREFIX=us21
```

Deploy function:

```bash
supabase functions deploy newsletter-mailchimp-sync
```

The function code lives at:

`supabase/functions/newsletter-mailchimp-sync/index.ts`

### Form Email Forwarding (Resend)

Website forms and job submissions can forward email notifications based on admin-managed routing rules:
- Routing settings table: `form_email_routing` (managed from `/admin/form-routing`)
- Default routing seeded in `supabase/jobs.sql`

1. In Supabase SQL Editor, run `supabase/jobs.sql` (includes `form_email_routing`).
2. Add frontend env vars:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_FORM_FORWARDER_FUNCTION=form-forwarder
VITE_SUPABASE_FORM_ROUTING_TABLE=form_email_routing
```

3. Set Edge Function secrets:

```bash
supabase secrets set \
  RESEND_API_KEY=your_resend_api_key \
  FORM_FORWARDER_FROM_EMAIL="DAWS Website <forms@yourdomain.com>" \
  FORM_FORWARDER_ALLOWED_ORIGIN=http://localhost:5173,https://www.dawsydney.org.au \
  FORM_FORWARDER_DEFAULT_CC=commitee@wawsydney.com
```

4. Deploy function:

```bash
supabase functions deploy form-forwarder
```

The function code lives at:

`supabase/functions/form-forwarder/index.ts`

Notes:
- Resend has a free tier and is suitable for low-volume use (for example less than 100 emails/month).
- For public website forms, keep Edge Function JWT verification disabled for `form-forwarder`.
- Set `FORM_FORWARDER_ALLOWED_ORIGIN` to an explicit allowlist (for example `https://www.dawsydney.org.au`) in production.

### Job Board Backend

Job posting and easy-apply data is stored in Supabase:
- `job_posts`: draft and published job listings
- `job_applications`: Easy Apply submissions
- `job_admin_notifications`: moderation and expiry notifications
- `site_settings`: website content settings (for example homepage LinkedIn links)
- `form_email_routing`: admin-managed To/CC recipients for form forwarding

1. In Supabase SQL Editor, run `supabase/jobs.sql`.
2. Add these env vars:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_JOBS_TABLE=job_posts
VITE_SUPABASE_JOB_APPLICATIONS_TABLE=job_applications
VITE_SUPABASE_JOB_ADMIN_NOTIFICATIONS_TABLE=job_admin_notifications
VITE_SUPABASE_SITE_SETTINGS_TABLE=site_settings
```

3. Add admin emails (can manage via `/admin`, including `/admin/jobs`):

```sql
insert into public.job_board_admins (email) values ('you@company.com');
```

Admin magic-link sign-in only works for emails present in `job_board_admins`.

If you see `stack depth limit exceeded` while performing admin writes, run `supabase/admin_rls_fix.sql` once in SQL Editor.

Publish payment options:

```bash
# Preferred: secure backend endpoint creates Stripe Checkout sessions
VITE_STRIPE_CHECKOUT_ENDPOINT=https://your-api.example.com/create-job-checkout

# Optional fallback: direct Stripe Payment Links
VITE_STRIPE_STANDARD_PAYMENT_LINK=https://buy.stripe.com/your_standard_link
VITE_STRIPE_AMPLIFIED_PAYMENT_LINK=https://buy.stripe.com/your_amplified_link
```

Important: the frontend no longer marks jobs as `paid` from `payment=success` URL params.  
Use a server-side Stripe webhook to verify checkout completion and update payment status safely.

Temporary test mode (skip Stripe and submit directly to admin review):

```bash
VITE_JOBS_DISABLE_PAYMENTS=true
```

Optional branding enrichment for job cards and headers:

```bash
VITE_BRANDFETCH_API_KEY=your_brandfetch_api_key_here
```

### Base URL

If deploying to a different path, update `base` in `vite.config.ts`:

```ts
export default defineConfig({
  base: '/your-repo-name/',
  // ...
})
```

## Project Structure

```
.
├── src/
│   ├── components/
│   │   ├── Layout.tsx        # Main layout with skip navigation
│   │   ├── Navigation.tsx    # Header navigation (desktop + mobile)
│   │   ├── Footer.tsx        # Footer with newsletter form
│   │   ├── ErrorBoundary.tsx # Global runtime error fallback
│   │   ├── Logo.tsx          # Logo component
│   │   └── ScrollToTop.tsx   # Scroll restoration on route change
│   ├── hooks/
│   │   ├── useEventbriteEvents.ts  # Fetch upcoming events
│   │   └── usePastEvents.ts        # Fetch past events
│   ├── pages/
│   │   ├── Home.tsx          # Landing page with events
│   │   ├── Contact.tsx       # General enquiries contact form
│   │   ├── Jobs.tsx          # Job board listing page
│   │   ├── JobDetail.tsx     # Job detail page
│   │   ├── JobSubmit.tsx     # Job post submission + checkout flow
│   │   ├── AdminJobs.tsx     # Admin moderation dashboard
│   │   ├── AdminFormRouting.tsx # Admin form forwarding recipients
│   │   ├── PreviousTalks.tsx # Event archive with search
│   │   ├── BecomeMember.tsx  # Membership + volunteer form
│   │   ├── BecomeSpeaker.tsx # Speaker proposal form
│   │   ├── BecomeSponsor.tsx # Sponsorship inquiry form
│   │   ├── About.tsx         # Organization info
│   │   ├── CodeOfConduct.tsx # Community guidelines
│   │   ├── NotFound.tsx      # 404 page
│   │   └── index.ts          # Barrel exports
│   ├── services/
│   │   ├── eventbrite.ts     # Eventbrite API integration
│   │   ├── forms.ts          # Supabase form submission client
│   │   ├── formForwarding.ts # Edge function email forwarding client
│   │   ├── jobs.ts           # Job board and application services
│   │   └── analytics.ts      # Optional Mixpanel form analytics
│   ├── types/
│   │   ├── eventbrite.ts     # Eventbrite type definitions
│   │   └── jobs.ts           # Job board type definitions
│   ├── App.tsx               # Router with lazy loading
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles & Tailwind
└── supabase/
    ├── forms.sql             # Form submission tables + RLS policies
    └── jobs.sql              # Job board tables + RLS policies
```

## 🎨 Customization

### Colors

Edit the CSS variables in `src/index.css`:

```css
:root {
  --color-primary: #0f172a;
  --color-accent: #3b82f6;
  /* ... */
}
```

### Fonts

The site uses:
- **DM Sans** - Body text
- **Instrument Serif** - Headings

Update in `index.html` if you want different fonts.

## 📄 License

MIT License - feel free to use this as a template for your own community website!

## 🤝 Contributing

Contributions are welcome! Please read our Code of Conduct first.

---

Made with ❤️ for the Sydney data & analytics community
