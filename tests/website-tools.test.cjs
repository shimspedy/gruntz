const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader } = require('./workout-test-utils.cjs');

const site = path.join(__dirname, '..', 'website', 'src', 'data', 'tools');
const load = createLoader();
const score = load('website/src/data/tools/score.ts');

test('times parse as mm:ss and reject nonsense', () => {
  assert.equal(score.parseTime('18:30'), 1110);
  assert.equal(score.parseTime('1:02:05'), 3725);
  assert.equal(score.parseTime('45'), 45);
  assert.equal(score.parseTime('18:75'), null);
  assert.equal(score.parseTime('abc'), null);
  assert.equal(score.formatTime(1110), '18:30');
});

test('points pick the best row reached, for reps and for times', () => {
  const reps = { id: 'r', name: 'R', unit: 'reps', better: 'higher', brackets: [{ sex: 'any', ageMin: 17, ageMax: 99, points: [[3, 40], [10, 70], [20, 100]] }] };
  assert.equal(score.pointsFor(reps, 'male', 25, 2), 0);
  assert.equal(score.pointsFor(reps, 'male', 25, 12), 70);
  assert.equal(score.pointsFor(reps, 'female', 40, 25), 100);
  const run = { id: 't', name: 'T', unit: 'seconds', better: 'lower', brackets: [{ sex: 'male', ageMin: 17, ageMax: 20, points: [[1080, 100], [1500, 60], [1680, 40]] }] };
  assert.equal(score.pointsFor(run, 'male', 18, 1070), 100);
  assert.equal(score.pointsFor(run, 'male', 18, 1600), 40);
  assert.equal(score.pointsFor(run, 'male', 18, 1800), 0);
  assert.equal(score.pointsFor(run, 'female', 18, 1000), 0, 'no bracket for that sex scores nothing');
  assert.equal(score.maxPerformance(run, 'male', 18), 1080);
});

test('the DoD tape formulas compute the published equations', () => {
  // One-site (DoDI 1308.03, 2022): male 180 lb, 36 in abdomen → -26.97 - 21.6 + 71.64 = 23.07 → 23
  assert.equal(score.bodyFatPercent('dod-one-site', 'male', { heightIn: 70, weightLb: 180, abdomenIn: 36 }), 23);
  // female 140 lb, 32 in → -9.15 - 2.1 + 40.64 = 29.39 → 29
  assert.equal(score.bodyFatPercent('dod-one-site', 'female', { heightIn: 65, weightLb: 140, abdomenIn: 32 }), 29);
  assert.equal(score.waistToHeight(34, 70), 0.49);
});

const files = (dir) => (fs.existsSync(path.join(site, dir)) ? fs.readdirSync(path.join(site, dir)).filter((f) => f.endsWith('.ts')) : []);

