import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { MuscleBodyMap } from '../components/MuscleBodyMap';
import { TabHeader } from '../components/TabHeader';
import { achievements as allAchievements } from '../data/achievements';
import { getExerciseById } from '../data/exercises';
import { getRankInfo, rankDescription, ranks, rankTitle } from '../data/ranks';
import { useTabChromeInset } from '../navigation/TabBar';
import { useUserStore } from '../store/useUserStore';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { SectionTitle } from '../ui/Layout';
import { Bar } from '../ui/Progress';
import { Tap } from '../ui/Pressable';
import { RANK_ORDER, RANK_TIERS, RankBadge } from '../ui/RankBadge';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { color, font, motion, radius, space } from '../ui/tokens';
import { getXPToNextLevel } from '../utils/xp';

type SkillKey = 'strength_score' | 'endurance_score' | 'stamina_score' | 'mobility_score' | 'consistency_score' | 'recovery_score';
const SKILLS: { key: SkillKey; name: string; blurb: string; icon: 'strength' | 'run' | 'bolt' | 'mobility' | 'calendar' | 'moon' }[] = [
  { key: 'strength_score', name: 'Strength', blurb: 'Loaded lifts, push-ups, pull-ups and carries.', icon: 'strength' },
  { key: 'endurance_score', name: 'Endurance', blurb: 'Runs, rucks and long aerobic work.', icon: 'run' },
  { key: 'stamina_score', name: 'Stamina', blurb: 'Intervals, sprints and work capacity.', icon: 'bolt' },
  { key: 'mobility_score', name: 'Mobility', blurb: 'Range, control and movement quality.', icon: 'mobility' },
  { key: 'consistency_score', name: 'Consistency', blurb: 'Showing up on schedule, week after week.', icon: 'calendar' },
  { key: 'recovery_score', name: 'Recovery', blurb: 'Sleep, readiness and smart rest days.', icon: 'moon' },
];

function scoreLevel(score: number) {
  if (score >= 80) return 'Elite';
  if (score >= 60) return 'Strong';
  if (score >= 40) return 'Solid';
  if (score > 0) return 'Building';
  return 'Unranked';
}

export default function RanksScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const bottom = useTabChromeInset();
  const ref = React.useRef<ScrollView>(null);
  useScrollToTop(ref);
  const progress = useUserStore((s) => s.progress);
  // Military framing belongs only to athletes who chose Military Prep.
  const military = useUserStore((s) => !!s.profile?.goals.includes('Military Prep'));
  const unlockedCount = useUserStore((s) => s.achievements.filter((a) => a.unlocked).length);
  const xp = getXPToNextLevel(progress.current_xp);
  const rankIndex = RANK_ORDER.indexOf(progress.current_rank);
  const info = getRankInfo(progress.current_rank);
  const next = ranks[rankIndex + 1];
  const fresh = progress.current_xp === 0;

  // Muscle intensity from lifetime reps per exercise.
  const muscles = useMemo(() => {
    const load = new Map<string, number>();
    Object.entries(progress.exercises_completed).forEach(([id, count]) => {
      const ex = getExerciseById(id);
      ex?.muscle_groups?.forEach((m) => load.set(m, (load.get(m) ?? 0) + count));
    });
    const max = Math.max(1, ...load.values());
    const out: Record<string, number> = {};
    load.forEach((v, m) => {
      out[m] = v / max > 0.66 ? 3 : v / max > 0.33 ? 2 : 1;
    });
    return out;
  }, [progress.exercises_completed]);

  return (
    <ScrollView ref={ref} style={styles.screen} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: bottom }} showsVerticalScrollIndicator={false}>
      <TabHeader />

      <View style={styles.rankCard}>
        <View style={styles.rankTop}>
          <View style={{ flex: 1 }}>
            <View style={styles.overline}>
              <Text variant="overline" tone="secondary">
                Current rank
              </Text>
              {/* The icon looked tappable and did nothing. */}
              <Tap
                feedback="opacity"
                hitSlop={12}
                accessibilityLabel="How ranks work"
                onPress={() =>
                  Alert.alert(
                    'How ranks work',
                    'Every workout, challenge and streak milestone earns XP. XP raises your level, and levels move you up the ladder. Nothing expires — you only ever climb.',
                  )
                }
              >
                <Icon name="info" size={16} color={color.textSecondary} />
              </Tap>
            </View>
            <Text style={[styles.rankName, fresh && { color: color.textTertiary }]}>{rankTitle(progress.current_rank, military)}</Text>
            <Text variant="callout" tone="secondary" style={{ marginTop: 2 }}>
              {fresh ? 'Complete a workout to start climbing' : `Level ${progress.current_level} · ${RANK_TIERS[progress.current_rank].name} tier`}
            </Text>
          </View>
          <RankBadge rank={progress.current_rank} size={92} locked={fresh} />
        </View>

        <View style={styles.pips}>
          {RANK_ORDER.map((r, i) => (
            <RankBadge key={r} rank={r} size={i === rankIndex ? 34 : 26} variant="pip" active={i === rankIndex} locked={i > rankIndex} />
          ))}
        </View>

        <View style={{ marginTop: space.lg }}>
          <View style={styles.xpRow}>
            <Text variant="subhead" tone="secondary" tabular>
              {xp.current.toLocaleString()} / {xp.required.toLocaleString()} XP
            </Text>
            <Text variant="subhead" tone="secondary">
              {next ? `${rankTitle(next.rank, military)} at level ${next.minLevel}` : 'Top rank'}
            </Text>
          </View>
          <Bar progress={xp.progress} height={6} style={{ marginTop: 8 }} />
        </View>

        <Button
          title={`Achievements · ${unlockedCount} of ${allAchievements.length}`}
          onPress={() => navigation.navigate('Achievements')}
          style={{ marginTop: space.lg }}
        />
        {info ? (
          <Text variant="footnote" tone="tertiary" align="center" style={{ marginTop: space.sm }}>
            {rankDescription(progress.current_rank, military)}
          </Text>
        ) : null}
      </View>

      <View style={styles.bodies}>
        <MuscleBodyMap muscles={muscles} side="front" scale={0.82} />
        <MuscleBodyMap muscles={muscles} side="back" scale={0.82} />
      </View>
      {Object.keys(muscles).length === 0 ? (
        <Text variant="footnote" tone="tertiary" align="center" style={{ marginTop: space.sm }}>
          Muscles light up as you log missions.
        </Text>
      ) : null}

      <SectionTitle title="Skill Rankings" action="Stats" onAction={() => navigation.navigate('Stats')} style={styles.section} />
      <View style={{ gap: space.sm, paddingHorizontal: space.md }}>
        {SKILLS.map((sk) => (
          <SkillRow key={sk.key} name={sk.name} blurb={sk.blurb} icon={sk.icon} score={progress[sk.key]} />
        ))}
      </View>
    </ScrollView>
  );
}

