import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import { branchDefaultTest, militaryTests } from '../../data/militaryTests';
import { DEV_UNLOCK } from '../../config/monetization';
import { getProgramById } from '../../data/programs';
import { recommendProgramForProfile } from '../../services/adaptiveCoach';
import { requestNotificationPermission, scheduleDailyReminder, scheduleWeeklyRecap, setupNotificationChannels } from '../../services/notifications';
import { useProgramStore } from '../../store/useProgramStore';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { useUserStore } from '../../store/useUserStore';
import type { FitnessTestType, ServiceBranch, ServiceStatus, UserProfile } from '../../types';
import { Button } from '../../ui/Button';
import { Icon, type IconName } from '../../ui/Icon';
import { KeyboardLift } from '../../ui/KeyboardAware';
import { Bar } from '../../ui/Progress';
import { Tap } from '../../ui/Pressable';
import { Segmented } from '../../ui/Segmented';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { color, font, motion, radius, space } from '../../ui/tokens';
import { Commit, Generating, NotifyPrime, PlanReady } from './Finale';
import { GridTile, OptionRow, Question, Ruler, onboardingStyles as os } from './parts';
import { Story, STORY_BG } from './Story';
import { Welcome } from './Welcome';

type Step =
  | 'welcome'
  | 'goals'
  | 'level'
  | 'story1'
  | 'branch'
  | 'status'
  | 'testChoice'
  | 'testDate'
  | 'story2'
  | 'days'
  | 'minutes'
  | 'equipment'
  | 'guardrails'
  | 'age'
  | 'intensity'
  | 'name'
  | 'notify'
  | 'generating'
  | 'ready'
  | 'commit';

const GOALS: { label: string; icon: IconName }[] = [
  { label: 'Military Prep', icon: 'flag' },
  { label: 'Get Stronger', icon: 'strength' },
  { label: 'Improve Endurance', icon: 'run' },
  { label: 'Lose Fat', icon: 'flame' },
  { label: 'Build Discipline', icon: 'calendar' },
  { label: 'Start Moving', icon: 'steps' },
];

const LEVELS: { id: UserProfile['fitness_level']; label: string; meta: string }[] = [
  { id: 'beginner', label: 'Beginner', meta: 'Just starting' },
  { id: 'intermediate', label: 'Intermediate', meta: '6+ months' },
  { id: 'advanced', label: 'Advanced', meta: '2+ years' },
];

const BRANCHES: { id: ServiceBranch; label: string }[] = [
  { id: 'army', label: 'Army' },
  { id: 'marines', label: 'Marine Corps' },
  { id: 'navy', label: 'Navy' },
  { id: 'air_force', label: 'Air Force' },
  { id: 'space_force', label: 'Space Force' },
  { id: 'coast_guard', label: 'Coast Guard' },
  { id: 'general', label: 'General readiness' },
];

const STATUSES: { id: ServiceStatus; label: string }[] = [
  { id: 'recruit', label: 'Recruit or applicant' },
  { id: 'active', label: 'Active duty' },
  { id: 'reserve', label: 'Reserve' },
  { id: 'guard', label: 'National Guard' },
  { id: 'rotc', label: 'ROTC or academy' },
  { id: 'veteran', label: 'Veteran' },
  { id: 'civilian', label: 'Civilian' },
];

