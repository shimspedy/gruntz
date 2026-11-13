const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');

const load = createLoader();
const key = (date) => load('src/utils/dateKey.ts').getLocalDateKey(date);
const daysAgo = (n, from = new Date()) => new Date(from.getFullYear(), from.getMonth(), from.getDate() - n, 12);

test('a six-day schedule keeps its streak across its one rest day; seven days stays strict', () => {
  const xp = load('src/utils/xp.ts');
  assert.equal(xp.streakGraceDays(7), 1);
  assert.equal(xp.streakGraceDays(6), 2);
  assert.equal(xp.streakGraceDays(5), 3);
  assert.equal(xp.streakGraceDays(3), 4);
  assert.equal(xp.streakGraceDays(null), 1);
  // Saturday's workout, checked on Monday: one rest day between them.
  assert.equal(xp.isStreakAlive(key(daysAgo(2)), 6), true);
  assert.equal(xp.isStreakAlive(key(daysAgo(3)), 6), false);
  assert.equal(xp.isStreakAlive(key(daysAgo(-1)), 6), false, 'a future date never holds a streak');
});

test('level progress stays inside 0..1 for bad or extreme XP', () => {
  const xp = load('src/utils/xp.ts');
  for (const value of [-5, Number.NaN, Number.POSITIVE_INFINITY, 0, 799, 800, 1e12]) {
    const { progress } = xp.getXPToNextLevel(value);
    assert.ok(progress >= 0 && progress <= 1, `progress for ${value} was ${progress}`);
  }
});

test('impossible calendar dates are not date keys', () => {
  const { parseLocalDateKey } = load('src/utils/dateKey.ts');
  assert.equal(parseLocalDateKey('2026-02-31'), null);
  assert.equal(parseLocalDateKey('2026-13-45'), null);
  assert.equal(parseLocalDateKey('not-a-date'), null);
  assert.equal(key(parseLocalDateKey('2028-02-29')), '2028-02-29');
});

test('a Raider week with no Thursday session rests on Thursday instead of repeating Monday', () => {
  const programs = load('src/data/programWorkouts.ts');
  const thursday = new Date(2026, 10, 12, 12);
  assert.equal(thursday.getDay(), 4);
  for (const week of [6, 8, 10]) assert.equal(programs.getProgramWorkoutForDate('raider', week, thursday), null, `week ${week}`);
  assert.ok(programs.getProgramWorkoutForDate('raider', 1, thursday), 'a week that programs Thursday still has it');
  const monday = new Date(2026, 10, 9, 12);
  const tuesday = new Date(2026, 10, 10, 12);
  const next = programs.getNextProgramWorkout('raider', 6, tuesday);
  assert.notEqual(next?.id, programs.getProgramWorkoutForDate('raider', 6, monday)?.id, 'the next session is not Monday again');
});

test('this morning\'s workout and check-in count before noon', () => {
  const skills = createLoader({ '../store/useReadinessStore': { calculateDailyReadiness: () => 80 } })('src/features/skills.ts');
  const morning = new Date(2026, 10, 12, 9);
  const today = key(morning);
  assert.equal(skills.recoveryScore([{ date: today }], morning), 80);
  assert.equal(skills.consistencyScore({ workoutDates: new Set([today]), daysPerWeek: 1, now: morning }), 25);
  // The far edge is a whole day too, at any hour.
  const edge = key(daysAgo(28, morning));
  const outside = key(daysAgo(29, morning));
  for (const hour of [9, 13]) {
    const at = new Date(2026, 10, 12, hour);
    assert.equal(skills.recoveryScore([{ date: edge }], at), 80);
    assert.equal(skills.recoveryScore([{ date: outside }], at), null);
  }
  assert.equal(skills.recoveryScore([{ date: key(daysAgo(-1, morning)) }], morning), null, 'tomorrow is not history');
});

