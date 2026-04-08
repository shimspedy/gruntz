import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
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

export default function WorkoutCardsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  const currentOffering = useSubscriptionStore((s) => s.currentOffering);

  function DifficultyBadge({ level }: { level: string }) {
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
  }

  function CardItem({ card, onPress, recommended }: { card: MovementCard; onPress: () => void; recommended?: WorkoutRecommendation }) {
    return (
        <TouchableOpacity activeOpacity={0.7} onPress={() => { hapticLight(); onPress(); }}>
        <View style={[styles.cardItem, recommended?.priority === 'high' && styles.cardItemHighlighted]}>
          <View style={styles.cardHeader}>
            <GameIcon name={card.icon} size={34} color={colors.accent} style={styles.cardIcon} />
            <View style={styles.cardTitleArea}>
              <Text style={styles.cardNumber}>CARD #{card.card_number}</Text>
              <Text style={styles.cardName}>{card.name}</Text>
            </View>
            <DifficultyBadge level={card.difficulty} />
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{card.description}</Text>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{card.estimated_duration} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="repeat-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{card.total_rounds} rounds</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="body-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{card.target_muscle_groups.slice(0, 3).join(', ')}</Text>
            </View>
          </View>
          {recommended && recommended.priority === 'high' && (
            <View style={styles.recBadge}>
              <Ionicons name="sparkles" size={14} color={colors.background} />
              <Text style={styles.recBadgeText}>RECOMMENDED</Text>
            </View>
          )}
          {recommended && (
            <Text style={styles.recReason}>{recommended.reason}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }
  const progress = useUserStore((s) => s.progress);
  const unlockedCount = useUserStore((s) => s.achievements.filter((a) => a.unlocked).length);
  const recommendations = getTopRecommendations(progress, 11);
  const profile = getStrengthProfile(progress);
  const trainingUnlocked = hasTrainingAccess({ trialStartedAt, entitlementActive });
  const monthlyPrice = getDisplayedMonthlyPrice(currentOffering);

  const recMap = new Map<string, WorkoutRecommendation>();
  recommendations.forEach(r => recMap.set(r.card_id, r));

  const movCards = getAllMovementCards();
  const swimCards = getAllSwimCards();

  if (!trainingUnlocked) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Card style={styles.lockedCard}>
            <GameIcon name="mission" size={44} color={colors.accentGold} style={styles.lockedIcon} />
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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.achievementsBanner}
          activeOpacity={0.8}
          onPress={() => { hapticLight(); navigation.navigate('Achievements'); }}
        >
          <View style={styles.bannerLeft}>
            <GameIcon name="achievement" size={34} color={colors.accentGold} style={styles.bannerIcon} />
            <View>
              <Text style={styles.bannerTitle}>MISSION ACHIEVEMENTS</Text>
              <Text style={styles.bannerSub}>{unlockedCount} unlocked. Track medals, streaks, and milestones.</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.accentGold} />
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
                <GameIcon name={item.icon} size={20} color={colors.accent} style={styles.profileIcon} />
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
            onPress={() => navigation.navigate('CardDetail', { cardId: card.id })}
          />
        ))}

        {/* Swim Cards */}
        <SectionHeader title="Swim Cards" subtitle="5 progressive swim training cards" icon="swim" />
        {swimCards.map(card => (
          <CardItem
            key={card.id}
            card={card}
            recommended={recMap.get(card.id)}
            onPress={() => navigation.navigate('CardDetail', { cardId: card.id })}
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
    paddingBottom: spacing.xxl,
  },
  achievementsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accentGold,
    borderRadius: 2,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  bannerIcon: {
    marginRight: spacing.xs,
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
  profileCard: {
    marginBottom: spacing.md,
  },
  profileTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 2,
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
    width: 24,
  },
  profileBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  profileBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  profileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 65,
  },
  profileValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    width: 35,
    textAlign: 'right',
  },
  lockedCard: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  lockedIcon: {
    marginBottom: spacing.md,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  lockedText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  lockedButton: {
    marginTop: spacing.sm,
  },
  cardItem: {
    backgroundColor: colors.card,
    borderRadius: 2,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardItemHighlighted: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  cardIcon: {
    marginRight: spacing.xs,
  },
  cardTitleArea: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  diffBadge: {
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  diffBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
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
    fontSize: 12,
    color: colors.textMuted,
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentGold,
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: spacing.sm,
  },
  recBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1,
  },
  recReason: {
    fontSize: 12,
    color: colors.accent,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});
