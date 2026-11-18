// @ts-check
import { defineConfig } from 'astro/config';
import sitemap, { ChangeFreqEnum as F } from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// https://astro.build/config
export default defineConfig({
  site: 'https://gruntzfit.com',
  // Preserve the site's Astro 6 whitespace behavior across the security upgrade.
  compressHTML: true,
  integrations: [
    react(),
    sitemap({
      // Admin is noindex; /join is a team-invite landing with nothing to rank.
      filter: (page) => !/\/(admin|join)\/?$/.test(new URL(page).pathname),
      // The homepage exists in English and Spanish; link the pair for search engines.
      i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es' } },
      // Hints for crawlers: tools and charts change with each official revision, legal pages rarely.
      serialize(item) {
        const path = new URL(item.url).pathname;
        const rule =
          path === '/' || path === '/es/' ? { changefreq: F.WEEKLY, priority: 1.0 }
          : /^\/tools\/[^/]+\/[^/]+\/$/.test(path) ? { changefreq: F.MONTHLY, priority: 0.9 }
          : /^\/(tools|fitness-tests|training)\//.test(path) ? { changefreq: F.MONTHLY, priority: 0.8 }
          : /^\/reference\//.test(path) ? { changefreq: F.MONTHLY, priority: 0.7 }
          : /^\/heritage\//.test(path) ? { changefreq: F.YEARLY, priority: 0.6 }
          : /^\/(privacy-policy|terms-of-use)\/$/.test(path) ? { changefreq: F.YEARLY, priority: 0.2 }
          : { changefreq: F.MONTHLY, priority: 0.5 };
        return { ...item, ...rule, lastmod: new Date().toISOString() };
      },
    }),
  ],
  build: {
    format: 'directory',
  },
  // Never inline scripts into the HTML: the Content-Security-Policy (public/_headers)
  // allows scripts from this origin only, so an inlined one is silently blocked.
  vite: {
    plugins: [tailwindcss()],
    // Vite 8 can otherwise inspect the parent mobile-app tsconfig during a
    // website-only CI install, where Expo dependencies are intentionally absent.
    tsconfig: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
    build: { assetsInlineLimit: 0 },
  },
});
