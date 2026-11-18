// Mounts the interactive React pieces. The HTML for each is already rendered at build
// time; this replaces it with the live component. Mounted from a bundled file on purpose:
// the Content-Security-Policy allows scripts from this origin only, so Astro's inline
// island bootstrap (client:* directives) would be blocked.
import { createElement, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

// Dev server only: the React plugin expects a refresh preamble that Astro injects for its
// own islands. These components are mounted by hand, so stub it. Production is unaffected.
if (import.meta.env.DEV) {
  const w = window as unknown as Record<string, unknown>;
  w.$RefreshReg$ ??= () => {};
  w.$RefreshSig$ ??= () => (type: unknown) => type;
  w.__vite_plugin_react_preamble_installed__ = true;
}

const registry: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
  faq: () => import('../components/react/Faq'),
  features: () => import('../components/react/FeatureTabs'),
  nav: () => import('../components/react/MobileNav'),
};

document.querySelectorAll<HTMLElement>('[data-island]').forEach(async (el) => {
  const load = registry[el.dataset.island ?? ''];
  if (!load) return;
  try {
    const props = JSON.parse(el.dataset.props ?? '{}');
    const { default: Component } = await load();
    createRoot(el).render(createElement(Component, props));
  } catch (error) {
    // Leave the build-time HTML in place: it is readable and its links still work.
    console.error('Island failed to mount', el.dataset.island, error);
  }
});

// Fade sections in as they scroll into view.
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }),
    { rootMargin: '0px 0px -6% 0px', threshold: 0.04 },
  );
  reveals.forEach((element) => observer.observe(element));
} else {
  reveals.forEach((element) => element.classList.add('is-visible'));
}
