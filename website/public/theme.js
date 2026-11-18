// Theme: follows the visitor's system setting unless they pick light or dark with the
// header switch, which cycles System → Light → Dark. Runs before first paint.
// A file, not inline: the Content-Security-Policy only allows scripts from this origin.
(function () {
  var KEY = 'gruntz-theme';
  var ORDER = ['system', 'light', 'dark'];
  var LABEL = { system: 'Theme: system. Switch to light', light: 'Theme: light. Switch to dark', dark: 'Theme: dark. Switch to system' };
  var root = document.documentElement;
  var prefersLight = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  var mode = 'system';
  function apply(next) {
    mode = next === 'light' || next === 'dark' ? next : 'system';
    if (mode === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
    root.setAttribute('data-theme-mode', mode);
  }
  function effective() {
    if (mode !== 'system') return mode;
    return prefersLight && prefersLight.matches ? 'light' : 'dark';
  }
  function sync() {
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i += 1) buttons[i].setAttribute('aria-label', LABEL[mode]);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', effective() === 'light' ? '#f3f3ee' : '#0b0c0a');
  }
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked: follow the system */ }
  apply(saved);
  document.addEventListener('click', function (event) {
    var target = event.target;
    var button = target && target.closest ? target.closest('[data-theme-toggle]') : null;
    if (!button) return;
    apply(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]);
    try {
      if (mode === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, mode);
    } catch (e) { /* the choice lasts for this page only */ }
    sync();
  });
  document.addEventListener('DOMContentLoaded', sync);
  if (prefersLight && prefersLight.addEventListener) prefersLight.addEventListener('change', sync);
})();
