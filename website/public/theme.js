// Applies the saved light/dark choice before first paint and runs the header switch.
// A file, not inline: the Content-Security-Policy only allows scripts from this origin.
(function () {
  var KEY = 'gruntz-theme';
  var root = document.documentElement;
  var prefersLight = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  function apply(choice) {
    if (choice === 'light' || choice === 'dark') root.setAttribute('data-theme', choice);
    else root.removeAttribute('data-theme');
  }
  function effective() {
    var set = root.getAttribute('data-theme');
    if (set === 'light' || set === 'dark') return set;
    return prefersLight && prefersLight.matches ? 'light' : 'dark';
  }
  function sync() {
    var light = effective() === 'light';
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i += 1) {
      buttons[i].setAttribute('aria-pressed', light ? 'true' : 'false');
      buttons[i].setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? '#f3f3ee' : '#0b0c0a');
  }
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked: follow the system */ }
  apply(saved);
  document.addEventListener('click', function (event) {
    var target = event.target;
    var button = target && target.closest ? target.closest('[data-theme-toggle]') : null;
    if (!button) return;
    var next = effective() === 'light' ? 'dark' : 'light';
    apply(next);
    try { localStorage.setItem(KEY, next); } catch (e) { /* the choice lasts for this page only */ }
    sync();
  });
  document.addEventListener('DOMContentLoaded', sync);
  if (prefersLight && prefersLight.addEventListener) prefersLight.addEventListener('change', sync);
})();
