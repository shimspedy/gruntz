import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GlassCard } from '../components/GlassCard';
import { GameIcon } from '../components/GameIcon';
import { MissionButton } from '../components/MissionButton';
import { getProgramById } from '../data/programs';
import { useProgramStore } from '../store/useProgramStore';
import { useUserStore } from '../store/useUserStore';
import { getTodaysCheckIn, calculateDailyReadiness, useReadinessStore } from '../store/useReadinessStore';
import { spacing, useColors } from '../theme';
import type { ThemeColors } from '../theme';
import type { MissionsStackParamList } from '../types/navigation';
import { useFloatingTabBarSpacing } from '../hooks/useFloatingTabBarSpacing';

type Nav = NativeStackNavigationProp<MissionsStackParamList, 'Plan'>;

export default function PlanScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const { insets, bottomContentPadding } = useFloatingTabBarSpacing();
  const selectedProgram = useProgramStore((state) => state.selectedProgram);
  const currentWeek = useProgramStore((state) => state.currentWeek);
  const profile = useUserStore((state) => state.profile);
  const checkIns = useReadinessStore((state) => state.checkIns);
  const readiness = calculateDailyReadiness(getTodaysCheckIn(checkIns));
  const program = selectedProgram ? getProgramById(selectedProgram) : null;
  const weeklyDays = profile?.workout_days_per_week ?? 4;
  const recoveryBias = readiness < 50;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: bottomContentPadding }]}>
        <Text style={styles.kicker}>TRAINING ORDER</Text>
        <Text style={styles.title}>Plan</Text>
        <Text style={styles.subtitle}>{program?.name ?? 'Choose a program'} · Week {currentWeek}</Text>

        <GlassCard variant="accent" style={styles.intentCard}>
          <View style={styles.intentHeader}>
            <View style={styles.intentIcon}><GameIcon name={recoveryBias ? 'recovery' : 'program'} size={24} color={colors.accent} animated={false} /></View>
            <View style={{ flex: 1 }}><Text style={styles.intentLabel}>THIS WEEK&apos;S INTENT</Text><Text style={styles.intentTitle}>{recoveryBias ? 'Recover without losing momentum' : 'Build repeatable operational capacity'}</Text></View>
          </View>
          <Text style={styles.intentCopy}>{recoveryBias ? 'Today’s readiness is low, so the plan favors mobility and controlled volume.' : `Your ${weeklyDays}-day schedule balances strength, conditioning, and recovery around your available time.`}</Text>
        </GlassCard>

        <View style={styles.weekHeader}><Text style={styles.sectionTitle}>Seven-day view</Text><Text style={styles.weekTag}>{weeklyDays} TRAINING DAYS</Text></View>
        <View style={styles.weekRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
            const active = index < weeklyDays;
            const today = index === (new Date().getDay() + 6) % 7;
            return <View key={`${day}-${index}`} style={[styles.day, active && styles.dayActive, today && styles.dayToday]}><Text style={[styles.dayText, active && styles.dayTextActive]}>{day}</Text><View style={[styles.dayDot, active && styles.dayDotActive]} /></View>;
          })}
        </View>

        <Text style={styles.sectionTitle}>Capability rotation</Text>
        {[
          { icon: 'strength', title: 'Strength & load carriage', detail: 'Lower-body strength, carries, and resilient trunk work', color: colors.accentRed },
          { icon: 'run', title: 'Aerobic engine', detail: 'Run and ruck capacity with controlled progression', color: colors.accent },
          { icon: 'mission', title: 'Work capacity', detail: 'Short intervals and test-event specificity', color: colors.accentOrange },
          { icon: 'recovery', title: 'Recovery & mobility', detail: 'Movement quality, sleep, hydration, and downshift', color: colors.accentGreen },
        ].map((item) => (
          <GlassCard key={item.title} style={styles.capabilityCard}>
            <View style={[styles.capabilityIcon, { backgroundColor: `${item.color}12` }]}><GameIcon name={item.icon} size={19} color={item.color} animated={false} /></View>
            <View style={{ flex: 1 }}><Text style={styles.capabilityTitle}>{item.title}</Text><Text style={styles.capabilityDetail}>{item.detail}</Text></View>
          </GlassCard>
        ))}

        <MissionButton title="OPEN TRAINING CARDS" onPress={() => navigation.navigate('WorkoutCards')} style={styles.button} />
        <TouchableOpacity style={styles.changePlan} onPress={() => navigation.getParent()?.navigate('ProfileTab' as never)}><Text style={styles.changePlanText}>Change program from Profile</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: spacing.md }, kicker: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.6 }, title: { color: colors.textPrimary, fontSize: 30, fontWeight: '900', letterSpacing: -0.8 }, subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2, marginBottom: spacing.lg },
  intentCard: { marginBottom: spacing.xl, borderLeftWidth: 3, borderLeftColor: colors.accent }, intentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, intentIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.accent}12` }, intentLabel: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, intentTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 2 }, intentCopy: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: spacing.md },
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: spacing.md }, weekTag: { color: colors.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, weekRow: { flexDirection: 'row', gap: 7, marginBottom: spacing.xl }, day: { flex: 1, height: 54, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center', gap: 6 }, dayActive: { backgroundColor: `${colors.accent}0D` }, dayToday: { borderColor: colors.accent }, dayText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' }, dayTextActive: { color: colors.textPrimary }, dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.cardBorder }, dayDotActive: { backgroundColor: colors.accent },
  capabilityCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }, capabilityIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, capabilityTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' }, capabilityDetail: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 2 }, button: { marginTop: spacing.md }, changePlan: { alignItems: 'center', padding: spacing.md }, changePlanText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
});
