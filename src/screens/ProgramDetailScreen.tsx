import React from 'react';
import { Alert, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { StackActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { getExerciseById } from '../data/exercises';
import { getProgramById } from '../data/programs';
import { usePlanLibraryStore } from '../store/usePlanLibraryStore';
import { useProgramStore } from '../store/useProgramStore';
import { useSessionStore } from '../store/useSessionStore';
import { hasTrainingAccess, useSubscriptionStore } from '../store/useSubscriptionStore';
import type { ProgramId } from '../types';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { HeroArt } from '../ui/ExerciseArt';
import { Icon } from '../ui/Icon';
import { EmptyState, Hairline, NavHeader, Stat } from '../ui/Layout';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, radius, space } from '../ui/tokens';
import { PROGRAM_ART } from './ProgramSelectScreen';

export default function ProgramDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'ProgramDetail'>>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const current = useProgramStore((s) => s.selectedProgram);
  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  const program = getProgramById(params.programId);
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => y.set(e.contentOffset.y));
  const heroH = width * 1.05;
  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(y.get(), [-200, 0, heroH], [-100, 0, heroH * 0.4]) }, { scale: interpolate(y.get(), [-200, 0], [1.3, 1], 'clamp') }],
  }));

  if (!program) {
    return (
      <View style={styles.screen}>
        <NavHeader />
        <EmptyState icon="alert" title="Program unavailable" body="This training block couldn’t be loaded. Go back and pick another." />
      </View>
    );
  }

  const unlocked = hasTrainingAccess({ trialStartedAt, entitlementActive });
  const isCurrent = current === program.id;

  const start = () => {
    if (!unlocked) {
      navigation.navigate('Paywall');
      return;
    }
    Alert.alert(`Start ${program.name}?`, 'Your plan restarts at week one. Completed workouts and XP stay with you.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start program',
        onPress: () => {
          if (useSessionStore.getState().active) useSessionStore.getState().discard();
          useProgramStore.getState().selectProgram(program.id as ProgramId);
          useProgramStore.getState().setHasSeenProgramSelect(true);
          usePlanLibraryStore.getState().unfollow();
          haptic.success();
          navigation.dispatch(StackActions.popToTop());
          toast(`${program.name} is your new program`, { icon: 'check' });
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: insets.bottom + 140 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={[{ height: heroH }, heroStyle]}>
          <HeroArt exercise={getExerciseById(PROGRAM_ART[program.id])} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)', color.bg]} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <View style={[styles.body, { marginTop: -heroH * 0.28 }]}>
          <Text variant="display">{program.name.toUpperCase()}</Text>
          <Text variant="body" tone="secondary" style={{ marginTop: 6 }}>
            {program.subtitle}
          </Text>
          <View style={styles.stats}>
            <Stat label="Weeks" value={String(program.duration_weeks)} accent style={{ flex: 1 }} />
            <Stat label="Days / week" value={String(program.days_per_week)} style={{ flex: 1 }} />
            <Stat label="Level" value={program.difficulty.charAt(0).toUpperCase() + program.difficulty.slice(1)} style={{ flex: 1 }} />
          </View>
          <Hairline />
          <Text variant="body" tone="secondary" style={{ marginTop: space.lg }}>
            {program.description}
          </Text>

          <Text variant="section" style={styles.h}>
            Phases
          </Text>
          {program.phases.map((p, i) => (
            <View key={p.phase_number} style={styles.phase}>
              <View style={styles.rail}>
                <View style={[styles.dot, i === 0 && styles.dotOn]} />
                {i < program.phases.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: space.lg }}>
                <Text variant="headline">{p.name}</Text>
                <Text variant="subhead" tone="tertiary" style={{ marginTop: 2 }}>
                  Weeks {p.weeks[0]}–{p.weeks[1]}
                  {p.is_deload_included ? ' · includes deload' : ''}
                </Text>
                <Text variant="callout" tone="secondary" style={{ marginTop: 6 }}>
                  {p.description}
                </Text>
              </View>
            </View>
          ))}

          <Text variant="section" style={styles.h}>
            Focus
          </Text>
          <View style={styles.chips}>
            {program.focus_areas.map((f) => (
              <View key={f} style={styles.chip}>
                <Text variant="subhead">{f}</Text>
              </View>
            ))}
          </View>

          {program.equipment_needed.length ? (
            <>
              <Text variant="section" style={styles.h}>
                Equipment
              </Text>
              {program.equipment_needed.map((e) => (
                <View key={e} style={styles.item}>
                  <Icon name="check" size={15} color={color.accent} weight="bold" />
                  <Text variant="callout" style={{ flex: 1 }}>
                    {e}
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          {program.prerequisites.length ? (
            <>
              <Text variant="section" style={styles.h}>
                Before you start
              </Text>
              {program.prerequisites.map((e) => (
                <View key={e} style={styles.item}>
                  <Icon name="info" size={16} color={color.textSecondary} />
                  <Text variant="callout" tone="secondary" style={{ flex: 1 }}>
                    {e}
                  </Text>
                </View>
              ))}
            </>
          ) : null}
        </View>
      </Animated.ScrollView>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <NavHeader transparent />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.xs }]}>
        <Button
          title={isCurrent ? 'Your current program' : unlocked ? `Start ${program.name}` : 'Unlock Gruntz Pro'}
          disabled={isCurrent}
          icon={isCurrent || !unlocked ? undefined : 'play'}
          onPress={start}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  body: { paddingHorizontal: space.gutter + 4 },
  stats: { flexDirection: 'row', paddingVertical: space.lg, marginTop: space.md },
  h: { marginTop: space.xl, marginBottom: space.md },
  phase: { flexDirection: 'row', gap: 14 },
  rail: { alignItems: 'center', width: 14 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: color.lineStrong, marginTop: 5 },
  dotOn: { backgroundColor: color.accent, borderColor: color.accent },
  line: { flex: 1, width: 2, backgroundColor: color.line, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: color.surface, justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.md, paddingTop: space.md, backgroundColor: color.bg },
});