test('every fitness chart is well formed', () => {
  for (const file of files('fitness')) {
    const mod = load(`website/src/data/tools/fitness/${file}`);
    for (const value of Object.values(mod)) {
      if (!value || typeof value !== 'object' || !('slots' in value)) continue;
      const t = value;
      assert.ok(t.provenance.sources.length > 0, `${file} ${t.id} lists an official source`);
      for (const s of t.provenance.sources) assert.match(s.url, /^https:\/\//, `${file} source is https`);
      for (const slot of t.slots) for (const ev of slot.options) {
        assert.ok(ev.brackets.length > 0, `${file} ${t.id} ${ev.id} has brackets`);
        for (const b of ev.brackets) {
          assert.ok(b.points.length > 0, `${file} ${ev.id} ${b.sex} ${b.ageMin} has rows`);
          for (const [perf, pts] of b.points) {
            assert.ok(Number.isFinite(perf) && perf >= 0, `${file} ${ev.id} performance is a number`);
            assert.ok(Number.isFinite(pts) && pts >= 0 && pts <= t.maxPoints, `${file} ${ev.id} points within the test maximum`);
          }
          // Better results never earn fewer points.
          const sorted = [...b.points].sort((x, y) => (ev.better === 'higher' ? x[0] - y[0] : y[0] - x[0]));
          for (let i = 1; i < sorted.length; i += 1) {
            assert.ok(sorted[i][1] >= sorted[i - 1][1], `${file} ${ev.id} ${b.sex} ${b.ageMin}-${b.ageMax}: points never drop as results improve (${sorted[i - 1]} → ${sorted[i]})`);
          }
        }
        // Every age group on the chart is covered for every sex the chart uses.
        for (const g of t.ageGroups) for (const sex of t.bySex ? ['male', 'female'] : ['male']) {
          assert.ok(score.bracketFor(ev, sex, g.ageMin), `${file} ${ev.id} covers ${sex} ${g.label}`);
        }
      }
    }
  }
});

test('every calculator page has search-length title and description', () => {
  const { tools } = load('website/src/data/tools/registry.ts');
  const seen = new Set();
  for (const t of tools) {
    assert.ok(t.metaTitle.length <= 60, `${t.branch}/${t.slug} title ${t.metaTitle.length} chars`);
    assert.ok(t.description.length <= 155, `${t.branch}/${t.slug} description ${t.description.length} chars`);
    assert.ok(!seen.has(`${t.branch}/${t.slug}`), 'unique path');
    seen.add(`${t.branch}/${t.slug}`);
    assert.doesNotMatch(`${t.description} ${t.lede}`, /official score|guarantee/i);
  }
});

test('Army waist-to-height follows AD 2026-13: three decimals cut off, strictly below 0.55', () => {
  const rule = { decimals: 3, truncate: true, strictlyBelow: true };
  const army = { waistToHeightMax: 0.55, waistToHeightRule: rule };
  // 38.5 / 70 = 0.55 exactly: does not meet "below 0.55".
  assert.equal(score.waistToHeight(38.5, 70, rule), 0.55);
  assert.equal(score.meetsRatio(0.55, army), false);
  // 0.5499 is cut to 0.549, not rounded up to 0.55, so it passes.
  assert.equal(score.waistToHeight(0.5499 * 1000, 1000, rule), 0.549);
  assert.equal(score.meetsRatio(0.549, army), true);
  // Without a rule: two decimals, rounded, at or under passes.
  assert.equal(score.meetsRatio(0.55, { waistToHeightMax: 0.55 }), true);
});

test('Navy BCA: four decimals cut off, 0.5499 passes, then the official body fat table', () => {
  const navy = load('website/src/data/tools/body-comp/navy.ts');
  const rule = navy.standard.waistToHeightRule;
  assert.deepEqual(rule, { decimals: 4, truncate: true, strictlyBelow: true });
  assert.equal(score.meetsRatio(score.waistToHeight(0.54999 * 1000, 1000, rule), navy.standard), true);
  assert.equal(score.meetsRatio(0.55, navy.standard), false);
  assert.equal(typeof navy.lookupBodyFat, 'function');
  // Every row of the table is ordered: body fat never falls as weight rises.
  for (const sex of ['male', 'female']) for (const row of navy.bodyFatTable[sex]) {
    const steps = row.slice(4);
    for (let i = 1; i < steps.length; i += 1) assert.ok(steps[i] >= steps[i - 1], `${sex} diff ${row[0]} steps ascend`);
    assert.equal(navy.navyBodyFatPercent(sex, row[0], row[1]), row[3], `${sex} diff ${row[0]} lowest weight gives the base value`);
  }
});

test('Marine body composition: 0.52 or lower passes, then the neck/waist/hip tape test', () => {
  const mc = load('website/src/data/tools/body-comp/marine-corps.ts');
  const st = mc.standard;
  assert.equal(st.waistToHeightMax, 0.52);
  assert.equal(score.meetsRatio(0.52, st), true, 'exactly 0.52 passes, as the order\'s own table does');
  assert.equal(score.meetsRatio(0.5201, st), false);
  assert.deepEqual(st.bodyFatAfterRatio, { male: ['neck'], female: ['neck', 'hip'] });
  // The published max-waist table agrees with the ratio: each max waist ÷ height is at or under 0.52.
  for (const [h, w] of mc.maxWaistByHeight) assert.ok(w / h <= 0.52 + 1e-9, `${h} in → ${w} in stays within 0.52`);
  // Tape test: a 70 in man with a 36 in abdomen and 16 in neck → 86.01·log10(20) − 70.041·log10(70) + 36.76 ≈ 19
  assert.equal(mc.lookupBodyFat('male', { heightIn: 70, waistIn: 36, neckIn: 16 }), 19);
  assert.equal(mc.lookupBodyFat('female', { heightIn: 65, waistIn: 30, neckIn: 13 }), null, 'a woman needs a hip measurement');
});

test('every rank has an insignia drawing, except the entry grades that wear none', () => {
  const { ranks } = load('website/src/data/tools/reference/ranks.ts');
  const { insigniaSvg } = load('website/src/data/tools/insignia.ts');
  const none = new Set(['army PVT', 'marine-corps Pvt', 'navy SR', 'coast-guard SR', 'air-force AB', 'space-force Spc1']);
  for (const r of ranks) {
    const svg = insigniaSvg(r);
    if (none.has(`${r.branch} ${r.abbr}`)) assert.equal(svg, null, `${r.branch} ${r.abbr} wears no insignia`);
    else {
      assert.ok(svg && svg.startsWith('<svg') && svg.includes('</svg>'), `${r.branch} ${r.abbr} has a drawing`);
      assert.doesNotMatch(svg, /NaN|undefined/, `${r.branch} ${r.abbr} drawing has real coordinates`);
    }
  }
});

// ─── Hardening from audit run-12 ───────────────────────────────────────────────
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.ts') ? [path.join(dir, e.name)] : []));

test('every source, citation and provenance link in the tools data is https', () => {
  // URLs render as href without a scheme check, so the data must never carry javascript: or http:.
  // Checks the loaded values, so template-built URLs are checked as they really render.
  const urls = [];
  const collect = (v, where) => {
    if (Array.isArray(v)) v.forEach((x) => collect(x, where));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (k === 'url' && typeof x === 'string') urls.push([where, x]); else collect(x, where); }
  };
  for (const file of walk(site)) {
    const rel = path.relative(path.join(__dirname, '..'), file);
    if (/catalog|registry|insignia(-images)?\.ts$|score\.ts$/.test(rel)) continue;
    collect(load(rel), rel);
  }
  assert.ok(urls.length > 100, `found ${urls.length} links`);
  for (const [where, url] of urls) assert.match(url, /^https:\/\//, `${where}: ${url}`);
});

test('every ribbon stripe colour is a plain hex value', () => {
  // Colours go straight into an SVG fill attribute.
  const file = path.join(site, 'reference', 'ribbons.ts');
  if (!fs.existsSync(file)) return;
  const { ribbonPatterns } = load('website/src/data/tools/reference/ribbons.ts');
  for (const [name, p] of Object.entries(ribbonPatterns)) {
    for (const [color, width] of p.stripes) {
      assert.match(color, /^#[0-9a-fA-F]{6}$/, `${name}: ${color}`);
      assert.ok(Number.isFinite(width) && width > 0, `${name}: width ${width}`);
    }
    assert.ok(Math.abs(p.stripes.reduce((n, [, w]) => n + w, 0) - 44) < 1e-6, `${name} is 44 units wide`);
  }
});
