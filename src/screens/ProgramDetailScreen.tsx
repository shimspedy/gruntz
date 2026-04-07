import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import { hapticMedium } from '../utils/haptics';
import { useFadeInUp } from '../utils/animations';
import type { ThemeColors } from '../theme';
import { getProgramById } from '../data/programs';
import { useProgramStore } from '../store/useProgramStore';
import type { HomeStackParamList } from '../types/navigation';
import type { ProgramPhase, ProgramId } from '../types';
import { GameIcon } from '../components/GameIcon';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'ProgramDetail'>;
type Route = RouteProp<HomeStackParamList, 'ProgramDetail'>;

const TAB_BAR_HEIGHT = 72;

export default function ProgramDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const heroAnim = useFadeInUp(500);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { selectProgram, setHasSeenProgramSelect } = useProgramStore();

  const program = getProgramById(route.params.programId);
  if (!program) return null;

  const accentColor = program.id === 'raider' ? colors.accent : colors.accentOrange;

  const handleStart = () => {
    hapticMedium();
    Alert.alert(
      `Start ${program.name}?`,
      `This will set your active program to ${program.name}. You can switch anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Program',
          onPress: () => {
            selectProgram(program.id as ProgramId);
            setHasSeenProgramSelect(true);
            navigation.popToTop();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Hero */}
        <Animated.View style={[styles.hero, { opacity: heroAnim.opacity, transform: heroAnim.transform }]}>
          <GameIcon name={program.icon} size={72} color={accentColor} style={styles.heroIcon} />
          <Text style={styles.heroName} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{program.name}</Text>
          <Text style={[styles.heroSub, { color: accentColor }]} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{program.subtitle}</Text>
        </Animated.View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{program.duration_weeks}</Text>
            <Text style={styles.statLbl}>Weeks</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{program.days_per_week}</Text>
            <Text style={styles.statLbl}>Days/Wk</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: accentColor }]}>{program.difficulty.toUpperCase()}</Text>
            <Text style={styles.statLbl}>Difficulty</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>{program.description}</Text>

        {/* Phases */}
        <Text style={styles.sectionTitle}>TRAINING PHASES</Text>
        {program.phases.map((phase) => (
          <PhaseCard key={phase.phase_number} phase={phase} accent={accentColor} styles={styles} />
        ))}

        {/* Focus Areas */}
        <Text style={styles.sectionTitle}>FOCUS AREAS</Text>
        <View style={styles.chipRow}>
          {program.focus_areas.map((area) => (
            <View key={area} style={[styles.chip, { borderColor: accentColor }]}>
              <Text style={[styles.chipText, { color: accentColor }]}>{area}</Text>
            </View>
          ))}
        </View>

        {/* Equipment */}
        <Text style={styles.sectionTitle}>EQUIPMENT NEEDED</Text>
        {program.equipment_needed.map((item) => (
          <View key={item} style={styles.equipRow}>
            <View style={styles.equipDot} />
            <Text style={styles.equipText}>{item}</Text>
          </View>
        ))}

        {/* Prerequisites */}
        <Text style={styles.sectionTitle}>PREREQUISITES</Text>
        {program.prerequisites.map((item) => (
          <View key={item} style={styles.equipRow}>
            <View style={[styles.equipDot, styles.prereqDot, { backgroundColor: colors.accentGold }]} />
            <Text style={styles.equipText}>{item}</Text>
          </View>
        ))}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Fixed bottom button — above glass tab bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT }]}>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: accentColor }]}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>START {program.name.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function PhaseCard({ phase, accent, styles }: { phase: ProgramPhase; accent: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.phaseCard}>
      <View style={styles.phaseHeader}>
        <View style={[styles.phaseNum, { backgroundColor: accent }]}>
          <Text style={styles.phaseNumText}>{phase.phase_number}</Text>
        </View>
        <View style={styles.phaseHeaderText}>
          <Text style={styles.phaseName}>{phase.name}</Text>
          <Text style={styles.phaseWeeks}>Weeks {phase.weeks[0]}–{phase.weeks[1]}</Text>
        </View>
        {phase.is_deload_included && (
          <View style={styles.deloadBadge}>
            <Text style={styles.deloadText}>DELOAD</Text>
          </View>
        )}
      </View>
      <Text style={styles.phaseDesc}>{phase.description}</Text>
      <Text style={[styles.phaseFocus, { color: accent }]}>Focus: {phase.focus}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 180 },
  hero: { alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.md },
  heroIcon: { marginBottom: spacing.sm },
  heroName: { fontSize: 28, fontWeight: '900', color: colors.textPrimary },
  heroSub: { fontSize: 14, fontWeight: '700', letterSpacing: 1.5, marginTop: 4 },
  statsBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: colors.card, borderRadius: 2, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.lg,
  },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  statLbl: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 2 },
  description: {
    fontSize: 15, color: colors.textSecondary, lineHeight: 23,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 2, marginBottom: spacing.md, marginTop: spacing.md,
  },
  phaseCard: {
    backgroundColor: colors.card, borderRadius: 2, padding: spacing.md,
    borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm,
  },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  phaseNum: {
    width: 28, height: 28, borderRadius: 2, alignItems: 'center', justifyContent: 'center',
  },
  phaseNumText: { fontSize: 14, fontWeight: '900', color: colors.background },
  phaseHeaderText: { marginLeft: spacing.sm, flex: 1 },
  phaseName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  phaseWeeks: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  deloadBadge: {
    backgroundColor: colors.backgroundSecondary, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  deloadText: { fontSize: 9, fontWeight: '800', color: colors.accentGold, letterSpacing: 1 },
  phaseDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 4 },
  phaseFocus: { fontSize: 12, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: {
    borderWidth: 1, borderRadius: 2, paddingHorizontal: 10, paddingVertical: 5,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  equipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  equipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
    marginRight: spacing.sm,
  },
  prereqDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  equipText: { fontSize: 14, color: colors.textSecondary },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background, padding: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.cardBorder,
  },
  startButton: {
    borderRadius: 2, paddingVertical: 16, alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16, fontWeight: '900', color: colors.background, letterSpacing: 1.5,
  },
});
