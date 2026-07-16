import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { branchDefaultTest, getTestsForBranch } from '../data/militaryTests';
import { useUserStore } from '../store/useUserStore';
import { borderRadius, spacing, useColors } from '../theme';
import type { ThemeColors } from '../theme';
import type { FitnessTestType, ServiceBranch } from '../types';

const branches: Array<{ id: ServiceBranch; label: string; short: string }> = [
  { id: 'army', label: 'U.S. Army', short: 'ARMY' }, { id: 'marines', label: 'U.S. Marine Corps', short: 'USMC' },
  { id: 'navy', label: 'U.S. Navy', short: 'NAVY' }, { id: 'air_force', label: 'U.S. Air Force', short: 'USAF' },
  { id: 'space_force', label: 'U.S. Space Force', short: 'USSF' }, { id: 'coast_guard', label: 'U.S. Coast Guard', short: 'USCG' },
  { id: 'general', label: 'General readiness', short: 'GENERAL' },
];

export default function ServiceProfileScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const profile = useUserStore((state) => state.profile);
  const setProfile = useUserStore((state) => state.setProfile);
  const branch = profile?.service_branch ?? 'general';
  const tests = getTestsForBranch(branch);
  const selectedTest = tests.some((test) => test.id === profile?.fitness_test_type) ? profile?.fitness_test_type : branchDefaultTest[branch];
  const selectBranch = (next: ServiceBranch) => profile && setProfile({ ...profile, service_branch: next, fitness_test_type: branchDefaultTest[next] });
  const selectTest = (test: FitnessTestType) => profile && setProfile({ ...profile, fitness_test_type: test });

  return <SafeAreaView style={styles.safe} edges={['bottom']}><ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
    <Text style={styles.kicker}>SERVICE ALIGNMENT</Text><Text style={styles.title}>Your branch drives your test.</Text>
    <Text style={styles.subtitle}>Changing branches immediately replaces the Test Center event board. Scores remain isolated by assessment.</Text>
    <View style={styles.branchGrid} accessibilityRole="radiogroup">{branches.map((item) => { const active = branch === item.id; return <TouchableOpacity key={item.id} style={[styles.branchCard, active && styles.branchCardActive]} onPress={() => selectBranch(item.id)} accessibilityRole="radio" accessibilityState={{ selected: active }}><Text style={[styles.branchShort, active && styles.branchShortActive]}>{item.short}</Text><Text style={[styles.branchName, active && styles.branchNameActive]}>{item.label}</Text></TouchableOpacity>; })}</View>
    <Text style={styles.sectionLabel}>ASSIGNED ASSESSMENT</Text>
    {tests.map((test) => { const active = selectedTest === test.id; return <GlassCard key={test.id} style={[styles.testCard, active && styles.testCardActive]} onPress={() => selectTest(test.id)}><View style={styles.testRow}><View style={{ flex: 1 }}><Text style={styles.testName}>{test.name}</Text><Text style={styles.testMeta}>{test.events.length} events · {test.effectiveLabel}</Text></View><View style={[styles.radio, active && styles.radioActive]}>{active && <View style={styles.radioDot} />}</View></View></GlassCard>; })}
    <Text style={styles.note}>Marine profiles can switch between the PFT and CFT. Other branches receive their current primary assessment lane.</Text>
  </ScrollView></SafeAreaView>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  kicker: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.6 }, title: { color: colors.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: spacing.md }, branchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  branchCard: { width: '48%', minHeight: 68, justifyContent: 'center', padding: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card }, branchCardActive: { borderColor: colors.accent, backgroundColor: `${colors.accent}12` },
  branchShort: { color: colors.textMuted, fontSize: 15, fontWeight: '900', letterSpacing: 1 }, branchShortActive: { color: colors.accent }, branchName: { color: colors.textMuted, fontSize: 10, marginTop: 3 }, branchNameActive: { color: colors.textSecondary },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 2 }, testCard: { marginBottom: 2 }, testCardActive: { borderColor: colors.accent }, testRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  testName: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' }, testMeta: { color: colors.textMuted, fontSize: 10, marginTop: 4 }, radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' }, radioActive: { borderColor: colors.accent }, radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }, note: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: spacing.sm },
});
