import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { MissionButton } from '../components/MissionButton';
import { GameIcon } from '../components/GameIcon';
import { hapticSuccess, hapticLevelUp, hapticHeartbeat } from '../utils/haptics';
import { useBounceIn, useFadeInUp, useFadeInDown, useZoomIn } from '../utils/animations';
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
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (leveledUp || newRank) {
      hapticLevelUp();
    } else {
      hapticSuccess();
      timeoutId = setTimeout(() => hapticHeartbeat(), 600);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [leveledUp, newRank]);

  const checkAnim = useBounceIn(600, 200);
  const titleAnim = useFadeInUp(500, 400);
  const subtitleAnim = useFadeInUp(500, 600);
  const rewardsAnim = useZoomIn(500, 800);
  const levelUpAnim = useFadeInUp(500, 1000);
  const rankAnim = useFadeInUp(500, 1200);
  const buttonAnim = useFadeInDown(500, 1400);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View style={[styles.checkmark, { opacity: checkAnim.opacity, transform: checkAnim.transform }]}>
          <GameIcon name="check" size={90} color={colors.accentGreen} />
        </Animated.View>
        <Animated.Text style={[styles.title, { opacity: titleAnim.opacity, transform: titleAnim.transform }]} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>MISSION COMPLETE</Animated.Text>
        <Animated.Text style={[styles.subtitle, { opacity: subtitleAnim.opacity, transform: subtitleAnim.transform }]}>Outstanding work, warrior.</Animated.Text>

        <Animated.View style={[styles.rewardsContainer, { opacity: rewardsAnim.opacity, transform: rewardsAnim.transform }]}>
          <View style={styles.rewardItem}>
            <GameIcon name="xp" size={42} color={colors.accentGold} style={styles.rewardIcon} />
            <Text style={styles.rewardValue} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>+{xpEarned}</Text>
            <Text style={styles.rewardLabel}>XP EARNED</Text>
          </View>
          <View style={styles.rewardItem}>
            <GameIcon name="coin" size={42} color={colors.accentGold} style={styles.rewardIcon} />
            <Text style={styles.rewardValue} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>+{coinsEarned}</Text>
            <Text style={styles.rewardLabel}>COINS</Text>
          </View>
        </Animated.View>

        {leveledUp && (
          <Animated.View style={[styles.levelUpBanner, { opacity: levelUpAnim.opacity, transform: levelUpAnim.transform }]}>
            <View style={styles.bannerRow}>
              <GameIcon name="level" size={28} color={colors.background} animated={false} variant="minimal" />
              <Text style={styles.levelUpText}>LEVEL UP!</Text>
            </View>
          </Animated.View>
        )}

        {newRank && (
          <Animated.View style={[styles.rankBanner, { opacity: rankAnim.opacity, transform: rankAnim.transform }]}>
            <View style={styles.bannerRow}>
              <GameIcon name="rank" size={28} color={colors.background} animated={false} variant="minimal" />
              <Text style={styles.rankText}>NEW RANK: {newRank.toUpperCase()}</Text>
            </View>
          </Animated.View>
        )}

        <Animated.View style={[{ width: '100%' }, { opacity: buttonAnim.opacity, transform: buttonAnim.transform }]}>
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
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
