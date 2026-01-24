# DAW Sydney Website - TODO

## Forms Integration
- [ ] Connect Newsletter subscription form (Footer)
- [ ] Connect Become a Member form (`/join`)
- [ ] Connect Become a Speaker form (`/become-a-speaker`)
- [ ] Connect Become a Sponsor form (`/become-a-sponsor`)

**Recommended:** Use Formspree, Netlify Forms, or a serverless function for form handling.

## Integrations
- [x] Connect Eventbrite API for upcoming events on homepage
- [x] Connect Eventbrite API for previous talks page

## Content Review
- [ ] Review Home page content
- [ ] Review About page content
- [ ] Review Previous Talks page content
- [ ] Review Become a Member page content
- [ ] Review Become a Speaker page content
- [ ] Review Become a Sponsor page content
- [ ] Review Code of Conduct page content

## Branding
- [ ] Update Logo (currently using placeholder SVG)
- [ ] Add Open Graph image for social sharing

## Completed

### Security & Dependencies
- [x] Fix React Router security vulnerabilities
- [x] Update all dependencies to latest versions

### SEO & Meta Tags
- [x] Add meta description
- [x] Add Open Graph tags
- [x] Add Twitter card tags
- [x] Update page title

### Accessibility
- [x] Add skip navigation link
- [x] Add proper ARIA labels
- [x] Semantic HTML structure

### Performance
- [x] Implement lazy loading for route components
- [x] Reduce initial bundle size (324KB -> 261KB gzipped)

### UX Improvements
- [x] Add 404 Not Found page
- [x] Add scroll-to-top on route change
- [x] Fix internal links (use React Router `Link` component)

### Bug Fixes
- [x] Fix IMWT sponsor link (was placeholder)
- [x] Fix homepage URL in package.json

## Future Enhancements (Nice to Have)
- [ ] Convert images to WebP format for better compression
- [ ] Add responsive image srcsets
- [ ] Add error boundary component
- [ ] Add PWA manifest
- [ ] Add apple-touch-icon
- [ ] Add loading skeleton animations
- [ ] Mobile navigation focus trap
