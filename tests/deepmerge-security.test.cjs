'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const { patchDeepmerge } = require('../scripts/security/rebuild-deepmerge.cjs');

const root = path.resolve(__dirname, '..');
const vendor = path.join(root, 'vendor/deepmerge');
const rootRequire = createRequire(path.join(root, 'package.json'));
const targetsRequire = createRequire(rootRequire.resolve('@bacons/apple-targets/package.json'));
const consumers = [
  ['Expo SDK config', rootRequire.resolve('@expo/config')],
  ['Apple targets config', targetsRequire.resolve('@expo/config')],
].map(([name, configPath]) => ({ name, configPath, require: createRequire(configPath) }));
const installed = consumers[0].require.resolve('deepmerge');
// Only for proving these attack regressions fail against the unpatched package.
const merge = require(process.env.DEEPMERGE_SECURITY_TARGET ? path.resolve(process.env.DEEPMERGE_SECURITY_TARGET) : installed);
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const malicious = () => JSON.parse('{"__proto__":{"gruntzInjectedAdmin":true}}');
function assertSafe(value) {
  assert.equal(Object.getPrototypeOf(value), Object.prototype, 'returned object keeps its intended prototype');
  assert.equal(value.gruntzInjectedAdmin, undefined, 'no inherited attacker-controlled value');
  assert.equal(Object.hasOwn(value, '__proto__'), false);
  assert.equal(({}).gruntzInjectedAdmin, undefined, 'global prototype also stays clean');
}

test('deepmerge fork preserves pinned notices and contains only the reviewed runtime edits', () => {
  const provenance = require(path.join(vendor, 'provenance.json'));
  assert.equal(provenance.patchCommit, 'c5ad573121574db1c625b0aabcc6114ed7df6c5a');
  assert.equal(provenance.upstreamVersion, '4.3.1');
  assert.equal(provenance.baseCjsSha256, '2e5160f84a1141bd927264afe4d15766f1e6cf07daef182b37ff53fea121de7d');
  assert.equal(provenance.patchedCjsSha256, '8983763adcccc772c023cb97bbf8830de52f7eeaa3c997b867345e1e62dd9d3b');
  for (const [file, original] of Object.entries(provenance.upstreamFiles)) {
    assert.equal(sha256(fs.readFileSync(path.join(vendor, file))), file === 'dist/cjs.js' ? provenance.patchedCjsSha256 : original, file);
  }
  assert.equal(fs.existsSync(path.join(vendor, 'dist/umd.js')), false);
  assert.equal(fs.existsSync(path.join(vendor, 'index.js')), false, 'main must not require an undeclared build-only dependency');
  assert.match(fs.readFileSync(path.join(vendor, 'license.txt'), 'utf8'), /MIT License/);
  assert.throws(() => patchDeepmerge('changed upstream source'), /source changed/);
  assert.throws(() => patchDeepmerge(fs.readFileSync(path.join(vendor, 'dist/cjs.js'), 'utf8')), /source changed/, 'never silently reapply a patch to different source');
});

test('both installed Expo consumers resolve the identified patched CommonJS distribution', () => {
  for (const consumer of consumers) {
    const directory = path.dirname(consumer.require.resolve('deepmerge/package.json'));
    const info = require(path.join(directory, 'package.json'));
    assert.equal(info.name, '@gruntz/deepmerge', consumer.name);
    assert.equal(info.version, '4.3.1-gruntz.1', consumer.name);
    assert.equal(info.main, 'dist/cjs.js');
    assert.equal(consumer.require('deepmerge'), consumer.require('deepmerge/dist/cjs.js'));
    assert.equal(sha256(fs.readFileSync(consumer.require.resolve('deepmerge'))), '8983763adcccc772c023cb97bbf8830de52f7eeaa3c997b867345e1e62dd9d3b');
  }
});

test('prototype poisoning cannot pass through a null-prototype target', () => {
  const target = Object.assign(Object.create(null), { enabled: false });
  const result = merge(target, malicious());
  assertSafe(result); assert.equal(result.enabled, false);
  assert.equal(Object.getPrototypeOf(target), null, 'target is not mutated');
});

for (const placeholder of [null, undefined, false, 0, 'placeholder']) {
  test(`prototype poisoning cannot pass through a ${String(placeholder)} nested placeholder`, () => {
    const result = merge({ session: placeholder }, { session: { ...malicious(), normal: { preserved: true } } });
    assertSafe(result.session); assert.deepEqual(result.session.normal, { preserved: true });
  });
}

test('prototype poisoning is blocked in target-only copies, nested targets, and array element clones', () => {
  assertSafe(merge(malicious(), { ordinary: true }));
  assertSafe(merge({ nested: malicious() }, {}).nested);
  assertSafe(merge({ list: [malicious()] }, { list: [malicious()] }).list[0]);
  assertSafe(merge.all([Object.create(null), malicious(), { ordinary: true }]));
});

test('forbidden prototype getters are skipped before reading in both target and source loops', () => {
  for (const position of ['target', 'source']) {
    const value = { ordinary: true };
    Object.defineProperty(value, '__proto__', { enumerable: true, get() { throw Error('forbidden getter was read'); } });
    const result = position === 'target' ? merge(value, {}) : merge(Object.create(null), value);
    assertSafe(result); assert.equal(result.ordinary, true);
  }
});

