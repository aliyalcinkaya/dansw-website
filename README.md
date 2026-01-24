# Data & Analytics Wednesday Sydney Website

A modern, responsive website for Sydney's premier data and analytics community.

**Live site:** [https://aliyalcinkaya.github.io/dansw-website/](https://aliyalcinkaya.github.io/dansw-website/)

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
- **React Router 7** - Client-side routing (HashRouter for GitHub Pages)
- **GitHub Pages** - Hosting

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Environment Variables

Create a `.env` file in the root directory:

```bash
VITE_EVENTBRITE_PRIVATE_TOKEN=your_eventbrite_api_token
VITE_EVENTBRITE_ORGANIZATION_ID=8179498448
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

The site will be available at `http://localhost:5173/dansw-website/`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🚀 Deployment

This site is configured for automatic deployment to GitHub Pages.

### Automatic Deployment

Push to the `main` branch and GitHub Actions will automatically build and deploy.

### Manual Deployment

```bash
npm run deploy
```

### GitHub Pages Setup

1. Go to your repository Settings > Pages
2. Under "Build and deployment", select "GitHub Actions"
3. Push to main to trigger deployment

## Configuration

### Eventbrite Integration

The site fetches events from Eventbrite using the private API. Set your credentials in `.env`:

```bash
VITE_EVENTBRITE_PRIVATE_TOKEN=your_token_here
VITE_EVENTBRITE_ORGANIZATION_ID=8179498448
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
src/
├── components/
│   ├── Layout.tsx       # Main layout with skip navigation
│   ├── Navigation.tsx   # Header navigation (desktop + mobile)
│   ├── Footer.tsx       # Footer with newsletter form
│   ├── Logo.tsx         # Logo component
│   └── ScrollToTop.tsx  # Scroll restoration on route change
├── hooks/
│   ├── useEventbriteEvents.ts  # Fetch upcoming events
│   └── usePastEvents.ts        # Fetch past events
├── pages/
│   ├── Home.tsx           # Landing page with events
│   ├── PreviousTalks.tsx  # Event archive with search
│   ├── BecomeMember.tsx   # Membership + volunteer form
│   ├── BecomeSpeaker.tsx  # Speaker proposal form
│   ├── BecomeSponsor.tsx  # Sponsorship inquiry form
│   ├── About.tsx          # Organization info
│   ├── CodeOfConduct.tsx  # Community guidelines
│   ├── NotFound.tsx       # 404 page
│   └── index.ts           # Barrel exports
├── services/
│   └── eventbrite.ts      # Eventbrite API integration
├── types/
│   └── eventbrite.ts      # TypeScript types
├── App.tsx                # Router with lazy loading
├── main.tsx               # Entry point
└── index.css              # Global styles & Tailwind
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
