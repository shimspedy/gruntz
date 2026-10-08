// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://gruntzfit.com',
  integrations: [sitemap()],
  build: {
    format: 'directory',
  },
  // Never inline scripts into the HTML: the Content-Security-Policy (public/_headers)
  // allows scripts from this origin only, so an inlined one is silently blocked.
  vite: { build: { assetsInlineLimit: 0 } },
});
