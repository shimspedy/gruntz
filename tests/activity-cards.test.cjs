const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');
const load = createLoader();
const route = load('src/utils/activityRoute.ts');
const display = load('src/utils/activityDisplay.ts');
const capture = load('src/utils/activityCapture.ts');
const point = (latitude, longitude, segment = 0) => ({ latitude, longitude, altitude: null, timestamp: 1, speed: null, segment });

test('share route excludes every visit within 200m of either endpoint, including loops', () => {
  const original = [point(0, 0), point(0.001, 0), point(0.003, 0), point(0.004, 0), point(0.001, 0), point(0.004, 0.003), point(0.006, 0.003), point(0.008, 0.003), point(0.01, 0.003)];
  const redacted = route.privateRoute(original);
  assert.ok(redacted.length >= 2);
  for (const sample of redacted) {
    assert.ok(route.routeDistanceMeters(sample, original[0]) > 200);
    assert.ok(route.routeDistanceMeters(sample, original.at(-1)) > 200);
  }
  assert.ok(route.routeSegments(redacted).length > 1);
  assert.equal(original[2].segment, 0, 'sharing must not change saved route segments');
});

test('share route does not draw a sparse segment straight through a hidden endpoint', () => {
  const original = [point(0, 0), point(0.003, -0.003), point(0.003, 0), point(0.004, 0), point(-0.004, 0), point(-0.003, 0), point(-0.003, 0.003), point(-0.02, 0.02)];
  const segments = route.routeSegments(route.privateRoute(original));
  assert.ok(segments.length >= 2);
  for (const segment of segments) {
    assert.ok(!segment.some((sample) => sample.latitude > 0) || !segment.some((sample) => sample.latitude < 0), 'a line must not cross the protected start');
  }
});

test('short activities can keep their stats while privacy hides the entire route', () => {
  assert.deepEqual(route.privateRoute([point(40, -80), point(40.0001, -80), point(40.0002, -80)]), []);
  assert.deepEqual(route.routeGeoJSON([]).geometry.coordinates, []);
  assert.equal(route.routeBounds([]), null);
});

test('maps retain pause segments and gaps caused by invalid GPS samples', () => {
  const original = [point(1, 1), point(2, 2), point(NaN, 2), point(3, 3), point(4, 4), point(5, 5, 1), point(6, 6, 1)];
  const json = route.routeGeoJSON(original);
  assert.deepEqual(json.geometry.coordinates, [[[1, 1], [2, 2]], [[3, 3], [4, 4]], [[5, 5], [6, 6]]]);
  assert.deepEqual(json.properties, {}, 'route export must not include GPS timestamps or personal metadata');
});

test('date-line route bounds and Mercator artwork span the short path', () => {
  const original = [point(10, 179.9), point(10.01, -179.9), point(10.02, -179.8)];
  const bounds = route.routeBounds(original);
  assert.ok(bounds[2] - bounds[0] < 1);
  const projected = route.projectedRoute(original)[0];
  assert.ok(Math.abs(projected.at(-1).x - projected[0].x) < 0.01);
});

test('legacy calendar dates retain local day and invalid dates get an explicit fallback', () => {
  const date = display.activityDate({ date: '2026-10-03' });
  assert.equal(date.getDate(), 3);
  assert.equal(date.getMonth(), 9);
  assert.equal(display.activityDate({ date: '2026-02-30' }), null);
  assert.equal(display.activityDateLabel({ date: 'broken' }), 'Date unavailable');
});

test('card distance, pace and ascent follow units and normalize rounding boundaries', () => {
  assert.deepEqual(display.activityDistance(1, 'metric'), { value: '1.61', unit: 'km' });
  assert.equal(display.activityAscent(100, 'metric'), '30 m');
  assert.equal(display.activityDuration(59.8), '1:00');
  assert.deepEqual(display.activityPace({ distanceMiles: 0, durationSeconds: 100 }, 'imperial'), { value: '—', unit: '/mi' });
  assert.deepEqual(display.activityPace({ distanceMiles: 1, durationSeconds: 359.8 }, 'imperial'), { value: '6:00', unit: '/mi' });
});

test('history totals do not silently truncate records or mutate the store order', () => {
  const sessions = Array.from({ length: 405 }, (_, i) => ({ id: String(i), type: i % 3 ? 'hike' : 'run', date: i === 0 ? '2026-10-01' : '2026-10-03', distanceMiles: 1, durationSeconds: 60, elevationFeet: 20 }));
  const sorted = display.sortActivities(sessions);
  assert.equal(sorted.length, 405);
  assert.equal(sessions[0].id, '0');
  assert.equal(sorted.at(-1).id, '0');
  assert.deepEqual(display.activityTotals(sorted), { count: 405, distanceMiles: 405, durationSeconds: 24300, elevationFeet: 8100 });
});

test('share image stays 1080 physical pixels on retina iPhones and Android', () => {
  for (const density of [1, 2, 3]) {
    const size = capture.activityCaptureSize(390, 780, 'ios', density);
    assert.equal(size.width * density, 1080);
    assert.equal(size.height * density, 2160);
  }
  assert.deepEqual(capture.activityCaptureSize(390, 780, 'android', 3), { width: 1080, height: 2160 });
});

test('capture cannot proceed with an unmeasured or invalid card layout', () => {
  assert.throws(() => capture.activityCaptureSize(0, 780, 'ios', 3), /still loading/);
  assert.throws(() => capture.activityCaptureSize(390, NaN, 'android', 3), /still loading/);
});

test('native snapshot contains only supplied redacted coordinates and resolves URL templates', async () => {
  const fetchBefore = global.fetch;
  let options;
  global.fetch = async () => ({ ok: true, json: async () => ({ version: 8, sources: { base: { type: 'vector', tiles: ['../tiles/{z}/{x}/{y}.pbf'] } }, glyphs: '../fonts/{fontstack}/{range}.pbf', sprite: '../sprite', layers: [{ id: 'background', type: 'background' }] }) });
  const snapshotLoad = createLoader({
    '@maplibre/maplibre-react-native': { StaticMapImageManager: { createImage: async (input) => { options = input; return 'png-bytes'; } } },
    'react-native': { Platform: { OS: 'ios' }, PixelRatio: { get: () => 3 } },
  });
  try {
    const snapshot = snapshotLoad('src/utils/activityMapSnapshot.ts');
    const original = [point(0, 0), point(0.003, 0), point(0.004, 0), point(0.005, 0), point(0.008, 0)];
    const safeRoute = route.privateRoute(original);
    assert.equal(await snapshot.activityMapSnapshot(safeRoute, '#A8F16A'), 'data:image/png;base64,png-bytes');
    assert.deepEqual(options.mapStyle.sources['gruntz-share-route'].data.geometry.coordinates, route.routeGeoJSON(safeRoute).geometry.coordinates);
    assert.ok(!JSON.stringify(options.mapStyle.sources['gruntz-share-route']).includes('[0,0]'));
    assert.ok(options.mapStyle.glyphs.includes('{fontstack}/{range}'));
    assert.ok(options.mapStyle.sources.base.tiles[0].includes('{z}/{x}/{y}'));
    assert.deepEqual(options.bounds, route.routeBounds(safeRoute));
    assert.equal(options.output, 'base64');
    assert.equal(options.width, 360, 'iOS native snapshot points must not create a 3240px bitmap');
    assert.equal(options.mapStyle.layers.at(-1).paint['line-width'], 3);
  } finally { global.fetch = fetchBefore; }
});
