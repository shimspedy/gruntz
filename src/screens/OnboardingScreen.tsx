import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFadeInUp } from '../utils/animations';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { MissionButton } from '../components/MissionButton';
import { GlassCard } from '../components/GlassCard';
import { GameIcon } from '../components/GameIcon';
import { useUserStore } from '../store/useUserStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { hapticLight, hapticSelection, hapticSuccess } from '../utils/haptics';
import type { UserProfile } from '../types';

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const GOALS = [
  'Lose Fat',
  'Build Discipline',
  'Improve Endurance',
  'Get Stronger',
  'Military Prep',
] as const;
const INTENSITIES = ['low', 'moderate', 'high'] as const;

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
  high: { icon: 'intensity_high', label: 'Full send' },
};

const TOTAL_STEPS = 5;

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
  const startTrialIfNeeded = useSubscriptionStore((s) => s.startTrialIfNeeded);

  const [step, setStep] = useState(0);
  const [fitnessLevel, setFitnessLevel] = useState<(typeof FITNESS_LEVELS)[number]>('beginner');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [hasPool, setHasPool] = useState(false);
  const [hasRuck, setHasRuck] = useState(false);
  const [intensity, setIntensity] = useState<(typeof INTENSITIES)[number]>('moderate');

  // Step transition animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateStepTransition = (nextStep: number) => {
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

  const toggleGoal = (goal: string) => {
    hapticSelection();
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleComplete = () => {
    hapticSuccess();
    const profile: UserProfile = {
      id: 'local',
      display_name: 'Warrior',
      email: '',
      created_at: new Date().toISOString(),
      onboarding_complete: true,
      fitness_level: fitnessLevel,
      goals: selectedGoals,
      available_equipment: [],
      workout_days_per_week: daysPerWeek,
      has_pool_access: hasPool,
      has_ruck_access: hasRuck,
      preferred_intensity: intensity,
      settings: {
        notifications_enabled: true,
        reminder_time: '07:00',
        units: 'imperial',
      },
    };
    setProfile(profile);
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
          <GameIcon name="program" size={80} color={colors.accent} />
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
          Military-Grade Fitness
        </Animated.Text>
        <Text style={styles.brandDesc}>
          Transform your body with structured, progressive training inspired by
          elite military fitness programs.
        </Text>
      </View>
      <MissionButton title="BEGIN TRAINING" onPress={goNext} style={styles.cta} />
    </View>
  );

  const renderFitnessLevel = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEyebrow}>STEP 1 OF 4</Text>
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
                      size={22}
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
      <Text style={styles.stepEyebrow}>STEP 2 OF 4</Text>
      <Text style={styles.stepTitle}>What are your goals?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply</Text>
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
      <Text style={styles.stepEyebrow}>STEP 3 OF 4</Text>
      <Text style={styles.stepTitle}>Training schedule</Text>
      <Text style={styles.stepSubtitle}>Days per week</Text>
      <View style={styles.dayRow}>
        {[3, 4, 5, 6].map((d) => {
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
                size={20}
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
                size={20}
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
      <MissionButton title="NEXT" onPress={goNext} style={styles.cta} />
    </View>
  );

  const renderIntensity = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEyebrow}>STEP 4 OF 4</Text>
      <Text style={styles.stepTitle}>Preferred intensity</Text>
      <Text style={styles.stepSubtitle}>You can change this later in settings</Text>
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
                      size={22}
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
      <MissionButton title="LET'S GO" onPress={handleComplete} style={styles.cta} />
    </View>
  );

  const steps = [renderWelcome, renderFitnessLevel, renderGoals, renderDaysAndEquipment, renderIntensity];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress bar */}
        <View style={styles.progressBarWrap}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: `${((step) / (TOTAL_STEPS - 1)) * 100}%` },
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
      borderRadius: 2,
      backgroundColor: colors.glassBorder,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 2,
    },
    progressLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.5,
      minWidth: 48,
      textAlign: 'right',
    },

    // Steps shared
    stepContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    stepEyebrow: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 3,
      marginBottom: spacing.sm,
    },
    stepTitle: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    stepSubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: spacing.lg,
      lineHeight: 20,
    },

    // Welcome
    welcomeCenter: {
      alignItems: 'center',
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xl,
    },
    heroBadge: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
      position: 'relative',
    },
    heroBadgeGlow: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: colors.accent,
      opacity: 0.12,
    },
    brandTitle: {
      fontSize: 48,
      fontWeight: '900',
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: 8,
    },
    brandSubtitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.accent,
      textAlign: 'center',
      letterSpacing: 3,
      marginTop: spacing.sm,
      textTransform: 'uppercase',
    },
    brandDesc: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.lg,
      lineHeight: 24,
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
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      backgroundColor: `${colors.accent}18`,
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
      fontSize: 16,
      fontWeight: '700',
      color: colors.textSecondary,
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
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkBox: {
      width: 26,
      height: 26,
      borderRadius: borderRadius.sm,
      borderWidth: 2,
      borderColor: colors.glassBorder,
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
      height: 72,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.glassBackground,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayBtnActive: {
      borderColor: colors.accent,
      backgroundColor: `${colors.accent}18`,
    },
    dayNum: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.textMuted,
    },
    dayNumActive: {
      color: colors.accent,
    },
    dayLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textMuted,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 2,
    },
    dayLabelActive: {
      color: colors.accent,
    },

    // CTA
    cta: {
      marginTop: spacing.xl,
    },
  });
