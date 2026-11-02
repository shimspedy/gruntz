const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createLoader } = require('./workout-test-utils.cjs');

const tick = () => new Promise((resolve) => setImmediate(resolve));

function environment({ available = true, permission = 'not-determined', optedIn = false, choiceMade = false, request } = {}) {
  const calls = { requests: 0, activations: 0, choices: [], listeners: 0 };
  let stateListener;
  const appState = {
    currentState: 'active',
    addEventListener(_event, listener) {
      calls.listeners += 1;
      stateListener = listener;
      return { remove() { calls.listeners -= 1; stateListener = undefined; } };
    },
  };
  const read = () => ({ available, permission, choiceMade, enabled: available && optedIn && permission === 'authorized' });
  const service = createLoader({
    'react-native': { AppState: appState },
    '../../modules/gruntz-meta-events': {
      readMetaInstallTrackingState: read,
      setNativeMetaInstallTrackingEnabled(enabled) {
        optedIn = enabled && permission === 'authorized';
        choiceMade = true;
        calls.choices.push(optedIn);
        return read();
      },
      async requestNativeMetaTrackingAuthorization() {
        calls.requests += 1;
        if (request) permission = await request();
        return permission;
      },
      async activateNativeMetaInstallTracking() {
        assert.equal(read().enabled, true, 'native event attempted without both consent gates');
        assert.equal(appState.currentState, 'active');
        calls.activations += 1;
        return true;
      },
    },
  })('src/services/metaInstallTracking.ts');
  return {
    ...service, calls,
    permission(value) { permission = value; },
    transition(value) { appState.currentState = value; stateListener?.(value); },
  };
}

test('unsupported or unconfigured builds never request ATT or start measurement', async () => {
  const env = environment({ available: false });
  env.startMetaInstallTracking();
  await tick();
  assert.deepEqual(env.calls, { requests: 0, activations: 0, choices: [], listeners: 0 });
});

test('denied permission cannot initialize or activate measurement', async () => {
  const env = environment({ request: async () => 'denied' });
  const stop = env.startMetaInstallTracking();
  await tick();
  env.transition('background'); env.transition('active');
  await tick();
  assert.equal(env.calls.requests, 1);
  assert.equal(env.calls.activations, 0);
  assert.deepEqual(env.calls.choices, [false]);
  stop();
});

test('grant permits one manual activation per foreground and lifecycle cleanup removes observers', async () => {
  const env = environment({ request: async () => 'authorized' });
  const stop = env.startMetaInstallTracking();
  await tick();
  assert.equal(env.calls.activations, 1);
  env.transition('active');
  await tick();
  assert.equal(env.calls.activations, 1);
  env.transition('background'); env.transition('active');
  await tick();
  assert.equal(env.calls.activations, 2);
  stop();
  assert.equal(env.calls.listeners, 0);
});

test('local opt-out wins over existing ATT authorization and is not automatically prompted again', async () => {
  const env = environment({ permission: 'authorized', choiceMade: true });
  env.startMetaInstallTracking();
  await tick();
  assert.equal(env.calls.requests, 0);
  assert.equal(env.calls.activations, 0);
});

test('opting out during an ATT prompt prevents its eventual grant from re-enabling tracking', async () => {
  let grant;
  const env = environment({ request: () => new Promise((resolve) => { grant = resolve; }) });
  const pending = env.enableMetaInstallTracking();
  await tick();
  env.disableMetaInstallTracking();
  grant('authorized');
  const state = await pending;
  assert.equal(state.enabled, false);
  assert.equal(state.choiceMade, true);
  assert.deepEqual(env.calls.choices, [false]);
  assert.equal(env.calls.activations, 0);
});

test('a queued opt-in cancelled by reset does not even present the stale permission prompt', async () => {
  const env = environment();
  const pending = env.enableMetaInstallTracking();
  env.disableMetaInstallTracking();
  await pending;
  assert.equal(env.calls.requests, 0);
  assert.equal(env.calls.activations, 0);
});

test('an ATT prompt deferred by iOS leaves the choice open and retries on a later foreground', async () => {
  const env = environment();
  env.startMetaInstallTracking();
  await tick();
  assert.equal(env.getMetaInstallTrackingState().choiceMade, false);
  assert.equal(env.calls.activations, 0);
  env.permission('authorized');
  env.transition('inactive'); env.transition('active');
  await tick();
  assert.equal(env.calls.activations, 1);
});

test('revoking ATT prevents subsequent foreground activation even with the old local opt-in', async () => {
  const env = environment({ permission: 'authorized', optedIn: true, choiceMade: true });
  env.startMetaInstallTracking();
  await tick();
  env.permission('denied');
  env.transition('background'); env.transition('active');
  await tick();
  assert.equal(env.calls.activations, 1);
  assert.equal(env.getMetaInstallTrackingState().enabled, false);
});

function plugin(env) {
  const module = { exports: {} };
  const warnings = [];
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../plugins/withMetaInstallTracking.js'), 'utf8'), {
    module, exports: module.exports, process: { env },
    console: { warn: (message) => warnings.push(message) },
    require: () => ({ withInfoPlist: (config, modifier) => modifier({ ...config, modResults: {} }) }),
  });
  return { build: () => module.exports({}), warnings };
}

test('build config disables unrelated collection and keeps the client token out of public extra', () => {
  const result = plugin({ GRUNTZ_META_CLIENT_TOKEN: 'test-client-token' }).build();
  assert.equal(result.modResults.GruntzMetaInstallTrackingEnabled, true);
  for (const flag of ['FacebookAutoInitEnabled', 'FacebookAutoLogAppEventsEnabled', 'FacebookAdvertiserIDCollectionEnabled', 'FBSDKAutoLogMetaDataEnabled', 'FBSDKAutoLogProductImprovementEnabled', 'FBSDKAemAutoSetupEnabled']) {
    assert.equal(result.modResults[flag], false, flag);
  }
  assert.equal(result.extra, undefined);
  assert.equal(result.ios.privacyManifests.NSPrivacyTracking, true);
});

test('missing build credential fails production and disables development measurement', () => {
  for (const profile of ['production', 'release-simulator']) {
    assert.throws(() => plugin({ EAS_BUILD_PROFILE: profile }).build(), /must be configured/);
  }
  const development = plugin({});
  const result = development.build();
  assert.equal(result.modResults.GruntzMetaInstallTrackingEnabled, false);
  assert.equal(result.modResults.FacebookClientToken, undefined);
  assert.equal(development.warnings.length, 1);
});
