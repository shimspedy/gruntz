// Feature tabs: swap the phone screen and copy, with arrow-key support.
type Feature = { name: string; headline: string; copy: string; screen: string };

const tablist = document.getElementById('feature-tabs');
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.feature-tab'));
const screen = document.getElementById('feature-screen') as HTMLImageElement | null;
const headline = document.getElementById('feature-headline');
const text = document.getElementById('feature-text');
const count = document.getElementById('feature-count');
const panel = document.getElementById('feature-panel');

if (tablist && screen && headline && text && count && panel) {
  const { features, counter, screenAlt } = JSON.parse(tablist.dataset.features ?? '{}') as {
    features: Feature[];
    counter: string;
    screenAlt: string;
  };
  let swap: ReturnType<typeof setTimeout> | undefined;

  const select = (i: number, focus: boolean) => {
    tabs.forEach((tab, j) => {
      tab.setAttribute('aria-selected', String(i === j));
      tab.tabIndex = i === j ? 0 : -1;
    });
    const feature = features[i];
    screen.style.opacity = '0';
    // Clicking through quickly must end on the last tab chosen, not an earlier one.
    clearTimeout(swap);
    swap = setTimeout(() => {
      screen.src = feature.screen;
      screen.alt = `${feature.name} ${screenAlt}`;
      screen.style.opacity = '1';
    }, 180);
    headline.textContent = feature.headline;
    text.textContent = feature.copy;
    count.textContent = `${counter} ${String(i + 1).padStart(2, '0')}`;
    panel.setAttribute('aria-labelledby', tabs[i].id);
    if (focus) tabs[i].focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i, false));
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); select((i + 1) % tabs.length, true); }
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
    });
  });

  // Preload the other screens so switching tabs is instant.
  features.slice(1).forEach((feature) => { const img = new Image(); img.src = feature.screen; });
}

// Fade sections in as they scroll into view.
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }),
    { rootMargin: '0px 0px -6% 0px', threshold: 0.04 },
  );
  reveals.forEach((element) => observer.observe(element));
} else {
  reveals.forEach((element) => element.classList.add('is-visible'));
}
