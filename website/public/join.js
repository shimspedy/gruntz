// Team invite links look like /join/#ABC234. The code stays in the fragment, so it is
// never sent to this site. Nothing here joins a team: it only opens the app's join
// screen with the code typed in.
(function () {
  var code = (location.hash || '').slice(1).toUpperCase();
  if (!/^[A-Z2-9]{6}$/.test(code)) return;
  var open = document.getElementById('join-open');
  var line = document.getElementById('join-code-line');
  var shown = document.getElementById('join-code');
  var missing = document.getElementById('join-missing');
  if (!open || !line || !shown || !missing) return;
  open.setAttribute('href', 'gruntz://join/' + code);
  open.hidden = false;
  shown.textContent = code;
  line.hidden = false;
  missing.hidden = true;
})();
