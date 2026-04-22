import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { PROGRAMS } from '../data/programs';
import { recommendProgramForProfile } from '../services/adaptiveCoach';
import { hapticLight } from '../utils/haptics';
import { useUserStore } from '../store/useUserStore';
import type { HomeStackParamList } from '../types/navigation';
import type { ProgramId, TrainingProgram } from '../types';
import { GameIcon } from '../components/GameIcon';
type Nav = NativeStackNavigationProp<HomeStackParamList, 'ProgramSelect'>;

export default function ProgramSelectScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((s) => s.profile);
  const recommendation = useMemo(() => (profile ? recommendProgramForProfile(profile) : null), [profile]);
  const bottomContentPadding = Math.max(spacing.xxl, tabBarHeight + insets.bottom + spacing.lg);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: bottomContentPadding }]}>
        <Text style={styles.headerLabel}>SELECT YOUR PROGRAM</Text>
        <Text style={styles.headerTitle}>Choose Your Path</Text>
        <Text style={styles.headerSub}>
          Start with Base Camp or move into tactical prep when your answers match the prerequisites.
        </Text>

        {PROGRAMS.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            recommended={recommendation?.programId === program.id}
            recommendationReason={recommendation?.programId === program.id ? recommendation.reason : undefined}
            onPress={() => navigation.navigate('ProgramDetail', { programId: program.id })}
            colors={colors}
            styles={styles}
          />
        ))}

        <Text style={styles.footer}>
          You can switch programs at any time from your profile.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function getProgramAccentColor(programId: ProgramId, colors: ThemeColors) {
  if (programId === 'basecamp') return colors.accentGreen;
  if (programId === 'recon') return colors.accentOrange;
  return colors.accent;
}

function ProgramCard({
  program,
  recommended,
  recommendationReason,
  onPress,
  colors,
  styles,
}: {
  program: TrainingProgram;
  recommended?: boolean;
  recommendationReason?: string;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const accentColor = getProgramAccentColor(program.id, colors);

  return (
    <TouchableOpacity style={[styles.card, { borderColor: accentColor }]} onPress={() => { hapticLight(); onPress(); }} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <GameIcon name={program.icon} size={32} color={accentColor} style={styles.cardIcon} />
        <View style={styles.badgeGroup}>
          {recommended ? (
            <View style={[styles.cardDiffBadge, { backgroundColor: `${accentColor}22` }]}>
              <Text style={[styles.cardDiffText, { color: accentColor }]}>RECOMMENDED</Text>
            </View>
          ) : null}
          <View style={styles.cardDiffBadge}>
            <Text style={[styles.cardDiffText, { color: accentColor }]}>{program.difficulty.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.cardName}>{program.name}</Text>
      <Text style={[styles.cardSubtitle, { color: accentColor }]}>{program.subtitle}</Text>
      <Text style={styles.cardDesc}>{program.description}</Text>
      {recommendationReason ? <Text style={styles.recommendReason}>{recommendationReason}</Text> : null}

      <View style={styles.cardStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{program.duration_weeks}</Text>
          <Text style={styles.statLabel}>Weeks</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{program.days_per_week}</Text>
          <Text style={styles.statLabel}>Days/Wk</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{program.phases.length}</Text>
          <Text style={styles.statLabel}>Phases</Text>
        </View>
      </View>

      <View style={styles.focusRow}>
        {program.focus_areas.slice(0, 3).map((area) => (
          <View key={area} style={[styles.focusChip, { borderColor: accentColor }]}>
            <Text style={[styles.focusChipText, { color: accentColor }]}>{area}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.cardButton, { backgroundColor: accentColor }]}>
        <Text style={styles.cardButtonText}>View Program</Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  headerLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: spacing.xs, marginTop: spacing.md,
  },
  headerTitle: {
    fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs,
  },
  headerSub: {
    fontSize: 13, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 19,
  },
  card: {
    backgroundColor: colors.card, borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm,
  },
  cardIcon: {},
  badgeGroup: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  cardDiffBadge: {
    backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  cardDiffText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  cardName: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 2, lineHeight: 26 },
  cardSubtitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: spacing.sm },
  cardDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: spacing.md },
  recommendReason: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    backgroundColor: `${colors.accentGreen}0D`,
    borderLeftWidth: 2,
    borderLeftColor: colors.accentGreen,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  cardStats: {
    flexDirection: 'row', backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm, padding: spacing.sm + 2, marginBottom: spacing.md,
    justifyContent: 'space-around', alignItems: 'center',
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '500', color: colors.textMuted, marginTop: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 24, backgroundColor: colors.cardBorder },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  focusChip: {
    borderWidth: StyleSheet.hairlineWidth, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  focusChipText: { fontSize: 11, fontWeight: '600' },
  cardButton: {
    borderRadius: borderRadius.md, paddingVertical: spacing.sm + 2, alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 12, fontWeight: '700', color: colors.background, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  footer: {
    fontSize: 12, color: colors.textMuted, textAlign: 'center',
    marginTop: spacing.sm, marginBottom: spacing.xl,
  },
});
