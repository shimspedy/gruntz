import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { colors, spacing } from '../theme';
import { Card } from '../components/Card';
import { useUserStore } from '../store/useUserStore';
import { achievements as allAchievements } from '../data/achievements';

export default function AchievementsScreen() {
  const { achievements: userAchievements, progress } = useUserStore();

  const isUnlocked = (achievementId: string) =>
    userAchievements.some((a) => a.achievement_id === achievementId && a.unlocked);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Achievements</Text>
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
                <Text style={[styles.icon, !unlocked && styles.iconLocked]}>
                  {achievement.icon}
                </Text>
                <View style={styles.info}>
                  <Text style={[styles.name, !unlocked && styles.nameLocked]}>
                    {achievement.name}
                  </Text>
                  <Text style={styles.description}>{achievement.description}</Text>
                </View>
                {unlocked ? (
                  <Text style={styles.unlockedBadge}>✅</Text>
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

const styles = StyleSheet.create({
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
    fontSize: 32,
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
    fontSize: 20,
  },
  xpReward: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentGold,
  },
});
