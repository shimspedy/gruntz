import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInUp, FadeInDown, BounceIn, ZoomIn } from 'react-native-reanimated';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { MissionButton } from '../components/MissionButton';
import { hapticSuccess } from '../utils/haptics';
import type { HomeStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'MissionComplete'>;
type Route = RouteProp<HomeStackParamList, 'MissionComplete'>;

export default function MissionCompleteScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { xpEarned, coinsEarned, leveledUp, newRank } = route.params;

  useEffect(() => {
    hapticSuccess();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.Text entering={BounceIn.duration(600).delay(200)} style={styles.checkmark}>✅</Animated.Text>
        <Animated.Text entering={FadeInUp.duration(500).delay(400)} style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>MISSION COMPLETE</Animated.Text>
        <Animated.Text entering={FadeInUp.duration(500).delay(600)} style={styles.subtitle}>Outstanding work, warrior.</Animated.Text>

        <Animated.View entering={ZoomIn.duration(500).delay(800)} style={styles.rewardsContainer}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>⭐</Text>
            <Text style={styles.rewardValue} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>+{xpEarned}</Text>
            <Text style={styles.rewardLabel}>XP EARNED</Text>
          </View>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>🪙</Text>
            <Text style={styles.rewardValue} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>+{coinsEarned}</Text>
            <Text style={styles.rewardLabel}>COINS</Text>
          </View>
        </Animated.View>

        {leveledUp && (
          <Animated.View entering={FadeInUp.duration(500).delay(1000)} style={styles.levelUpBanner}>
            <Text style={styles.levelUpText}>🎉 LEVEL UP!</Text>
          </Animated.View>
        )}

        {newRank && (
          <Animated.View entering={FadeInUp.duration(500).delay(1200)} style={styles.rankBanner}>
            <Text style={styles.rankText}>🎖️ NEW RANK: {newRank.toUpperCase()}</Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(500).delay(1400)} style={{ width: '100%' }}>
          <MissionButton
            title="BACK TO BASE"
            onPress={() => navigation.popToTop()}
            style={{ marginTop: spacing.xl, width: '100%' }}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  levelUpText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.background,
  },
  rankBanner: {
    backgroundColor: colors.accentGold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 2,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.background,
  },
});
