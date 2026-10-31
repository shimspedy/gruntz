// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const nodeGlobals = Object.fromEntries(
  ['__dirname', '__filename', 'Buffer', 'console', 'exports', 'global', 'module', 'process', 'require']
    .map(name => [name, 'readonly']),
);

module.exports = defineConfig([
  expoConfig,
  {
    // React Compiler readiness rules. The app does not use the compiler yet, so these
    // report as warnings; real hook and import errors still fail lint.
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
  {
    // Node-only tooling: tests, build scripts and config files.
    files: ['tests/**', 'scripts/**', '**/*.cjs', '*.config.js'],
    languageOptions: { globals: nodeGlobals },
  },
  {
    ignores: [
      'website/*',
      'vendor/*',
      'node_modules/*',
      'ios/*',
      'android/*',
      'assets/*',
      'marketing/*',
      'scripts/data/*',
      'dist/*',
      'web-build/*',
      '.expo/*',
      '.claude/*',
      'ai-proxy/node_modules/*',
      // Deno edge functions resolve jsr:/npm: specifiers that Node tooling cannot.
      'supabase/functions/*',
    ],
  },
]);