test('challenge streaks ignore future dates and timed holds are not counted as reps', () => {
  const stats = load('src/utils/challengeStats.ts');
  const future = [3, 2, 1].map((n) => key(daysAgo(-n)));
  assert.equal(stats.summarizeChallengeHistory(future).challengeStreakDays, 0);
  assert.equal(stats.summarizeChallengeHistory([key(daysAgo(0)), key(daysAgo(1))]).challengeStreakDays, 2);
  assert.equal(stats.getTrackedChallengeExerciseId('plank_5min'), null);
  assert.equal(stats.getTrackedChallengeExerciseId('pushup_100'), 'pushups');
});

test('a scaled distance challenge reads "1 mile", not "1 miles"', () => {
  const challenges = load('src/data/dailyChallenges.ts');
  const seen = new Map();
  for (let day = 0; day < 400 && seen.size < 40; day += 1) {
    const template = challenges.getChallengeTemplateForDate(new Date(2026, 0, 1 + day, 12));
    seen.set(template.id, template);
  }
  const distance = [...seen.values()].filter((t) => /\{(mi|km)\}/.test(t.description));
  assert.ok(distance.length > 0, 'the rotation includes a distance challenge');
  for (const template of distance) {
    for (const scale of [0.2, 0.3, 0.5, 1]) {
      const text = challenges.scaleChallenge(template, scale).description;
      assert.doesNotMatch(text, /\b1 (miles|kilometers)\b/, `${template.id} at ${scale}: ${text}`);
      assert.doesNotMatch(text, /\{/, `${template.id} left a token in: ${text}`);
    }
  }
});

test('the plan counter matches the plans that ship', () => {
  const plans = load('src/data/workoutPlans.ts');
  assert.equal(plans.PLAN_COUNT, plans.allPlans().length);
});

test('cards that need a pool or a ruck are never recommended to an athlete without one', () => {
  const { movementCards } = load('src/data/movementCards.ts');
  const { getTopRecommendations } = load('src/utils/recommendations.ts');
  const gated = new Set(movementCards.filter((card) => card.category === 'swim' || card.category === 'ruck').map((card) => card.id));
  for (const workouts of [0, 30]) {
    const progress = { workouts_completed: workouts, exercises_completed: {} };
    const top = getTopRecommendations(progress, movementCards.length, { has_pool_access: false, has_ruck_access: false });
    const firstGated = top.findIndex((rec) => gated.has(rec.card_id));
    assert.ok(top.slice(firstGated).every((rec) => gated.has(rec.card_id) || rec.confidence === 0), 'gated cards sort behind every scored card');
    for (const rec of top.filter((r) => gated.has(r.card_id))) assert.equal(rec.confidence, 0);
  }
});

test('re-importing an export does not duplicate a session whose time lost its milliseconds', () => {
  const { mergeLogs } = createLoader({
    'react-native': { Platform: { OS: 'ios' } },
    '@react-native-async-storage/async-storage': {}, zustand: { create: () => () => ({}) },
    'zustand/middleware': { createJSONStorage: () => ({}), persist: (initializer) => initializer },
  })('src/store/useExerciseLogStore.ts');
  const sets = [{ reps: 5, weight: 225 }];
  const logged = { bench: [{ id: '1762941605123:bench', at: '2026-11-12T10:00:05.123Z', workoutTitle: 'Push', unit: 'lb', sets }] };
  const exported = { bench: [{ id: 'strong:abc', at: '2026-11-12T10:00:05.000Z', workoutTitle: 'Push', unit: 'lb', sets, source: 'strong:abc' }] };
  const merged = mergeLogs(logged, exported);
  assert.equal(merged.logs.bench.length, 1);
  assert.equal(merged.report.entries, 0);
  const later = { bench: [{ ...exported.bench[0], id: 'strong:def', source: 'strong:def', at: '2026-11-12T10:00:06.000Z' }] };
  assert.equal(mergeLogs(logged, later).logs.bench.length, 2, 'a different second is a different session');
});

test('a full page of new chat lines restarts the list; a deleted line inside the page goes away', () => {
  const chat = createLoader({
    './supabaseClient': { getSupabase: () => null },
    './teams': { localTeamStatus: () => ({}) },
  })('src/services/teamChat.ts');
  const line = (n) => ({ id: `m${String(n).padStart(4, '0')}`, teamId: 't', userId: 'u', displayName: 'A', body: String(n), createdAt: new Date(Date.UTC(2026, 10, 12, 0, 0, n)).toISOString(), isMe: false });
  const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => line(from + i));

  const gap = chat.reconcileLatestPage(range(1, 10), range(101, 160));
  assert.equal(gap.restarted, true);
  assert.equal(gap.messages.length, 60);
  assert.equal(gap.messages[0].id, 'm0101');

  const overlap = chat.reconcileLatestPage(range(1, 70), range(21, 80));
  assert.equal(overlap.restarted, false);
  assert.equal(overlap.messages.length, 80, 'lines older than a full page are kept');

  const deleted = chat.reconcileLatestPage(range(1, 5), [line(1), line(2), line(4), line(5)]);
  assert.deepEqual(deleted.messages.map((m) => m.id), ['m0001', 'm0002', 'm0004', 'm0005']);

  const arriving = chat.reconcileLatestPage([...range(1, 3), line(9)], range(1, 3));
  assert.equal(arriving.messages.at(-1).id, 'm0009', 'a line newer than the page (just delivered live) survives');
  assert.deepEqual(chat.reconcileLatestPage(range(1, 3), []).messages.length, 3, 'an empty answer changes nothing');
});

