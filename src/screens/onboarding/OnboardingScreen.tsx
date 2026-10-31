import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { isBackupAvailable } from '../../config/backup';
import type { OnboardingStackParamList } from '../../types/navigation';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import { branchDefaultTest, militaryTests } from '../../data/militaryTests';
import { getProgramById, getProgramTrainingDays } from '../../data/programs';
import { recommendProgramForProfile } from '../../services/adaptiveCoach';
import { recommendPlans } from '../../features/planRecommend';
import { usePlanLibraryStore } from '../../store/usePlanLibraryStore';
import { useOnboardingDraftStore, useOnboardingDraftHydrated } from '../../store/useOnboardingDraftStore';
import { useProgramStore } from '../../store/useProgramStore';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { useUserStore } from '../../store/useUserStore';
import { defaultUnits } from '../../utils/units';
import type { FitnessTestType, ServiceBranch, UserProfile } from '../../types';
import { Button } from '../../ui/Button';
import { Icon, type IconName } from '../../ui/Icon';
import { KeyboardLift } from '../../ui/KeyboardAware';
import { Bar } from '../../ui/Progress';
import { Tap } from '../../ui/Pressable';
import { Segmented } from '../../ui/Segmented';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { color, font, motion, radius, space } from '../../ui/tokens';
import { PlanReady } from './Finale';
import { PlanMatches, builtinKey } from './PlanMatches';
import { GridTile, OptionRow, Question, Ruler, onboardingStyles as os } from './parts';
import { trackRetentionEvent } from '../../services/retentionAnalytics';
import { onboardingSteps, preferredOnboardingPlan, resumedOnboardingStep, type OnboardingStep } from './flow';
import { PracticeSession } from './PracticeSession';
import { Welcome } from './Welcome';
import { showRestoreResult } from '../../components/restoreResult';
import { rememberedBackupAccount } from '../../services/returningAthlete';
import { toast } from '../../ui/Toast';
import { getLocalDateKey } from '../../utils/dateKey';

