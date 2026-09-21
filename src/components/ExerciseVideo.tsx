import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { getExerciseMedia } from '../data/exerciseMedia';
import type { Exercise } from '../types';
import { Icon } from '../ui/Icon';
import { categoryIcon } from '../ui/ExerciseArt';
import { motion } from '../ui/tokens';

/**
 * The x-ray exercise loop. Only the visible page owns a player; the rest show the poster,
 * so a 10-exercise session never holds 10 decoders.
 */
export function ExerciseVideo({
  exercise,
  mediaKey,
  active,
  style,
}: {
  exercise?: Exercise;
  mediaKey?: string;
  active: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const media = getExerciseMedia(mediaKey ?? exercise?.media_key);
  if (!media) {
    return (
      <View style={[styles.fallback, style]}>
        <Icon name={categoryIcon(exercise)} size={112} color="#3A3A3E" weight="thin" />
      </View>
    );
  }
  return (
    <View style={[styles.wrap, style]}>
      <Image source={media.poster} style={StyleSheet.absoluteFill} contentFit="contain" />
      {active ? <LoopingVideo source={media.video} /> : null}
    </View>
  );
}

function LoopingVideo({ source }: { source: number }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    // Silent demo loops must never pause the user's music or podcast.
    p.audioMixingMode = 'mixWithOthers';
    p.play();
  });
  const opacity = useSharedValue(0);
  useEffect(() => {
    // Fade the video over its own poster once the first frame is ready: no black flash.
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') opacity.set(withTiming(1, { duration: motion.base, easing: motion.easeOut }));
    });
    if (player.status === 'readyToPlay') opacity.set(1);
    return () => sub.remove();
  }, [player, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} allowsPictureInPicture={false} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#000' },
  fallback: { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
});