test('a typed treadmill distance replaces the step estimate; blank, unreadable or matching input changes nothing', () => {
  const { correctedIndoorWalk, MAX_INDOOR_MILES } = load('src/features/indoorWalk.ts');
  const recorded = { distanceMiles: 2, durationMs: 30 * 60000, caloriesEstimate: 200 };
  assert.deepEqual(correctedIndoorWalk(recorded, '', false, 180), {});
  assert.deepEqual(correctedIndoorWalk(recorded, 'abc', false, 180), {});
  assert.deepEqual(correctedIndoorWalk(recorded, '-1', false, 180), {});
  assert.deepEqual(correctedIndoorWalk(recorded, '2.00', false, 180), {});
  assert.deepEqual(correctedIndoorWalk(recorded, '2,5', false, 180), { distanceMiles: 2.5, paceMinPerMile: 12, caloriesEstimate: 250 });
  // Kilometres in, miles stored: the same conversion the screen displays with, so a
  // prefilled value that is not edited is not read back as a different distance.
  assert.deepEqual(correctedIndoorWalk(recorded, (2 * 1.609344).toFixed(2), true, 180), {});
  assert.equal(correctedIndoorWalk(recorded, '4.02', true, 180).distanceMiles, 2.5);
  assert.equal(correctedIndoorWalk(recorded, '5000', false, 180).distanceMiles, MAX_INDOOR_MILES);
  // No step estimate to scale from: calories fall back to body weight.
  assert.equal(correctedIndoorWalk({ ...recorded, distanceMiles: 0, caloriesEstimate: 0 }, '1.9', false, 190).caloriesEstimate, 190);
  assert.equal(correctedIndoorWalk(recorded, '0', false, 180).paceMinPerMile, null);
});

