import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import { useFadeInUp } from '../utils/animations';
import type { ThemeColors } from '../theme';
import { Card } from '../components/Card';
import { useUserStore } from '../store/useUserStore';
import { getRankInfo, getUnlockedAvatarItems, ranks } from '../data/ranks';

export default function AvatarScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const heroAnim = useFadeInUp(500);
  const { progress } = useUserStore();
  const rankInfo = getRankInfo(progress.current_rank);
  const unlockedItems = getUnlockedAvatarItems(progress.current_level, progress.current_rank);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>Avatar & Gear</Text>

        {/* Avatar Display */}
        <Card style={styles.avatarCard}>
          <Animated.View style={[styles.avatarCircle, { opacity: heroAnim.opacity, transform: heroAnim.transform }]}>
            <Text style={styles.avatarEmoji}>{rankInfo?.icon || '🔰'}</Text>
          </Animated.View>
          <Text style={styles.rankName} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{progress.current_rank}</Text>
          <Text style={styles.rankDesc}>{rankInfo?.description}</Text>
          <Text style={styles.levelText}>Level {progress.current_level}</Text>
        </Card>

        {/* Unlocked Items */}
        <Text style={styles.sectionTitle}>Unlocked Gear ({unlockedItems.length})</Text>
        {unlockedItems.length > 0 ? (
          unlockedItems.map((item) => (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <Text style={styles.itemIcon}>{item.icon}</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                  <Text style={styles.itemType}>{item.type.toUpperCase()}</Text>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <Card>
            <Text style={styles.emptyText}>Complete missions to unlock gear!</Text>
          </Card>
        )}

        {/* Rank Ladder */}
        <Text style={styles.sectionTitle}>Rank Ladder</Text>
        {ranks.map((r) => {
          const isCurrent = r.rank === progress.current_rank;
          const isLocked =
            r.minLevel > progress.current_level;
          return (
            <Card
              key={r.rank}
              style={[styles.rankCard, isCurrent && styles.rankCardActive, isLocked && styles.rankCardLocked]}
            >
              <View style={styles.rankRow}>
                <Text style={[styles.rankIcon, isLocked && styles.rankIconLocked]}>{r.icon}</Text>
                <View style={styles.rankInfo}>
                  <Text style={[styles.rankTitle, isCurrent && styles.rankTitleActive]}>
                    {r.title}
                  </Text>
                  <Text style={styles.rankLevels}>
                    Levels {r.minLevel}-{r.maxLevel === 999 ? '∞' : r.maxLevel}
                  </Text>
                </View>
                {isCurrent && <Text style={styles.currentBadge}>CURRENT</Text>}
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
    marginBottom: spacing.lg,
  },
  avatarCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.accent,
    marginBottom: spacing.md,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  rankName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  rankDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  itemCard: {
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemType: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  rankCard: {
    marginBottom: spacing.sm,
  },
  rankCardActive: {
    borderColor: colors.accentGold,
    borderWidth: 2,
  },
  rankCardLocked: {
    opacity: 0.4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  rankIconLocked: {
    opacity: 0.4,
  },
  rankInfo: {
    flex: 1,
  },
  rankTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rankTitleActive: {
    color: colors.accentGold,
  },
  rankLevels: {
    fontSize: 12,
    color: colors.textMuted,
  },
  currentBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accentGold,
    letterSpacing: 1,
  },
});