function SkillRow({ name, blurb, icon, score }: { name: string; blurb: string; icon: 'strength' | 'run' | 'bolt' | 'mobility' | 'calendar' | 'moon'; score: number }) {
  const [open, setOpen] = useState(false);
  const rot = useSharedValue(0);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.get() * 180}deg` }] }));
  const level = scoreLevel(score);
  return (
    <Animated.View layout={LinearTransition.duration(260).easing(motion.easeOut)} style={styles.skill}>
      <Tap
        feedback="none"
        onPress={() => {
          haptic.selection();
          rot.set(withTiming(open ? 0 : 1, { duration: 240, easing: motion.easeOut }));
          setOpen(!open);
        }}
        style={styles.skillHead}
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${name}, ${level}`}
      >
        <View style={styles.skillIcon}>
          <Icon name={icon} size={26} color={score > 0 ? color.text : color.textSecondary} weight="light" />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="headline" style={{ fontSize: 19 }}>
            {name}
          </Text>
          <Text variant="subhead" tone="secondary" style={{ marginTop: 3, letterSpacing: 0.6 }}>
            {/* A brand-new athlete saw "UNTRAINED · 0/100" six times over, which reads
                as a scorecard of failures rather than a blank slate. */}
            {score > 0 ? `${level} · ${score}/100` : 'Not measured yet'}
          </Text>
        </View>
        <Animated.View style={chevron}>
          <Icon name="chevronDown" size={20} color={color.textSecondary} />
        </Animated.View>
      </Tap>
      {open ? (
        <Animated.View entering={FadeIn.duration(220)} style={styles.skillBody}>
          <Bar progress={score / 100} height={6} />
          <Text variant="callout" tone="secondary" style={{ marginTop: space.sm }}>
            {blurb}
          </Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  rankCard: {
    marginHorizontal: space.md,
    marginTop: space.sm,
    padding: space.lg,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    backgroundColor: color.bgRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
  },
  rankTop: { flexDirection: 'row', alignItems: 'center' },
  overline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankName: { fontFamily: font.bold, fontSize: 42, lineHeight: 50, color: color.text, letterSpacing: -0.6, marginTop: 2 },
  pips: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.lg },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bodies: { flexDirection: 'row', justifyContent: 'center', marginTop: space.xl, gap: 0 },
  section: { paddingHorizontal: space.gutter, marginTop: space.xxl, marginBottom: space.md },
  skill: {
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
    overflow: 'hidden',
  },
  skillHead: { flexDirection: 'row', alignItems: 'center', padding: space.md, gap: space.md },
  skillIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: color.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillBody: { paddingHorizontal: space.md, paddingBottom: space.md },
});
