import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFadeInUp } from '../utils/animations';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { GlassCard } from '../components/GlassCard';
import { GameIcon } from '../components/GameIcon';
import { XPBar } from '../components/XPBar';
import { useUserStore } from '../store/useUserStore';
import { useProgramStore } from '../store/useProgramStore';
import { getXPToNextLevel } from '../utils/xp';
import { getRankInfo } from '../data/ranks';
import { getProgramById } from '../data/programs';
import { getDisplayedMonthlyPrice } from '../config/monetization';
import { hapticLight } from '../utils/haptics';
import { useAdaptiveLayout } from '../hooks/useAdaptiveLayout';
import { getAccessState, getTrialDaysRemaining, useSubscriptionStore } from '../store/useSubscriptionStore';
import type { ProfileStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

function formatChallengeTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0m';
  }

  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export default function ProfileScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const heroAnim = useFadeInUp(500);
  const { contentMaxWidth, horizontalPadding } = useAdaptiveLayout();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { progress, profile } = useUserStore();
  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  const currentOffering = useSubscriptionStore((s) => s.currentOffering);
  const openCustomerCenter = useSubscriptionStore((s) => s.openCustomerCenter);
  const openSubscriptionManagement = useSubscriptionStore((s) => s.openSubscriptionManagement);
  const xpInfo = getXPToNextLevel(progress.current_xp);
  const rankInfo = getRankInfo(progress.current_rank);
  const accessState = getAccessState({ trialStartedAt, entitlementActive });
  const trialDaysRemaining = getTrialDaysRemaining(trialStartedAt);
  const monthlyPrice = getDisplayedMonthlyPrice(currentOffering);
  const bottomContentPadding = Math.max(120, tabBarHeight + insets.bottom + spacing.lg);

  const { selectedProgram } = useProgramStore();
  const activeProgram = selectedProgram ? getProgramById(selectedProgram) : null;

  const menuItems = [
    {
      label: accessState === 'subscriber' ? 'Manage Gruntz Pro' : 'Upgrade to Pro',
      icon: 'rank',
      onPress: async () => {
        if (accessState === 'subscriber') {
          const result = await openCustomerCenter();
          if (result === 'unavailable' || result === 'error') {
            await openSubscriptionManagement();
          }
          return;
        }
        navigation.navigate('Paywall');
      },
    },
    { label: activeProgram ? `Program: ${activeProgram.name}` : 'Choose Program', icon: 'program', screen: 'ProgramSelect' as const },
    { label: 'Achievements', icon: 'achievement', screen: 'Achievements' as const },
    { label: 'Settings', icon: 'settings', screen: 'Settings' as const },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: contentMaxWidth,
            alignSelf: 'center',
            paddingHorizontal: horizontalPadding,
            paddingBottom: bottomContentPadding,
          },
        ]}
      >
        {/* Profile Header */}
        <Animated.View style={[styles.header, { opacity: heroAnim.opacity, transform: heroAnim.transform }]}>
          <View style={styles.avatarCircle}>
            <View style={styles.avatarGlow} />
            <GameIcon name={rankInfo?.icon || 'rank'} size={60} color={colors.accent} style={styles.avatarEmoji} />
          </View>
          <Text style={styles.displayName} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{profile?.display_name || 'Recruit'}</Text>
          <Text style={styles.rankText}>{progress.current_rank}</Text>
          <Text style={styles.levelText}>Level {progress.current_level}</Text>
          <View style={styles.streakBadge}>
            <GameIcon name="streak" size={18} color={colors.streakFire} variant="minimal" />
            <Text style={styles.streakText}>{progress.streak_days}-day streak</Text>
          </View>
        </Animated.View>

        {/* XP Card */}
        <GlassCard style={styles.section}>
          <XPBar current={xpInfo.current} required={xpInfo.required} level={progress.current_level} />
          <Text style={styles.totalXP}>{progress.current_xp.toLocaleString()} Total XP</Text>
        </GlassCard>

        {/* Membership Card */}
        <GlassCard style={styles.section} variant={accessState === 'subscriber' ? 'default' : 'accent'}>
          <View style={styles.membershipBadge}>
            {accessState === 'subscriber' ? (
              <>
                <GameIcon name="check" size={16} color={colors.accentGreen} variant="minimal" animated={false} />
                <Text style={[styles.membershipBadgeText, { color: colors.accentGreen }]}>PRO</Text>
              </>
            ) : (
              <>
                <GameIcon name="lock" size={16} color={colors.accent} variant="minimal" animated={false} />
                <Text style={styles.membershipBadgeText}>FREE</Text>
              </>
            )}
          </View>
          <Text style={styles.membershipTitle}>
            {accessState === 'subscriber'
              ? 'Pro Member'
              : accessState === 'trial'
                ? `${trialDaysRemaining} Days Remaining`
                : 'Upgrade Required'}
          </Text>
          <Text style={styles.membershipText}>
            {accessState === 'subscriber'
              ? 'All programs and daily missions unlocked.'
              : accessState === 'trial'
                ? `Included access active. Subscription is only required when this window ends. Monthly plan: ${monthlyPrice}.`
                : `Subscribe for ${monthlyPrice} to unlock all training.`}
          </Text>
        </GlassCard>

        {/* Fitness Scores */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionLabel}>Fitness Scores</Text>
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
        </GlassCard>

        {/* Stats */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionLabel}>Overall Stats</Text>
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
            <Text style={styles.statLabel}>Daily Challenges</Text>
            <Text style={styles.statValue}>{progress.challenges_completed}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Challenge Streak</Text>
            <Text style={styles.statValue}>{progress.challenge_streak_days} days</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Challenge XP Earned</Text>
            <Text style={styles.statValue}>{progress.challenge_xp_earned.toLocaleString()}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Challenge Time Logged</Text>
            <Text style={styles.statValue}>{formatChallengeTime(progress.challenge_time_seconds_logged)}</Text>
          </View>
          <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.statLabel}>Total Distance</Text>
            <Text style={styles.statValue}>{progress.total_distance_miles} mi</Text>
          </View>
        </GlassCard>

        {/* Menu Items */}
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => {
              hapticLight();
              if (typeof item.onPress === 'function') {
                void item.onPress();
                return;
              }
              navigation.navigate(item.screen);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}>
                <GameIcon name={item.icon} size={20} color={colors.accent} variant="minimal" animated={false} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
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
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.accent,
    opacity: 0.12,
  },
  avatarEmoji: {
  },
  displayName: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  levelText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    backgroundColor: `${colors.streakFire}12`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.streakFire,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  totalXP: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: `${colors.accent}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  membershipBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1,
  },
  membershipTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  membershipText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
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
    fontSize: 32,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.textPrimary}08`,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${colors.textPrimary}04`,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.textPrimary}08`,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.accent}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
