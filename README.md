# Data & Analytics Wednesday Sydney Website

A modern, responsive website for Sydney's premier data and analytics community.

## Features

- **Upcoming Events**: Live Eventbrite integration showing upcoming meetups
- **Previous Talks**: Archive of past presentations with search and filtering
- **Become a Member**: Membership application form with conditional fields
- **Become a Speaker**: Speaker proposal submission form
- **Become a Sponsor**: Sponsorship tiers and inquiry form
- **About**: Information about Digital Analytics NSW Inc.
- **Code of Conduct**: Community guidelines
- **Get Involved**: Volunteer opportunities
- **404 Page**: Custom not found page
- **Accessibility**: Skip navigation, semantic HTML, ARIA labels
- **SEO**: Meta tags, Open Graph, Twitter cards
- **Performance**: Lazy-loaded routes, optimized bundle

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
VITE_EVENTBRITE_PRIVATE_TOKEN=your_eventbrite_api_token
VITE_EVENTBRITE_ORGANIZATION_ID=8179498448
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_FORMS_TABLE=form_submissions
VITE_SUPABASE_NEWSLETTER_TABLE=newsletter_subscriptions
VITE_MIXPANEL_TOKEN=your_mixpanel_project_token_here # optional
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

The site fetches events from Eventbrite using the private API. Set your credentials in `.env`:

```bash
VITE_EVENTBRITE_PRIVATE_TOKEN=your_token_here
VITE_EVENTBRITE_ORGANIZATION_ID=8179498448
```

### Supabase Form Backend

Website forms submit to Supabase using two tables:
- `form_submissions`: join/speaker/sponsor forms
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
│   │   └── analytics.ts      # Optional Mixpanel form analytics
│   ├── types/
│   │   └── eventbrite.ts     # TypeScript types
│   ├── App.tsx               # Router with lazy loading
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles & Tailwind
└── supabase/
    └── forms.sql             # Supabase table + RLS policy
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