test('normal own constructor/prototype keys, symbols and existing inherited/nonenumerable guards are preserved', () => {
  const symbol = Symbol('__proto__');
  const target = JSON.parse('{"constructor":{"left":1},"prototype":{"left":1}}');
  target[symbol] = { left: 1 };
  const result = merge(target, { constructor: { right: 2 }, prototype: { right: 2 }, [symbol]: { right: 2 } });
  assert.deepEqual(result.constructor, { left: 1, right: 2 });
  assert.deepEqual(result.prototype, { left: 1, right: 2 });
  assert.deepEqual(result[symbol], { left: 1, right: 2 });
  assertSafe(result);
  const guarded = Object.create({ inherited: true });
  Object.defineProperty(guarded, 'hidden', { enumerable: false, value: true });
  const safe = merge(guarded, { inherited: 'blocked', hidden: 'blocked', ordinary: true, toString: 'blocked' });
  assert.equal(Object.hasOwn(safe, 'inherited'), false);
  assert.equal(Object.hasOwn(safe, 'hidden'), false);
  assert.equal(Object.hasOwn(safe, 'toString'), false);
  assert.equal(safe.ordinary, true);
});

test('array cloning, clone:false, special values, customMerge, custom isMergeableObject and all keep their API', () => {
  const date = new Date('2026-10-28T00:00:00Z'), regex = /gruntz/;
  const source = { list: [{ next: true }], date, regex };
  const result = merge({ list: [{ first: true }] }, source);
  assert.deepEqual(result.list, [{ first: true }, { next: true }]);
  assert.notEqual(result.list[1], source.list[0]);
  assert.equal(result.date, date); assert.equal(result.regex, regex);
  const original = { nested: { preserved: true } };
  assert.equal(merge({}, original, { clone: false }).nested, original.nested);
  assert.deepEqual(merge({ list: [1] }, { list: [2] }, { arrayMerge: (_target, value) => value }), { list: [2] });
  assert.deepEqual(merge({ name: { first: 'Gruntz' } }, { name: { last: 'Training' } }, {
    customMerge: key => key === 'name' ? (a, b) => `${a.first} ${b.last}` : undefined,
  }), { name: 'Gruntz Training' });
  class Value { constructor(value) { this.value = value; } }
  const instance = new Value(2);
  assert.equal(merge({}, { instance }, { isMergeableObject: value => value?.constructor === Object }).instance, instance);
  assert.deepEqual(merge.all([{ a: 1 }, { b: 2 }]), { a: 1, b: 2 });
  assert.throws(() => merge.all({}), /first argument should be an array/);
});

for (const consumer of consumers) {
  for (const wrapped of [true, false]) {
    test(`${consumer.name} actually merges ${wrapped ? 'wrapped' : 'bare'} Expo config and plugin options without poisoning`, async t => {
      const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gruntz-deepmerge-config-'));
      t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
      const config = {
        name: 'Gruntz security fixture', slug: 'gruntz-security-fixture', sdkVersion: '57.0.0',
        ios: { bundleIdentifier: 'com.gruntz.fitness', infoPlist: { UIBackgroundModes: ['location'] } },
        extra: { session: null, preserved: true },
        plugins: [['fixture-plugin', { guard: null, colors: { dark: true }, list: ['one'] }], 'other-plugin'],
      };
      fs.writeFileSync(path.join(temporary, 'app.json'), JSON.stringify(wrapped ? { expo: config } : config));
      fs.writeFileSync(path.join(temporary, 'package.json'), '{"name":"gruntz-security-fixture","version":"1.0.0"}');
      const input = {
        ios: { infoPlist: { NSMotionUsageDescription: 'Fixture permission' } },
        extra: { session: malicious(), added: true },
        plugins: [['fixture-plugin', { guard: malicious(), colors: { accent: '#C4F542' }, list: ['two'] }], ['new-plugin', { enabled: true }]],
      };
      const { modifyConfigAsync } = consumer.require(consumer.configPath);
      const result = await modifyConfigAsync(temporary, input, { skipPlugins: true }, { dryRun: true });
      assert.equal(result.type, 'success');
      assert.deepEqual(result.config.ios.infoPlist, { UIBackgroundModes: ['location'], NSMotionUsageDescription: 'Fixture permission' });
      assert.equal(result.config.extra.preserved, true); assert.equal(result.config.extra.added, true);
      assertSafe(result.config.extra.session);
      const plugin = result.config.plugins.find(value => Array.isArray(value) && value[0] === 'fixture-plugin');
      assertSafe(plugin[1].guard);
      assert.deepEqual(plugin[1].colors, { dark: true, accent: '#C4F542' });
      assert.deepEqual(plugin[1].list, ['one', 'two']);
      assert.equal(result.config.plugins.filter(value => Array.isArray(value) && value[0] === 'fixture-plugin').length, 1);
      assert.ok(result.config.plugins.includes('other-plugin'));
      assert.deepEqual(result.config.plugins.at(-1), ['new-plugin', { enabled: true }]);
      assert.deepEqual(JSON.parse(fs.readFileSync(path.join(temporary, 'app.json'), 'utf8')), wrapped ? { expo: config } : config, 'dry run must not rewrite input config');
    });
  }
}