test('on Android the workout history moves out of AsyncStorage into files, and a reset removes those files', async () => {
  const KEY = '@gruntz_exercise_log';
  const saved = JSON.stringify({ state: { logs: { bench: [{ id: 'a', at: '2026-11-12T10:00:00.000Z', workoutTitle: 'Push', unit: 'lb', sets: [{ reps: 5, weight: 225 }] }] } }, version: 1 });
  const rows = new Map([[KEY, saved]]);
  const files = new Map();
  const androidLoad = createLoader({
    'react-native': { Platform: { OS: 'android' } },
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => rows.get(key) ?? null,
      setItem: async (key, value) => { rows.set(key, value); },
      removeItem: async (key) => { rows.delete(key); },
    },
    'expo-file-system/legacy': {
      documentDirectory: 'file:///documents/',
      getInfoAsync: async (path) => ({ exists: files.has(path) }),
      readAsStringAsync: async (path) => files.get(path),
      writeAsStringAsync: async (path, value) => { files.set(path, value); },
      deleteAsync: async (path) => { files.delete(path); },
    },
  });
  const { exerciseLogStorage } = androidLoad('src/store/exerciseLogStorage.ts');
  assert.equal(await exerciseLogStorage.getItem(KEY), saved, 'history written by an older build is still read');
  assert.equal(rows.has(KEY), false, 'and leaves the size-limited row once it is safely in a file');
  assert.deepEqual([...files.keys()], ['file:///documents/gruntz-exercise-log-0.json']);

  const next = saved.replace('"reps":5', '"reps":6');
  await exerciseLogStorage.setItem(KEY, next);
  assert.equal(await exerciseLogStorage.getItem(KEY), next);
  assert.equal(rows.has(KEY), false);
  await assert.rejects(exerciseLogStorage.setItem(KEY, '{"not":"a store"}'), /Workout history is not a complete store payload/);
  assert.equal(await exerciseLogStorage.getItem(KEY), next, 'a refused write leaves the saved history alone');

  await exerciseLogStorage.removeItem(KEY);
  assert.equal(files.size, 0);
  assert.equal(await exerciseLogStorage.getItem(KEY), null);

  // iOS keeps AsyncStorage itself, so nothing changes there.
  const ios = { marker: true };
  const iosStorage = createLoader({ 'react-native': { Platform: { OS: 'ios' } }, '@react-native-async-storage/async-storage': ios })('src/store/exerciseLogStorage.ts').exerciseLogStorage;
  assert.equal(iosStorage, ios);
});

test('a program decides its own training weekdays; a days-per-week count is only the fallback', () => {
  const days = load('src/utils/trainingDays.ts');
  assert.deepEqual(days.trainingWeekdays(5), [1, 2, 3, 5, 6]);
  assert.deepEqual(days.trainingWeekdays([6, 1, 4, 2, 5, 5]), [1, 2, 4, 5, 6], 'explicit weekdays are used as given, in order, once each');
  assert.deepEqual(days.trainingWeekdays([]), days.trainingWeekdays(null), 'an empty list falls back');
  assert.deepEqual(days.notificationWeekdays([1, 2, 4, 5, 6]), [2, 3, 5, 6, 7]);

  const schedule = createLoader({
    '../store/usePlanLibraryStore': { usePlanLibraryStore: { getState: () => ({ activePlanId: null }) } },
    '../store/useProgramStore': { useProgramStore: { getState: () => ({ selectedProgram: 'raider', currentWeek: 1 }) } },
    '../store/useUserStore': { useUserStore: { getState: () => ({ profile: { workout_days_per_week: 5 } }) } },
  })('src/features/trainingSchedule.ts');
  const profile = { workout_days_per_week: 5 };
  // Raider rests Wednesday and Sunday: no reminder on Wednesday, and one on Thursday.
  assert.deepEqual(schedule.programWeekdays('raider', 1, profile), [1, 2, 4, 5, 6]);
  assert.deepEqual(schedule.programWeekdays('raider', 6, profile), [1, 2, 5, 6], 'a week that rests Thursday says so');
  assert.deepEqual(schedule.currentSchedule(), [1, 2, 4, 5, 6]);
  assert.equal(schedule.scheduleFor({ program: 'raider', week: 1, profile, onLibraryPlan: true }), 5, 'a library plan has no fixed calendar');
  assert.equal(schedule.scheduleFor({ program: null, week: 1, profile, onLibraryPlan: false }), 5);

  const retention = load('src/features/retention.ts');
  const tuesdayEvening = new Date(2026, 10, 10, 20);
  const next = retention.nextTrainingDay(schedule.currentSchedule(), ['2026-11-10'], tuesdayEvening);
  assert.equal(next.dateKey, '2026-11-12', 'after Tuesday the next Raider day is Thursday, not Wednesday');
});

