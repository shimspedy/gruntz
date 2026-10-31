const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Render the actual components and invoke their handlers; only native surfaces,
// animation clocks, and store boundaries are replaced. No device data is used.
function harness(extra = {}) {
  const slots = [];
  let cursor = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children: children.flat() } }),
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) { return react.useState(() => ({ current: initial }))[0]; },
    useEffect() {},
    useMemo: fn => fn(),
    useCallback: fn => fn,
  };
  const chain = new Proxy({}, { get: () => () => chain });
  const animation = {
    default: { View: 'AnimatedView' }, FadeIn: chain, FadeOut: chain, FadeInDown: chain,
    useSharedValue: initial => react.useRef({ get: () => initial, set() {} }).current,
    useAnimatedStyle: fn => fn(), useAnimatedScrollHandler: () => () => {}, interpolate: () => 1, interpolateColor: () => '#000',
    withTiming: value => value, withSpring: value => value, withDelay: (_delay, value) => value,
  };
  const tokens = {
    space: { xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, gutter: 20 },
    layout: { tabBarHeight: 58, pillBlock: 92, miniBar: 64 },
    motion: { stagger: 55, settle: {}, sheet: {} },
    color: {}, radius: { xl: 28 }, font: {},
  };
  const native = { View: 'View', ScrollView: 'ScrollView', TextInput: 'TextInput', Platform: { OS: 'ios' }, StyleSheet: { create: value => value, absoluteFill: {} } };
  // Components use the automatic JSX runtime (tsconfig `jsx: react-jsx`), so most no
  // longer import React. Route it to the same element shape createElement builds.
  const jsx = (type, { children, ...props } = {}, key) => react.createElement(type, key === undefined ? props : { ...props, key }, ...(children === undefined ? [] : [children]));
  const jsxRuntime = { jsx, jsxs: jsx, Fragment: react.Fragment };
  const mocks = {
    react, 'react/jsx-runtime': jsxRuntime, 'react-native': native,
    'react-native-reanimated': { __esModule: true, ...animation },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 28, bottom: 34, left: 0, right: 0 }) },
    '../ui/tokens': tokens, '../../ui/tokens': tokens,
    '../ui/Sheet': { Sheet: 'Sheet' },
    '../ui/Button': { Button: 'Button' },
    '../ui/Pressable': { Tap: 'Tap' }, '../../ui/Pressable': { Tap: 'Tap' },
    '../ui/Text': { Text: 'AppText' }, '../../ui/Text': { Text: 'AppText' },
    '../ui/haptics': { haptic: { selection() {}, success() {} } }, '../../ui/haptics': { haptic: { selection() {} } },
    '../ui/Toast': { toast() {} },
    ...extra,
  };
  function load(file, names = []) {
    const filename = path.join(__dirname, '..', file);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
      fileName: filename,
    }).outputText;
    const module = { exports: {} };
    const req = name => {
      if (name in mocks) return mocks[name];
      return new Proxy({}, { get: (_object, key) => key === '__esModule' ? false : String(key) });
    };
    new Function('require', 'module', 'exports', source + '\nObject.assign(exports, {' + names.join(',') + '});')(req, module, module.exports);
    return module.exports;
  }
  return { load, render: (Component, props = {}) => { cursor = 0; return Component(props); }, react, native, mocks };
}
function all(node, predicate) {
  if (!node || typeof node !== 'object') return [];
  return [ ...(predicate(node) ? [node] : []), ...(node.props?.children ?? []).flatMap(child => all(child, predicate)) ];
}
const find = (node, type) => all(node, child => child.type === type)[0];
const styles = node => Object.assign({}, ...[node.props.style].flat().filter(Boolean));

