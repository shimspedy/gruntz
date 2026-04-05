import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing } from '../theme';
import type { ThemeColors } from '../theme';
import { Card } from '../components/Card';
import { MissionButton } from '../components/MissionButton';
import type { MissionsStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<MissionsStackParamList, 'Challenges'>;

interface ChallengeItem {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  progress: number;
  target: number;
  reward_xp: number;
  icon: string;
}

const sampleChallenges: ChallengeItem[] = [
  { id: 'dc1', name: 'Daily Push', description: 'Complete 50 push-ups today', type: 'daily', progress: 0, target: 50, reward_xp: 30, icon: '💪' },
  { id: 'dc2', name: 'Plank Hold', description: 'Hold a plank for 2 minutes total', type: 'daily', progress: 0, target: 120, reward_xp: 20, icon: '🧱' },
  { id: 'wc1', name: 'Weekly Warrior', description: 'Complete 5 missions this week', type: 'weekly', progress: 0, target: 5, reward_xp: 250, icon: '⚔️' },
  { id: 'wc2', name: 'Distance Runner', description: 'Run 10 miles this week', type: 'weekly', progress: 0, target: 10, reward_xp: 200, icon: '🏃' },
  { id: 'mc1', name: 'Iron Discipline', description: 'Complete 20 missions this month', type: 'monthly', progress: 0, target: 20, reward_xp: 500, icon: '🔥' },
  { id: 'mc2', name: 'Rep Machine', description: 'Complete 1000 total reps this month', type: 'monthly', progress: 0, target: 1000, reward_xp: 400, icon: '🔄' },
];

export default function ChallengesScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const categories = ['daily', 'weekly', 'monthly'] as const;
  const categoryLabels = { daily: 'Daily Challenges', weekly: 'Weekly Challenges', monthly: 'Monthly Challenges' };
  const categoryIcons = { daily: '📅', weekly: '📆', monthly: '🗓️' };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Challenges</Text>
        <Text style={styles.subtitle}>Push yourself beyond the mission.</Text>

        {/* Training Cards Banner */}
        <TouchableOpacity
          style={styles.cardsBanner}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('WorkoutCards')}
        >
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerIcon}>🎴</Text>
            <View>
              <Text style={styles.bannerTitle}>TRAINING CARDS</Text>
              <Text style={styles.bannerSub}>Browse all Movement & Swim Cards with AI recommendations</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.accentGold} />
        </TouchableOpacity>

        {categories.map((cat) => (
          <View key={cat}>
            <Text style={styles.categoryTitle}>
              {categoryIcons[cat]} {categoryLabels[cat]}
            </Text>
            {sampleChallenges
              .filter((c) => c.type === cat)
              .map((challenge) => (
                <Card key={challenge.id} style={styles.challengeCard}>
                  <View style={styles.row}>
                    <Text style={styles.icon}>{challenge.icon}</Text>
                    <View style={styles.info}>
                      <Text style={styles.name}>{challenge.name}</Text>
                      <Text style={styles.description}>{challenge.description}</Text>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${challenge.target > 0 ? (challenge.progress / challenge.target) * 100 : 0}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {challenge.progress} / {challenge.target}
                      </Text>
                    </View>
                    <Text style={styles.reward}>+{challenge.reward_xp} XP</Text>
                  </View>
                </Card>
              ))}
          </View>
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
  cardsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accentGold,
    borderRadius: 2,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  bannerIcon: {
    fontSize: 28,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.accentGold,
    letterSpacing: 1,
  },
  bannerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  challengeCard: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accentGreen,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  reward: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentGold,
    marginLeft: spacing.sm,
  },
});
