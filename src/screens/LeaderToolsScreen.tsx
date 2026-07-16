import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { GameIcon } from '../components/GameIcon';
import { MissionButton } from '../components/MissionButton';
import { calculateDailyReadiness, getTodaysCheckIn, useReadinessStore } from '../store/useReadinessStore';
import { useUserStore } from '../store/useUserStore';
import { borderRadius, spacing, useColors } from '../theme';
import type { ThemeColors } from '../theme';

export default function LeaderToolsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const progress = useUserStore((state) => state.progress);
  const checkIns = useReadinessStore((state) => state.checkIns);
  const teamName = useReadinessStore((state) => state.teamName);
  const teamCode = useReadinessStore((state) => state.teamCode);
  const setTeam = useReadinessStore((state) => state.setTeam);
  const [name, setName] = useState(teamName);
  const [code, setCode] = useState(teamCode);
  const readiness = calculateDailyReadiness(getTodaysCheckIn(checkIns));

  return <SafeAreaView style={styles.safe} edges={['bottom']}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>OPTIONAL TEAM LAYER</Text><Text style={styles.title}>Leader Tools</Text><Text style={styles.subtitle}>Coordinate voluntary training without turning personal health data into a leaderboard.</Text>
    <GlassCard variant="accent" style={styles.privacyCard}><GameIcon name="lock" size={22} color={colors.accent} animated={false} /><View style={{ flex: 1 }}><Text style={styles.privacyTitle}>Privacy by default</Text><Text style={styles.privacyText}>Only completion and user-approved readiness status are designed to be shared. Body weight, medical limitations, sleep details, and exact scores stay private.</Text></View></GlassCard>
    <Text style={styles.sectionTitle}>Team setup</Text>
    <GlassCard style={styles.section}>
      <Text style={styles.inputLabel}>TEAM / SECTION NAME</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Example: Alpha Section" placeholderTextColor={colors.textMuted} />
      <Text style={styles.inputLabel}>INVITE CODE</Text><TextInput style={styles.input} value={code} onChangeText={setCode} autoCapitalize="characters" maxLength={12} placeholder="GRUNTZ-01" placeholderTextColor={colors.textMuted} />
      <MissionButton title="SAVE TEAM" onPress={() => setTeam(name.trim(), code.trim().toUpperCase())} style={{ marginTop: spacing.md }} />
    </GlassCard>
    <Text style={styles.sectionTitle}>My share preview</Text>
    <View style={styles.metricRow}>
      <GlassCard style={styles.metric}><Text style={styles.metricValue}>{progress.workouts_completed}</Text><Text style={styles.metricLabel}>SESSIONS</Text></GlassCard>
      <GlassCard style={styles.metric}><Text style={styles.metricValue}>{progress.streak_days}</Text><Text style={styles.metricLabel}>STREAK</Text></GlassCard>
      <GlassCard style={styles.metric}><Text style={[styles.metricValue, { color: readiness >= 50 ? colors.accentGreen : colors.accentOrange }]}>{readiness >= 75 ? 'GREEN' : readiness >= 50 ? 'AMBER' : 'PRIVATE'}</Text><Text style={styles.metricLabel}>STATUS</Text></GlassCard>
    </View>
    <GlassCard style={styles.section}><Text style={styles.emptyTitle}>No cloud roster connected</Text><Text style={styles.emptyText}>This local-first release prepares the permission model and share preview. A future authenticated roster can be added without exposing private readiness inputs.</Text></GlassCard>
  </ScrollView></SafeAreaView>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.md, paddingBottom: spacing.xxl }, kicker: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { color: colors.textPrimary, fontSize: 29, fontWeight: '900' }, subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: spacing.lg }, privacyCard: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl }, privacyTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' }, privacyText: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 3 }, sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: spacing.sm }, section: { marginBottom: spacing.lg }, inputLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginBottom: 5, marginTop: spacing.sm }, input: { minHeight: 48, color: colors.textPrimary, backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.md, fontSize: 14, fontWeight: '700' }, metricRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }, metric: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs }, metricValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' }, metricLabel: { color: colors.textMuted, fontSize: 7, fontWeight: '900', letterSpacing: 0.7, marginTop: 4 }, emptyTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' }, emptyText: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 4 } });
