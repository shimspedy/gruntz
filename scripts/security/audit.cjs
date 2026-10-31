#!/usr/bin/env node
// Fails on any npm advisory, at any severity, in the app or the website — except the
// few listed below, each with the reason it cannot reach untrusted input and a date
// after which it fails again so it is re-checked rather than forgotten.
const { execFileSync } = require('node:child_process');

const ACCEPTED = {
  // minimatch < 11.0.1. Used only by Expo's config/prebuild tooling and ESLint on
  // patterns from this repository's own config; no user or network input reaches
  // them. The only fix is minimatch 11, whose API break Expo 57 has not adopted.
  'GHSA-g3hv-75wg-m249': '2027-01-31',
  // glob <= 14.0.1. Same consumers and same reasoning; fixed only in glob 14.0.2+.
  'GHSA-3g3m-2fjr-6pw4': '2027-01-31',
};

function advisories(prefix) {
  const args = ['audit', '--json', ...(prefix ? ['--prefix', prefix] : [])];
  let out;
  try {
    out = execFileSync('npm', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  } catch (error) {
    out = error.stdout; // npm audit exits non-zero when it finds anything.
  }
  const report = JSON.parse(out);
  const found = new Map();
  for (const vuln of Object.values(report.vulnerabilities ?? {})) {
    for (const via of vuln.via) {
      if (typeof via === 'object' && via.url) found.set(via.url.split('/').pop(), `${via.name}: ${via.title} (${via.severity})`);
    }
  }
  return found;
}

const today = new Date().toISOString().slice(0, 10);
let failed = false;
for (const [label, prefix] of [['app', null], ['website', 'website']]) {
  for (const [id, summary] of advisories(prefix)) {
    const until = ACCEPTED[id];
    if (until && today <= until) {
      console.log(`[${label}] accepted until ${until}: ${id} ${summary}`);
    } else {
      console.error(`[${label}] ${until ? 'acceptance expired' : 'advisory'}: ${id} ${summary}`);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log('npm audit: no unaccepted advisories.');
