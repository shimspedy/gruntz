import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getExerciseById } from '../data/exercises';
import { PROGRAMS } from '../data/programs';
import { recommendProgramForProfile } from '../services/adaptiveCoach';
import { useProgramStore } from '../store/useProgramStore';
import { useUserStore } from '../store/useUserStore';
import type { ProgramId } from '../types';
import { HeroArt } from '../ui/ExerciseArt';
import { NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { color, motion, radius, space } from '../ui/tokens';

export const PROGRAM_ART: Record<ProgramId, string> = { basecamp: 'goblet_squat', raider: 'deadlift', recon: 'pullups' };

export default function ProgramSelectScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const profile = useUserStore((s) => s.profile);
  const current = useProgramStore((s) => s.selectedProgram);
  const rec = useMemo(() => (profile ? recommendProgramForProfile(profile) : null), [profile]);

  return (
    <View style={styles.screen}>
      <NavHeader title="Programs" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl, paddingHorizontal: space.md, gap: space.md }} showsVerticalScrollIndicator={false}>
        <Text variant="callout" tone="secondary" style={{ paddingHorizontal: 8, marginBottom: 4 }}>
          Start with Base Camp, or move into tactical prep when you’re ready.
        </Text>
        {PROGRAMS.map((p, i) => {
          const tag = current === p.id ? 'Current' : rec?.programId === p.id ? 'Recommended' : null;
          return (
            <Animated.View key={p.id} entering={FadeInDown.delay(i * motion.stagger).duration(360)}>
              <Tap onPress={() => navigation.navigate('ProgramDetail', { programId: p.id })} scaleTo={0.98} style={[styles.card, { height: width * 0.72 }]} accessibilityLabel={`${p.name}${tag ? `, ${tag}` : ''}`}>
                <HeroArt exercise={getExerciseById(PROGRAM_ART[p.id])} style={StyleSheet.absoluteFill} />
                <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(6,7,9,0.95)']} locations={[0.25, 0.92]} style={StyleSheet.absoluteFill} />
                {tag ? (
                  <View style={[styles.tag, tag === 'Current' && styles.tagCurrent]}>
                    <Text variant="subhead" style={{ color: tag === 'Current' ? '#000' : '#FFF' }}>
                      {tag}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.copy}>
                  <Text variant="hero">{p.name.toUpperCase()}</Text>
                  <Text variant="callout" tone="secondary" style={{ marginTop: 4 }}>
                    {p.duration_weeks} weeks · {p.days_per_week} days a week · {p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1)}
                  </Text>
                  <Text variant="footnote" tone="tertiary" style={{ marginTop: 6 }} numberOfLines={2}>
                    {p.subtitle}
                  </Text>
                </View>
              </Tap>
            </Animated.View>
          );
        })}
        <Text variant="footnote" tone="tertiary" align="center" style={{ marginTop: space.sm }}>
          Switching programs starts you at week one.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  card: { borderRadius: radius.xl, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: color.surface },
  tag: {
    position: 'absolute',
    top: space.lg,
    left: space.lg,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: color.accent,
    justifyContent: 'center',
  },
  tagCurrent: { backgroundColor: '#F5F5F7' },
  copy: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg },
});
