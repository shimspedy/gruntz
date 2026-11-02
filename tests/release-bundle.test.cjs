const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const xcode = require('xcode');
const withReleaseBundleGuard = require('../plugins/withReleaseBundleGuard');
const { withSentryIOS } = require('@sentry/react-native/plugin/build/withSentryIOS');

const root = path.resolve(__dirname, '..');
const guardName = '[Gruntz] Verify release JavaScript bundle';
const bundleName = 'Bundle React Native code and images';
const sentryWrapper = path.join(root, 'node_modules/@sentry/react-native/scripts/sentry-xcode.sh');
const productionEnv = require('../eas.json').build.production.env;

function projectFixture() {
  const project = xcode.project('fixture.xcodeproj/project.pbxproj');
  project.hash = {
    project: {
      objects: {
        PBXProject: { PROJECT: { targets: [{ value: 'WATCH' }, { value: 'APP' }] } },
        PBXNativeTarget: {
          WATCH: { productType: '"com.apple.product-type.application.watchapp2"', buildPhases: [] },
          APP: {
            productType: '"com.apple.product-type.application"',
            buildPhases: [{ value: 'BUNDLE', comment: bundleName }, { value: 'COPY', comment: 'Copy resources' }],
          },
        },
        PBXFileReference: {}, PBXBuildFile: {},
        PBXShellScriptBuildPhase: {
          BUNDLE: {
            name: JSON.stringify(bundleName),
            shellScript: JSON.stringify('/bin/sh ../node_modules/react-native/scripts/react-native-xcode.sh\n'),
          },
          BUNDLE_comment: bundleName,
        },
      },
    },
  };
  return project;
}

async function generatedGuard(project = projectFixture(), includeSentry = true) {
  // Exercise the real config mod chain: the Sentry wrapper and guard must coexist.
  const initial = { name: 'Gruntz', slug: 'gruntz' };
  const config = withReleaseBundleGuard(includeSentry ? withSentryIOS(initial, '') : initial);
  await config.mods.ios.xcodeproj({ ...config, modResults: project, modRequest: {} });
  const app = project.getTarget('com.apple.product-type.application').target;
  const entry = app.buildPhases.find((phase) => phase.comment === guardName);
  const phase = project.hash.project.objects.PBXShellScriptBuildPhase[entry.value];
  return { project, app, phase, script: JSON.parse(phase.shellScript) };
}

function harness(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gruntz-release-bundle-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const buildDirectory = path.join(directory, 'Release Products');
  const resources = 'Gruntz.app';
  const bundle = path.join(buildDirectory, resources, 'main.jsbundle');
  const bundler = path.join(directory, 'bundle.sh');
  const cli = path.join(directory, 'fake-sentry.js');
  const cliMarker = path.join(directory, 'cli-called');
  fs.mkdirSync(path.dirname(bundle), { recursive: true });
  fs.writeFileSync(cli, 'require("node:fs").writeFileSync(process.env.CLI_MARKER, "called");\n');
  const env = {
    PATH: process.env.PATH,
    NODE_BINARY: process.execPath,
    CONFIGURATION: 'Release',
    PROJECT_DIR: path.join(directory, 'ios'),
    CONFIGURATION_BUILD_DIR: buildDirectory,
    TARGET_BUILD_DIR: buildDirectory,
    UNLOCALIZED_RESOURCES_FOLDER_PATH: resources,
    DERIVED_FILE_DIR: directory,
    SENTRY_CLI_EXECUTABLE: cli,
    SENTRY_COLLECT_MODULES: path.join(directory, 'not-installed.sh'),
    CLI_MARKER: cliMarker,
  };
  return {
    directory, bundle, bundler, cliMarker, env,
    writeBundler(code) { fs.writeFileSync(bundler, '#!/bin/sh\nset -eu\n' + code); fs.chmodSync(bundler, 0o755); },
    runWrapper(overrides = {}) {
      return spawnSync('/bin/sh', [sentryWrapper, bundler], { env: { ...env, ...overrides }, encoding: 'utf8' });
    },
    runGuard(script, overrides = {}) {
      return spawnSync('/bin/sh', ['-c', script], { env: { ...env, ...overrides }, encoding: 'utf8' });
    },
  };
}

test('release guard follows the Sentry-wrapped bundle phase once and leaves watch targets alone', async () => {
  const { project, app, phase } = await generatedGuard();
  assert.deepEqual(app.buildPhases.map((entry) => entry.comment), [bundleName, guardName, 'Copy resources']);
  assert.match(project.hash.project.objects.PBXShellScriptBuildPhase.BUNDLE.shellScript, /sentry-xcode\.sh/);
  assert.equal(phase.alwaysOutOfDate, 1);
  await generatedGuard(project, false);
  assert.equal(app.buildPhases.filter((entry) => entry.comment === guardName).length, 1);
  assert.equal(project.hash.project.objects.PBXNativeTarget.WATCH.buildPhases.some((entry) => entry.comment === guardName), false);
  const plugins = require('../app.json').expo.plugins;
  assert.ok(plugins.indexOf('./plugins/withReleaseBundleGuard') > plugins.indexOf('@sentry/react-native'));
});

test('production skips Sentry uploads while the installed wrapper still bundles the app', async (t) => {
  assert.equal(productionEnv.SENTRY_DISABLE_AUTO_UPLOAD, 'true');
  assert.equal(productionEnv.SENTRY_ALLOW_FAILURE, undefined);
  const h = harness(t);
  h.writeBundler('printf "embedded JavaScript" > "$TARGET_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/main.jsbundle"\n');
  const result = h.runWrapper(productionEnv);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(h.cliMarker), false, 'Sentry CLI must not gate the bundler');
  assert.ok(fs.statSync(h.bundle).size > 0);
  assert.equal(h.runGuard((await generatedGuard()).script).status, 0);
});

test('JavaScript bundling errors remain fatal with uploads disabled', (t) => {
  const h = harness(t);
  h.writeBundler('exit 37\n');
  const result = h.runWrapper(productionEnv);
  assert.equal(result.status, 37, result.stderr);
  assert.equal(fs.existsSync(h.bundle), false);
});

test('release guard rejects a successful wrapper that never embedded JavaScript', async (t) => {
  const h = harness(t);
  h.writeBundler('printf "embedded JavaScript" > "$TARGET_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/main.jsbundle"\n');
  // Reproduce build58's false-success boundary without any network or credentials.
  const result = h.runWrapper({ SENTRY_ALLOW_FAILURE: 'true' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(h.cliMarker), true);
  assert.equal(fs.existsSync(h.bundle), false);
  const script = (await generatedGuard()).script;
  assert.equal(h.runGuard(script).status, 1);
  fs.writeFileSync(h.bundle, '');
  assert.equal(h.runGuard(script).status, 1, 'empty bundles cannot launch either');
  assert.equal(h.runGuard(script, { CONFIGURATION: 'Debug' }).status, 0);
});

test('prebuild fails if it cannot locate the main application bundle phase', async () => {
  const project = projectFixture();
  project.hash.project.objects.PBXNativeTarget.APP.buildPhases = [];
  await assert.rejects(() => generatedGuard(project), /React Native bundle phase not found/);
});
