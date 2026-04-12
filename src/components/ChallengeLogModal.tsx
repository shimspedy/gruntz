import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { formatChallengeAmount } from '../data/dailyChallenges';
import type { DailyChallenge } from '../data/dailyChallenges';
import { useAdaptiveLayout } from '../hooks/useAdaptiveLayout';
import { borderRadius, MAX_FONT_MULTIPLIER, spacing, useColors } from '../theme';
import type { ThemeColors } from '../theme';
import { hapticLight, hapticSelection } from '../utils/haptics';
import { GameIcon } from './GameIcon';
import { GlassModal } from './GlassModal';
import { MissionButton } from './MissionButton';

interface ChallengeLogModalProps {
  visible: boolean;
  challenge: DailyChallenge | null;
  currentProgress: number;
  todayCompleted: boolean;
  onAddProgress: (amount: number) => void;
  onComplete: () => void;
  onClose: () => void;
}

type ChallengeInputMode = 'reps' | 'time' | 'distance';

function getChallengeInputMode(challenge: DailyChallenge): ChallengeInputMode {
  if (challenge.unit === 'seconds' || challenge.unit === 'minutes' || challenge.type === 'time') {
    return 'time';
  }

  if (challenge.unit === 'km' || challenge.unit === 'miles' || challenge.type === 'distance') {
    return 'distance';
  }

  return 'reps';
}

function roundToStep(value: number, step: number) {
  if (step <= 0) {
    return value;
  }

  return Math.max(step, Math.round(value / step) * step);
}

function getQuickAddOptions(challenge: DailyChallenge, remaining: number): number[] {
  const mode = getChallengeInputMode(challenge);
  const target = challenge.target;
  let options: number[] = [];

  if (mode === 'distance') {
    const step = target >= 5 ? 0.5 : 0.25;
    options = [
      step,
      roundToStep(target * 0.25, step),
      roundToStep(target * 0.5, step),
    ];
  } else if (mode === 'time') {
    if (challenge.unit === 'minutes') {
      options = [5, 10, 15];
    } else {
      const step = target >= 300 ? 60 : 30;
      options = [
        step,
        roundToStep(target * 0.25, step),
        roundToStep(target * 0.5, step),
      ];
    }
  } else {
    const step = target >= 100 ? 10 : target >= 40 ? 5 : 1;
    options = [
      step,
      roundToStep(target * 0.25, step),
      roundToStep(target * 0.5, step),
    ];
  }

  const filtered = Array.from(
    new Set(
      options
        .map((value) => Math.round(value * 100) / 100)
        .filter((value) => value > 0 && value <= remaining))
    ).sort((a, b) => a - b);

  if (filtered.length > 0 || remaining <= 0) {
    return filtered;
  }

  return [Math.round(Math.min(remaining, target) * 100) / 100];
}

function formatChallengeMetric(value: number, challenge: DailyChallenge): string {
  if (challenge.unit === 'seconds') {
    return formatChallengeAmount(value, challenge);
  }

  return `${formatChallengeAmount(value, challenge)} ${challenge.unit}`;
}

function formatChallengeProgressText(progress: number, challenge: DailyChallenge): string {
  if (challenge.unit === 'seconds') {
    return `${formatChallengeAmount(progress, challenge)} / ${formatChallengeAmount(challenge.target, challenge)}`;
  }

  return `${formatChallengeAmount(progress, challenge)} / ${formatChallengeAmount(challenge.target, challenge)} ${challenge.unit}`;
}

