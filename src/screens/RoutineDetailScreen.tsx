import React from 'react';
import { ActionSheetIOS, Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { appMuscles, getLibraryItem } from '../data/exerciseLibrary';
import { MuscleBodyMap } from '../components/MuscleBodyMap';
import { muscleLabel, percentShares, plural } from '../features/plan';
import { routineMinutes, useRoutineStore } from '../store/useRoutineStore';
import { useSessionStore } from '../store/useSessionStore';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { ExerciseThumb } from '../ui/ExerciseArt';
import { Icon } from '../ui/Icon';
import { EmptyState, IconButton, NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, motion, radius, space } from '../ui/tokens';
import { getLocalDateKey } from '../utils/dateKey';

const BACK_MUSCLES = new Set(['back', 'hamstrings', 'glutes', 'triceps', 'calves', 'lower_back', 'traps']);
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function scheduleLabel(days: number[]) {
  if (!days.length) return 'Unscheduled';
  if (days.length === 7) return 'Every day';
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => days.includes(d)).map((d) => DAY_NAMES[d]).join(' · ');
}

export default function RoutineDetailScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'RoutineDetail'>>();
  const routine = useRoutineStore((s) => s.routines.find((r) => r.id === params.routineId));
  const session = useSessionStore();

  if (!routine) {
    return (
      <View style={styles.screen}>
        <NavHeader />
        <EmptyState icon="alert" title="Workout not found" body="It may have been deleted." />
      </View>
    );
  }

  const counts = new Map<string, number>();
  routine.items.forEach((it) => {
    const lib = getLibraryItem(it.key);
    if (!lib) return;
    appMuscles({ ...lib, secondary: [] }).forEach((m) => counts.set(m, (counts.get(m) ?? 0) + it.sets * 2));
    appMuscles({ ...lib, primary: [] }).forEach((m) => counts.set(m, (counts.get(m) ?? 0) + it.sets));
  });
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  const distribution = percentShares(Array.from(counts.entries()), total)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4)
    .map(({ key, pct }) => ({ muscle: key, pct }));

  const running = session.active && session.workoutDayId === `routine:${routine.id}`;

  const edit = () => {
    useRoutineStore.getState().editDraft(routine.id);
    navigation.navigate('RoutineEditor');
  };

  const remove = () => {
    Alert.alert(`Delete ${routine.name}?`, 'This removes the workout. Logged history stays.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const snapshot = { ...routine, items: routine.items.map((i) => ({ ...i })) };
          haptic.warning();
          navigation.goBack();
          useRoutineStore.getState().deleteRoutine(routine.id);
          toast('Workout deleted', {
            tone: 'info',
            icon: 'trash',
            action: { label: 'Undo', onPress: () => useRoutineStore.getState().restoreRoutine(snapshot) },
          });
        },
      },
    ]);
  };

  const duplicate = () => {
    const st = useRoutineStore.getState();
    st.newDraft(routine.items.map((it) => it.key));
    st.updateDraft({ name: `${routine.name} copy`, days: [...routine.days], items: routine.items.map((it) => ({ ...it, uid: `${it.uid}c` })) });
    navigation.navigate('RoutineEditor');
  };

  const more = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Edit workout', 'Duplicate', 'Delete workout', 'Cancel'], destructiveButtonIndex: 2, cancelButtonIndex: 3, userInterfaceStyle: 'dark' },
        (i) => {
          if (i === 0) edit();
          if (i === 1) duplicate();
          if (i === 2) remove();
        },
      );
      return;
    }
    // Android used to fall straight through to the delete confirmation, so Edit and
    // Duplicate could not be reached from this menu at all.
    Alert.alert(routine.name, undefined, [
      { text: 'Edit workout', onPress: edit },
      { text: 'Duplicate', onPress: duplicate },
      { text: 'Delete workout', style: 'destructive', onPress: remove },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const start = () => {
    if (running) return session.expand();
    if (session.active) {
      Alert.alert('Another workout is running', `Finish ${session.title || 'it'} first, or discard it and start this one.`, [
        { text: 'Open it', onPress: () => session.expand() },
        {
          text: 'Discard and start',
          style: 'destructive',
          onPress: () => {
            session.discard();
            haptic.medium();
            session.startRoutine(routine, getLocalDateKey());
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    haptic.medium();
    session.startRoutine(routine, getLocalDateKey());
  };

  return (
    <View style={styles.screen}>
      <NavHeader right={<IconButton icon="more" label="More" onPress={more} />} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 180 }} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Text variant="title">{routine.name}</Text>
          <Text variant="body" tone="secondary" style={{ marginTop: 6, fontSize: 17 }}>
            {plural(routine.items.length, 'exercise')}, {routineMinutes(routine)} min
          </Text>
          <View style={styles.schedule}>
            <Icon name="calendar" size={16} color={color.accent} />
            <Text variant="subhead" tone="accent">
              {scheduleLabel(routine.days)}
            </Text>
          </View>
        </View>

        {distribution.length ? (
          <>
            <Text variant="section" style={styles.section}>
              Muscle distribution
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiles}>
              {distribution.map((d) => (
                <View key={d.muscle} style={styles.tile}>
                  <View style={styles.tileArt}>
                    <MuscleBodyMap muscles={{ [d.muscle]: 3 }} scale={0.3} variant="soft" side={BACK_MUSCLES.has(d.muscle) ? 'back' : 'front'} />
                  </View>
                  <View style={{ gap: 6 }}>
                    <Text variant="callout">{muscleLabel(d.muscle)}</Text>
                    <View style={styles.pct}>
                      <Text variant="subhead" tabular>
                        {d.pct}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        ) : null}

        <Text variant="section" style={styles.section}>
          {routine.items.length} exercises
        </Text>
        {routine.items.map((it, i) => {
          const lib = getLibraryItem(it.key);
          const cardio = lib?.group === 'cardio' || lib?.group === 'swim';
          return (
            <Animated.View key={it.uid} entering={FadeInDown.delay(Math.min(i, 8) * motion.stagger).duration(300)}>
              <Tap
                feedback="highlight"
                baseColor={color.bg}
                pressedColor={color.bgRaised}
                style={styles.row}
                onPress={() => navigation.navigate('ExerciseDetail', { mediaKey: it.key })}
                accessibilityLabel={lib?.name}
              >
                <ExerciseThumb mediaKey={it.key} size={76} />
                <View style={{ flex: 1, marginLeft: space.md }}>
                  <Text variant="callout" tone="secondary">
                    {it.sets} {it.sets === 1 ? 'set' : 'sets'}
                    {cardio ? '' : ` x ${it.reps} reps`}
                  </Text>
                  <Text variant="headline" style={{ fontSize: 18, marginTop: 2 }} numberOfLines={2}>
                    {lib?.name ?? it.key}
                  </Text>
                </View>
                <Icon name="info" size={22} color={color.textSecondary} />
              </Tap>
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.xs }]} pointerEvents="box-none">
        <LinearGradient colors={['rgba(0,0,0,0)', color.bg]} style={{ height: 40 }} pointerEvents="none" />
        <View style={styles.footerRow}>
          <Button title="Edit Workout" variant="secondary" icon="pencil" onPress={edit} style={{ flex: 1 }} />
          <Button title={running ? 'Resume' : 'Start Workout'} icon="play" onPress={start} style={{ flex: 1.3 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  head: { paddingHorizontal: space.gutter + 4, paddingTop: space.md },
  schedule: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space.md, alignSelf: 'flex-start', paddingHorizontal: 12, height: 34, borderRadius: radius.pill, backgroundColor: color.accentSoft },
  section: { paddingHorizontal: space.gutter + 4, marginTop: space.xl, marginBottom: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter + 4, paddingVertical: 12 },
  tiles: { paddingHorizontal: space.gutter + 4, gap: 18 },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tileArt: { width: 76, height: 76, borderRadius: radius.sm, backgroundColor: color.surface, overflow: 'hidden', alignItems: 'center', paddingTop: 2 },
  pct: { alignSelf: 'flex-start', paddingHorizontal: 10, height: 28, borderRadius: 8, backgroundColor: color.surface, justifyContent: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  footerRow: { flexDirection: 'row', gap: 12, paddingHorizontal: space.md, backgroundColor: color.bg },
});
