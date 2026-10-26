// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://gruntzfit.com',
  // Preserve the site's Astro 6 whitespace behavior across the security upgrade.
  compressHTML: true,
  integrations: [sitemap()],
  build: {
    format: 'directory',
  },
  // Never inline scripts into the HTML: the Content-Security-Policy (public/_headers)
  // allows scripts from this origin only, so an inlined one is silently blocked.
  vite: { build: { assetsInlineLimit: 0 } },
});