export function ChallengeLogModal({
  visible,
  challenge,
  currentProgress,
  todayCompleted,
  onAddProgress,
  onComplete,
  onClose,
}: ChallengeLogModalProps) {
  const colors = useColors();
  const { size } = useAdaptiveLayout();
  const styles = useMemo(() => createStyles(colors, size !== 'compact'), [colors, size]);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    setCustomValue('');
  }, [challenge?.id, visible]);

  if (!challenge) {
    return null;
  }

  const progress = todayCompleted
    ? challenge.target
    : Math.min(currentProgress, challenge.target);
  const remaining = Math.max(challenge.target - progress, 0);
  const percentComplete = challenge.target > 0 ? Math.min((progress / challenge.target) * 100, 100) : 0;
  const inputMode = getChallengeInputMode(challenge);
  const quickAdds = todayCompleted ? [] : getQuickAddOptions(challenge, remaining);
  const keyboardType = inputMode === 'distance' ? 'decimal-pad' : 'number-pad';
  const placeholder = inputMode === 'distance' ? '0.5' : inputMode === 'time' ? '30' : '25';

  const handleQuickAdd = (amount: number) => {
    hapticSelection();
    onAddProgress(amount);
  };

  const handleAddCustom = () => {
    const parsed = Number.parseFloat(customValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }

    hapticLight();
    onAddProgress(parsed);
    setCustomValue('');
  };

  return (
    <GlassModal visible={visible} onClose={onClose}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <GameIcon name={challenge.icon} size={28} color={colors.accent} />
          </View>
          <View style={styles.headerBody}>
            <Text style={styles.eyebrow} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
              DAILY CHALLENGE
            </Text>
            <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
              {challenge.name}
            </Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
              {challenge.description}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
              TARGET
            </Text>
            <Text style={styles.metricValue} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
              {formatChallengeMetric(challenge.target, challenge)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
              REMAINING
            </Text>
            <Text style={styles.metricValue} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
              {todayCompleted ? formatChallengeMetric(0, challenge) : formatChallengeMetric(remaining, challenge)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
              REWARD
            </Text>
            <Text style={styles.metricValueAccent} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
              +{challenge.xpReward} XP
            </Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
              PROGRESS
            </Text>
            <Text style={styles.progressCopy} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
              {formatChallengeProgressText(progress, challenge)}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percentComplete}%`,
                  backgroundColor: todayCompleted ? colors.accentGreen : colors.accent,
                },
              ]}
            />
          </View>
          <Text style={styles.progressHint} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
            {todayCompleted
              ? 'XP has already been awarded for today.'
              : `${formatChallengeMetric(remaining, challenge)} left to finish.`}
          </Text>
        </View>

        {todayCompleted ? (
          <View style={styles.completeBanner}>
            <GameIcon name="xp" size={18} color={colors.accentGreen} />
            <Text style={styles.completeBannerText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
              Challenge complete. Today&apos;s XP is secured.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
                QUICK LOG
              </Text>
              <View style={styles.quickAddGrid}>
                {quickAdds.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickAddChip}
                    onPress={() => handleQuickAdd(amount)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.quickAddText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
                      +{formatChallengeMetric(amount, challenge)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
                CUSTOM LOG
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={customValue}
                  onChangeText={setCustomValue}
                  keyboardType={keyboardType}
                  placeholder={placeholder}
                  placeholderTextColor={colors.textMuted}
                />
                <View style={styles.inputUnit}>
                  <Text style={styles.inputUnitText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
                    {challenge.unit.toUpperCase()}
                  </Text>
                </View>
              </View>
              <MissionButton
                title="ADD PROGRESS"
                onPress={handleAddCustom}
                variant="secondary"
                disabled={customValue.trim().length === 0}
              />
            </View>

            <View style={styles.actions}>
              <MissionButton
                title="MARK COMPLETE"
                onPress={onComplete}
                variant="primary"
                icon="xp"
              />
            </View>
          </>
        )}
      </ScrollView>
    </GlassModal>
  );
}

const createStyles = (colors: ThemeColors, isWide: boolean) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    headerIcon: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.accent + '12',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerBody: {
      flex: 1,
      gap: spacing.xs,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 1.8,
    },
    title: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    metricsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    metricCard: {
      flexBasis: isWide ? '31%' : '48%',
      flexGrow: 1,
      minWidth: 120,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
      gap: spacing.xs,
    },
    metricLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 1.2,
    },
    metricValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    metricValueAccent: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.accent,
    },
    progressCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
      gap: spacing.sm,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.md,
    },
    progressLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 1.4,
    },
    progressCopy: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      textAlign: 'right',
      flexShrink: 1,
    },
    progressTrack: {
      height: 10,
      borderRadius: borderRadius.full,
      backgroundColor: colors.cardBorder,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: borderRadius.full,
    },
    progressHint: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    completeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.accentGreen + '14',
      borderWidth: 1,
      borderColor: colors.accentGreen + '30',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    completeBannerText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: colors.accentGreen,
      lineHeight: 18,
    },
    section: {
      gap: spacing.sm,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 1.4,
    },
    quickAddGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    quickAddChip: {
      minWidth: isWide ? 144 : 120,
      borderRadius: borderRadius.full,
      backgroundColor: colors.accent + '14',
      borderWidth: 1,
      borderColor: colors.accent + '30',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickAddText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.accent,
    },
    inputRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'stretch',
    },
    input: {
      flex: 1,
      minHeight: 56,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: spacing.md,
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '800',
    },
    inputUnit: {
      minWidth: 92,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    inputUnitText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
      letterSpacing: 1.2,
    },
    actions: {
      gap: spacing.sm,
    },
  });
