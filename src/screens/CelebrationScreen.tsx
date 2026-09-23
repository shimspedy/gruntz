import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { achievements } from '../data/achievements';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Bar } from '../ui/Progress';
import { RANK_TIERS, RankBadge } from '../ui/RankBadge';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { color, font, motion, radius, space } from '../ui/tokens';
import { useUserStore } from '../store/useUserStore';
import { getXPToNextLevel, streakGraceDays } from '../utils/xp';

/** After a mission: what moved. Rank-ups get the big moment; everything else stays calm. */
export default function CelebrationScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Celebration'>>();
  const xpNow = useUserStore((s) => s.progress.current_xp);
  const grace = streakGraceDays(useUserStore((s) => s.profile?.workout_days_per_week));
  const rankUp = params.rankAfter !== params.rankBefore;
  const levelUp = params.levelAfter > params.levelBefore;
  const unlocked = params.achievementIds.map((id) => achievements.find((a) => a.id === id)).filter(Boolean);
  const xp = getXPToNextLevel(xpNow);

  const badge = useSharedValue(0);
  const [shownXp, setShownXp] = useState(0);
  const [barProgress, setBarProgress] = useState(levelUp ? 0 : Math.max(0, xp.progress - params.xpEarned / Math.max(1, xp.required)));

  useEffect(() => {
    badge.set(withDelay(120, withSpring(1, rankUp ? motion.bouncy : motion.settle)));
    const t0 = setTimeout(() => (rankUp || levelUp ? haptic.heavy() : haptic.success()), 180);
    // Count the XP up over ~0.9s.
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 900);
      const eased = 1 - Math.pow(1 - p, 3);
      setShownXp(Math.round(params.xpEarned * eased));
      if (p >= 1) clearInterval(id);
    }, 16);
    const t1 = setTimeout(() => setBarProgress(xp.progress), 450);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, badge.get() * 1.6),
    transform: [{ scale: 0.6 + badge.get() * 0.4 }, { rotate: `${(1 - badge.get()) * -12}deg` }],
  }));

  const headline = rankUp ? 'New rank' : levelUp ? `Level ${params.levelAfter}` : 'Workout complete';
  const sub = rankUp ? `${params.rankAfter} · ${RANK_TIERS[params.rankAfter].name} tier` : params.title;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.xl }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Animated.View style={badgeStyle}>
            <RankBadge rank={params.rankAfter} size={rankUp ? 168 : 128} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(260).duration(420).easing(Easing.bezier(0.23, 1, 0.32, 1))} style={{ alignItems: 'center' }}>
            <Text variant="display" align="center" style={{ marginTop: space.lg }}>
              {headline}
            </Text>
            <Text variant="body" tone="secondary" align="center" style={{ marginTop: 6 }}>
              {sub}
            </Text>
            <Text style={styles.xp} tabular>
              +{shownXp} XP
            </Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.delay(420).duration(360)} style={styles.panel}>
          <View style={styles.levelRow}>
            <Text variant="headline">Level {params.levelAfter}</Text>
            <Text variant="subhead" tone="secondary" tabular>
              {xp.current} / {xp.required} XP
            </Text>
          </View>
          <Bar progress={barProgress} height={8} duration={900} style={{ marginTop: 12 }} />
        </Animated.View>

        <View style={styles.list}>
          <Animated.View entering={FadeInDown.delay(520).duration(320)} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(255,106,31,0.14)' }]}>
              <Icon name="flame" size={22} color={color.flame} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="headline">{params.streak > 1 ? `${params.streak}-workout streak` : 'Streak started'}</Text>
              <Text variant="subhead" tone="secondary" style={{ marginTop: 2 }}>
                {grace === 1 ? 'Train tomorrow to keep it alive' : `Train within ${grace} days to keep it alive`}
              </Text>
            </View>
          </Animated.View>
          {unlocked.map((a, i) => (
            <Animated.View key={a!.id} entering={FadeInDown.delay(600 + i * motion.stagger).duration(320)} style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: color.accentSoft }]}>
                <Icon name="trophy" size={22} color={color.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="headline">{a!.name}</Text>
                <Text variant="subhead" tone="secondary" style={{ marginTop: 2 }} numberOfLines={2}>
                  {a!.description}
                </Text>
              </View>
              <Text variant="subhead" tone="accent" tabular>
                +{a!.xp_reward}
              </Text>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + space.xs }]}>
        <Button title="Continue" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  hero: { alignItems: 'center', paddingHorizontal: space.xl },
  xp: { fontFamily: font.bold, fontSize: 22, color: color.accent, marginTop: space.md },
  panel: {
    marginHorizontal: space.md,
    marginTop: space.xl,
    padding: space.lg,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
  },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  list: { marginTop: space.md, paddingHorizontal: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.line,
  },
  rowIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.md, paddingTop: space.md, backgroundColor: color.bg },
});
