import React, { useMemo } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { achievements } from '../data/achievements';
import { useUserStore } from '../store/useUserStore';
import type { Achievement, UserProgress } from '../types';
import { Icon, type IconName } from '../ui/Icon';
import { NavHeader } from '../ui/Layout';
import { Bar } from '../ui/Progress';
import { Text } from '../ui/Text';
import { color, radius, space } from '../ui/tokens';

const CATEGORY: Record<Achievement['category'], { label: string; icon: IconName }> = {
  workout: { label: 'Missions', icon: 'dumbbell' },
  streak: { label: 'Streaks', icon: 'flame' },
  xp: { label: 'Experience', icon: 'bolt' },
  rank: { label: 'Rank', icon: 'medal' },
  record: { label: 'Volume', icon: 'chart' },
  program: { label: 'Programs', icon: 'calendar' },
};

function currentValue(a: Achievement, p: UserProgress): number | null {
  switch (a.condition_type) {
    case 'workouts_completed':
      return p.workouts_completed;
    case 'streak_days':
      return p.streak_days;
    case 'total_xp':
      return p.current_xp;
    case 'level':
      return p.current_level;
    default:
      if (a.condition_type.startsWith('exercise_total_')) {
        const id = a.condition_type.replace('exercise_total_', '');
        const ids = id === 'pushups' ? ['pushups', 'strict_pushups', 'close_grip_pushups'] : [id];
        return ids.reduce((s, x) => s + (p.exercises_completed[x] || 0), 0);
      }
      return null;
  }
}

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const progress = useUserStore((s) => s.progress);
  const unlockedList = useUserStore((s) => s.achievements);
  const unlocked = useMemo(() => new Map(unlockedList.filter((a) => a.unlocked).map((a) => [a.achievement_id, a.unlocked_at])), [unlockedList]);

  const sections = useMemo(() => {
    const groups = new Map<Achievement['category'], Achievement[]>();
    achievements.forEach((a) => groups.set(a.category, [...(groups.get(a.category) ?? []), a]));
    return Array.from(groups.entries()).map(([cat, data]) => ({
      title: CATEGORY[cat]?.label ?? cat,
      icon: CATEGORY[cat]?.icon ?? 'trophy',
      data: [...data].sort((a, b) => Number(unlocked.has(b.id)) - Number(unlocked.has(a.id)) || a.condition_value - b.condition_value),
    }));
  }, [unlocked]);

  return (
    <View style={styles.screen}>
      <NavHeader title="Achievements" />
      <SectionList
        sections={sections}
        keyExtractor={(a) => a.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl, paddingHorizontal: space.md }}
        ListHeaderComponent={
          <View style={styles.summary}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text variant="title" tabular>
                {unlocked.size}
                <Text variant="body" tone="secondary">
                  {' '}
                  of {achievements.length} unlocked
                </Text>
              </Text>
            </View>
            <Bar progress={unlocked.size / achievements.length} height={6} style={{ marginTop: space.md }} />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHead}>
            <Icon name={section.icon as IconName} size={18} color={color.textSecondary} />
            <Text variant="overline" tone="secondary">
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const got = unlocked.has(item.id);
          const value = currentValue(item, progress);
          const ratio = got ? 1 : value != null ? Math.min(1, value / item.condition_value) : 0;
          const first = index === 0;
          const last = index === section.data.length - 1;
          return (
            <View style={[styles.row, first && styles.first, last && styles.last, !last && styles.divider]}>
              <View style={[styles.badge, got ? styles.badgeOn : null]}>
                <Icon name={got ? 'trophy' : 'lock'} size={20} color={got ? color.accent : color.textTertiary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text variant="headline" style={{ flex: 1, color: got ? color.text : color.textSecondary }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text variant="subhead" tone={got ? 'accent' : 'tertiary'} tabular>
                    +{item.xp_reward} XP
                  </Text>
                </View>
                <Text variant="subhead" tone="tertiary" style={{ marginTop: 2 }} numberOfLines={2}>
                  {item.description}
                </Text>
                {!got && value != null ? (
                  <View style={styles.progress}>
                    <Bar progress={ratio} height={4} style={{ flex: 1 }} trackColor={color.surfaceHigh} />
                    <Text variant="caption" tone="tertiary" tabular>
                      {Math.min(value, item.condition_value).toLocaleString()}/{item.condition_value.toLocaleString()}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  summary: { paddingHorizontal: 8, paddingTop: space.md, paddingBottom: space.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, marginTop: space.xl, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 14, padding: space.md, backgroundColor: color.surface },
  first: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  last: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  badge: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  badgeOn: { backgroundColor: color.accentSoft },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
});
