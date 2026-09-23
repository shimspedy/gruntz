import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { cardTitle, formatMinutes, heroExercise, plural, workoutExercises, type PlanDay } from '../features/plan';
import { HeroArt } from '../ui/ExerciseArt';
import { HexIcon } from '../ui/HexIcon';
import { Icon } from '../ui/Icon';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { color, font, radius, space } from '../ui/tokens';

interface Props {
  days: PlanDay[];
  onOpen: (day: PlanDay) => void;
}

/**
 * The week's missions as tall hero cards. The focused card sits centred at full size;
 * neighbours peek at the edges, slightly smaller and dimmer, and grow as they scroll in.
 */
export function PlanCarousel({ days, onOpen }: Props) {
  const { width } = useWindowDimensions();
  const cardW = Math.round(width * 0.8);
  const gap = 14;
  const snap = cardW + gap;
  const side = (width - cardW) / 2;
  const x = useSharedValue(0);
  const ref = useRef<Animated.ScrollView>(null);

  const cards = useMemo(() => days.filter((d) => d.workout), [days]);
  const focusIndex = useMemo(() => {
    const today = cards.findIndex((d) => d.isToday);
    if (today >= 0) return today;
    const next = cards.findIndex((d) => !d.isPast);
    return next >= 0 ? next : Math.max(0, cards.length - 1);
  }, [cards]);

  useEffect(() => {
    const id = setTimeout(() => ref.current?.scrollTo({ x: focusIndex * snap, animated: false }), 0);
    return () => clearTimeout(id);
  }, [focusIndex, snap]);

  const onScroll = useAnimatedScrollHandler((e) => {
    x.set(e.contentOffset.x);
  });

  return (
    <Animated.ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={snap}
      contentContainerStyle={{ paddingHorizontal: side, gap }}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentOffset={{ x: focusIndex * snap, y: 0 }}
    >
      {cards.map((d, i) => (
        <PlanCard key={d.dateKey} day={d} index={i} x={x} snap={snap} width={cardW} onPress={() => onOpen(d)} />
      ))}
    </Animated.ScrollView>
  );
}

function PlanCard({
  day,
  index,
  x,
  snap,
  width,
  onPress,
}: {
  day: PlanDay;
  index: number;
  x: SharedValue<number>;
  snap: number;
  width: number;
  onPress: () => void;
}) {
  const workout = day.workout!;
  const hero = heroExercise(workout);
  const count = workoutExercises(workout).length;
  const height = Math.round(width * 1.3);

  const style = useAnimatedStyle(() => {
    const d = Math.abs(x.get() / snap - index);
    return {
      transform: [{ scale: interpolate(d, [0, 1], [1, 0.9], Extrapolation.CLAMP) }],
      opacity: interpolate(d, [0, 1], [1, 0.55], Extrapolation.CLAMP),
    };
  });

  const label = day.isToday ? 'Today' : day.weekday;

  return (
    <Animated.View style={[{ width, height }, style]}>
      <Tap onPress={onPress} scaleTo={0.98} style={styles.card} accessibilityLabel={`${label}, ${workout.title}`}>
        <HeroArt exercise={hero} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.25)', 'rgba(8,9,11,0.96)']}
          locations={[0.35, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.dayChip, day.isToday && styles.dayChipToday]}>
          <Text variant="subhead" style={{ color: day.isToday ? '#000' : color.text }}>
            {label}
          </Text>
        </View>
        {day.completed ? (
          <View style={styles.doneBadge}>
            <Icon name="check" size={14} color="#FFFFFF" weight="bold" />
          </View>
        ) : null}
        <View style={styles.bottom}>
          <Text style={styles.title} numberOfLines={2}>
            {cardTitle(workout)}
          </Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: 6, fontSize: 16 }}>
            {formatMinutes(workout.estimated_duration)} · {plural(count, 'exercise')}
          </Text>
          <View style={styles.meta}>
            {day.completed ? (
              <>
                <Icon name="check" size={16} color={color.accent} weight="bold" />
                <Text variant="subhead" style={{ color: color.text }}>
                  Completed · +{workout.rewards.xp} XP
                </Text>
              </>
            ) : (
              <>
                <HexIcon size={18} color={color.accent} filled />
                <Text variant="subhead" style={{ color: color.text }} tabular>
                  +{workout.rewards.xp} XP · Week {workout.week}
                </Text>
              </>
            )}
          </View>
        </View>
      </Tap>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.hero,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dayChip: {
    position: 'absolute',
    top: space.lg,
    left: space.lg,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: 'rgba(60,60,64,0.72)',
    justifyContent: 'center',
  },
  dayChipToday: { backgroundColor: '#F5F5F7' },
  doneBadge: {
    position: 'absolute',
    top: space.lg,
    right: space.lg,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.xl },
  title: { fontFamily: font.heavy, fontSize: 31, lineHeight: 34, letterSpacing: -0.5, color: color.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space.md },
});
