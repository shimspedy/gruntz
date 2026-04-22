import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  TextInput,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFadeInUp } from '../utils/animations';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { MissionButton } from '../components/MissionButton';
import { GlassCard } from '../components/GlassCard';
import { GameIcon } from '../components/GameIcon';
import { useUserStore } from '../store/useUserStore';
import { useProgramStore } from '../store/useProgramStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { getProgramById } from '../data/programs';
import { recommendProgramForProfile } from '../services/adaptiveCoach';
import { hapticLight, hapticSelection, hapticSuccess } from '../utils/haptics';
import type { UserProfile } from '../types';

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const GOALS = [
  'Start Moving',
  'Lose Fat',
  'Build Discipline',
  'Improve Endurance',
  'Get Stronger',
  'Military Prep',
] as const;
const INTENSITIES = ['low', 'moderate', 'high'] as const;
const AGE_RANGES = ['under_30', '30_44', '45_59', '60_plus'] as const;
const SESSION_LENGTHS = [20, 30, 45, 60] as const;
const LIMITATIONS = [
  { id: 'low_impact', label: 'Low-impact start' },
  { id: 'joint_concerns', label: 'Joint concerns' },
  { id: 'returning_after_break', label: 'Returning after a break' },
] as const;

const FITNESS_LEVEL_META: Record<
  (typeof FITNESS_LEVELS)[number],
  { icon: string; desc: string }
> = {
  beginner: { icon: 'intensity_low', desc: 'Just starting out' },
  intermediate: { icon: 'intensity_medium', desc: '6+ months training' },
  advanced: { icon: 'intensity_high', desc: '2+ years consistent' },
};

const INTENSITY_META: Record<
  (typeof INTENSITIES)[number],
  { icon: string; label: string }
> = {
  low: { icon: 'intensity_low', label: 'Ease into it' },
  moderate: { icon: 'intensity_medium', label: 'Balanced push' },
  high: { icon: 'intensity_high', label: 'Hard but controlled' },
};

const AGE_RANGE_META: Record<(typeof AGE_RANGES)[number], string> = {
  under_30: 'Under 30',
  '30_44': '30-44',
  '45_59': '45-59',
  '60_plus': '60+',
};

