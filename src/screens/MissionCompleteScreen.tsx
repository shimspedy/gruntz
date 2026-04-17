import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors, spacing, MAX_FONT_MULTIPLIER, borderRadius } from '../theme';
import type { ThemeColors } from '../theme';
import { GlassCard } from '../components/GlassCard';
import { MissionButton } from '../components/MissionButton';
import { GameIcon } from '../components/GameIcon';
import { LottieReward } from '../components/LottieReward';
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
  const { xpEarned = 0, coinsEarned = 0, leveledUp = false, newRank } = route.params ?? {};
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const bottomContentPadding = Math.max(spacing.xxl, tabBarHeight + insets.bottom + spacing.lg);
  const [lottieVisible, setLottieVisible] = useState(true);
  const [levelUpLottieVisible, setLevelUpLottieVisible] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (leveledUp || newRank) {
      hapticLevelUp();
      // Trigger level up animation after a delay
      timeoutId = setTimeout(() => {
        setLevelUpLottieVisible(true);
      }, 1200);
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
  const statsAnim = useFadeInUp(500, 1400);
  const buttonAnim = useFadeInDown(500, 1600);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomContentPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Background Gradient Effect */}
        <View style={styles.gradientBg} />

        {/* Success Icon Animation */}
        <Animated.View
          style={[styles.checkmarkSection, { opacity: checkAnim.opacity, transform: checkAnim.transform }]}
        >
          <View style={styles.checkCircle}>
            <GameIcon name="check" size={80} color={colors.accentGreen} variant="minimal" />
          </View>
        </Animated.View>

        {/* Mission Complete Title */}
        <Animated.Text
          style={[styles.title, { opacity: titleAnim.opacity, transform: titleAnim.transform }]}
          maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}
        >
          MISSION COMPLETE
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          style={[styles.subtitle, { opacity: subtitleAnim.opacity, transform: subtitleAnim.transform }]}
        >
          Outstanding work, warrior.
        </Animated.Text>

        {/* Rewards Glass Cards */}
        <Animated.View
          style={[styles.rewardsSection, { opacity: rewardsAnim.opacity, transform: rewardsAnim.transform }]}
        >
          <GlassCard variant="default" style={styles.rewardCard}>
            <View style={styles.rewardContent}>
              <GameIcon name="xp" size={48} color={colors.accentGold} variant="minimal" />
              <Text style={styles.rewardValue} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
                +{xpEarned}
              </Text>
              <Text style={styles.rewardLabel}>XP EARNED</Text>
            </View>
          </GlassCard>

          <GlassCard variant="default" style={styles.rewardCard}>
            <View style={styles.rewardContent}>
              <GameIcon name="coin" size={48} color={colors.accentGold} variant="minimal" />
              <Text style={styles.rewardValue} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
                +{coinsEarned}
              </Text>
              <Text style={styles.rewardLabel}>COINS</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Level Up Banner */}
        {leveledUp && (
          <Animated.View
            style={[styles.levelUpBannerWrap, { opacity: levelUpAnim.opacity, transform: levelUpAnim.transform }]}
          >
            <GlassCard variant="accent" noPadding>
              <View style={styles.bannerContent}>
                <GameIcon name="level" size={32} color={colors.background} variant="minimal" />
                <Text style={styles.levelUpText}>LEVEL UP!</Text>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* New Rank Banner */}
        {newRank && (
          <Animated.View
            style={[styles.rankBannerWrap, { opacity: rankAnim.opacity, transform: rankAnim.transform }]}
          >
            <GlassCard variant="accent" noPadding>
              <View style={styles.bannerContent}>
                <GameIcon name="rank" size={32} color={colors.background} variant="minimal" />
                <Text style={styles.rankText}>NEW RANK: {newRank.toUpperCase()}</Text>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Stats Summary */}
        <Animated.View
          style={[styles.statsWrap, { opacity: statsAnim.opacity, transform: statsAnim.transform }]}
        >
          <GlassCard>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <GameIcon name="check" size={24} color={colors.accent} variant="minimal" />
                <Text style={styles.statLabel}>Mission Complete</Text>
              </View>
              <View style={styles.statItem}>
                <GameIcon name="xp" size={24} color={colors.accentGold} variant="minimal" />
                <Text style={styles.statLabel}>{xpEarned} Total XP</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Back Button */}
        <Animated.View
          style={[styles.buttonWrap, { opacity: buttonAnim.opacity, transform: buttonAnim.transform }]}
        >
          <MissionButton
            title="BACK TO BASE"
            onPress={() => navigation.popToTop()}
            style={{ width: '100%' }}
          />
        </Animated.View>
      </ScrollView>

      {/* Lottie Reward Animations */}
      <LottieReward type="mission_complete" visible={lottieVisible} onComplete={() => setLottieVisible(false)} />
      {leveledUp && (
        <LottieReward
          type="level_up"
          visible={levelUpLottieVisible}
          onComplete={() => setLevelUpLottieVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingBottom: spacing.xxl,
    },
    gradientBg: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '40%',
      backgroundColor: `${colors.accent}08`,
      borderBottomLeftRadius: 80,
      borderBottomRightRadius: 80,
    },

    /* === SUCCESS ICON === */
    checkmarkSection: {
      marginTop: spacing.xl,
      marginBottom: spacing.lg,
      zIndex: 2,
    },
    checkCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: `${colors.accentGreen}20`,
      borderWidth: 2,
      borderColor: colors.accentGreen,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accentGreen,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 8,
    },

    /* === TITLE & SUBTITLE === */
    title: {
      fontSize: 36,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: 2,
      marginBottom: spacing.xs,
      textAlign: 'center',
      zIndex: 2,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: spacing.xl,
      textAlign: 'center',
      fontWeight: '500',
      lineHeight: 24,
      zIndex: 2,
    },

    /* === REWARDS SECTION === */
    rewardsSection: {
      width: '100%',
      flexDirection: 'row',
      gap: spacing.lg,
      marginBottom: spacing.lg,
      justifyContent: 'center',
      zIndex: 2,
    },
    rewardCard: {
      flex: 1,
      minHeight: 140,
    },
    rewardContent: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    rewardValue: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.accentGold,
      marginTop: spacing.xs,
    },
    rewardLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
      letterSpacing: 1.2,
      marginTop: spacing.xs,
      textTransform: 'uppercase',
    },

    /* === BANNERS === */
    levelUpBannerWrap: {
      width: '100%',
      marginBottom: spacing.lg,
      zIndex: 2,
    },
    rankBannerWrap: {
      width: '100%',
      marginBottom: spacing.lg,
      zIndex: 2,
    },
    bannerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
    },
    levelUpText: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.background,
      letterSpacing: 1.2,
    },
    rankText: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.background,
      letterSpacing: 1,
    },

    /* === STATS === */
    statsWrap: {
      width: '100%',
      marginBottom: spacing.xl,
      zIndex: 2,
    },
    statsGrid: {
      gap: spacing.lg,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    statLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },

    /* === BUTTON === */
    buttonWrap: {
      width: '100%',
      maxWidth: 300,
      zIndex: 2,
    },
  });
