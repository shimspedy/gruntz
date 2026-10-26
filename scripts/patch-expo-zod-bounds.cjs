const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

// GHSA-mrhx-c7xc-m3w5 is fixed by Zod >=4.6.6 for bounded collections.
// Expo 57's two Zod consumers use APIs shared by v3/v4, but its plugin arrays
// are unbounded. Keep their valid descriptor/output shapes and add explicit
// development-tool limits so hostile collections reject before element parsing.
const LIMITS = Object.freeze({ environments: 2, parameters: 100, commands: 100, outputLines: 1000 });

function patchExpoDevToolsSchema(source) {
  const changes = [
    ["        'mcp'\n    ])).readonly(),", `        'mcp'\n    ])).max(${LIMITS.environments}).readonly(),`],
    ['parameters: _zod().z.array(CommandParameterSchema).optional()', `parameters: _zod().z.array(CommandParameterSchema).max(${LIMITS.parameters}).optional()`],
    ['commands: _zod().z.array(CommandSchema).min(1)', `commands: _zod().z.array(CommandSchema).min(1).max(${LIMITS.commands})`],
    ['const DevToolsPluginOutputSchema = _zod().z.array(DevToolsPluginOutputLinesSchema);', `const DevToolsPluginOutputSchema = _zod().z.array(DevToolsPluginOutputLinesSchema).max(${LIMITS.outputLines});`],
  ];
  for (const [before, after] of changes) {
    if (source.includes(after)) continue;
    if (source.split(before).length !== 2) {
      throw new Error('Expo DevTools schemas changed; review the Zod collection security patch before installing.');
    }
    source = source.replace(before, after);
  }
  return source;
}

function verifyPatchedZod(version) {
  const parts = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return !!parts && Number(parts[1]) === 4 && (Number(parts[2]) > 6 || (Number(parts[2]) === 6 && Number(parts[3]) >= 6));
}

if (require.main === module) {
  const cliPackage = require.resolve('@expo/cli/package.json');
  const cliRequire = createRequire(cliPackage);
  if (!verifyPatchedZod(cliRequire('zod/package.json').version)) {
    throw new Error('Expo CLI must resolve the reviewed patched Zod 4 release before applying collection bounds.');
  }
  const schemaFile = path.join(path.dirname(cliPackage), 'build/src/start/server/DevToolsPlugin.schema.js');
  const source = fs.readFileSync(schemaFile, 'utf8');
  const patched = patchExpoDevToolsSchema(source);
  if (patched !== source) {
    fs.writeFileSync(schemaFile, patched);
    console.log('Applied bounded Expo DevTools schemas for patched Zod.');
  }
}

module.exports = { LIMITS, patchExpoDevToolsSchema, verifyPatchedZod };