test('run tracker shows saved-draft recovery only for a failed draft read, preserving active and ended controls', () => {
  let snapshot = {
    ready: true, isTracking: false, isPaused: false, sessionId: null, activityType: 'run',
    distanceMiles: 0, durationMs: 0, paceMinPerMile: null, currentSpeedMph: null,
    steps: 0, elevationGainFt: 0, caloriesEstimate: 0, route: [],
    backgroundEnabled: false, stepsLimited: false, recoveryNotice: null,
    error: 'An error occurred.', savedDraftRecoveryRequired: false,
  };
  const user = { profile: { settings: { units: 'imperial' } }, recordTrackedSession() {} };
  const useUserStore = selector => selector(user); useUserStore.getState = () => user;
  const h = harness({
    '@react-navigation/native': { useNavigation: () => ({}), useRoute: () => ({ params: {} }) },
    '../hooks/useRunTracker': { useRunTracker: () => snapshot, DEFAULT_BODY_WEIGHT_LBS: 160 },
    '../store/useSubscriptionStore': { useTrainingAccess: () => true },
    '../store/useReadinessStore': { useReadinessStore: selector => selector({}) },
    '../store/useUserStore': { useUserStore },
  });
  const Component = h.load('src/screens/RunTrackerScreen.tsx').default;
  const titles = () => all(h.render(Component), node => node.type === 'Button').map(node => node.props.title);
  assert.ok(titles().includes('Start run'));
  assert.ok(!titles().includes('Retry saved activity'));
  assert.ok(!titles().includes('Discard saved activity'));
  snapshot = { ...snapshot, savedDraftRecoveryRequired: true };
  assert.ok(titles().includes('Retry saved activity'));
  assert.ok(titles().includes('Discard saved activity'));
  snapshot = { ...snapshot, savedDraftRecoveryRequired: false, error: null };
  assert.ok(!titles().includes('Retry saved activity'));
  assert.ok(!titles().includes('Discard saved activity'));
  snapshot = { ...snapshot, sessionId: 'real-draft', isTracking: true, isPaused: true, error: 'An error occurred.' };
  assert.ok(titles().includes('Resume')); assert.ok(titles().includes('End'));
  assert.ok(!titles().includes('Discard saved activity'));
  snapshot = { ...snapshot, isTracking: false };
  assert.ok(titles().includes('Save recovered activity'));
  assert.ok(!titles().includes('Retry saved activity'));
});

test('Create menu keeps every action scrollable and clears chrome after window-height changes', () => {
  let height = 678, pressed = null;
  const actions = Array.from({ length: 5 }, (_, i) => ({ title: `Action ${i}`, onPress: () => { pressed = i; } }));
  const ui = { createMenuOpen: true, setCreateMenu() {} };
  const h = harness({
    'react-native': { View: 'View', ScrollView: 'ScrollView', useWindowDimensions: () => ({ height }), StyleSheet: { create: value => value, absoluteFill: {} } },
    '../store/useUiStore': { useUiStore: selector => selector(ui) },
    './createActions': { useCreateActions: () => actions },
  });
  const { CreateMenu } = h.load('src/navigation/TabBar.tsx', ['CreateMenu']);
  for (height of [678, 440, 300, 820]) {
    const tree = h.render(CreateMenu, { bottom: 92 });
    const scroll = find(tree, 'ScrollView');
    assert.ok(scroll, 'The menu must scroll rather than crop its final action');
    assert.equal(scroll.props.children.length, 5);
    const card = all(tree, node => styles(node).maxHeight !== undefined)[0];
    assert.ok(styles(card).maxHeight <= height - 92 - 28 - 12, 'Menu must clear the top safe area and tab bar');
    scroll.props.children.at(-1).props.onPress();
    assert.equal(pressed, 4);
  }
});

test('onboarding tiles resize between folded, open and narrow containers without fixed-height text overlap', () => {
  let width = 382;
  const h = harness({ '../../ui/useContentSize': { useContentSize: () => ({ width, height: 678 }) } });
  const { GridTile } = h.load('src/screens/onboarding/parts.tsx');
  for (width of [382, 836, 280, 382]) {
    const tree = h.render(GridTile, { label: 'Dumbbells or bands at home', icon: 'home', selected: false, onPress() {} });
    const outer = styles(tree);
    const inner = width - 40;
    assert.equal(outer.flexBasis, inner >= 292 ? (inner - 12) / 2 : inner);
    assert.equal(outer.minWidth, 0);
    assert.equal(outer.flexShrink, 1);
    const card = all(tree, node => styles(node).minHeight === 150)[0];
    assert.equal(styles(card).height, undefined, 'Larger text must be able to grow the card');
    const icon = all(tree, node => styles(node).alignSelf === 'flex-end')[0];
    assert.equal(styles(icon).position, undefined, 'Icon must follow text instead of overlapping it');
  }
});

