const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { patchExpoJsiInterfaceSource } = require('../scripts/patch-expo-jsi-interface.cjs');

test('Expo JSI interface cleanup handles both Swift namespace spellings without removing public API', () => {
  const upstream = fs.readFileSync(path.join(__dirname, '../node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh'), 'utf8');
  const patched = patchExpoJsiInterfaceSource(upstream);
  const line = patched.split('\n').find(line => line.includes("sed -E '/^extension __ObjC"));
  assert.ok(line, 'The installed Expo version must use the reviewed interface sanitizer.');
  const expression = line.split("'", 3)[1];
  const fixture = [
    'public struct Before {}',
    'extension __ObjC.expo.CppError : Swift.Error {',
    '  public var message: Swift.String {',
    '    get',
    '  }',
    '}',
    'extension __ObjC::expo.__ObjC::CppError : Swift::Error {',
    '  public var message: Swift::String {',
    '    get',
    '  }',
    '}',
    'public struct After {}',
    '',
  ].join('\n');
  assert.equal(execFileSync('sed', ['-E', expression], { input: fixture, encoding: 'utf8' }), 'public struct Before {}\npublic struct After {}\n');
  assert.equal(patchExpoJsiInterfaceSource(patched), patched);
});
