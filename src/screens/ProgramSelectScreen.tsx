import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { PROGRAMS } from '../data/programs';
import { hapticLight } from '../utils/haptics';
import type { HomeStackParamList } from '../types/navigation';
import type { TrainingProgram } from '../types';
import { GameIcon } from '../components/GameIcon';
type Nav = NativeStackNavigationProp<HomeStackParamList, 'ProgramSelect'>;

export default function ProgramSelectScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.headerLabel}>SELECT YOUR PROGRAM</Text>
        <Text style={styles.headerTitle}>Choose Your Path</Text>
        <Text style={styles.headerSub}>
          Two elite programs. One goal: be ready.
        </Text>

        {PROGRAMS.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
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

function ProgramCard({ program, onPress, colors, styles }: { program: TrainingProgram; onPress: () => void; colors: ThemeColors; styles: ReturnType<typeof createStyles> }) {
  const accentColor = program.id === 'raider' ? colors.accent : colors.accentOrange;

  return (
    <TouchableOpacity style={[styles.card, { borderColor: accentColor }]} onPress={() => { hapticLight(); onPress(); }} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <GameIcon name={program.icon} size={44} color={accentColor} style={styles.cardIcon} />
        <View style={styles.cardDiffBadge}>
          <Text style={[styles.cardDiffText, { color: accentColor }]}>{program.difficulty.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.cardName}>{program.name}</Text>
      <Text style={[styles.cardSubtitle, { color: accentColor }]}>{program.subtitle}</Text>
      <Text style={styles.cardDesc}>{program.description}</Text>

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
        <Text style={styles.cardButtonText}>VIEW PROGRAM →</Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  headerLabel: {
    fontSize: 11, fontWeight: '700', color: colors.accent,
    letterSpacing: 3, marginBottom: spacing.xs, marginTop: spacing.md,
  },
  headerTitle: {
    fontSize: 32, fontWeight: '900', color: colors.textPrimary, marginBottom: spacing.xs,
  },
  headerSub: {
    fontSize: 15, color: colors.textSecondary, marginBottom: spacing.xl, lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card, borderRadius: 2, borderWidth: 1,
    padding: spacing.lg, marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md,
  },
  cardIcon: {},
  cardDiffBadge: {
    backgroundColor: colors.backgroundSecondary, borderRadius: 2,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  cardDiffText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  cardName: { fontSize: 24, fontWeight: '900', color: colors.textPrimary, marginBottom: 2 },
  cardSubtitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.sm },
  cardDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginBottom: spacing.md },
  cardStats: {
    flexDirection: 'row', backgroundColor: colors.backgroundSecondary,
    borderRadius: 2, padding: spacing.md, marginBottom: spacing.md,
    justifyContent: 'space-around', alignItems: 'center',
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.cardBorder },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  focusChip: {
    borderWidth: 1, borderRadius: 2,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  focusChipText: { fontSize: 11, fontWeight: '700' },
  cardButton: {
    borderRadius: 2, paddingVertical: 14, alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 14, fontWeight: '800', color: colors.background, letterSpacing: 1,
  },
  footer: {
    fontSize: 13, color: colors.textMuted, textAlign: 'center',
    marginTop: spacing.sm, marginBottom: spacing.xl,
  },
});
