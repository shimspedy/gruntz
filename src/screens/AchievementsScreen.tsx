import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { Card } from '../components/Card';
import { GameIcon } from '../components/GameIcon';
import { useUserStore } from '../store/useUserStore';
import { achievements as allAchievements } from '../data/achievements';

export default function AchievementsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const userAchievements = useUserStore((s) => s.achievements);
  const progress = useUserStore((s) => s.progress);

  const isUnlocked = (achievementId: string) =>
    userAchievements.some((a) => a.achievement_id === achievementId && a.unlocked);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>Achievements</Text>
        <Text style={styles.subtitle}>
          {userAchievements.filter((a) => a.unlocked).length} / {allAchievements.length} Unlocked
        </Text>

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
                  size={36}
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
                  <GameIcon name="check" size={24} color={colors.accentGreen} style={styles.unlockedBadge} />
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
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  achievementCard: {
    marginBottom: spacing.sm,
    opacity: 0.6,
  },
  achievementUnlocked: {
    opacity: 1,
    borderColor: colors.accentGold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.md,
  },
  iconLocked: {
    opacity: 0.4,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  nameLocked: {
    color: colors.textMuted,
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  unlockedBadge: {
    marginLeft: spacing.sm,
  },
  xpReward: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentGold,
  },
});
