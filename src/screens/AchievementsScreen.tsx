import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { Card } from '../components/Card';
import { GameIcon } from '../components/GameIcon';
import { MissionButton } from '../components/MissionButton';
import { useUserStore } from '../store/useUserStore';
import { achievements as allAchievements } from '../data/achievements';

export default function AchievementsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const userAchievements = useUserStore((s) => s.achievements);
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const bottomContentPadding = Math.max(spacing.xxl, tabBarHeight + insets.bottom + spacing.lg);

  const isUnlocked = (achievementId: string) =>
    userAchievements.some((a) => a.achievement_id === achievementId && a.unlocked);

  const unlockedCount = userAchievements.filter((a) => a.unlocked).length;
  const hasNoUnlocks = unlockedCount === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: bottomContentPadding }]}>
        <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>Achievements</Text>
        <Text style={styles.subtitle}>
          {unlockedCount} / {allAchievements.length} Unlocked
        </Text>

        {hasNoUnlocks && (
          <View style={styles.emptyHero}>
            <View style={styles.emptyIcon}>
              <GameIcon name="trophy" size={36} color={colors.accentGold} />
            </View>
            <Text style={styles.emptyTitle}>No Unlocks Yet</Text>
            <Text style={styles.emptyBody}>
              Complete your first mission to unlock the Starter badge and begin filling your trophy wall.
            </Text>
            <MissionButton
              title="START FIRST MISSION"
              onPress={() =>
                navigation.dispatch(
                  CommonActions.navigate({ name: 'HomeTab' as never }),
                )
              }
              variant="primary"
              style={{ marginTop: spacing.lg }}
            />
          </View>
        )}

        {allAchievements.map((achievement) => {
          const unlocked = isUnlocked(achievement.id);
          return (
            <Card
              key={achievement.id}
              style={[styles.achievementCard, unlocked && styles.achievementUnlocked]}
            >
              <View style={styles.row}>
                <GameIcon
                  name={achievement.icon}
                  size={24}
                  color={unlocked ? colors.accentGold : colors.textMuted}
                  style={[styles.icon, !unlocked && styles.iconLocked]}
                />
                <View style={styles.info}>
                  <Text style={[styles.name, !unlocked && styles.nameLocked]}>
                    {achievement.name}
                  </Text>
                  <Text style={styles.description}>{achievement.description}</Text>
                </View>
                {unlocked ? (
                  <GameIcon name="check" size={14} color={colors.accentGreen} style={styles.unlockedBadge} />
                ) : (
                  <Text style={styles.xpReward}>+{achievement.xp_reward} XP</Text>
                )}
              </View>
            </Card>
          );
        })}
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  emptyHero: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    marginBottom: spacing.lg,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.accentGold}0D`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  achievementCard: {
    marginBottom: spacing.sm,
    opacity: 0.6,
  },
  achievementUnlocked: {
    opacity: 1,
    borderColor: `${colors.accentGold}55`,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.sm + 2,
  },
  iconLocked: {
    opacity: 0.4,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  nameLocked: {
    color: colors.textMuted,
  },
  description: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 17,
  },
  unlockedBadge: {
    marginLeft: spacing.sm,
  },
  xpReward: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accentGold,
  },
});
