const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { LIMITS, patchExpoDevToolsSchema, verifyPatchedZod } = require('../scripts/patch-expo-zod-bounds.cjs');

const cliPackage = require.resolve('@expo/cli/package.json');
const cliRequire = createRequire(cliPackage);
const zod = cliRequire('zod');
const schemaDirectory = path.join(path.dirname(cliPackage), 'build/src/start/server');

/** Execute the actual distributed Expo schemas; only their Zod dependency is injected. */
function loadCliSchema(file, { bounded = false } = {}) {
  const filename = path.join(schemaDirectory, file);
  const localRequire = createRequire(filename);
  const module = { exports: {} };
  const original = fs.readFileSync(filename, 'utf8');
  const source = bounded ? patchExpoDevToolsSchema(original) : original;
  new Function('require', 'module', 'exports', source)((name) => name === 'zod' ? zod : localRequire(name), module, module.exports);
  return module.exports;
}

const plugin = () => ({
  packageName: 'test-plugin', packageRoot: '/tmp/test-plugin', bannerTitle: true,
  cliExtensions: { description: 'Project tools', entryPoint: 'commands.js', commands: [{
    name: 'inspect', title: 'Inspect project', environments: ['cli', 'mcp'],
    parameters: [{ name: 'query', type: 'text' }, { name: 'limit', type: 'number' }, { name: 'confirm', type: 'confirm' }],
  }] },
});

test('Expo CLI resolves a patched Zod v4 release, not the still-vulnerable v3 compatibility subpath', () => {
  assert.ok(verifyPatchedZod(cliRequire('zod/package.json').version));
  assert.ok(zod.z.core, 'The root import must use the patched v4 implementation.');
  for (const version of ['3.25.76', '4.6.5', '5.0.0', '4.6.7-canary.1']) assert.equal(verifyPatchedZod(version), false);
  for (const version of ['4.6.6', '4.6.7']) assert.equal(verifyPatchedZod(version), true);
});

test('patched Zod rejects oversized arrays, sets and maps before walking malformed elements', () => {
  const { z } = zod;
  let elementsParsed = 0;
  const element = z.string().refine(() => { elementsParsed += 1; return true; });
  const array = new Proxy(new Array(1_000_000), {
    get(target, key, receiver) {
      if (typeof key === 'string' && /^\d+$/.test(key)) throw new Error('Oversized input walked before its bound');
      return Reflect.get(target, key, receiver);
    },
  });
  for (const schema of [z.array(element).max(100), z.array(element).length(100)]) {
    const result = schema.safeParse(array);
    assert.equal(result.success, false);
    assert.equal(result.error.issues.length, 1);
    assert.equal(result.error.issues[0].code, 'too_big');
  }
  const set = new Set(['a', 'b', 'c']);
  const map = new Map([['a', 'a'], ['b', 'b'], ['c', 'c']]);
  const refuseIteration = () => { throw new Error('Oversized collection iterated before its bound'); };
  for (const value of [set, map]) {
    value[Symbol.iterator] = refuseIteration;
    value.entries = refuseIteration;
    value.values = refuseIteration;
  }
  for (const [schema, value] of [[z.set(element).max(2), set], [z.map(element, element).size(2), map]]) {
    const result = schema.safeParse(value);
    assert.equal(result.success, false);
    assert.equal(result.error.issues.length, 1);
    assert.equal(result.error.issues[0].code, 'too_big');
  }
  assert.equal(elementsParsed, 0);
});

test('actual Expo plugin and output schemas retain valid and malformed-input behavior on Zod v4', () => {
  const { PluginSchema, DevToolsPluginOutputSchema } = loadCliSchema('DevToolsPlugin.schema.js', { bounded: true });
  const descriptor = PluginSchema.parse(plugin());
  assert.ok(Object.isFrozen(descriptor.cliExtensions.commands[0].environments));
  for (const input of [{}, { ...plugin(), packageName: '' }, { ...plugin(), cliExtensions: { ...plugin().cliExtensions, commands: [] } }]) assert.equal(PluginSchema.safeParse(input).success, false);
  assert.equal(DevToolsPluginOutputSchema.safeParse([
    { type: 'text', text: 'Ready', level: 'info' },
    { type: 'image', url: 'https://example.com/image.png' },
    { type: 'audio', url: 'https://example.com/audio.wav' },
  ]).success, true);
  assert.equal(DevToolsPluginOutputSchema.safeParse([{ type: 'image', url: 'invalid URL' }]).success, false);
  const { createMCPDevToolsExtensionSchema } = loadCliSchema('createMCPDevToolsExtensionSchema.js');
  const command = createMCPDevToolsExtensionSchema(descriptor);
  assert.deepEqual(command.parse({ command: 'inspect', query: 'status', limit: 5, confirm: true }), { command: 'inspect', query: 'status', limit: 5, confirm: true });
  for (const input of [{ command: 'absent' }, { command: 'inspect', extra: true }, { command: 'inspect', limit: '5' }]) assert.equal(command.safeParse(input).success, false);
  const jsonSchema = zod.z.toJSONSchema(command);
  assert.equal(jsonSchema.additionalProperties, false);
  assert.deepEqual(jsonSchema.required, ['command']);
});

test('Expo collection limits reject oversized plugin/output arrays without visiting attacker-controlled entries', () => {
  const { PluginSchema, DevToolsPluginOutputSchema } = loadCliSchema('DevToolsPlugin.schema.js', { bounded: true });
  const oversized = (max) => new Proxy(new Array(max + 1), {
    get(target, key, receiver) {
      if (typeof key === 'string' && /^\d+$/.test(key)) throw new Error('Oversized Expo collection walked before rejection');
      return Reflect.get(target, key, receiver);
    },
  });
  const command = plugin().cliExtensions.commands[0];
  for (const input of [
    { ...plugin(), cliExtensions: { ...plugin().cliExtensions, commands: oversized(LIMITS.commands) } },
    { ...plugin(), cliExtensions: { ...plugin().cliExtensions, commands: [{ ...command, parameters: oversized(LIMITS.parameters) }] } },
    { ...plugin(), cliExtensions: { ...plugin().cliExtensions, commands: [{ ...command, environments: oversized(LIMITS.environments) }] } },
  ]) {
    const result = PluginSchema.safeParse(input);
    assert.equal(result.success, false);
    assert.equal(result.error.issues.length, 1);
    assert.equal(result.error.issues[0].code, 'too_big');
  }
  const output = DevToolsPluginOutputSchema.safeParse(oversized(LIMITS.outputLines));
  assert.equal(output.success, false);
  assert.equal(output.error.issues.length, 1);
  assert.equal(output.error.issues[0].code, 'too_big');
});

test('the Expo security patch is idempotent and rejects unexpected upstream schema changes', () => {
  const source = fs.readFileSync(path.join(schemaDirectory, 'DevToolsPlugin.schema.js'), 'utf8');
  const patched = patchExpoDevToolsSchema(source);
  assert.equal(patchExpoDevToolsSchema(patched), patched);
  assert.throws(() => patchExpoDevToolsSchema('unexpected schema'), /schemas changed/);
});

test('the installed Expo schema has the reviewed collection bounds applied', () => {
  const source = fs.readFileSync(path.join(schemaDirectory, 'DevToolsPlugin.schema.js'), 'utf8');
  assert.equal(source, patchExpoDevToolsSchema(source), 'Run the reviewed postinstall patch after installing the scoped Zod override.');
});