const TOTAL_STEPS = 8;
const QUESTION_STEPS = TOTAL_STEPS - 1;

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const emojiAnim = useFadeInUp(700);
  const titleAnim = useFadeInUp(700, 200);
  const subtitleAnim = useFadeInUp(700, 400);
  const { setProfile, setOnboarded } = useUserStore();
  const { selectProgram, setHasSeenProgramSelect } = useProgramStore();
  const startTrialIfNeeded = useSubscriptionStore((s) => s.startTrialIfNeeded);

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState<(typeof FITNESS_LEVELS)[number]>('beginner');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<(typeof AGE_RANGES)[number]>('30_44');
  const [movementLimitations, setMovementLimitations] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [sessionMinutes, setSessionMinutes] = useState<(typeof SESSION_LENGTHS)[number]>(30);
  const [hasPool, setHasPool] = useState(false);
  const [hasRuck, setHasRuck] = useState(false);
  const [hasGym, setHasGym] = useState(false);
  const [intensity, setIntensity] = useState<(typeof INTENSITIES)[number]>('moderate');

  // Step transition animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduceMotion(enabled);
    });
    return () => {
      active = false;
      sub?.remove?.();
    };
  }, []);

  const animateStepTransition = (nextStep: number) => {
    if (reduceMotion) {
      setStep(nextStep);
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const goNext = () => {
    hapticLight();
    animateStepTransition(step + 1);
  };

  const goBack = () => {
    if (step <= 0) return;
    hapticLight();
    animateStepTransition(step - 1);
  };

  const toggleGoal = (goal: string) => {
    hapticSelection();
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const toggleLimitation = (limitation: string) => {
    hapticSelection();
    setMovementLimitations((prev) =>
      prev.includes(limitation) ? prev.filter((item) => item !== limitation) : [...prev, limitation]
    );
  };

  const draftProfile = useMemo<UserProfile>(() => {
    const trimmedName = displayName.trim();
    const availableEquipment = [
      hasPool ? 'pool' : null,
      hasRuck ? 'ruck' : null,
      hasGym ? 'gym' : null,
    ].filter((item): item is string => item !== null);

    return {
      id: 'local',
      display_name: trimmedName.length > 0 ? trimmedName : 'Recruit',
      created_at: new Date().toISOString(),
      onboarding_complete: true,
      fitness_level: fitnessLevel,
      goals: selectedGoals,
      available_equipment: availableEquipment,
      workout_days_per_week: daysPerWeek,
      has_pool_access: hasPool,
      has_ruck_access: hasRuck,
      has_gym_access: hasGym,
      age_range: ageRange,
      movement_limitations: movementLimitations,
      preferred_session_minutes: sessionMinutes,
      preferred_intensity: intensity,
      settings: {
        notifications_enabled: true,
        reminder_time: '07:00',
        units: 'imperial',
      },
    };
  }, [
    ageRange,
    daysPerWeek,
    displayName,
    fitnessLevel,
    hasGym,
    hasPool,
    hasRuck,
    intensity,
    movementLimitations,
    selectedGoals,
    sessionMinutes,
  ]);

  const recommendation = useMemo(() => recommendProgramForProfile(draftProfile), [draftProfile]);
  const recommendedProgram = useMemo(() => getProgramById(recommendation.programId), [recommendation.programId]);

  const handleComplete = () => {
    hapticSuccess();
    setProfile(draftProfile);
    selectProgram(recommendation.programId);
    setHasSeenProgramSelect(true);
    setOnboarded(true);
    startTrialIfNeeded();
    onComplete();
  };

  // ──────────── Step Renderers ────────────

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeCenter}>
        <Animated.View
          style={[
            styles.heroBadge,
            { opacity: emojiAnim.opacity, transform: emojiAnim.transform },
          ]}
        >
          <View style={styles.heroBadgeGlow} />
          <GameIcon name="program" size={56} color={colors.accent} />
        </Animated.View>
        <Animated.Text
          style={[styles.brandTitle, { opacity: titleAnim.opacity, transform: titleAnim.transform }]}
          maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}
        >
          GRUNTZ
        </Animated.Text>
        <Animated.Text
          style={[styles.brandSubtitle, { opacity: subtitleAnim.opacity, transform: subtitleAnim.transform }]}
        >
          Mission-Based Fitness
        </Animated.Text>
        <Text style={styles.brandDesc}>
          Start where you are. Gruntz will recommend a path and generate daily missions
          based on your starting point, equipment, and goals.
        </Text>
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            Consult a healthcare provider before starting any exercise program, especially if you have a medical condition, pain, or haven&apos;t trained in a while. You must be 13 or older to use this app.
          </Text>
        </View>
      </View>
      <MissionButton title="BUILD MY PLAN" onPress={goNext} style={styles.cta} />
    </View>
  );

  const renderName = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEyebrow}>STEP 1 OF {QUESTION_STEPS}</Text>
      <Text style={styles.stepTitle}>What should we call you?</Text>
      <Text style={styles.stepSubtitle}>
        Your callsign appears on every mission brief.
      </Text>
      <View style={styles.nameInputWrap}>
        <TextInput
          style={styles.nameInput}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Enter your callsign"
          placeholderTextColor={colors.textMuted}
          maxLength={24}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}
        />
      </View>
      <MissionButton
        title={displayName.trim().length > 0 ? 'NEXT' : 'SKIP'}
        onPress={goNext}
        style={styles.cta}
      />
    </View>
  );

  const renderFitnessLevel = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEyebrow}>STEP 2 OF {QUESTION_STEPS}</Text>
      <Text style={styles.stepTitle}>Current fitness level?</Text>
      <Text style={styles.stepSubtitle}>
        We will calibrate your missions accordingly.
      </Text>
      <View style={styles.optionList}>
        {FITNESS_LEVELS.map((level) => {
          const active = fitnessLevel === level;
          const meta = FITNESS_LEVEL_META[level];
          return (
            <TouchableOpacity
              key={level}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${level} fitness level`}
              onPress={() => {
                hapticSelection();
                setFitnessLevel(level);
              }}
            >
              <GlassCard
                variant={active ? 'accent' : 'default'}
                style={styles.optionCard}
              >
                <View style={styles.optionRow}>
                  <View style={[styles.optionIconWrap, active && styles.optionIconWrapActive]}>
                    <GameIcon
                      name={meta.icon}
                      size={18}
                      color={active ? colors.background : colors.accent}
                      variant="minimal"
                      animated={false}
                    />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                    <Text style={styles.optionDesc}>{meta.desc}</Text>
                  </View>
                  {active && (
                    <View style={styles.checkBadge}>
                      <GameIcon name="check" size={14} color={colors.background} variant="minimal" animated={false} />
                    </View>
                  )}
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>
      <MissionButton title="NEXT" onPress={goNext} style={styles.cta} />
    </View>
  );

  const renderGoals = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEyebrow}>STEP 3 OF {QUESTION_STEPS}</Text>
      <Text style={styles.stepTitle}>What are you training for?</Text>
      <Text style={styles.stepSubtitle}>Pick every objective that fits your real goal.</Text>
      <View style={styles.optionList}>
        {GOALS.map((goal) => {
          const active = selectedGoals.includes(goal);
          return (
            <TouchableOpacity
              key={goal}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={goal}
              onPress={() => toggleGoal(goal)}
            >
              <GlassCard
                variant={active ? 'accent' : 'default'}
                style={styles.optionCard}
              >
                <View style={styles.optionRow}>
                  <View style={[styles.checkBox, active && styles.checkBoxActive]}>
                    {active && (
                      <GameIcon name="check" size={14} color={colors.background} variant="minimal" animated={false} />
                    )}
                  </View>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                    {goal}
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>
      <MissionButton
        title="NEXT"
        onPress={goNext}
        disabled={selectedGoals.length === 0}
        style={styles.cta}
      />
    </View>
  );

  const renderDaysAndEquipment = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEyebrow}>STEP 5 OF {QUESTION_STEPS}</Text>
      <Text style={styles.stepTitle}>Training schedule</Text>
      <Text style={styles.stepSubtitle}>Days per week</Text>
      <View style={styles.dayRow}>
        {[3, 4, 5].map((d) => {
          const active = daysPerWeek === d;
          return (
            <TouchableOpacity
              key={d}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${d} days per week`}
              onPress={() => {
                hapticSelection();
                setDaysPerWeek(d);
              }}
              style={[styles.dayBtn, active && styles.dayBtnActive]}
            >
              <Text style={[styles.dayNum, active && styles.dayNumActive]}>{d}</Text>
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>days</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.stepSubtitle, { marginTop: spacing.xl }]}>
        Session length
      </Text>
      <View style={styles.dayRow}>
        {SESSION_LENGTHS.map((minutes) => {
          const active = sessionMinutes === minutes;
          return (
            <TouchableOpacity
              key={minutes}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${minutes} minutes per session`}
              onPress={() => {
                hapticSelection();
                setSessionMinutes(minutes);
              }}
              style={[styles.dayBtn, active && styles.dayBtnActive]}
            >
              <Text style={[styles.dayNum, active && styles.dayNumActive]}>{minutes}</Text>
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>min</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.stepSubtitle, { marginTop: spacing.xl }]}>
        Equipment access
      </Text>
      <TouchableOpacity
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: hasPool }}
        accessibilityLabel="Pool access"
        onPress={() => {
          hapticSelection();
          setHasPool(!hasPool);
        }}
      >
        <GlassCard variant={hasPool ? 'accent' : 'default'} style={styles.optionCard}>
          <View style={styles.optionRow}>
            <View style={[styles.optionIconWrap, hasPool && styles.optionIconWrapActive]}>
              <GameIcon
                name="pool"
                size={16}
                color={hasPool ? colors.background : colors.accent}
                variant="minimal"
                animated={false}
              />
            </View>
            <Text style={[styles.optionLabel, hasPool && styles.optionLabelActive]}>
              Pool Access
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: hasRuck }}
        accessibilityLabel="Ruck or weighted pack access"
        onPress={() => {
          hapticSelection();
          setHasRuck(!hasRuck);
        }}
      >
        <GlassCard variant={hasRuck ? 'accent' : 'default'} style={styles.optionCard}>
          <View style={styles.optionRow}>
            <View style={[styles.optionIconWrap, hasRuck && styles.optionIconWrapActive]}>
              <GameIcon
                name="ruck"
                size={16}
                color={hasRuck ? colors.background : colors.accent}
                variant="minimal"
                animated={false}
              />
            </View>
            <Text style={[styles.optionLabel, hasRuck && styles.optionLabelActive]}>
              Ruck / Weighted Pack
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: hasGym }}
        accessibilityLabel="Gym access"
        onPress={() => {
          hapticSelection();
          setHasGym(!hasGym);
        }}
      >
        <GlassCard variant={hasGym ? 'accent' : 'default'} style={styles.optionCard}>
          <View style={styles.optionRow}>
            <View style={[styles.optionIconWrap, hasGym && styles.optionIconWrapActive]}>
              <GameIcon
                name="strength"
                size={16}
                color={hasGym ? colors.background : colors.accent}
                variant="minimal"
                animated={false}
              />
            </View>
            <Text style={[styles.optionLabel, hasGym && styles.optionLabelActive]}>
              Gym Access
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
      <MissionButton title="NEXT" onPress={goNext} style={styles.cta} />
    </View>
  );

  const renderTrainingContext = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEyebrow}>STEP 4 OF {QUESTION_STEPS}</Text>
      <Text style={styles.stepTitle}>Starting point</Text>
      <Text style={styles.stepSubtitle}>This helps the app choose a safer first path.</Text>

      <Text style={styles.groupLabel}>Age range</Text>
      <View style={styles.dayRow}>
        {AGE_RANGES.map((range) => {
          const active = ageRange === range;
          return (
            <TouchableOpacity
              key={range}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Age range ${AGE_RANGE_META[range]}`}
              onPress={() => {
                hapticSelection();
                setAgeRange(range);
              }}
              style={[styles.ageBtn, active && styles.dayBtnActive]}
            >
              <Text style={[styles.ageLabel, active && styles.dayLabelActive]}>{AGE_RANGE_META[range]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.groupLabel, { marginTop: spacing.xl }]}>Guardrails</Text>
      <View style={styles.optionList}>
        {LIMITATIONS.map((item) => {
          const active = movementLimitations.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={item.label}
              onPress={() => toggleLimitation(item.id)}
            >
              <GlassCard variant={active ? 'accent' : 'default'} style={styles.optionCard}>
                <View style={styles.optionRow}>
                  <View style={[styles.checkBox, active && styles.checkBoxActive]}>
                    {active && (
                      <GameIcon name="check" size={14} color={colors.background} variant="minimal" animated={false} />
                    )}
                  </View>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                    {item.label}
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>

      <MissionButton title="NEXT" onPress={goNext} style={styles.cta} />
    </View>
  );

  const renderIntensity = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEyebrow}>STEP 6 OF {QUESTION_STEPS}</Text>
      <Text style={styles.stepTitle}>Preferred intensity</Text>
      <Text style={styles.stepSubtitle}>This affects your starting recommendation and Base Camp track.</Text>
      <View style={styles.optionList}>
        {INTENSITIES.map((level) => {
          const active = intensity === level;
          const meta = INTENSITY_META[level];
          return (
            <TouchableOpacity
              key={level}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${level} intensity`}
              onPress={() => {
                hapticSelection();
                setIntensity(level);
              }}
            >
              <GlassCard
                variant={active ? 'accent' : 'default'}
                style={styles.optionCard}
              >
                <View style={styles.optionRow}>
                  <View style={[styles.optionIconWrap, active && styles.optionIconWrapActive]}>
                    <GameIcon
                      name={meta.icon}
                      size={18}
                      color={active ? colors.background : colors.accent}
                      variant="minimal"
                      animated={false}
                    />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                    <Text style={styles.optionDesc}>{meta.label}</Text>
                  </View>
                  {active && (
                    <View style={styles.checkBadge}>
                      <GameIcon name="check" size={14} color={colors.background} variant="minimal" animated={false} />
                    </View>
                  )}
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>
      <MissionButton title="SEE MY PATH" onPress={goNext} style={styles.cta} />
    </View>
  );

  const renderRecommendedPath = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEyebrow}>STEP 7 OF {QUESTION_STEPS}</Text>
      <Text style={styles.stepTitle}>Recommended path</Text>
      <Text style={styles.stepSubtitle}>You can switch programs later from your profile.</Text>

      <GlassCard variant="accent" style={styles.recommendCard}>
        <View style={styles.recommendHeader}>
          <GameIcon name={recommendedProgram?.icon || 'program'} size={32} color={colors.accent} />
          <View style={styles.recommendTitleCol}>
            <Text style={styles.recommendName}>{recommendedProgram?.name || recommendation.title}</Text>
            <Text style={styles.recommendSubtitle}>{recommendation.title}</Text>
          </View>
        </View>
        <Text style={styles.recommendReason}>{recommendation.reason}</Text>
        <Text style={styles.recommendCoach}>{recommendation.coachNote}</Text>
        <View style={styles.focusRow}>
          {recommendation.focusAreas.map((area) => (
            <View key={area} style={styles.focusChip}>
              <Text style={styles.focusChipText}>{area}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      <MissionButton
        title={`START ${recommendedProgram?.name.toUpperCase() || recommendation.programId.toUpperCase()}`}
        onPress={handleComplete}
        style={styles.cta}
      />
    </View>
  );

  const steps = [
    renderWelcome,
    renderName,
    renderFitnessLevel,
    renderGoals,
    renderTrainingContext,
    renderDaysAndEquipment,
    renderIntensity,
    renderRecommendedPath,
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress bar + back */}
        <View style={styles.progressBarWrap}>
          {step > 0 ? (
            <TouchableOpacity
              onPress={goBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back one step"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>‹</Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  // Welcome step reads ~8% so the bar isn't empty on first render.
                  width: `${Math.max(8, (step / (TOTAL_STEPS - 1)) * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {step === 0 ? 'Welcome' : `${step} of ${TOTAL_STEPS - 1}`}
          </Text>
        </View>

        {/* Animated step content */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            flex: 1,
          }}
        >
          {steps[step]()}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ──────────── Styles ────────────

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },

    // Progress bar
    progressBarWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    progressTrack: {
      flex: 1,
      height: 4,
      borderRadius: borderRadius.full,
      backgroundColor: colors.glassBorder,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: borderRadius.full,
    },
    progressLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.5,
      minWidth: 48,
      textAlign: 'right',
    },
    backBtn: {
      width: 28,
      height: 28,
      borderRadius: borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.cardBorder,
    },
    backBtnText: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textSecondary,
      marginTop: -2,
    },

    // Steps shared
    stepContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    stepEyebrow: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    stepTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    stepSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: spacing.lg,
      lineHeight: 19,
    },

    // Medical + age disclaimer on welcome step
    disclaimerBox: {
      marginTop: spacing.xl,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.cardBorder,
    },
    disclaimerText: {
      fontSize: 11,
      color: colors.textMuted,
      lineHeight: 16,
      textAlign: 'center',
    },

    // Name capture
    nameInputWrap: {
      marginBottom: spacing.xl,
    },
    nameInput: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.cardBorder,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      letterSpacing: 0.3,
    },

    // Welcome
    welcomeCenter: {
      alignItems: 'center',
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xl,
    },
    heroBadge: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
      position: 'relative',
    },
    heroBadgeGlow: {
      position: 'absolute',
      width: 104,
      height: 104,
      borderRadius: 52,
      backgroundColor: colors.accent,
      opacity: 0.08,
    },
    brandTitle: {
      fontSize: 40,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: 6,
    },
    brandSubtitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      textAlign: 'center',
      letterSpacing: 1.5,
      marginTop: spacing.sm,
      textTransform: 'uppercase',
    },
    brandDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.lg,
      lineHeight: 21,
      paddingHorizontal: spacing.md,
    },

    // Options
    optionList: {
      gap: spacing.sm,
    },
    optionCard: {
      marginBottom: 0,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    optionIconWrap: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionIconWrapActive: {
      backgroundColor: colors.accent,
    },
    optionTextCol: {
      flex: 1,
    },
    optionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    optionLabelActive: {
      color: colors.accent,
    },
    optionDesc: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    checkBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkBox: {
      width: 22,
      height: 22,
      borderRadius: borderRadius.sm,
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkBoxActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },

    // Days
    dayRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    dayBtn: {
      flex: 1,
      height: 56,
      borderRadius: borderRadius.md,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayBtnActive: {
      borderColor: colors.accent,
      backgroundColor: `${colors.accent}0D`,
    },
    dayNum: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textMuted,
    },
    dayNumActive: {
      color: colors.accent,
    },
    dayLabel: {
      fontSize: 10,
      fontWeight: '500',
      color: colors.textMuted,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginTop: 2,
    },
    dayLabelActive: {
      color: colors.accent,
    },

    groupLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    ageBtn: {
      flex: 1,
      minHeight: 44,
      borderRadius: borderRadius.md,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
    },
    ageLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      textAlign: 'center',
    },
    recommendCard: {
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    recommendHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    recommendTitleCol: {
      flex: 1,
    },
    recommendName: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      lineHeight: 26,
    },
    recommendSubtitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginTop: 2,
    },
    recommendReason: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
      marginBottom: spacing.sm,
    },
    recommendCoach: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 17,
      marginBottom: spacing.md,
    },
    focusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    focusChip: {
      borderWidth: 1,
      borderColor: `${colors.accent}60`,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: `${colors.background}66`,
    },
    focusChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
      textTransform: 'capitalize',
    },

    // CTA
    cta: {
      marginTop: spacing.xl,
    },
  });
