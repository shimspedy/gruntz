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
});
