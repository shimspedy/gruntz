import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { getAccessState, useSubscriptionStore } from '../store/useSubscriptionStore';
import { useUserStore } from '../store/useUserStore';
import { Icon } from '../ui/Icon';
import { Wordmark } from '../ui/Logo';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { color, font, motion, radius, space } from '../ui/tokens';

/** Tab-root header: wordmark left; PRO, streak and settings right. */
export function TabHeader() {
  const navigation = useNavigation();
  const streak = useUserStore((s) => s.progress.streak_days);
  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  const isPro = getAccessState({ trialStartedAt, entitlementActive }) === 'subscriber';

  // The flame bumps when the streak grows.
  const bump = useSharedValue(1);
  const prev = useRef(streak);
  useEffect(() => {
    if (streak > prev.current) bump.set(withSequence(withSpring(1.3, motion.bouncy), withSpring(1, motion.settle)));
    prev.current = streak;
  }, [streak, bump]);
  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.get() }] }));

  return (
    <View style={styles.row}>
      <Wordmark height={34} />
      <View style={styles.actions}>
        <Tap
          scaleTo={0.94}
          onPress={() => {
            haptic.light();
            navigation.navigate('Paywall');
          }}
          accessibilityLabel={isPro ? 'Gruntz Pro membership' : 'Upgrade to Gruntz Pro'}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={styles.proWrap}
        >
          {isPro ? (
            <LinearGradient colors={['#6FB4FF', '#2D8CFF', '#EAF3FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pro}>
              <Text style={[styles.proText, { color: '#06101F' }]}>PRO</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.pro, styles.proFree]}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          )}
        </Tap>
        <Tap
          feedback="opacity"
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          onPress={() => {
            haptic.light();
            navigation.navigate('Streak');
          }}
          style={styles.streak}
          accessibilityLabel={`${streak} workout streak`}
        >
          <Animated.View style={flameStyle}>
            <Icon name="flame" size={24} color={streak > 0 ? color.flame : color.textTertiary} />
          </Animated.View>
          <Text style={styles.streakText} tabular>
            {streak}
          </Text>
        </Tap>
        <Tap
          feedback="opacity"
          hitSlop={8}
          onPress={() => {
            haptic.light();
            navigation.navigate('Settings');
          }}
          accessibilityLabel="Settings"
          style={styles.gear}
        >
          <Icon name="gear" size={27} color={color.text} />
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.gutter,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  proWrap: { borderRadius: radius.pill },
  pro: { height: 32, paddingHorizontal: 13, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  proFree: { backgroundColor: '#F5F5F7' },
  proText: { fontFamily: font.bold, fontSize: 14, letterSpacing: 0.8, color: '#000' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  streakText: { fontFamily: font.semibold, fontSize: 19, color: color.text },
  gear: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
});
