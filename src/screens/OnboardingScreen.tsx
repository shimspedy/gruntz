import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { MissionButton } from '../components/MissionButton';
import { Card } from '../components/Card';
import { useUserStore } from '../store/useUserStore';
import type { UserProfile } from '../types';

const fitnessLevels = ['beginner', 'intermediate', 'advanced'] as const;
const goals = ['Lose Fat', 'Build Discipline', 'Improve Endurance', 'Get Stronger', 'Military Prep'];
const intensities = ['low', 'moderate', 'high'] as const;

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { setProfile, setOnboarded } = useUserStore();
  const [step, setStep] = useState(0);
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [hasPool, setHasPool] = useState(false);
  const [hasRuck, setHasRuck] = useState(false);
  const [intensity, setIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleComplete = () => {
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
    onComplete();
  };

  const steps = [
    // Step 0: Welcome
    <View key="welcome" style={styles.stepContainer}>
      <Text style={styles.welcomeEmoji}>⚔️</Text>
      <Text style={styles.welcomeTitle}>GRUNTZ</Text>
      <Text style={styles.welcomeSubtitle}>Military-Grade Fitness</Text>
      <Text style={styles.welcomeDesc}>
        Transform your body with structured, progressive training inspired by elite military fitness programs.
      </Text>
      <MissionButton title="BEGIN" onPress={() => setStep(1)} style={styles.nextButton} />
    </View>,

    // Step 1: Fitness Level
    <View key="fitness" style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your fitness level?</Text>
      {fitnessLevels.map((level) => (
        <TouchableOpacity
          key={level}
          style={[styles.optionCard, fitnessLevel === level && styles.optionSelected]}
          onPress={() => setFitnessLevel(level)}
        >
          <Text style={[styles.optionText, fitnessLevel === level && styles.optionTextSelected]}>
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
      <MissionButton title="NEXT" onPress={() => setStep(2)} style={styles.nextButton} />
    </View>,

    // Step 2: Goals
    <View key="goals" style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What are your goals?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply</Text>
      {goals.map((goal) => (
        <TouchableOpacity
          key={goal}
          style={[styles.optionCard, selectedGoals.includes(goal) && styles.optionSelected]}
          onPress={() => toggleGoal(goal)}
        >
          <Text style={[styles.optionText, selectedGoals.includes(goal) && styles.optionTextSelected]}>
            {goal}
          </Text>
        </TouchableOpacity>
      ))}
      <MissionButton title="NEXT" onPress={() => setStep(3)} style={styles.nextButton} />
    </View>,

    // Step 3: Days & Equipment
    <View key="days" style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Training Days Per Week</Text>
      <View style={styles.daysRow}>
        {[3, 4, 5, 6].map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.dayButton, daysPerWeek === d && styles.dayButtonSelected]}
            onPress={() => setDaysPerWeek(d)}
          >
            <Text style={[styles.dayText, daysPerWeek === d && styles.dayTextSelected]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.stepTitle, { marginTop: spacing.xl }]}>Equipment Access</Text>
      <TouchableOpacity
        style={[styles.optionCard, hasPool && styles.optionSelected]}
        onPress={() => setHasPool(!hasPool)}
      >
        <Text style={[styles.optionText, hasPool && styles.optionTextSelected]}>🏊 Pool Access</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.optionCard, hasRuck && styles.optionSelected]}
        onPress={() => setHasRuck(!hasRuck)}
      >
        <Text style={[styles.optionText, hasRuck && styles.optionTextSelected]}>🎒 Ruck / Weighted Pack</Text>
      </TouchableOpacity>
      <MissionButton title="NEXT" onPress={() => setStep(4)} style={styles.nextButton} />
    </View>,

    // Step 4: Intensity
    <View key="intensity" style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Preferred Intensity</Text>
      {intensities.map((level) => (
        <TouchableOpacity
          key={level}
          style={[styles.optionCard, intensity === level && styles.optionSelected]}
          onPress={() => setIntensity(level)}
        >
          <Text style={[styles.optionText, intensity === level && styles.optionTextSelected]}>
            {level === 'low' ? '🟢 Low — Ease into it' : level === 'moderate' ? '🟡 Moderate — Balanced' : '🔴 High — Push the limits'}
          </Text>
        </TouchableOpacity>
      ))}
      <MissionButton title="LET'S GO" onPress={handleComplete} style={styles.nextButton} />
    </View>,
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Dots */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.dot, step >= i && styles.dotActive]} />
          ))}
        </View>
        {steps[step]}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.backgroundSecondary,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeEmoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 6,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
  welcomeDesc: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.backgroundSecondary,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.accent,
  },
  daysRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dayButton: {
    flex: 1,
    height: 56,
    borderRadius: 2,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.backgroundSecondary,
  },
  dayText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textMuted,
  },
  dayTextSelected: {
    color: colors.accent,
  },
  nextButton: {
    marginTop: spacing.xl,
  },
});