test('a run time must be entered as minutes:seconds; short timed events still take plain seconds', () => {
  const entry = load('src/features/testScoreEntry.ts');
  assert.equal(entry.parseTestScoreValue('15', 'seconds', 900), null);
  assert.equal(entry.parseTestScoreValue('15:30', 'seconds', 900), 930);
  assert.equal(entry.parseTestScoreValue('90', 'seconds', 180), 90);
  assert.equal(entry.parseTestScoreValue('1:30', 'seconds', 180), 90);
  assert.equal(entry.parseTestScoreValue('42', 'reps', 60), 42);
  const run = { id: 'two_mile', shortName: '2-Mile', unit: 'seconds', target: 900 };
  assert.match(entry.prepareTestScoreEntry([run], { two_mile: { current: '15', target: '' } }).error, /2-Mile as minutes:seconds/);
  assert.deepEqual(entry.prepareTestScoreEntry([run], { two_mile: { current: '15:30', target: '' } }).scores, { two_mile: 930 });
});

test('an import reports sets the caps dropped, and never counts a duplicate as dropped', () => {
  const { mergeLogs, MAX_ENTRIES_PER_EXERCISE } = createLoader({
    'react-native': { Platform: { OS: 'ios' } },
    '@react-native-async-storage/async-storage': {}, zustand: { create: () => () => ({}) },
    'zustand/middleware': { createJSONStorage: () => ({}), persist: (initializer) => initializer },
  })('src/store/useExerciseLogStore.ts');
  const entry = (n) => ({ id: `strong:${n}`, source: `strong:${n}`, at: new Date(Date.UTC(2020, 0, 1) + n * 86400000).toISOString(), workoutTitle: 'Push', unit: 'lb', sets: [{ reps: 5, weight: 100 + n }, { reps: 5, weight: 100 + n }] });
  const file = { bench: Array.from({ length: 10 }, (_, n) => entry(n)) };
  const first = mergeLogs({}, file);
  assert.deepEqual([first.report.entries, first.report.sets, first.report.droppedSets], [10, 20, 0]);
  const again = mergeLogs(first.logs, file);
  assert.deepEqual([again.report.entries, again.report.sets, again.report.droppedSets], [0, 0, 0], 'the same file again adds nothing and drops nothing');
  const big = { bench: Array.from({ length: MAX_ENTRIES_PER_EXERCISE + 5 }, (_, n) => entry(n + 100)) };
  const capped = mergeLogs({}, big);
  assert.equal(capped.report.entries, MAX_ENTRIES_PER_EXERCISE);
  assert.equal(capped.report.droppedSets, 10, 'five entries of two sets did not fit');
});

test('a finished workout posts to private teams only when switched on, as one plain chat line', async () => {
  const { workoutAnnouncement } = load('src/features/teamPost.ts');
  assert.equal(workoutAnnouncement({ title: 'Back & Biceps', minutes: 42, sets: 12, personalRecords: 2 }), 'Finished Back & Biceps · 42 min · 12 sets · 2 records');
  assert.equal(workoutAnnouncement({ title: '  Push   day ', minutes: 0, sets: 1, personalRecords: 0 }), 'Finished Push day · 1 set');
  assert.equal(workoutAnnouncement({ title: 'Push day', minutes: 30, sets: 0, personalRecords: 0 }), null, 'nothing logged, nothing to post');
  assert.equal(workoutAnnouncement({ title: '   ', minutes: 30, sets: 3, personalRecords: 0 }), null);
  assert.ok(workoutAnnouncement({ title: 'x'.repeat(500), minutes: 30, sets: 3, personalRecords: 0 }).length < 120);

  const sent = [];
  const prefs = { shareWorkoutsWithTeams: false };
  const teams = [{ id: 'platoon', isPublic: false }, { id: 'community', isPublic: true }, { id: 'squad', isPublic: false }];
  const rows = { insert: (row) => { sent.push(row); return { select: () => ({ single: async () => ({ data: { id: `m${sent.length}`, team_id: row.team_id, user_id: 'me', display_name: 'Alex', body: row.body, created_at: new Date().toISOString() }, error: null }) }) }; } };
  const chat = createLoader({
    './supabaseClient': { getSupabase: () => ({ auth: { getSession: async () => ({ data: { session: { user: { id: 'me' } } } }) }, from: () => rows }) },
    './teams': { localTeamStatus: () => ({ displayName: 'Alex' }), fetchMyTeams: async () => ({ ok: true, value: teams }) },
    '../store/useReadinessStore': { useReadinessStore: { getState: () => prefs } },
  })('src/services/teamWorkoutPost.ts');
  const workout = { title: 'Back & Biceps', minutes: 42, sets: 12, personalRecords: 0 };

  assert.equal(await chat.announceWorkout(workout), 0);
  assert.equal(sent.length, 0, 'off by default: nothing leaves the phone');

  prefs.shareWorkoutsWithTeams = true;
  assert.equal(await chat.announceWorkout(workout), 2);
  assert.deepEqual(sent.map((row) => row.team_id), ['platoon', 'squad'], 'public communities are skipped');
  assert.ok(sent.every((row) => row.body === 'Finished Back & Biceps · 42 min · 12 sets' && row.user_id === 'me'));
});

