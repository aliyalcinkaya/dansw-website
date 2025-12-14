# Data & Analytics Wednesday Sydney Website

A modern, responsive website for Sydney's premier data and analytics community.

## 🚀 Features

- **Upcoming Events**: Eventbrite integration ready (placeholder for now)
- **Previous Talks**: Archive of past presentations with search and filtering
- **Become a Member**: Membership application form with conditional fields
- **Become a Speaker**: Speaker proposal submission form
- **About**: Information about Digital Analytics NSW Inc.
- **Code of Conduct**: Community guidelines
- **Get Involved**: Volunteer opportunities

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Vite** - Build tool
- **React Router** - Client-side routing
- **GitHub Pages** - Hosting

## 📦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dansw-website.git
cd dansw-website

# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at `http://localhost:5173`

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

## 📝 Configuration

### Eventbrite Integration

To add Eventbrite events, you'll need to:

1. Get your Eventbrite API key
2. Update the `upcomingEvents` in `src/pages/Home.tsx` to fetch from Eventbrite API

### Base URL

If deploying to a different path, update `base` in `vite.config.ts`:

```ts
export default defineConfig({
  base: '/your-repo-name/',
  // ...
})
```

## 📁 Project Structure

```
src/
├── components/
│   ├── Layout.tsx      # Main layout wrapper
│   ├── Navigation.tsx  # Header navigation
│   ├── Footer.tsx      # Footer component
│   └── Logo.tsx        # Logo component
├── pages/
│   ├── Home.tsx        # Home page
│   ├── PreviousTalks.tsx
│   ├── BecomeMember.tsx
│   ├── BecomeSpeaker.tsx
│   ├── About.tsx
│   ├── CodeOfConduct.tsx
│   └── GetInvolved.tsx
├── App.tsx             # Main app with routing
├── main.tsx            # Entry point
└── index.css           # Global styles & Tailwind
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
