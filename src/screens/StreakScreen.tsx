import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { claimedDates } from '../features/plan';
import { useUserStore } from '../store/useUserStore';
import { Icon } from '../ui/Icon';
import { NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { color, font, motion, radius, space } from '../ui/tokens';
import { getLocalDateKey } from '../utils/dateKey';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function longestStreak(dates: Set<string>) {
  const sorted = Array.from(dates).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  sorted.forEach((k) => {
    const d = new Date(`${k}T12:00:00`);
    run = prev && Math.round((d.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  });
  return best;
}

export default function StreakScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const progress = useUserStore((s) => s.progress);
  const dates = useMemo(() => claimedDates(progress.claimed_missions), [progress.claimed_missions]);
  const best = Math.max(longestStreak(dates), progress.streak_days);
  const today = getLocalDateKey();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const monday = new Date();
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const week = DOW.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = getLocalDateKey(d);
    return { key, trained: dates.has(key), past: key <= today };
  });
  const rested = week.filter((d) => d.past && !d.trained && d.key !== today).length;

  const cells = useMemo(() => {
    const first = new Date(month);
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  }, [month]);

  const cell = Math.floor((width - space.md * 2 - space.lg * 2) / 7);
  // There is nothing to see past this month, so the calendar stops at it rather
  // than letting you page forever into empty grids.
  const atCurrentMonth = (() => {
    const now = new Date();
    return month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();
  })();
  const shiftMonth = (n: number) => {
    if (n > 0 && atCurrentMonth) return;
    haptic.selection();
    setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xl }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <NavHeader transparent />
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.big} tabular>
                {progress.streak_days}
              </Text>
              <Text style={styles.bigLabel}>day streak</Text>
            </View>
            <Flame lit={progress.streak_days > 0} />
          </View>
          <View style={styles.weekRow}>
            {week.map((d, i) => (
              <View key={d.key} style={{ alignItems: 'center', gap: 10 }}>
                <Text variant="footnote" tone="secondary">
                  {DOW[i]}
                </Text>
                <View style={[styles.weekDot, d.trained && styles.weekDotOn]}>
                  {d.trained ? (
                    <Icon name="check" size={22} color="#000" weight="bold" />
                  ) : (
                    <Icon name="dumbbell" size={20} color={color.textTertiary} />
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.cards}>
          <View style={styles.card}>
            <Icon name="moon" size={22} color={color.accent} />
            <Text variant="headline" style={styles.cardText} tabular>
              {rested} <Text variant="body" style={{ fontSize: 19 }}>Days rested</Text>
            </Text>
          </View>
          <View style={styles.card}>
            <Icon name="flame" size={22} color={color.flame} />
            <Text variant="headline" style={styles.cardText} tabular>
              {best} <Text variant="body" style={{ fontSize: 19 }}>Best streak</Text>
            </Text>
          </View>
        </View>

        <View style={styles.calendar}>
          <View style={styles.calHead}>
            <Text variant="headline" style={{ fontSize: 21 }}>
              {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </Text>
            <View style={{ flexDirection: 'row', gap: 18 }}>
              <Tap feedback="opacity" hitSlop={10} onPress={() => shiftMonth(-1)} accessibilityLabel="Previous month">
                <Icon name="chevronLeft" size={20} weight="semibold" />
              </Tap>
              <Tap
                feedback="opacity"
                hitSlop={10}
                onPress={() => shiftMonth(1)}
                disabled={atCurrentMonth}
                accessibilityLabel="Next month"
                accessibilityState={{ disabled: atCurrentMonth }}
              >
                <Icon name="chevronRight" size={20} weight="semibold" color={atCurrentMonth ? color.textQuaternary : undefined} />
              </Tap>
            </View>
          </View>
          <View style={styles.grid}>
            {DOW.map((d, i) => (
              <Text key={i} variant="subhead" tone="secondary" align="center" style={{ width: cell }}>
                {d}
              </Text>
            ))}
          </View>
          <Animated.View key={month.toISOString()} entering={FadeIn.duration(200)} style={[styles.grid, { rowGap: 10, marginTop: 12 }]}>
            {cells.map((d, i) => {
              if (!d) return <View key={`e${i}`} style={{ width: cell, height: cell - 6 }} />;
              const key = getLocalDateKey(d);
              const on = dates.has(key);
              const isToday = key === today;
              return (
                <View key={key} style={{ width: cell, alignItems: 'center' }}>
                  <View
                    style={[
                      styles.day,
                      { width: cell - 8, height: cell - 8, borderRadius: (cell - 8) / 2 },
                      on && styles.dayOn,
                      isToday && !on && styles.dayToday,
                    ]}
                  >
                    {on ? (
                      <Icon name="check" size={20} color="#000" weight="bold" />
                    ) : (
                      <Text variant="subhead" tone={key > today ? 'tertiary' : 'secondary'} tabular>
                        {d.getDate()}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

function Flame({ lit }: { lit: boolean }) {
  const s = useSharedValue(1);
  React.useEffect(() => {
    if (!lit) return;
    s.set(withRepeat(withSequence(withTiming(1.05, { duration: 900, easing: motion.easeInOut }), withTiming(1, { duration: 900, easing: motion.easeInOut })), -1));
  }, [lit, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }] }));
  return (
    <Animated.View style={[style, { transformOrigin: 'bottom center' }]}>
      <Svg width={112} height={132} viewBox="0 0 112 132">
        <Defs>
          <LinearGradient id="outer" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor={lit ? '#FF7A1A' : '#3A3A3C'} />
            <Stop offset="1" stopColor={lit ? '#FF3D00' : '#2A2A2C'} />
          </LinearGradient>
          <LinearGradient id="inner" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor={lit ? '#FFC23D' : '#48484A'} />
            <Stop offset="1" stopColor={lit ? '#FF9A1F' : '#3A3A3C'} />
          </LinearGradient>
        </Defs>
        <Path
          d="M58 4C62 30 88 44 98 70c12 32-10 58-42 58S4 104 12 72c5-20 20-26 22-44 14 10 16 24 16 34C62 50 54 26 58 4z"
          fill="url(#outer)"
        />
        <Path d="M56 60c4 16 22 24 22 44 0 14-10 22-22 22s-22-8-22-22c0-10 6-16 10-22 2 8 6 12 10 12 0-12-2-22 2-34z" fill="url(#inner)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  hero: {
    backgroundColor: color.bgRaised,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderCurve: 'continuous',
    paddingBottom: space.xl,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.xl, marginTop: space.md },
  big: { fontFamily: font.heavy, fontSize: 88, lineHeight: 92, color: color.text, letterSpacing: -2 },
  bigLabel: { fontFamily: font.semibold, fontSize: 24, color: color.text, marginTop: 4 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.lg, marginTop: space.xl },
  weekDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: color.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDotOn: { backgroundColor: '#F5F5F7', borderColor: '#F5F5F7' },
  cards: { flexDirection: 'row', gap: 12, paddingHorizontal: space.md, marginTop: space.lg },
  card: {
    flex: 1,
    padding: space.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    gap: 8,
  },
  cardText: { fontSize: 20 },
  calendar: {
    marginHorizontal: space.md,
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
  },
  calHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { backgroundColor: color.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: '#F5F5F7', borderWidth: 3, borderColor: '#3A3A3C' },
  dayToday: { borderWidth: 1.5, borderColor: color.text },
});