test('plan popularity only breaks ties between plans that already fit, and built-in programs get their own id', () => {
  const { createLoader } = require('./workout-test-utils.cjs');
  const { popularityBonus } = createLoader({ '../data/workoutPlans': { allPlans: () => [], planExercises: () => ({}) } })('src/features/planRecommend.ts');
  assert.equal(popularityBonus(undefined), 0);
  assert.equal(popularityBonus(2), 0, 'fewer than three followers is never shown or counted');
  assert.ok(popularityBonus(10) > 0 && popularityBonus(10) < popularityBonus(100));
  assert.equal(popularityBonus(1_000_000), 1, 'a crowd cannot outweigh a goal match (three points)');

  const noop = { subscribe() {}, getState: () => ({}) };
  const { followedPlanId } = createLoader({
    '../store/usePlanLibraryStore': { usePlanLibraryStore: noop }, '../store/useProgramStore': { useProgramStore: noop },
    './athletes': {}, './planFollows': {}, './supabaseClient': {}, './teamPush': {},
  })('src/services/socialStartup.ts');
  assert.equal(followedPlanId('5-day-split', 'recon'), '5-day-split');
  assert.equal(followedPlanId(null, 'recon'), 'program-recon');
  assert.equal(followedPlanId(null, null), null);
});

test('feed: a reaction moves between emoji without double counting, and menu outcomes update the list', () => {
  const { createLoader } = require('./workout-test-utils.cjs');
  const { withReaction, applyPostChange } = createLoader({
    'react-native': { ActionSheetIOS: {}, Alert: {}, Platform: { OS: 'ios' } },
    '../services/athletes': {}, '../services/feed': { FEED_FAILURE: {} }, '../ui/haptics': { haptic: {} }, '../ui/Toast': { toast() {} },
  })('src/hooks/usePostActions.ts');
  const post = { id: 'p1', userId: 'a', reactions: { fire: 2 }, myReaction: null, isFollowing: false };
  const fired = withReaction(post, 'fire');
  assert.deepEqual([fired.reactions.fire, fired.myReaction], [3, 'fire']);
  const switched = withReaction(fired, 'strong');
  assert.deepEqual([switched.reactions.fire, switched.reactions.strong, switched.myReaction], [2, 1, 'strong']);
  const cleared = withReaction(switched, null);
  assert.deepEqual([cleared.reactions.fire, cleared.reactions.strong, cleared.myReaction], [2, 0, null]);
  assert.equal(post.reactions.fire, 2, 'the post on screen is not mutated');

  const posts = [post, { id: 'p2', userId: 'b', reactions: {}, myReaction: null, isFollowing: false }, { id: 'p3', userId: 'a', reactions: {}, myReaction: null, isFollowing: false }];
  assert.deepEqual(applyPostChange(posts, { kind: 'removed', post }).map((p) => p.id), ['p2', 'p3']);
  assert.deepEqual(applyPostChange(posts, { kind: 'author-removed', userId: 'a' }).map((p) => p.id), ['p2'], 'blocking removes every post by that athlete');
  assert.deepEqual(applyPostChange(posts, { kind: 'following', userId: 'a', on: true }).map((p) => p.isFollowing), [true, false, true]);
});

