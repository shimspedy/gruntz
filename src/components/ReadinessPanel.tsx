import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { GameIcon } from './GameIcon';
import { MissionButton } from './MissionButton';
import { calculateDailyReadiness, getTodaysCheckIn, useReadinessStore } from '../store/useReadinessStore';
import { getLocalDateKey } from '../utils/dateKey';
import { hapticSelection, hapticSuccess } from '../utils/haptics';
import { borderRadius, spacing, useColors } from '../theme';
import type { ThemeColors } from '../theme';

function statusFor(score: number) {
  if (score >= 75) return { label: 'GREEN', action: 'Train as planned', tone: 'green' as const };
  if (score >= 50) return { label: 'AMBER', action: 'Control volume', tone: 'amber' as const };
  return { label: 'RED', action: 'Recovery priority', tone: 'red' as const };
}

export function ReadinessPanel() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const checkIns = useReadinessStore((state) => state.checkIns);
  const saveCheckIn = useReadinessStore((state) => state.saveCheckIn);
  const today = getTodaysCheckIn(checkIns);
  const [expanded, setExpanded] = useState(!today);
  const [sleepHours, setSleepHours] = useState(today?.sleepHours ?? 7);
  const [energy, setEnergy] = useState(today?.energy ?? 3);
  const [soreness, setSoreness] = useState(today?.soreness ?? 2);
  const [stress, setStress] = useState(today?.stress ?? 2);
  const [hydration, setHydration] = useState(today?.hydration ?? 3);
  const draft = { date: getLocalDateKey(), sleepHours, energy, soreness, stress, hydration };
  const score = calculateDailyReadiness(today ?? draft);
  const status = statusFor(score);
  const tone = status.tone === 'green' ? colors.accentGreen : status.tone === 'amber' ? colors.accentOrange : colors.accentRed;

  const Scale = ({ label, value, onChange, reverse = false }: { label: string; value: number; onChange: (value: number) => void; reverse?: boolean }) => (
    <View style={styles.scaleRow}>
      <Text style={styles.scaleLabel}>{label}</Text>
      <View style={styles.scaleOptions}>{[1, 2, 3, 4, 5].map((option) => <TouchableOpacity key={option} accessibilityRole="radio" accessibilityState={{ selected: value === option }} accessibilityLabel={`${label} ${option} of 5`} onPress={() => { hapticSelection(); onChange(option); }} style={[styles.scaleButton, value === option && { borderColor: reverse && option >= 4 ? colors.accentOrange : colors.accent, backgroundColor: `${reverse && option >= 4 ? colors.accentOrange : colors.accent}16` }]}><Text style={[styles.scaleValue, value === option && { color: reverse && option >= 4 ? colors.accentOrange : colors.accent }]}>{option}</Text></TouchableOpacity>)}</View>
    </View>
  );

  return (
    <GlassCard variant="default" style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded((value) => !value)} accessibilityRole="button" accessibilityLabel="Open daily readiness check-in">
        <View style={[styles.score, { borderColor: tone }]}><Text style={styles.scoreValue}>{score}</Text></View>
        <View style={styles.headerBody}><Text style={styles.eyebrow}>DAILY READINESS</Text><Text style={styles.title}>{status.label} · {status.action}</Text><Text style={styles.subtitle}>{today ? 'Today’s check-in is saved' : '60-second check-in before training'}</Text></View>
        <GameIcon name="arrow" size={14} color={colors.textMuted} animated={false} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.form}>
          <View style={styles.sleepRow}><Text style={styles.scaleLabel}>SLEEP</Text><View style={styles.sleepOptions}>{[5, 6, 7, 8, 9].map((hours) => <TouchableOpacity key={hours} onPress={() => setSleepHours(hours)} style={[styles.sleepButton, sleepHours === hours && styles.sleepButtonActive]}><Text style={[styles.scaleValue, sleepHours === hours && styles.scaleValueActive]}>{hours}h</Text></TouchableOpacity>)}</View></View>
          <Scale label="ENERGY" value={energy} onChange={setEnergy} />
          <Scale label="SORENESS" value={soreness} onChange={setSoreness} reverse />
          <Scale label="STRESS" value={stress} onChange={setStress} reverse />
          <Scale label="HYDRATION" value={hydration} onChange={setHydration} />
          <MissionButton title="SAVE READINESS" onPress={() => { saveCheckIn(draft); hapticSuccess(); setExpanded(false); }} style={styles.saveButton} />
          <Text style={styles.disclaimer}>A training aid—not medical clearance. Follow duty restrictions and seek care for concerning symptoms.</Text>
        </View>
      )}
    </GlassCard>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { marginBottom: spacing.lg }, header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, score: { width: 46, height: 46, borderRadius: 12, borderWidth: 1, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' }, scoreValue: { color: colors.textPrimary, fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] }, headerBody: { flex: 1 }, eyebrow: { color: colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 1.3 }, title: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 2 }, subtitle: { color: colors.textMuted, fontSize: 10, marginTop: 2 }, form: { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.cardBorder, gap: spacing.sm }, scaleRow: { flexDirection: 'row', alignItems: 'center' }, scaleLabel: { width: 78, color: colors.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 }, scaleOptions: { flex: 1, flexDirection: 'row', gap: 6 }, scaleButton: { flex: 1, height: 34, borderRadius: 9, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' }, scaleValue: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' }, scaleValueActive: { color: colors.accent }, sleepRow: { flexDirection: 'row', alignItems: 'center' }, sleepOptions: { flex: 1, flexDirection: 'row', gap: 6 }, sleepButton: { flex: 1, height: 34, borderRadius: 9, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' }, sleepButtonActive: { borderColor: colors.accent, backgroundColor: `${colors.accent}16` }, saveButton: { marginTop: spacing.sm }, disclaimer: { color: colors.textMuted, fontSize: 9, lineHeight: 14, textAlign: 'center' },
});
