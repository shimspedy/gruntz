# GruntzFit Website

Standalone Astro marketing site for `gruntzfit.com`.

This project is intentionally isolated from the Expo app. All site code, legal pages, and Netlify
configuration live inside `website/`.

## Routes

- `/` marketing homepage (`/es/` in Spanish)
- `/fitness-tests/` hub and one guide per branch test
- `/training/` hub and six training guides
- `/privacy-policy`
- `/terms-of-use`
- `/support`

## Stack

- Astro, with React and Tailwind CSS v4 for components
- shadcn/ui pieces restyled to the site tokens (`src/components/ui`), Radix tabs and accordion, a Vaul drawer for the phone menu, and the Magic UI marquee
- Archivo (wide and heavy for headlines) and JetBrains Mono, Gruntz blue on an olive-black ramp, paper for the comic and FAQ sections
- Interactive pieces are mounted by `src/scripts/islands.tsx`, not `client:*` directives: the Content-Security-Policy allows scripts from this origin only, and Astro's island bootstrap is inline

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

Homepage content lives in `src/i18n/content.ts` and `src/components/Home.astro`. Guide content lives in `src/data/guides/` (`tests.ts`, `training.ts`), and photos with their credits in `src/data/photos.ts`; the original comic reader is `src/components/ComicGallery.astro`. See `DESIGN-NOTES.md` for the marketing guidance, real screenshot sources, responsive checks, and deployment notes.

Update that file if you want to change:

- support email
- pricing or trial copy
- app identifiers
- homepage messaging
- screenshot captions
