import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFadeInUp } from '../utils/animations';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { Card } from '../components/Card';
import { GameIcon } from '../components/GameIcon';
import { XPBar } from '../components/XPBar';
import { useUserStore } from '../store/useUserStore';
import { useProgramStore } from '../store/useProgramStore';
import { getXPToNextLevel } from '../utils/xp';
import { getRankInfo } from '../data/ranks';
import { getProgramById } from '../data/programs';
import { hapticLight } from '../utils/haptics';
import { useAdaptiveLayout } from '../hooks/useAdaptiveLayout';
import type { ProfileStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const heroAnim = useFadeInUp(500);
  const { contentMaxWidth, horizontalPadding } = useAdaptiveLayout();
  const navigation = useNavigation<Nav>();
  const { progress, profile } = useUserStore();
  const xpInfo = getXPToNextLevel(progress.current_xp);
  const rankInfo = getRankInfo(progress.current_rank);

  const { selectedProgram } = useProgramStore();
  const activeProgram = selectedProgram ? getProgramById(selectedProgram) : null;

  const menuItems = [
    { label: activeProgram ? `Program: ${activeProgram.name}` : 'Choose Program', icon: 'program', screen: 'ProgramSelect' as const },
    { label: 'Achievements', icon: 'achievement', screen: 'Achievements' as const },
    { label: 'Settings', icon: 'settings', screen: 'Settings' as const },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { maxWidth: contentMaxWidth, alignSelf: 'center', paddingHorizontal: horizontalPadding }]}>
        {/* Profile Header */}
        <Animated.View style={[styles.header, { opacity: heroAnim.opacity, transform: heroAnim.transform }]}>
          <View style={styles.avatarCircle}>
            <GameIcon name={rankInfo?.icon || 'rank'} size={68} color={colors.accent} style={styles.avatarEmoji} />
          </View>
          <Text style={styles.displayName} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{profile?.display_name || 'Warrior'}</Text>
          <Text style={styles.rankText}>{progress.current_rank} • Level {progress.current_level}</Text>
          <View style={styles.streakBadge}>
            <GameIcon name="streak" size={20} color={colors.streakFire} variant="minimal" />
            <Text style={styles.streakText}>{progress.streak_days}-day streak</Text>
          </View>
        </Animated.View>

        {/* XP Bar */}
        <Card style={styles.section}>
          <XPBar current={xpInfo.current} required={xpInfo.required} level={progress.current_level} />
          <Text style={styles.totalXP}>{progress.current_xp.toLocaleString()} Total XP</Text>
        </Card>

        {/* Fitness Scores */}
        <Card title="Fitness Scores" style={styles.section}>
          <View style={styles.scoreGrid}>
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreValue, { color: colors.accent }]}>{progress.strength_score}</Text>
              <Text style={styles.scoreLabel}>Strength</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreValue, { color: colors.accentGreen }]}>{progress.endurance_score}</Text>
              <Text style={styles.scoreLabel}>Endurance</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreValue, { color: colors.accentOrange }]}>{progress.stamina_score}</Text>
              <Text style={styles.scoreLabel}>Stamina</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreValue, { color: colors.accentGold }]}>{progress.consistency_score}</Text>
              <Text style={styles.scoreLabel}>Consistency</Text>
            </View>
          </View>
        </Card>

        {/* Stats */}
        <Card title="Overall Stats" style={styles.section}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Missions Completed</Text>
            <Text style={styles.statValue}>{progress.workouts_completed}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={styles.statValue}>{progress.streak_days} days</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Reps</Text>
            <Text style={styles.statValue}>{progress.total_reps.toLocaleString()}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Distance</Text>
            <Text style={styles.statValue}>{progress.total_distance_miles} mi</Text>
          </View>
        </Card>

        {/* Menu Items */}
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => { hapticLight(); navigation.navigate(item.screen); }}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <GameIcon name={item.icon} size={24} color={colors.textSecondary} variant="minimal" animated={false} />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.accent,
    marginBottom: spacing.md,
  },
  avatarEmoji: {
  },
  displayName: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  rankText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.streakFire,
  },
  section: {
    marginBottom: spacing.lg,
  },
  totalXP: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  scoreItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  statLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