test('Keep editing after system dismissal reopens the profile sheet with the unsaved name', () => {
  let alert, closes = 0;
  const profile = { display_name: 'Saved name' };
  const h = harness({
    'react-native': { View: 'View', TextInput: 'TextInput', Alert: { alert: (...args) => { alert = args; } }, StyleSheet: { create: value => value } },
    '../store/useUserStore': { useUserStore: selector => selector({ profile, setProfile() { throw new Error('Unsaved name was written'); } }) },
  });
  const { EditNameSheet } = h.load('src/screens/ProfileScreen.tsx', ['EditNameSheet']);
  const props = { visible: true, onClose: () => { closes++; } };
  let tree = h.render(EditNameSheet, props);
  find(tree, 'TextInput').props.onChangeText('Unsaved draft');
  tree = h.render(EditNameSheet, props);
  tree.props.onClose();
  assert.equal(h.render(EditNameSheet, props).props.visible, false);
  alert[2].find(button => button.text === 'Keep editing').onPress();
  tree = h.render(EditNameSheet, props);
  assert.equal(tree.props.visible, true);
  assert.equal(find(tree, 'TextInput').props.value, 'Unsaved draft');
  assert.equal(closes, 0);
  tree.props.onClose();
  alert[2].find(button => button.text === 'Discard').onPress();
  assert.equal(closes, 1);
});

test('New workout from an exercise picker waits for sheet dismissal before pushing the editor', () => {
  const events = [];
  const exercise = { id: 'lib:air', media_key: 'air', category: 'strength', name: 'Air squat', muscle_groups: [], steps: [], form_tips: [], rest_seconds: 0, xp_value: 5 };
  const library = { key: 'air', group: 'bodyweight', difficulty: 'beginner', equipment: ['None'], pattern: ['Squat'], instructions: [], mistakes: [], benefits: [] };
  const routines = { routines: [{ id: 'saved', name: 'Saved workout', items: [] }], newDraft: keys => events.push(['draft', keys]) };
  const useRoutineStore = selector => selector(routines);
  useRoutineStore.getState = () => routines;
  const h = harness({
    '@react-navigation/native': { useNavigation: () => ({ navigate: name => events.push(['navigate', name]) }), useRoute: () => ({ params: { mediaKey: 'air' } }), useIsFocused: () => true },
    '../ui/useContentSize': { useContentSize: () => ({ width: 382, height: 678 }) },
    '../components/ExerciseProgress': { useExerciseSessions: () => [] },
    '../data/exercises': { getExerciseById: () => exercise, libraryExerciseId: key => 'lib:' + key, exerciseLogKey: value => value.id, exercises: [] },
    '../data/exerciseLibrary': { appMuscles: () => [], getLibraryItem: () => library },
    '../store/useRoutineStore': { useRoutineStore },
    '../store/useExerciseNotesStore': { useExerciseNotesStore: selector => selector({ notes: {} }) },
    '../store/useUserStore': { useUserStore: selector => selector({ profile: { settings: { units: 'imperial' } } }) },
    './ExerciseLibraryScreen': { GROUP_LABEL: { bodyweight: 'Bodyweight' } },
  });
  const Component = h.load('src/screens/ExerciseDetailScreen.tsx').default;
  let tree = h.render(Component);
  all(tree, node => node.type === 'Button' && node.props.title === 'Add to a workout')[0].props.onPress();
  tree = h.render(Component);
  const sheet = find(tree, 'Sheet');
  assert.equal(sheet.props.visible, true);
  all(sheet, node => node.props?.accessibilityLabel === 'New workout')[0].props.onPress();
  assert.deepEqual(events, [], 'No editor may be stacked over the closing picker');
  assert.equal(find(h.render(Component), 'Sheet').props.visible, false);
  sheet.props.onDismissed();
  assert.deepEqual(events, [['draft', ['air']], ['navigate', 'RoutineEditor']]);
  sheet.props.onDismissed();
  assert.equal(events.length, 2, 'A repeated callback must not create another draft');
});