test('feed: only a workout finished in the last 18 hours is offered for sharing, with bounded numbers', async () => {
  const { createLoader } = require('./workout-test-utils.cjs');
  const disk = new Map();
  const { rememberWorkout, recentWorkout } = createLoader({
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async (k) => disk.get(k) ?? null, setItem: async (k, v) => { disk.set(k, v); } } },
    './supabaseClient': { getSupabase: () => null },
  })('src/services/feed.ts');
  assert.equal(await recentWorkout(), null);
  await rememberWorkout({ title: '  Lower Body  ', minutes: 42.4, sets: 99999, records: -3 });
  assert.deepEqual(await recentWorkout(), { title: 'Lower Body', minutes: 42, sets: 1000, records: 0 });
  disk.set('@gruntz_last_workout', JSON.stringify({ title: 'Old', minutes: 1, sets: 1, records: 0, at: Date.now() - 19 * 60 * 60 * 1000 }));
  assert.equal(await recentWorkout(), null, 'yesterday\'s session is not today\'s post');
  disk.set('@gruntz_last_workout', JSON.stringify({ title: 'Future', at: Date.now() + 60000 }));
  assert.equal(await recentWorkout(), null);
  disk.set('@gruntz_last_workout', '{not json');
  assert.equal(await recentWorkout(), null);
});

test('feed: nothing fetched for one account stays on the phone after it leaves (audit run-9)', async () => {
  const { createLoader } = require('./workout-test-utils.cjs');
  const disk = new Map();
  let cleared = 0;
  const feed = createLoader({
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async (k) => disk.get(k) ?? null, setItem: async (k, v) => { disk.set(k, v); }, removeItem: async (k) => { disk.delete(k); } } },
    './supabaseClient': { getSupabase: () => null },
    'expo-image': { Image: { clearMemoryCache: async () => { cleared += 1; }, clearDiskCache: async () => { cleared += 1; } } },
  })('src/services/feed.ts');
  feed.cachePosts([{ id: 'p1', body: 'followers only' }, { id: 'p2', body: 'another' }]);
  await feed.rememberWorkout({ title: 'Lower Body', minutes: 40, sets: 12, records: 1 });
  assert.equal(feed.cachedPost('p1').body, 'followers only');
  assert.ok(await feed.recentWorkout());
  const stamp = feed.feedChangeStamp();

  await feed.clearFeedState();
  assert.equal(feed.cachedPost('p1'), undefined);
  assert.equal(feed.cachedPost('p2'), undefined);
  assert.equal(await feed.recentWorkout(), null, 'the next account is not offered the previous one\'s workout');
  assert.equal(cleared, 2, 'downloaded pictures are dropped from memory and disk');
  assert.notEqual(feed.feedChangeStamp(), stamp, 'open feed screens know to reload');
});

test('feed: posting and commenting need the community rules accepted once per account', async () => {
  const { createLoader } = require('./workout-test-utils.cjs');
  const disk = new Map();
  let user = 'athlete-a';
  let answer = 'I agree';
  let asked = 0;
  const { ensureFeedRulesAccepted } = createLoader({
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async (k) => disk.get(k) ?? null, setItem: async (k, v) => { disk.set(k, v); } } },
    'react-native': { Alert: { alert: (_t, _m, buttons) => { asked += 1; buttons.find((b) => b.text === answer).onPress(); } } },
    '../utils/externalLinks': { openExternalUrl: async () => undefined },
    './supabaseClient': { getSupabase: () => ({ auth: { getSession: async () => ({ data: { session: user ? { user: { id: user } } : null } }) } }) },
  })('src/services/feedRules.ts');
  answer = 'Cancel';
  assert.equal(await ensureFeedRulesAccepted(), false, 'declining blocks the post');
  answer = 'I agree';
  assert.equal(await ensureFeedRulesAccepted(), true);
  assert.equal(await ensureFeedRulesAccepted(), true);
  assert.equal(asked, 2, 'asked until agreed, then never again for that account');
  user = 'athlete-b';
  assert.equal(await ensureFeedRulesAccepted(), true);
  assert.equal(asked, 3, 'another account on the phone agrees for itself');
  user = null;
  assert.equal(await ensureFeedRulesAccepted(), false, 'signed out cannot post');
});
