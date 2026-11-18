# Gruntz website redesign — November 17, 2026

Dark, photographic redesign in the spirit of joinladder.com, plus a first set of search content.

## Direction

- **Product:** today's military-style workout, a set-by-set log and PT-test tracking for all six branches.
- **Character:** disciplined, gritty, dry-humoured.
- **World:** 0500 PT. Olive-tinted near-black surfaces, one accent (Gruntz blue, matching the app screens), paper for the comic and FAQ sections.
- **Moments:** one full-bleed photograph behind the hero, and the real app screens at large size.
- **Signature:** mono mission stamps (`0500 · Today's mission`) and the ticker of the seven tests under the hero.
- **Type:** Archivo, expanded and heavy in uppercase for headlines, normal width for body. JetBrains Mono for stamps.

## Photos

Listed with credits in `src/data/photos.ts`. Rule: U.S. Department of Defense photos (public domain) are used only where nobody is recognizable, and the footer carries the DoD non-endorsement line. Portraits with faces come from Unsplash under its commercial license. Neither source provides model releases.

## Search content

`/fitness-tests/` (hub plus seven test guides) and `/training/` (hub plus six guides). Each guide has a title of 60 characters or fewer, a meta description of 155 or fewer, Article, BreadcrumbList and FAQPage structured data, a "last verified" date, official sources and the non-affiliation line.

Fact rules for the test guides, also at the top of `src/data/guides/tests.ts`: no age or sex score tables are reproduced, anything not confirmed from an official release points to the official chart instead of stating a number, and Gruntz is never described as giving an official score. Most .mil pages refuse automated fetches, so a person should open the linked official charts and confirm each guide before it is promoted.

## Earlier notes (October 30, 2026)

The homepage connects the six-branch comic campaign to Gruntz's daily training plans, workout log, test-event progress, and XP/ranks. The visual direction uses cream editorial paper, dark training panels, the existing Gruntz blue, original comics, and genuine app captures.

## Marketing guidance applied

Used Corey Haines' [marketingskills](https://github.com/coreyhaines31/marketingskills) product-marketing, copywriting, and CRO skills. The product context is `.agents/product-marketing.md` at the repository root. Changes prioritize matching the ads, a clear app-download action, proof through real screens, specific feature copy, and answers to purchase objections. No testimonials, customer counts, pass guarantees, or injury-reduction claims were invented.

## Screens and artwork

- `train-current.webp`, `ranks-current.webp`, and `test-current.webp` are genuine October 27 app captures.
- Existing workout-log, planner, and exercise-detail captures remain authentic earlier app screens.
- `/comics/` contains optimized original campaign art. HTML dialogue has English/Spanish text, transcripts, keyboard controls, and mobile panel navigation.
- The icon and favicon use the current app icon from `assets/icon.png`.

## Validation

An additional editorial pass removed decorative graph grids, fake volume/issue labels, a decorative star, repeated motivational slogans, and the oversized floating app-icon treatment. About and download sections now use specific product information and the real Gruntz icon.

Production Astro build, static asset/route audit, and browser checks at 320, 390, 768, and 1440 px. Checked all six comic selections, mobile panel navigation, keyboard arrows, feature screenshot changes, FAQ disclosure, language navigation, App Store destinations, and browser console. No page-level horizontal overflow found.

## Deployment

Existing Netlify project `gruntz`, site `5c3d76ec-d753-47ba-aa76-3e2787ca1088`, serves `https://gruntzfit.com`. Git continuous deployment targets `main`, runs `npm run build` from `website`, and publishes `website/dist`. The redesigned source and its local assets are versioned together so subsequent Git deployments preserve the comic reader and app previews. Manual production deployments should use the same built directory. Vite is explicitly bound to `website/tsconfig.json` so website-only builds do not inspect the parent mobile app’s Expo configuration. Verified with the root tsconfig present and only website dependencies installed.