test('restored detail routes without params reach recovery surfaces instead of crashing', () => {
  const { createLoader } = require('./workout-test-utils.cjs');
  const { getProgramWorkoutDay } = createLoader()('src/data/programWorkouts.ts');
  const state = {
    selectedProgram: 'basecamp', profile: null, testScores: {}, targetScores: {}, trainingChoice: null,
    progress: { claimed_missions: new Set() }, trialStartedAt: null, entitlementActive: false,
    active: false, workoutDayId: null, activePlanId: null, completedDayIds: [], cycle: 1,
    routines: [], notes: {}, leaderPrivacyDismissed: true, setLeaderPrivacyDismissed() {},
  };
  const store = selector => selector(state);
  const stores = Object.fromEntries(['useProgramStore', 'useSessionStore', 'useReadinessStore', 'useSubscriptionStore', 'useUserStore', 'usePlanLibraryStore', 'useRoutineStore', 'useExerciseNotesStore'].map(name => [`../store/${name}`, { [name]: store, useTrainingAccess: () => true }]));
  for (const screen of ['WorkoutDetail', 'ProgramDetail', 'LibraryPlanDetail', 'LibraryPlanDay', 'CardDetail', 'ExerciseDetail', 'RoutineDetail', 'Team']) {
    for (const params of [undefined, null, {}, { workoutId: null, dateKey: [] }]) {
      const h = harness({
        ...stores,
        '@react-navigation/native': { useNavigation: () => ({}), useRoute: () => ({ params }), useIsFocused: () => true, useFocusEffect() {} },
        '../store/useUiStore': { useChromePrefs: store },
        '../ui/useContentSize': { useContentSize: () => ({ width: 382, height: 678 }) },
        '../ui/Layout': { EmptyState: 'EmptyState', NavHeader: 'NavHeader' },
        '../components/ExerciseProgress': { useExerciseSessions: () => [] },
        '../data/exercises': { getExerciseById: () => undefined, libraryExerciseId: key => 'lib:' + key },
        '../data/programs': { getProgramById: () => undefined },
        '../data/programWorkouts': { getProgramWorkoutDay },
        '../data/workoutPlans': { getWorkoutPlan: () => undefined },
        '../data/movementCards': { getMovementCard: () => undefined },
        '../features/plan': { workoutExercises: () => [], muscleDistribution: () => [] },
        '../features/trainingFocus': { getTodaysTrainingChoice: () => 'normal' },
      });
      const Component = h.load(`src/screens/${screen}Screen.tsx`).default;
      const tree = h.render(Component);
      assert.ok(tree, screen);
      assert.ok(find(tree, 'NavHeader'), `${screen} must retain its Back recovery action`);
      if (screen !== 'Team') assert.ok(find(tree, 'EmptyState'), `${screen} must explain unavailable content`);
      else assert.ok(all(tree, node => node.type === 'AppText' && node.props.children.some(text => typeof text === 'string' && text.includes('no longer in this team'))).length);
    }
  }
});

test('cold-start public links retain Train underneath every non-tab destination', async () => {
  const { pathToFileURL } = require('node:url');
  const core = path.dirname(require.resolve('@react-navigation/core/package.json'));
  const { getStateFromPath } = await import(pathToFileURL(path.join(core, 'lib/module/getStateFromPath.js')).href);
  const file = path.join(__dirname, '../src/navigation/RootNavigator.tsx');
  const source = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let config;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'linking') {
      const entry = node.initializer.properties.find(property => property.name?.getText(ast) === 'config');
      const expression = ts.transpileModule('module.exports = ' + entry.initializer.getText(ast), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
      const module = { exports: {} }; new Function('module', expression)(module); config = module.exports;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(config);
  for (const [name, entry] of Object.entries(config.screens)) {
    if (name === 'Tabs') {
      for (const [tab, path] of Object.entries(entry.screens)) {
        const state = getStateFromPath(path, config);
        const tabs = state.routes.at(-1);
        assert.equal(tabs.name, 'Tabs');
        assert.equal(tabs.state.routes.at(-1).name, tab);
      }
      continue;
    }
    const url = entry.replace(/:([A-Za-z]+)/g, 'example-id');
    const state = getStateFromPath(url, config);
    assert.equal(state.routes[0].name, 'Tabs', name);
    assert.equal(state.routes.at(-1).name, name);
    assert.equal(state.index, 1, `${name} must be able to go Back to Tabs`);
  }
  const recap = getStateFromPath('weekly-debrief?weekStart=2026-10-19', config);
  assert.equal(recap.routes.at(-1).params.weekStart, '2026-10-19');
});
