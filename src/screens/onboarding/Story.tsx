import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Text } from '../../ui/Text';
import { color, motion, space } from '../../ui/tokens';

const ART = {
  crimson: require('../../../assets/story/crimson.jpg'),
  blue: require('../../../assets/story/blue.jpg'),
  sky: require('../../../assets/story/sky.jpg'),
};

export const STORY_BG = { crimson: color.storyCrimson, blue: color.storyBlue, sky: color.storySky } as const;

/** Full-bleed editorial page: duotone render, one headline, one line of copy. */
export function Story({ tone, title, body }: { tone: keyof typeof ART; title: string; body: string }) {
  const { width, height } = useWindowDimensions();
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.set(withTiming(1, { duration: 6000, easing: motion.easeOut }));
  }, [drift]);
  const art = useAnimatedStyle(() => ({ transform: [{ scale: 1.06 - drift.get() * 0.06 }] }));
  const bg = STORY_BG[tone];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: bg }]}>
      <Animated.View entering={FadeIn.duration(500)} style={[{ position: 'absolute', top: height * 0.1, width, height: height * 0.62 }, art]}>
        <Image source={ART[tone]} style={StyleSheet.absoluteFill} contentFit="contain" />
      </Animated.View>
      <LinearGradient colors={[`${bg}00`, bg]} locations={[0, 0.5]} style={[styles.fade, { top: height * 0.52 }]} />
      <View style={[styles.copy, { top: height * 0.66 }]}>
        <Animated.View entering={FadeInDown.delay(200).duration(480)}>
          <Text variant="question" align="center" style={{ fontSize: 26, lineHeight: 32 }}>
            {title}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(320).duration(480)}>
          <Text variant="callout" align="center" style={{ color: 'rgba(255,255,255,0.86)', marginTop: 10 }}>
            {body}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fade: { position: 'absolute', left: 0, right: 0, height: 240 },
  copy: { position: 'absolute', left: space.xl, right: space.xl },
});
