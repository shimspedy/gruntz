import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../theme';
import { MissionButton } from '../components/MissionButton';
import type { HomeStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'MissionComplete'>;
type Route = RouteProp<HomeStackParamList, 'MissionComplete'>;

export default function MissionCompleteScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { xpEarned, coinsEarned, leveledUp, newRank } = route.params;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.checkmark}>✅</Text>
        <Text style={styles.title}>MISSION COMPLETE</Text>
        <Text style={styles.subtitle}>Outstanding work, warrior.</Text>

        <View style={styles.rewardsContainer}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>⭐</Text>
            <Text style={styles.rewardValue}>+{xpEarned}</Text>
            <Text style={styles.rewardLabel}>XP EARNED</Text>
          </View>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>🪙</Text>
            <Text style={styles.rewardValue}>+{coinsEarned}</Text>
            <Text style={styles.rewardLabel}>COINS</Text>
          </View>
        </View>

        {leveledUp && (
          <View style={styles.levelUpBanner}>
            <Text style={styles.levelUpText}>🎉 LEVEL UP!</Text>
          </View>
        )}

        {newRank && (
          <View style={styles.rankBanner}>
            <Text style={styles.rankText}>🎖️ NEW RANK: {newRank.toUpperCase()}</Text>
          </View>
        )}

        <MissionButton
          title="BACK TO BASE"
          onPress={() => navigation.popToTop()}
          style={{ marginTop: spacing.xl, width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  checkmark: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.accentGreen,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  rewardsContainer: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  rewardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.accentGold,
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  levelUpBanner: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  levelUpText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  rankBanner: {
    backgroundColor: colors.accentGold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
});