const DAYS = [
  { n: 3, meta: 'Efficient' },
  { n: 4, meta: 'Serious' },
  { n: 5, meta: 'Incredible' },
];
const MINUTES = [
  { n: 20, meta: 'Express' },
  { n: 30, meta: 'Efficient' },
  { n: 45, meta: 'Serious' },
  { n: 60, meta: 'Intense' },
];
const AGES: { id: NonNullable<UserProfile['age_range']>; label: string }[] = [
  { id: 'under_30', label: 'Under 30' },
  { id: '30_44', label: '30 – 44' },
  { id: '45_59', label: '45 – 59' },
  { id: '60_plus', label: '60 or older' },
];
const INTENSITIES: { id: UserProfile['preferred_intensity']; label: string; meta: string }[] = [
  { id: 'low', label: 'Ease into it', meta: 'Low' },
  { id: 'moderate', label: 'Balanced push', meta: 'Moderate' },
  { id: 'high', label: 'Hard but controlled', meta: 'High' },
];
const GUARDRAILS: { id: string; label: string; icon: IconName }[] = [
  { id: 'low_impact', label: 'Low-impact start', icon: 'steps' },
  { id: 'joint_concerns', label: 'Joint concerns', icon: 'joint' },
  { id: 'returning_after_break', label: 'Back after a break', icon: 'restart' },
];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [level, setLevel] = useState<UserProfile['fitness_level'] | null>(null);
  const [branch, setBranch] = useState<ServiceBranch | null>(null);
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [testType, setTestType] = useState<FitnessTestType>('general_readiness');
  const [weeksOut, setWeeksOut] = useState(12);
  const [noDate, setNoDate] = useState(false);
  const [days, setDays] = useState<number | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [gear, setGear] = useState<string[]>([]);
  const [guardrails, setGuardrails] = useState<string[]>([]);
  const [age, setAge] = useState<NonNullable<UserProfile['age_range']> | null>(null);
  const [intensity, setIntensity] = useState<UserProfile['preferred_intensity'] | null>(null);
  const [remindersOn, setRemindersOn] = useState(false);

  const steps = useMemo<Step[]>(() => {
    const s: Step[] = ['welcome', 'goals', 'level', 'story1', 'branch', 'status'];
    if (branch === 'marines') s.push('testChoice');
    s.push('testDate', 'story2', 'days', 'minutes', 'equipment', 'guardrails', 'age', 'intensity', 'name', 'notify', 'generating', 'ready', 'commit');
    return s;
  }, [branch]);

  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const step = steps[index];
  const questionSteps = steps.filter((x) => !['welcome', 'story1', 'story2', 'generating', 'ready', 'commit'].includes(x));
  const qIndex = questionSteps.indexOf(step);
  const progress = qIndex >= 0 ? (qIndex + 1) / questionSteps.length : 1;

  const go = useCallback(
    (delta: 1 | -1) => {
      haptic.light();
      setDir(delta);
      setIndex((i) => Math.max(0, Math.min(steps.length - 1, i + delta)));
    },
    [steps.length],
  );
  const next = useCallback(() => go(1), [go]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const testDate = useMemo(() => {
    if (noDate) return null;
    const d = new Date();
    d.setDate(d.getDate() + weeksOut * 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, [noDate, weeksOut]);

  const profile = useMemo<UserProfile>(
    () => ({
      id: 'local',
      display_name: name.trim() || 'Recruit',
      created_at: new Date().toISOString(),
      onboarding_complete: true,
      fitness_level: level ?? 'beginner',
      goals,
      available_equipment: gear.filter((g) => g !== 'none'),
      workout_days_per_week: days ?? 4,
      has_pool_access: gear.includes('pool'),
      has_ruck_access: gear.includes('ruck'),
      has_gym_access: gear.includes('gym'),
      age_range: age ?? '30_44',
      movement_limitations: guardrails,
      preferred_session_minutes: minutes ?? 30,
      preferred_intensity: intensity ?? 'moderate',
      service_branch: branch ?? 'general',
      service_status: status ?? 'civilian',
      fitness_test_type: branch === 'marines' ? testType : branchDefaultTest[branch ?? 'general'],
      fitness_test_date: testDate,
      occupational_demands: [],
      settings: { notifications_enabled: remindersOn, reminder_time: '07:00', units: 'imperial' },
    }),
    [name, level, goals, gear, days, age, guardrails, minutes, intensity, branch, status, testType, testDate, remindersOn],
  );
  const recommendation = useMemo(() => recommendProgramForProfile(profile), [profile]);
  const program = getProgramById(recommendation.programId);

  const askNotifications = async () => {
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        await setupNotificationChannels();
        await scheduleDailyReminder(7, 0);
        await scheduleWeeklyRecap();
      }
      setRemindersOn(granted);
    } catch {
      // Permission prompts can fail on simulators; carry on either way.
    }
    next();
  };

  const complete = () => {
    // Save everything, then hand over to the paywall; RootNavigator swaps to the app after it.
    useUserStore.getState().setProfile(profile);
    useProgramStore.getState().selectProgram(recommendation.programId);
    useProgramStore.getState().setHasSeenProgramSelect(true);
    useSubscriptionStore.getState().startTrialIfNeeded();
    if (DEV_UNLOCK) {
      // Dev builds skip the paywall and go straight into the app.
      useUserStore.getState().setOnboarded(true);
      return;
    }
    navigation.navigate('OnboardingPaywall' as never);
  };

  if (step === 'welcome') return <Welcome onStart={next} />;

  const isStory = step === 'story1' || step === 'story2';
  const bg = step === 'story1' ? STORY_BG.crimson : step === 'story2' ? STORY_BG.blue : color.bg;
  const chrome = !['generating', 'commit'].includes(step);

  let valid = true;
  let cta = 'Continue';
  let onCta: () => void = next;
  switch (step) {
    case 'goals':
      valid = goals.length > 0;
      break;
    case 'level':
      valid = !!level;
      break;
    case 'branch':
      valid = !!branch;
      break;
    case 'status':
      valid = !!status;
      break;
    case 'days':
      valid = !!days;
      break;
    case 'minutes':
      valid = !!minutes;
      break;
    case 'equipment':
      valid = gear.length > 0;
      break;
    case 'guardrails':
      cta = guardrails.length ? 'Continue' : 'Skip';
      break;
    case 'age':
      valid = !!age;
      break;
    case 'intensity':
      valid = !!intensity;
      break;
    case 'name':
      cta = name.trim() ? 'Continue' : 'Skip';
      break;
    case 'notify':
      cta = 'Turn on reminders';
      onCta = () => void askNotifications();
      break;
    case 'ready':
      cta = 'Continue';
      break;
  }

  const entering = (dir > 0 ? SlideInRight : SlideInLeft).duration(380).easing(motion.easeOut);
  const exiting = (dir > 0 ? SlideOutLeft : SlideOutRight).duration(300).easing(motion.easeOut);

  return (
    <Animated.View style={[styles.screen, { backgroundColor: color.bg }]}>
      <Animated.View key={step} entering={entering} exiting={exiting} style={[StyleSheet.absoluteFill, { backgroundColor: bg }]}>
        <View style={[styles.page, { paddingTop: isStory ? 0 : insets.top + 64 }]}>{renderStep()}</View>
      </Animated.View>

      {chrome ? (
        <View style={[styles.header, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
          <Tap feedback="opacity" hitSlop={10} onPress={() => go(-1)} style={[styles.back, isStory && styles.backOnColor]} accessibilityLabel="Back">
            <Icon name="back" size={20} color={color.text} weight="medium" />
          </Tap>
          {qIndex >= 0 ? <Bar progress={progress} height={9} tint="#FFFFFF" trackColor={color.lineStrong} style={{ flex: 1 }} duration={420} /> : <View style={{ flex: 1 }} />}
        </View>
      ) : null}

      {chrome ? (
        <KeyboardLift offset={8}>
          <View style={[styles.footer, { paddingBottom: insets.bottom + space.xs }]}>
            {step === 'notify' ? (
              <Tap feedback="opacity" onPress={next} style={styles.notNow} accessibilityLabel="Not now">
                <Text variant="callout" tone="tertiary">
                  Not now
                </Text>
              </Tap>
            ) : null}
            <Button title={cta} caps disabled={!valid} onPress={onCta} />
          </View>
        </KeyboardLift>
      ) : null}
    </Animated.View>
  );

  function renderStep() {
    switch (step) {
      case 'goals':
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
            <Question title="What are you training for?" subtitle="Pick everything that fits." />
            <View style={os.list}>
              {GOALS.map((g, i) => (
                <OptionRow key={g.label} index={i} label={g.label} icon={g.icon} multi selected={goals.includes(g.label)} onPress={() => toggle(goals, setGoals, g.label)} />
              ))}
            </View>
          </ScrollView>
        );
      case 'level':
        return (
          <View>
            <Question title="How experienced are you with training?" />
            <View style={os.list}>
              {LEVELS.map((l, i) => (
                <OptionRow key={l.id} index={i} label={l.label} meta={l.meta} icon={i === 0 ? 'gauge' : i === 1 ? 'chart' : 'bolt'} selected={level === l.id} onPress={() => setLevel(l.id)} />
              ))}
            </View>
          </View>
        );
      case 'story1':
        return <Story tone="crimson" title="Motivation fades. Standards don’t." body="Most people train when they feel like it. Tests don’t wait for that day." />;
      case 'branch':
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
            <Question title="Which branch are you preparing for?" subtitle="Sets your test events and targets." />
            <View style={os.list}>
              {BRANCHES.map((b, i) => (
                <OptionRow key={b.id} index={i} label={b.label} selected={branch === b.id} onPress={() => { setBranch(b.id); setTestType(branchDefaultTest[b.id]); }} />
              ))}
            </View>
          </ScrollView>
        );
      case 'status':
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
            <Question title="What’s your status?" />
            <View style={os.list}>
              {STATUSES.map((s, i) => (
                <OptionRow key={s.id} index={i} label={s.label} selected={status === s.id} onPress={() => setStatus(s.id)} />
              ))}
            </View>
          </ScrollView>
        );
      case 'testChoice':
        return (
          <View>
            <Question title="Which test is next?" />
            <View style={os.list}>
              {(['marine_pft', 'marine_cft'] as FitnessTestType[]).map((t, i) => (
                <OptionRow key={t} index={i} label={militaryTests[t].name} meta={t === 'marine_pft' ? 'Physical' : 'Combat'} selected={testType === t} onPress={() => setTestType(t)} />
              ))}
            </View>
          </View>
        );
      case 'testDate':
        return (
          <View>
            <Question title="When is your next test?" />
            <View style={{ paddingHorizontal: space.gutter }}>
              <Segmented value={noDate ? 'none' : 'date'} onChange={(v) => setNoDate(v === 'none')} options={[{ value: 'date', label: 'I have a date' }, { value: 'none', label: 'Not scheduled' }]} />
            </View>
            <Animated.View key={noDate ? 'none' : 'date'} entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)}>
              {noDate ? (
                <Text variant="callout" tone="secondary" align="center" style={{ marginTop: space.xxxl, paddingHorizontal: space.xl }}>
                  No problem. Your plan builds a base now, and you can add a date from the Test tab anytime.
                </Text>
              ) : (
                <>
                  <Text style={styles.big} align="center" tabular>
                    {weeksOut} {weeksOut === 1 ? 'week' : 'weeks'}
                  </Text>
                  <Text variant="callout" tone="secondary" align="center">
                    {testDate ? new Date(`${testDate}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                  </Text>
                  <View style={{ marginTop: space.lg }}>
                    <Ruler min={1} max={52} value={weeksOut} onChange={setWeeksOut} />
                  </View>
                  <View style={styles.note}>
                    <Icon name="shieldCheck" size={20} color={color.textSecondary} />
                    <Text variant="footnote" tone="secondary" style={{ flex: 1 }}>
                      Your plan tapers intensity in the final week before test day.
                    </Text>
                  </View>
                </>
              )}
            </Animated.View>
          </View>
        );
      case 'story2':
        return <Story tone="blue" title="Your test, broken into daily missions" body="One mission a day. Every set logged, every event tracked, every rank earned." />;
      case 'days':
        return (
          <View>
            <Question title="How many days a week can you train?" />
            <View style={os.list}>
              {DAYS.map((d, i) => (
                <OptionRow key={d.n} index={i} label={`${d.n} days / week`} meta={d.meta} selected={days === d.n} onPress={() => setDays(d.n)} />
              ))}
            </View>
          </View>
        );
      case 'minutes':
        return (
          <View>
            <Question title="How long should workouts be?" />
            <View style={os.list}>
              {MINUTES.map((m, i) => (
                <OptionRow key={m.n} index={i} label={`${m.n} minutes`} meta={m.meta} selected={minutes === m.n} onPress={() => setMinutes(m.n)} />
              ))}
            </View>
          </View>
        );
      case 'equipment':
        return (
          <View>
            <Question title="What do you have access to?" subtitle="Pick all that apply." />
            <View style={os.grid}>
              <GridTile index={0} label="Gym" icon="dumbbell" selected={gear.includes('gym')} onPress={() => setGear((g) => toggleExclusive(g, 'gym'))} />
              <GridTile index={1} label="Ruck or weighted pack" icon="ruck" selected={gear.includes('ruck')} onPress={() => setGear((g) => toggleExclusive(g, 'ruck'))} />
              <GridTile index={2} label="Pool" icon="swim" selected={gear.includes('pool')} onPress={() => setGear((g) => toggleExclusive(g, 'pool'))} />
              <GridTile index={3} label="Bodyweight only" icon="body" selected={gear.includes('none')} onPress={() => setGear((g) => (g.includes('none') ? [] : ['none']))} />
            </View>
          </View>
        );
      case 'guardrails':
        return (
          <View>
            <Question title="Anything we should plan around?" subtitle="Your first weeks start gentler." />
            <View style={os.grid}>
              {GUARDRAILS.map((g, i) => (
                <GridTile key={g.id} index={i} label={g.label} icon={g.icon} selected={guardrails.includes(g.id)} onPress={() => toggle(guardrails, setGuardrails, g.id)} />
              ))}
            </View>
          </View>
        );
      case 'age':
        return (
          <View>
            <Question title="What’s your age range?" />
            <View style={os.list}>
              {AGES.map((a, i) => (
                <OptionRow key={a.id} index={i} label={a.label} selected={age === a.id} onPress={() => setAge(a.id)} />
              ))}
            </View>
          </View>
        );
      case 'intensity':
        return (
          <View>
            <Question title="How hard do you want to push?" />
            <View style={os.list}>
              {INTENSITIES.map((it, i) => (
                <OptionRow key={it.id} index={i} label={it.label} meta={it.meta} selected={intensity === it.id} onPress={() => setIntensity(it.id)} />
              ))}
            </View>
          </View>
        );
      case 'name':
        return (
          <View>
            <Question title="What should we call you?" subtitle="Your callsign shows on your profile." />
            <View style={{ paddingHorizontal: space.gutter }}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Callsign"
                placeholderTextColor={color.textTertiary}
                maxLength={24}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={next}
                style={styles.input}
                selectionColor={color.accent}
                accessibilityLabel="Callsign"
              />
            </View>
          </View>
        );
      case 'notify':
        return (
          <View style={{ flex: 1 }}>
            <NotifyPrime />
            <View style={{ paddingHorizontal: space.xl, marginTop: space.xl }}>
              <Text variant="question" align="center">
                Get reminded when it’s time to train
              </Text>
              <Text variant="callout" tone="secondary" align="center" style={{ marginTop: 8 }}>
                One reminder a day at 7:00 AM and a weekly recap. Change it anytime.
              </Text>
            </View>
          </View>
        );
      case 'generating':
        return <Generating onDone={next} />;
      case 'ready':
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
            <PlanReady program={program} recommendation={recommendation} daysPerWeek={profile.workout_days_per_week} />
          </ScrollView>
        );
      case 'commit':
        return <Commit days={profile.workout_days_per_week} onSigned={complete} />;
      default:
        return null;
    }
  }
}

function toggleExclusive(list: string[], v: string) {
  const base = list.filter((x) => x !== 'none');
  return base.includes(v) ? base.filter((x) => x !== v) : [...base, v];
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  page: { flex: 1 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: space.md },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backOnColor: { backgroundColor: 'rgba(0,0,0,0.22)' },
  footer: { paddingHorizontal: space.md, paddingTop: space.sm },
  notNow: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20, marginBottom: 4 },
  big: { fontFamily: font.bold, fontSize: 40, color: color.text, marginTop: space.xl },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: space.gutter,
    marginTop: space.xl,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: color.surface,
  },
  input: {
    height: 60,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    paddingHorizontal: space.lg,
    color: color.text,
    fontFamily: font.medium,
    fontSize: 20,
  },
});
