# GruntzFit Website

Standalone Astro marketing site for `gruntzfit.com`.

This project is intentionally isolated from the Expo app. All site code, legal pages, and Netlify
configuration live inside `website/`.

## Routes

- `/` marketing homepage
- `/privacy-policy`
- `/terms-of-use`
- `/support`

## Stack

- Astro
- Swiper web components for the screenshot rail
- Oxanium + IBM Plex font stack

## Local Development

```bash
cd website
npm install
npm run dev
```

## Production Build

```bash
cd website
npm run build
```

## Netlify Setup

Use these settings in Netlify if you connect the whole repo:

- Base directory: `website`
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `22.12.0`

The project also includes `website/netlify.toml`, path aliases in `public/_redirects`, and basic
security headers in `public/_headers`.

## Content Updates

Most site constants live in `src/data/site.ts`.

Update that file if you want to change:

- support email
- pricing or trial copy
- app identifiers
- homepage messaging
- screenshot captions
