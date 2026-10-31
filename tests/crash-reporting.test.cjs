const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function loadCrashReporting(dsn) {
  const filename = path.resolve(root, 'src/services/crashReporting.ts');
  const calls = { init: [], capture: [], tags: [] };
  const sentry = {
    init: (options) => calls.init.push(options),
    captureException: (error, hint) => calls.capture.push([error, hint]),
    withScope: (fn) => fn({ setTag: (key, value) => calls.tags.push([key, value]) }),
  };
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const req = (id) => {
    if (id === '@sentry/react-native') return sentry;
    throw new Error(`unexpected import ${id}`);
  };
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
    __DEV__: false,
    process: { env: dsn ? { EXPO_PUBLIC_SENTRY_DSN: dsn } : {} },
  }, { filename })(req, module, module.exports);
  return { api: module.exports, calls };
}

test('crash reporting stays off in builds without a DSN', () => {
  const { api, calls } = loadCrashReporting('');
  assert.equal(calls.init.length, 0);
  assert.equal(api.crashReportingEnabled(), false);
  api.reportError(new Error('boom'));
  api.reportHandled(new Error('handled'), 'backup.push');
  assert.equal(calls.capture.length, 0);
  assert.equal(calls.tags.length, 0);
});

test('handled errors are reported with a tag once crash reporting is on', () => {
  const { api, calls } = loadCrashReporting('https://key@example.ingest.sentry.io/1');
  const error = new Error('push failed');
  api.reportHandled(error, 'backup.push');
  assert.equal(calls.capture.length, 1);
  assert.equal(calls.capture[0][0], error);
  assert.deepEqual(calls.tags, [['handled', 'backup.push']]);
});

test('crash reports carry no personal data', () => {
  const { api, calls } = loadCrashReporting('https://key@example.ingest.sentry.io/1');
  assert.equal(calls.init.length, 1, 'starts once on import');
  const options = calls.init[0];
  assert.equal(options.sendDefaultPii, false);
  assert.equal(options.attachScreenshot, false);
  assert.equal(options.attachViewHierarchy, false);
  assert.equal(options.tracesSampleRate, 0);

  const event = options.beforeSend({
    user: { email: 'a@b.c', id: 'u1' },
    request: { url: 'https://x.supabase.co/rest/v1/backups?user_id=eq.123', headers: { Authorization: 'Bearer t' }, cookies: 'c' },
  });
  assert.equal(event.user, undefined);
  assert.equal(event.request.headers, undefined);
  assert.equal(event.request.cookies, undefined);
  assert.equal(event.request.url, 'https://x.supabase.co/rest/v1/backups');

  const db = options.beforeSend({
    message: 'push failed for alex.smith@mail.com',
    exception: { values: [{ type: 'Error', value: 'Key (user_id)=(3f2a1b4c-1234-4abc-9def-0123456789ab) violates constraint' }] },
  });
  assert.equal(db.message, 'push failed for <email>');
  assert.equal(db.exception.values[0].value, 'Key (user_id)=(<id>) violates constraint');

  assert.equal(options.beforeBreadcrumb({ category: 'console', message: 'typed text' }), null);
  const http = options.beforeBreadcrumb({ category: 'http', data: { url: 'https://x.co/a?user_id=eq.9#f', method: 'GET' } });
  assert.equal(http.data.url, 'https://x.co/a');
  assert.equal(http.data.method, 'GET');

  api.initCrashReporting();
  assert.equal(calls.init.length, 1, 'a second init is ignored');
  api.reportError(new Error('render'), 'in Screen');
  assert.equal(calls.capture.length, 1);
  assert.equal(calls.capture[0][1].contexts.react.componentStack, 'in Screen');
});

test('crash reporting loads before the rest of the app and the error boundary reports', () => {
  const index = fs.readFileSync(path.join(root, 'index.ts'), 'utf8');
  const imports = [...index.matchAll(/^import .*$/gm)].map((m) => m[0]);
  assert.match(imports[1], /crashReporting/, 'first import after expo');
  const boundary = fs.readFileSync(path.join(root, 'src/components/ErrorBoundary.tsx'), 'utf8');
  assert.match(boundary, /reportError\(error, info\.componentStack\)/);
});

test('a new phone can restore from the first onboarding screen', () => {
  const nav = fs.readFileSync(path.join(root, 'src/navigation/RootNavigator.tsx'), 'utf8');
  const onboardingStack = nav.slice(nav.indexOf('function OnboardingFlow'), nav.indexOf('</OnboardingStack.Navigator>'));
  assert.match(onboardingStack, /name="Backup" component=\{BackupScreen\}/);
  const screen = fs.readFileSync(path.join(root, 'src/screens/onboarding/OnboardingScreen.tsx'), 'utf8');
  assert.match(screen, /onRestore=\{isBackupAvailable\(\) \? \(\) => navigation\.navigate\('Backup', \{ onboarding: true \}\) : undefined\}/);
  const backup = fs.readFileSync(path.join(root, 'src/screens/BackupScreen.tsx'), 'utf8');
  // Mid-setup sign-in must never upload this phone's empty state over a real backup.
  const onboardingBranch = backup.slice(backup.indexOf('if (onboarding) {'), backup.indexOf('// First sign-in'));
  assert.doesNotMatch(onboardingBranch, /pushBackup/);
  assert.match(onboardingBranch, /fetchBackupMeta\(\)/);
});
