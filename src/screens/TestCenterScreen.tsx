import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { MissionButton } from '../components/MissionButton';
import { GameIcon } from '../components/GameIcon';
import { branchDefaultTest, getTestsForBranch, getTestReadiness } from '../data/militaryTests';
import { useUserStore } from '../store/useUserStore';
import { useReadinessStore } from '../store/useReadinessStore';
import { borderRadius, spacing, useColors } from '../theme';
import type { ThemeColors } from '../theme';
import { useFloatingTabBarSpacing } from '../hooks/useFloatingTabBarSpacing';
import type { FitnessTestType, ServiceBranch } from '../types';

const branchLabels: Record<ServiceBranch, string> = {
  army: 'U.S. ARMY', marines: 'U.S. MARINE CORPS', navy: 'U.S. NAVY', air_force: 'U.S. AIR FORCE',
  space_force: 'U.S. SPACE FORCE', coast_guard: 'U.S. COAST GUARD', general: 'GENERAL READINESS',
};

function formatValue(value: number, unit: string) {
  if (!value) return '--';
  if (unit !== 'seconds') return `${value}`;
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function daysUntil(date?: string | null) {
  if (!date) return null;
  const diff = new Date(`${date}T12:00:00`).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function TestCenterScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { bottomContentPadding, insets } = useFloatingTabBarSpacing();
  const profile = useUserStore((state) => state.profile);
  const setProfile = useUserStore((state) => state.setProfile);
  const testScores = useReadinessStore((state) => state.testScores);
  const targetScores = useReadinessStore((state) => state.targetScores);
  const setTestScore = useReadinessStore((state) => state.setTestScore);
  const setTargetScore = useReadinessStore((state) => state.setTargetScore);
  const [editing, setEditing] = useState(false);
  const branch = profile?.service_branch ?? 'general';
  const branchTests = getTestsForBranch(branch);
  const selectedTest = branchTests.find((item) => item.id === profile?.fitness_test_type)
    ?? branchTests.find((item) => item.id === branchDefaultTest[branch])
    ?? branchTests[0];
  const test = selectedTest ?? getTestsForBranch('general')[0];
  const scoreKey = (eventId: string) => `${test.id}:${eventId}`;
  const scopedScores = Object.fromEntries(test.events.map((event) => [event.id, testScores[scoreKey(event.id)] ?? 0]));
  const readiness = getTestReadiness(test, scopedScores);
  const countdown = daysUntil(profile?.fitness_test_date);
  const ranked = test.events.map((event) => ({ event, score: getTestReadiness({ ...test, events: [event] }, scopedScores) }))
    .sort((a, b) => a.score - b.score);

  const selectTest = (fitnessTestType: FitnessTestType) => {
    if (profile) setProfile({ ...profile, fitness_test_type: fitnessTestType });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: bottomContentPadding }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>READINESS STANDARD</Text>
            <Text style={styles.title}>Test Center</Text>
            <Text style={styles.subtitle}>{test.name}</Text>
          </View>
          <View style={styles.scoreBlock} accessibilityLabel={`Readiness estimate ${readiness} percent`}>
            <Text style={styles.scoreLabel}>READINESS</Text>
            <Text style={styles.scoreValue}>{readiness}<Text style={styles.scoreUnit}>%</Text></Text>
          </View>
        </View>

        <View style={styles.branchBand}>
          <View style={styles.branchMarker} />
          <View style={{ flex: 1 }}>
            <Text style={styles.branchLabel}>ASSIGNED BRANCH</Text>
            <Text style={styles.branchValue}>{branchLabels[branch]}</Text>
          </View>
          <Text style={styles.branchCount}>{branchTests.length} {branchTests.length === 1 ? 'TEST' : 'TESTS'}</Text>
        </View>

        {branchTests.length > 1 && (
          <View style={styles.testSelector} accessibilityRole="radiogroup">
            {branchTests.map((option) => {
              const active = option.id === test.id;
              return (
                <TouchableOpacity key={option.id} style={[styles.testOption, active && styles.testOptionActive]} onPress={() => selectTest(option.id)} accessibilityRole="radio" accessibilityState={{ selected: active }}>
                  <Text style={[styles.testOptionText, active && styles.testOptionTextActive]}>{option.id === 'marine_pft' ? 'PFT' : 'CFT'}</Text>
                  <Text style={[styles.testOptionSub, active && styles.testOptionSubActive]}>{option.id === 'marine_pft' ? 'PHYSICAL FITNESS' : 'COMBAT FITNESS'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <GlassCard style={styles.countdownCard}>
          <View style={styles.countdownInner}>
            <View style={styles.countdownIcon}><GameIcon name="timer" size={18} color={colors.textSecondary} animated={false} /></View>
            <View style={styles.countdownBody}>
              <Text style={styles.countdownLabel}>NEXT ASSESSMENT</Text>
              <Text style={styles.countdownValue}>{countdown == null ? 'Set a date in Profile' : `${countdown} days`}</Text>
            </View>
            <Text style={styles.policyTag}>{test.effectiveLabel}</Text>
          </View>
        </GlassCard>

        <View style={styles.priorityStrip}>
          <View style={styles.priorityItem}>
            <Text style={styles.priorityLabel}>PRIORITY</Text>
            <Text style={styles.priorityValue}>{ranked[0]?.event.shortName}</Text>
          </View>
          <View style={styles.priorityDivider} />
          <View style={styles.priorityItem}>
            <Text style={styles.priorityLabel}>STRONGEST</Text>
            <Text style={styles.priorityValue}>{ranked.at(-1)?.event.shortName}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionLabel}>EVENT BOARD</Text><Text style={styles.sectionTitle}>Current versus target</Text></View>
          <TouchableOpacity onPress={() => setEditing((value) => !value)} accessibilityRole="button">
            <Text style={styles.editButton}>{editing ? 'DONE' : 'LOG SCORES'}</Text>
          </TouchableOpacity>
        </View>

        {test.events.map((event) => {
          const current = testScores[scoreKey(event.id)] ?? 0;
          const target = targetScores[scoreKey(event.id)] ?? event.target;
          const eventReadiness = getTestReadiness({ ...test, events: [event] }, { [event.id]: current });
          return (
            <GlassCard key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View style={styles.eventIndex}><Text style={styles.eventIndexText}>{String(test.events.indexOf(event) + 1).padStart(2, '0')}</Text></View>
                <View style={styles.eventBody}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventMeta}>{event.direction === 'higher' ? 'Higher is better' : 'Lower is better'} · {event.unit}</Text>
                  {event.alternatives && <Text style={styles.eventAlternatives}>{event.alternatives.join(' · ')}</Text>}
                </View>
                <Text style={styles.eventPercent}>{eventReadiness}%</Text>
              </View>
              {editing ? (
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}><Text style={styles.inputLabel}>CURRENT</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={current ? String(current) : ''} placeholder="0" placeholderTextColor={colors.textMuted} onChangeText={(text) => setTestScore(scoreKey(event.id), Number(text.replace(/[^0-9.]/g, '')) || 0)} /></View>
                  <View style={styles.inputGroup}><Text style={styles.inputLabel}>TARGET</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={String(target)} onChangeText={(text) => setTargetScore(scoreKey(event.id), Number(text.replace(/[^0-9.]/g, '')) || event.target)} /></View>
                </View>
              ) : (
                <View style={styles.valueRow}><Text style={styles.currentValue}>{formatValue(current, event.unit)}</Text><Text style={styles.targetValue}>TARGET {formatValue(target, event.unit)}</Text></View>
              )}
              <View style={styles.track}><View style={[styles.fill, { width: `${eventReadiness}%` }]} /></View>
            </GlassCard>
          );
        })}

        <MissionButton title="START MOCK TEST" onPress={() => setEditing(true)} variant="primary" style={styles.mockButton} />
        <TouchableOpacity style={styles.sourceCard} onPress={() => Linking.openURL(test.sourceUrl)} accessibilityRole="link">
          <GameIcon name="info" size={16} color={colors.textMuted} animated={false} />
          <View style={{ flex: 1 }}><Text style={styles.sourceTitle}>{test.sourceLabel}</Text><Text style={styles.sourceText}>Gruntz estimates are for preparation only. Verify official standards before testing.</Text></View>
          <GameIcon name="arrow" size={14} color={colors.textMuted} animated={false} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.xl },
  kicker: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.textPrimary, fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  scoreBlock: { alignItems: 'flex-end', paddingBottom: 2 },
  scoreLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  scoreValue: { color: colors.textPrimary, fontSize: 30, fontWeight: '700', fontVariant: ['tabular-nums'], lineHeight: 34 }, scoreUnit: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  branchBand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.md },
  branchMarker: { width: 2, height: 28, borderRadius: 1, backgroundColor: colors.accent },
  branchLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  branchValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '900', letterSpacing: 0.5, marginTop: 2 },
  branchCount: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  testSelector: { flexDirection: 'row', padding: 3, gap: 3, marginBottom: spacing.md, backgroundColor: colors.card, borderRadius: borderRadius.md },
  testOption: { flex: 1, minHeight: 52, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: borderRadius.sm },
  testOptionActive: { backgroundColor: colors.backgroundSecondary },
  testOptionText: { color: colors.textSecondary, fontSize: 17, fontWeight: '900' },
  testOptionTextActive: { color: colors.accent },
  testOptionSub: { color: colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 0.8, marginTop: 2 },
  testOptionSubActive: { color: colors.textSecondary },
  countdownCard: { marginBottom: spacing.lg },
  countdownInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  countdownIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' }, countdownBody: { flex: 1 },
  countdownLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, countdownValue: { color: colors.textPrimary, fontSize: 19, fontWeight: '800' }, policyTag: { color: colors.textMuted, fontSize: 8, maxWidth: 90, textAlign: 'right' },
  priorityStrip: { flexDirection: 'row', marginBottom: spacing.xl, paddingVertical: spacing.xs }, priorityItem: { flex: 1 }, priorityDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.cardBorder, marginHorizontal: spacing.md }, priorityLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1 }, priorityValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: spacing.md }, sectionLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 }, sectionTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' }, editButton: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  eventCard: { marginBottom: spacing.sm }, eventHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, eventIndex: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary }, eventIndexText: { color: colors.textMuted, fontSize: 10, fontWeight: '800' }, eventBody: { flex: 1 }, eventName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' }, eventMeta: { color: colors.textMuted, fontSize: 10, marginTop: 2 }, eventPercent: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  eventAlternatives: { color: colors.textMuted, fontSize: 9, lineHeight: 13, marginTop: 4 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.md }, currentValue: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', fontVariant: ['tabular-nums'] }, targetValue: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  track: { height: 3, borderRadius: 2, backgroundColor: colors.cardBorder, marginTop: spacing.md, overflow: 'hidden' }, fill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  inputRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }, inputGroup: { flex: 1 }, inputLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 1, marginBottom: 4 }, input: { minHeight: 46, color: colors.textPrimary, backgroundColor: colors.card, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, fontSize: 18, fontWeight: '800', borderWidth: 1, borderColor: colors.cardBorder },
  mockButton: { marginTop: spacing.md }, sourceCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, marginTop: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.cardBorder }, sourceTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' }, sourceText: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 2 },
});
