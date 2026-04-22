import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { Card } from '../components/Card';
import { GameIcon } from '../components/GameIcon';
import { SectionHeader } from '../components/SectionHeader';
import { MissionButton } from '../components/MissionButton';
import { getDisplayedMonthlyPrice } from '../config/monetization';
import { movementCards, getAllMovementCards, getAllSwimCards } from '../data/movementCards';
import { useUserStore } from '../store/useUserStore';
import { hasTrainingAccess, useSubscriptionStore } from '../store/useSubscriptionStore';
import { getTopRecommendations, getStrengthProfile } from '../utils/recommendations';
import { hapticLight } from '../utils/haptics';
import type { MovementCard, WorkoutRecommendation } from '../types';
import type { MissionsStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<MissionsStackParamList, 'WorkoutCards'>;
type Styles = ReturnType<typeof createStyles>;

// Defined at module scope (not inside the screen) so React reuses the same
// component instance across parent re-renders instead of remounting.
const DifficultyBadge = React.memo(function DifficultyBadge({ level, colors, styles }: { level: string; colors: ThemeColors; styles: Styles }) {
  const colorMap: Record<string, string> = {
    beginner: colors.accentGreen,
    intermediate: colors.accentGold,
    advanced: colors.accentRed,
  };
  return (
    <View style={[styles.diffBadge, { backgroundColor: colorMap[level] || colors.textMuted }]}>
      <Text style={styles.diffBadgeText}>{level.toUpperCase()}</Text>
    </View>
  );
});

const CardItem = React.memo(function CardItem({
  card,
  onPress,
  recommended,
  colors,
  styles,
}: {
  card: MovementCard;
  onPress: (id: string) => void;
  recommended?: WorkoutRecommendation;
  colors: ThemeColors;
  styles: Styles;
}) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => { hapticLight(); onPress(card.id); }}>
      <View style={[styles.cardItem, recommended?.priority === 'high' && styles.cardItemHighlighted]}>
        <View style={styles.cardHeader}>
          <GameIcon name={card.icon} size={24} color={colors.accent} style={styles.cardIcon} />
          <View style={styles.cardTitleArea}>
            <Text style={styles.cardNumber}>CARD #{card.card_number}</Text>
            <Text style={styles.cardName}>{card.name}</Text>
          </View>
          <DifficultyBadge level={card.difficulty} colors={colors} styles={styles} />
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{card.description}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{card.estimated_duration} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="repeat-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{card.total_rounds} rounds</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="body-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{card.target_muscle_groups.slice(0, 3).join(', ')}</Text>
          </View>
        </View>
        {recommended && recommended.priority === 'high' && (
          <View style={styles.recBadge}>
            <Ionicons name="sparkles" size={10} color={colors.accentGold} />
            <Text style={styles.recBadgeText}>RECOMMENDED</Text>
          </View>
        )}
        {recommended && (
          <Text style={styles.recReason}>{recommended.reason}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default function WorkoutCardsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  const currentOffering = useSubscriptionStore((s) => s.currentOffering);
  const openCardDetail = React.useCallback(
    (cardId: string) => navigation.navigate('CardDetail', { cardId }),
    [navigation],
  );
  const progress = useUserStore((s) => s.progress);
  const userProfile = useUserStore((s) => s.profile);
  const unlockedCount = useUserStore((s) => s.achievements.filter((a) => a.unlocked).length);
  const recommendations = getTopRecommendations(progress, 11, userProfile);
  const profile = getStrengthProfile(progress);
  const trainingUnlocked = hasTrainingAccess({ trialStartedAt, entitlementActive });
  const monthlyPrice = getDisplayedMonthlyPrice(currentOffering);

  const recMap = useMemo(() => {
    const map = new Map<string, WorkoutRecommendation>();
    recommendations.forEach(r => map.set(r.card_id, r));
    return map;
  }, [recommendations]);
  const bottomContentPadding = Math.max(spacing.xxl, tabBarHeight + insets.bottom + spacing.lg);

  const movCards = useMemo(() => getAllMovementCards(), []);
  const swimCards = useMemo(() => getAllSwimCards(), []);

  if (!trainingUnlocked) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: bottomContentPadding }]}
        >
          <Card style={styles.lockedCard}>
            <GameIcon name="mission" size={32} color={colors.accentGold} style={styles.lockedIcon} />
            <Text style={styles.lockedTitle}>Training cards are part of Gruntz Pro</Text>
            <Text style={styles.lockedText}>
              Subscribe for {monthlyPrice} to unlock movement cards, swim cards, and the full training library.
            </Text>
            <MissionButton
              title="UNLOCK GRUNTZ PRO"
              onPress={() => navigation.navigate('Paywall')}
              style={styles.lockedButton}
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomContentPadding }]}
      >
        <TouchableOpacity
          style={styles.achievementsBanner}
          activeOpacity={0.8}
          onPress={() => { hapticLight(); navigation.navigate('Achievements'); }}
        >
          <View style={styles.bannerLeft}>
            <GameIcon name="achievement" size={20} color={colors.accentGold} style={styles.bannerIcon} />
            <View>
              <Text style={styles.bannerTitle}>MISSION ACHIEVEMENTS</Text>
              <Text style={styles.bannerSub}>{unlockedCount} unlocked. Track medals, streaks, and milestones.</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Strength Profile */}
        <Card style={styles.profileCard}>
          <Text style={styles.profileTitle}>YOUR STRENGTH PROFILE</Text>
          <View style={styles.profileGrid}>
            {[
              { label: 'Upper', value: profile.upper_body, icon: 'strength' },
              { label: 'Lower', value: profile.lower_body, icon: 'lower' },
              { label: 'Core', value: profile.core, icon: 'core' },
              { label: 'Endurance', value: profile.endurance, icon: 'run' },
              { label: 'Swim', value: profile.swimming, icon: 'swim' },
              { label: 'Ruck', value: profile.rucking, icon: 'ruck' },
            ].map(item => (
              <View key={item.label} style={styles.profileItem}>
                <GameIcon name={item.icon} size={14} color={colors.textMuted} style={styles.profileIcon} />
                <View style={styles.profileBarTrack}>
                  <View style={[styles.profileBarFill, { width: `${Math.max(5, item.value)}%` }]} />
                </View>
                <Text style={styles.profileLabel}>{item.label}</Text>
                <Text style={styles.profileValue}>{item.value}%</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Movement Cards */}
        <SectionHeader title="Movement Cards" subtitle="6 training cards from the Raider program" icon="strength" />
        {movCards.map(card => (
          <CardItem
            key={card.id}
            card={card}
            recommended={recMap.get(card.id)}
            onPress={openCardDetail}
            colors={colors}
            styles={styles}
          />
        ))}

        {/* Swim Cards */}
        <SectionHeader title="Swim Cards" subtitle="5 progressive swim training cards" icon="swim" />
        {swimCards.map(card => (
          <CardItem
            key={card.id}
            card={card}
            recommended={recMap.get(card.id)}
            onPress={openCardDetail}
            colors={colors}
            styles={styles}
          />
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
  },
  achievementsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm + 2,
  },
  bannerIcon: {
    marginRight: 0,
  },
  bannerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  bannerSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileCard: {
    marginBottom: spacing.md,
  },
  profileTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  profileGrid: {
    gap: spacing.sm,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileIcon: {
    width: 20,
  },
  profileBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.cardBorder,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  profileBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
  },
  profileLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    width: 65,
  },
  profileValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    width: 35,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  lockedCard: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  lockedIcon: {
    marginBottom: spacing.md,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  lockedText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  lockedButton: {
    marginTop: spacing.sm,
  },
  cardItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
  },
  cardItemHighlighted: {
    borderColor: `${colors.accent}55`,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm + 2,
  },
  cardIcon: {
    marginRight: 0,
  },
  cardTitleArea: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  diffBadge: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  diffBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.background,
    letterSpacing: 1,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.accentGold}1A`,
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.sm,
  },
  recBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentGold,
    letterSpacing: 1,
  },
  recReason: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
