import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXERCISE_LIBRARY, type LibraryGroup, type LibraryItem } from '../data/exerciseLibrary';
import { ExerciseThumb } from '../ui/ExerciseArt';
import { Icon } from '../ui/Icon';
import { Chip, EmptyState, NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { color, font, radius, space } from '../ui/tokens';
import type { RootStackParamList } from '../types/navigation';
import { useRoutineStore } from '../store/useRoutineStore';
import { useSessionStore } from '../store/useSessionStore';
import { toast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { haptic } from '../ui/haptics';

export const GROUP_LABEL: Record<LibraryGroup, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  kettlebell: 'Kettlebell',
  cable: 'Cable',
  machine: 'Machine',
  band: 'Band',
  bodyweight: 'Bodyweight',
  other: 'Other',
  cardio: 'Cardio',
  swim: 'Swim',
  mobility: 'Mobility',
};

const ROW = 84;

/** Every movement in the bundled video library, searchable and filterable by equipment. */
/** What people type vs what the library calls it. */
const SEARCH_SYNONYMS: Record<string, string> = {
  abs: 'core',
  ab: 'core',
  stomach: 'core',
  obliques: 'core',
  lats: 'back',
  pecs: 'chest',
  quads: 'quadriceps',
  hams: 'hamstrings',
  glute: 'glutes',
  bum: 'glutes',
  delts: 'shoulders',
  traps: 'trapezius',
  bi: 'biceps',
  tri: 'triceps',
  cardio: 'cardio',
  db: 'dumbbell',
  bb: 'barbell',
  kb: 'kettlebell',
};

export default function ExerciseLibraryScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'ExerciseLibrary'>>();
  const picking = !!params?.pick;
  const toSession = params?.target === 'session';

  // Picking for a live workout: the session was minimized to open this sheet, so bring it back on close.
  React.useEffect(() => {
    if (!toSession) return;
    return () => useSessionStore.getState().expand();
  }, [toSession]);
  const [picked, setPicked] = useState<string[]>([]);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<LibraryGroup | 'all'>('all');

  const groups = useMemo(() => {
    const present = new Set(EXERCISE_LIBRARY.map((i) => i.group));
    return (Object.keys(GROUP_LABEL) as LibraryGroup[]).filter((g) => present.has(g));
  }, []);

  const items = useMemo(() => {
    const raw = query.trim().toLowerCase();
    // "abs" used to miss most core work, and "dumbbell" matched nothing.
    const q = SEARCH_SYNONYMS[raw] ?? raw;
    return EXERCISE_LIBRARY.filter(
      (i) =>
        (group === 'all' || i.group === group) &&
        (!q ||
          i.name.toLowerCase().includes(q) ||
          i.primary.some((m) => m.toLowerCase().includes(q)) ||
          i.secondary.some((m) => m.toLowerCase().includes(q)) ||
          i.equipment.some((e) => e.toLowerCase().includes(q)) ||
          i.tags.some((t) => t.toLowerCase().includes(q))),
    );
  }, [query, group]);

  const renderItem = ({ item }: { item: LibraryItem }) => (
    <Tap
      feedback="highlight"
      baseColor={color.bg}
      pressedColor={color.bgRaised}
      style={styles.row}
      onPress={() => {
        if (!picking) return navigation.navigate('ExerciseDetail', { mediaKey: item.key });
        haptic.selection();
        setPicked((p) => (p.includes(item.key) ? p.filter((k) => k !== item.key) : [...p, item.key]));
      }}
      onLongPress={() => {
        haptic.light();
        navigation.navigate('ExerciseDetail', { mediaKey: item.key });
      }}
      accessibilityLabel={item.name}
      accessibilityState={picking ? { checked: picked.includes(item.key) } : undefined}
    >
      <ExerciseThumb mediaKey={item.key} size={60} />
      <View style={{ flex: 1, marginLeft: space.md }}>
        <Text variant="headline" numberOfLines={1}>
          {item.name}
        </Text>
        <Text variant="subhead" tone="tertiary" style={{ marginTop: 2 }} numberOfLines={1}>
          {item.primary.slice(0, 2).join(', ')} · {GROUP_LABEL[item.group]}
        </Text>
      </View>
      {picking ? (
        <View style={[styles.check, picked.includes(item.key) && styles.checkOn]}>
          {picked.includes(item.key) ? <Icon name="check" size={14} color="#FFFFFF" weight="bold" /> : null}
        </View>
      ) : (
        <Icon name="chevronRight" size={15} color={color.textTertiary} weight="semibold" />
      )}
    </Tap>
  );

  return (
    <View style={styles.screen}>
      <NavHeader title={picking ? 'Add exercises' : 'Exercise library'} icon={picking ? 'close' : 'back'} inSheet={picking} />
      <View style={styles.search}>
        <Icon name="scope" size={18} color={color.textTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${EXERCISE_LIBRARY.length} exercises or muscles`}
          placeholderTextColor={color.textTertiary}
          style={styles.input}
          selectionColor={color.accent}
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
          <Chip label="All" active={group === 'all'} onPress={() => setGroup('all')} />
          {groups.map((g) => (
            <Chip key={g} label={GROUP_LABEL[g]} active={group === g} onPress={() => setGroup(g)} />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.key}
        renderItem={renderItem}
        extraData={picked}
        getItemLayout={(_, index) => ({ length: ROW, offset: ROW * index, index })}
        initialNumToRender={12}
        windowSize={7}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + (picking ? 110 : space.xl) }}
        ListEmptyComponent={<EmptyState icon="scope" title="No matches" body="Try a different name or clear the equipment filter." />}
      />
      {picking ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.xs }]}>
          <Button
            title={picked.length ? `Add ${picked.length} ${picked.length === 1 ? 'exercise' : 'exercises'}` : 'Select exercises'}
            disabled={!picked.length}
            onPress={() => {
              if (toSession) {
                useSessionStore.getState().addExercises(picked);
                toast(`Added ${picked.length} to your workout`, { icon: 'check' });
              } else useRoutineStore.getState().addToDraft(picked);
              navigation.goBack();
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: space.md,
    paddingHorizontal: space.md,
    height: 48,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
  },
  input: { flex: 1, color: color.text, fontFamily: font.medium, fontSize: 17, height: 48 },
  chips: { paddingHorizontal: space.md, gap: 8, paddingVertical: space.md },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: color.lineStrong, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: color.accent, borderColor: color.accent },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.md, paddingTop: space.md, backgroundColor: color.bg },
  row: { height: ROW, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter },
});
