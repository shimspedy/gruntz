const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

// Runs actual TypeScript modules, replacing only native boundaries with deterministic
// fakes. Each loader has its own module cache so stores cannot leak across tests.
function createLoader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
      fileName: file,
    }).outputText;
    const localRequire = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (!name.startsWith('.')) return require(name);
      const resolved = path.resolve(path.dirname(file), name);
      if (resolved.endsWith('.json')) return JSON.parse(fs.readFileSync(resolved, 'utf8'));
      return load(fs.existsSync(resolved) ? resolved : `${resolved}.ts`);
    };
    new Function('require', 'module', 'exports', '__DEV__', source)(localRequire, module, module.exports, false);
    return module.exports;
  }
  return load;
}

function createWorkoutEnv() {
  let user = { profile: { settings: { units: 'imperial' } } };
  const storage = { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} };
  const load = createLoader({
    '@react-native-async-storage/async-storage': storage,
    'react-native': { AppState: { addEventListener: () => ({ remove() {} }) } },
    '../services/notifications': { cancelRestDone: async () => {} },
    './useUserStore': { useUserStore: { getState: () => user } },
  });
  const { useSessionStore, isExerciseDone } = load('src/store/useSessionStore.ts');
  const { useExerciseLogStore } = load('src/store/useExerciseLogStore.ts');
  const { usePlanLibraryStore } = load('src/store/usePlanLibraryStore.ts');
  const data = load('src/data/exercises.ts');
  return {
    load, session: useSessionStore, log: useExerciseLogStore, plans: usePlanLibraryStore, isExerciseDone, ...data,
    setUnits(units) { user.profile.settings.units = units; },
    day(ids = ['bench_press']) {
      return { id: 'test-day', title: 'Test', estimated_duration: 25, rewards: { xp: 50 }, sections: [{ id: 'main', title: 'Main', exercises: ids }] };
    },
  };
}
module.exports = { createLoader, createWorkoutEnv };