const GOALS: { label: string; icon: IconName }[] = [
  { label: 'Build Muscle', icon: 'dumbbell' },
  { label: 'Get Stronger', icon: 'strength' },
  { label: 'Lose Fat', icon: 'flame' },
  { label: 'Improve Endurance', icon: 'run' },
  { label: 'Start Moving', icon: 'steps' },
  { label: 'Build Discipline', icon: 'calendar' },
  { label: 'Military Prep', icon: 'flag' },
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
const GUARDRAILS: { id: string; label: string; icon: IconName }[] = [
  { id: 'low_impact', label: 'Low-impact start', icon: 'steps' },
  { id: 'joint_concerns', label: 'Joint concerns', icon: 'joint' },
  { id: 'returning_after_break', label: 'Back after a break', icon: 'restart' },
];

const NO_MATCHES: ReturnType<typeof recommendPlans> = [];

export default function OnboardingScreen() {
  // Wait for saved answers so a user who closed the app mid-onboarding resumes where they were.
  const hydrated = useOnboardingDraftHydrated();
  if (!hydrated) return <View style={{ flex: 1, backgroundColor: color.bg }} />;
  return <OnboardingFlow />;
}

function OnboardingFlow() {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const saved = useRef(useOnboardingDraftStore.getState().draft).current;
  const insets = useSafeAreaInsets();
  const [goals, setGoals] = useState<string[]>(saved?.goals ?? []);
  const [level, setLevel] = useState<UserProfile['fitness_level'] | null>(saved?.level ?? null);
  const [branch, setBranch] = useState<ServiceBranch | null>(saved?.branch ?? null);
  const [testType, setTestType] = useState<FitnessTestType>(saved?.testType ?? 'general_readiness');
  const [weeksOut, setWeeksOut] = useState(saved?.weeksOut ?? 12);
  const [noDate, setNoDate] = useState(saved?.noDate ?? true);
  const [days, setDays] = useState<number | null>(saved?.days ?? null);
  const [minutes, setMinutes] = useState<number | null>(saved?.minutes ?? null);
  const [gear, setGear] = useState<string[]>(saved?.gear ?? []);
  const [guardrails, setGuardrails] = useState<string[]>(saved?.guardrails ?? []);
  const [choice, setChoice] = useState<string | null>(saved?.planChoice ?? null);
  const [practiceReady, setPracticeReady] = useState(false);
  const military = goals.includes('Military Prep');
  const steps = useMemo(() => onboardingSteps(military, branch), [branch, military]);
  const [step, setStep] = useState<OnboardingStep>(() => resumedOnboardingStep(saved?.step, steps));
  const [dir, setDir] = useState<1 | -1>(1);
  const index = steps.indexOf(step);
  const questionSteps = steps.filter((x) => !['welcome', 'ready', 'practice'].includes(x));
  const qIndex = questionSteps.indexOf(step);
  const maxQuestions = useRef(questionSteps.length);
  maxQuestions.current = Math.max(maxQuestions.current, questionSteps.length);
  const progress = qIndex >= 0 ? (qIndex + 1) / maxQuestions.current : 1;
  const transitionFrom = useRef<OnboardingStep | null>(null);
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    transitionFrom.current = null;
    trackRetentionEvent('onboarding_step_viewed', { step, count: index + 1 });
  }, [step, index]);

  const go = useCallback((delta: 1 | -1) => {
    if (transitionFrom.current === step) return;
    const nextStep = steps[Math.max(0, Math.min(steps.length - 1, index + delta))];
    if (nextStep === step) return;
    transitionFrom.current = step;
    if (delta > 0) trackRetentionEvent('onboarding_step_completed', { step });
    if (nextStep === 'practice') setPracticeReady(false);
    haptic.light();
    setDir(delta);
    setStep(nextStep);
  }, [step, steps, index]);
  const next = useCallback(() => go(1), [go]);
  const openRestoreProgress = useCallback((email?: string) => navigation.navigate('Backup', email ? { onboarding: true, email } : { onboarding: true }), [navigation]);

  /**
   * Nothing is asked before Get Started. After it, the store is checked quietly: a
   * returning subscriber gets Pro back with a toast and is offered their backup.
   * Progress and purchases restore independently; either can be skipped.
   */
  const start = useCallback(() => {
    next();
    void (async () => {
      await useSubscriptionStore.getState().refresh().catch(() => undefined);
      const subscriber = useSubscriptionStore.getState().entitlementActive;
      // Remembered in this Apple ID's iCloud when they backed up on another install.
      const backupEmail = rememberedBackupAccount();
      if (subscriber) toast('Gruntz Pro restored', { icon: 'check' });
      if ((!subscriber && !backupEmail) || !isBackupAvailable()) return;
      Alert.alert('Welcome back', 'Restore your progress? Your plan, streak and training history come back from your backup.', [
        { text: 'Start fresh', style: 'cancel' },
        { text: 'Restore', onPress: () => openRestoreProgress(backupEmail ?? undefined) },
      ]);
    })();
  }, [next, openRestoreProgress]);

  const [restoringPurchases, setRestoringPurchases] = useState(false);
  const restorePurchases = useCallback(async () => {
    if (restoringPurchases) return;
    setRestoringPurchases(true);
    try {
      showRestoreResult(await useSubscriptionStore.getState().restoreAccess());
    } finally {
      setRestoringPurchases(false);
    }
  }, [restoringPurchases]);
  const goRef = useRef(go);
  goRef.current = go;
  const practiceComplete = useCallback(() => setPracticeReady(true), []);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index <= 0) return false;
      go(-1);
      return true;
    });
    return () => sub.remove();
  }, [go, index]);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(advanceTimer.current), []);
  const choose = (apply: () => void) => {
    apply();
    const from = stepRef.current;
    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      // Selecting Marines inserts its test-choice step before this timer fires.
      if (stepRef.current === from) goRef.current(1);
    }, 280);
  };
  const toggle = (list: string[], set: (v: string[]) => void, value: string) => set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  const testDate = useMemo(() => {
    if (noDate || !military) return null;
    const date = new Date();
    date.setDate(date.getDate() + weeksOut * 7);
    return getLocalDateKey(date);
  }, [noDate, weeksOut, military]);

  // Optional profile details can be filled in later. Preserve answers from older drafts.
  const profile = useMemo<UserProfile>(() => ({
    id: 'local',
    display_name: saved?.name.trim() || 'Athlete',
    created_at: new Date().toISOString(),
    onboarding_complete: true,
    fitness_level: level ?? 'beginner',
    goals,
    available_equipment: gear.filter((g) => g !== 'none'),
    workout_days_per_week: days ?? 4,
    has_pool_access: gear.includes('pool'),
    has_ruck_access: military && gear.includes('ruck'),
    has_gym_access: gear.includes('gym'),
    age_range: saved?.age ?? undefined,
    movement_limitations: guardrails,
    preferred_session_minutes: minutes ?? 30,
    preferred_intensity: saved?.intensity ?? 'moderate',
    service_branch: military ? (branch ?? 'general') : 'general',
    service_status: military ? saved?.status ?? undefined : 'civilian',
    fitness_test_type: !military ? branchDefaultTest.general : branch === 'marines' ? testType : branchDefaultTest[branch ?? 'general'],
    fitness_test_date: testDate,
    occupational_demands: [],
    settings: { notifications_enabled: saved?.remindersOn ?? false, reminder_time: '07:00', units: defaultUnits() },
  }), [saved, level, goals, gear, days, guardrails, minutes, branch, testType, testDate, military]);
  const recommendation = useMemo(() => recommendProgramForProfile(profile), [profile]);
  const program = getProgramById(recommendation.programId);
  // Parse the catalog only when the recommendation is visible, never on Welcome.
  const plansNeeded = step === 'ready' || step === 'practice';
  const planMatches = useMemo(() => plansNeeded ? recommendPlans(profile, 3) : NO_MATCHES, [plansNeeded, profile]);
  const offerBuiltIn = military || planMatches.length === 0;
  const selectedPlan = preferredOnboardingPlan(military, builtinKey(recommendation.programId), planMatches.map((match) => match.plan.id), choice);

  useEffect(() => {
    useOnboardingDraftStore.getState().save({
      step, name: saved?.name ?? '', goals, level, branch, status: saved?.status ?? null,
      testType, weeksOut, noDate, days, minutes, gear, guardrails, age: saved?.age ?? null,
      intensity: saved?.intensity ?? null, remindersOn: saved?.remindersOn ?? false, planChoice: choice,
    });
  }, [saved, step, goals, level, branch, testType, weeksOut, noDate, days, minutes, gear, guardrails, choice]);

  const completed = useRef(false);
  const complete = () => {
    if (completed.current || !practiceReady) return;
    completed.current = true;
    trackRetentionEvent('onboarding_step_completed', { step: 'practice' });
    trackRetentionEvent('onboarding_completed');
    useUserStore.getState().setProfile(profile);
    if (selectedPlan.startsWith('builtin:')) {
      usePlanLibraryStore.getState().unfollow();
      useProgramStore.getState().selectProgram(recommendation.programId);
    } else {
      useProgramStore.getState().clearProgram();
      usePlanLibraryStore.getState().follow(selectedPlan);
    }
    useProgramStore.getState().setHasSeenProgramSelect(true);
    useSubscriptionStore.getState().startTrialIfNeeded();
    useOnboardingDraftStore.getState().clear();
    useUserStore.getState().setOnboarded(true);
  };

  if (step === 'welcome') return <Welcome onStart={start} onRestorePurchases={restorePurchases} />;
  let valid = true;
  let cta = 'Continue';
  switch (step) {
    case 'goals': valid = goals.length > 0; break;
    case 'level': valid = !!level; break;
    case 'branch': valid = !!branch; break;
    case 'days': valid = !!days; break;
    case 'minutes': valid = !!minutes; break;
    case 'equipment': cta = gear.length ? 'Continue' : 'I train with bodyweight'; break;
    case 'guardrails': cta = guardrails.length ? 'See my plan' : 'No limitations — see my plan'; break;
    case 'ready': cta = 'Try the logger'; break;
    case 'practice': cta = 'Start training'; valid = practiceReady; break;
  }
  const entering = (dir > 0 ? SlideInRight : SlideInLeft).duration(380).easing(motion.easeOut);
  const exiting = (dir > 0 ? SlideOutLeft : SlideOutRight).duration(300).easing(motion.easeOut);

  return (
    <Animated.View style={[styles.screen, { backgroundColor: color.bg }]}>
      <Animated.View key={step} entering={entering} exiting={exiting} style={[StyleSheet.absoluteFill, { backgroundColor: color.bg }]}>
        <View style={[styles.page, { paddingTop: insets.top + 64 }]}>{renderStep()}</View>
      </Animated.View>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
        <Tap feedback="opacity" hitSlop={10} onPress={() => go(-1)} style={styles.back} accessibilityLabel="Back">
          <Icon name="back" size={20} color={color.text} weight="medium" />
        </Tap>
        {qIndex >= 0 ? <Bar progress={progress} height={9} tint="#FFFFFF" trackColor={color.lineStrong} style={{ flex: 1 }} duration={420} /> : <View style={{ flex: 1 }} />}
      </View>
      <KeyboardLift offset={8}>
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.xs, backgroundColor: color.bg }]}>
          <Button title={cta} caps disabled={!valid} onPress={step === 'practice' ? complete : next} />
        </View>
      </KeyboardLift>
    </Animated.View>
  );

  function renderStep() {
    switch (step) {
      case 'goals':
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
            <Question title="What are you training for?" subtitle="Pick everything that fits." />
            {isBackupAvailable() ? (
              <Tap feedback="opacity" hitSlop={8} onPress={() => openRestoreProgress(rememberedBackupAccount() ?? undefined)} style={styles.restoreLink} accessibilityRole="button">
                <Text variant="footnote" tone="secondary">Already use Gruntz? <Text variant="footnote" style={styles.restoreLinkStrong}>Restore your progress</Text></Text>
              </Tap>
            ) : null}
            <View style={os.list}>
              {GOALS.map((g, i) => (
                <OptionRow key={g.label} index={i} label={g.label} icon={g.icon} multi selected={goals.includes(g.label)} onPress={() => { setChoice(null); toggle(goals, setGoals, g.label); }} />
              ))}
            </View>
          </ScrollView>
        );
      case 'level':
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Question title="How experienced are you with training?" />
            <View style={os.list}>
              {LEVELS.map((l, i) => (
                <OptionRow key={l.id} index={i} label={l.label} meta={l.meta} icon={i === 0 ? 'gauge' : i === 1 ? 'chart' : 'bolt'} selected={level === l.id} onPress={() => choose(() => setLevel(l.id))} />
              ))}
            </View>
          </ScrollView>
        );
      case 'branch':
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
            <Question title="Which branch are you preparing for?" subtitle="Sets your test events and targets." />
            <View style={os.list}>
              {BRANCHES.map((b, i) => (
                <OptionRow key={b.id} index={i} label={b.label} selected={branch === b.id} onPress={() => choose(() => { setBranch(b.id); setTestType(branchDefaultTest[b.id]); })} />
              ))}
            </View>
          </ScrollView>
        );
      case 'testChoice':
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Question title="Which test is next?" />
            <View style={os.list}>
              {(['marine_pft', 'marine_cft'] as FitnessTestType[]).map((t, i) => (
                <OptionRow key={t} index={i} label={militaryTests[t].name} meta={t === 'marine_pft' ? 'Physical' : 'Combat'} selected={testType === t} onPress={() => setTestType(t)} />
              ))}
            </View>
          </ScrollView>
        );
      case 'testDate':
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                      Your countdown stays on the Test tab, alongside your scores and targets.
                    </Text>
                  </View>
                </>
              )}
            </Animated.View>
          </ScrollView>
        );
      case 'days':
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Question title="How many days a week can you train?" />
            <View style={os.list}>
              {DAYS.map((d, i) => (
                <OptionRow key={d.n} index={i} label={`${d.n} days / week`} meta={d.meta} selected={days === d.n} onPress={() => choose(() => setDays(d.n))} />
              ))}
            </View>
          </ScrollView>
        );
      case 'minutes':
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Question title="How long should workouts be?" />
            <View style={os.list}>
              {MINUTES.map((m, i) => (
                <OptionRow key={m.n} index={i} label={`${m.n} minutes`} meta={m.meta} selected={minutes === m.n} onPress={() => choose(() => setMinutes(m.n))} />
              ))}
            </View>
          </ScrollView>
        );
      case 'equipment':
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Question title="What do you have access to?" subtitle="Pick all that apply." />
            <View style={os.grid}>
              <GridTile index={0} label="Gym" icon="dumbbell" selected={gear.includes('gym')} onPress={() => setGear((g) => toggleExclusive(g, 'gym'))} />
              <GridTile index={1} label="Dumbbells or bands at home" icon="home" selected={gear.includes('home')} onPress={() => setGear((g) => toggleExclusive(g, 'home'))} />
              {military ? (
                <GridTile index={2} label="Ruck or weighted pack" icon="ruck" selected={gear.includes('ruck')} onPress={() => setGear((g) => toggleExclusive(g, 'ruck'))} />
              ) : null}
              <GridTile index={military ? 3 : 2} label="Pool" icon="swim" selected={gear.includes('pool')} onPress={() => setGear((g) => toggleExclusive(g, 'pool'))} />
              <GridTile index={military ? 4 : 3} label="Bodyweight only" icon="body" selected={gear.includes('none')} onPress={() => setGear((g) => (g.includes('none') ? [] : ['none']))} />
            </View>
          </ScrollView>
        );
      case 'guardrails':
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Question title="Anything we should plan around?" subtitle="Your first weeks start gentler." />
            <View style={os.grid}>
              {GUARDRAILS.map((g, i) => (
                <GridTile key={g.id} index={i} label={g.label} icon={g.icon} selected={guardrails.includes(g.id)} onPress={() => toggle(guardrails, setGuardrails, g.id)} />
              ))}
            </View>
          </ScrollView>
        );
      case 'ready':
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
            {planMatches.length ? (
              <PlanMatches matches={planMatches} builtIn={offerBuiltIn ? recommendation : null} preferBuiltIn={military} profile={profile} selected={selectedPlan} onSelect={setChoice} />
            ) : (
              <PlanReady program={program} recommendation={recommendation} daysPerWeek={program ? getProgramTrainingDays(program, profile) : profile.workout_days_per_week} />
            )}
          </ScrollView>
        );
      case 'practice':
        return <PracticeSession onReady={practiceComplete} />;
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
  restoreLink: { alignSelf: 'center', marginTop: -space.xs, marginBottom: space.md, paddingHorizontal: space.gutter },
  restoreLinkStrong: { color: color.accent },
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
  footer: { paddingHorizontal: space.md, paddingTop: space.sm },
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
});
