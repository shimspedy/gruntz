import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../types/navigation';
import type { ActivityType } from '../types/activity';
import { useReadinessStore, type TrackedSession } from '../store/useReadinessStore';
import { useUserStore } from '../store/useUserStore';
import { activityAccent, activityAscent, activityDateLabel, activityDistance, activityDuration, activityLabel, activityPace, activityTotals, sortActivities, type ActivityUnits } from '../utils/activityDisplay';
import { ActivityRouteArt } from '../components/activity/ActivityRouteArt';
import { useActivityRoute } from '../hooks/useActivityRoute';
import { Button } from '../ui/Button';
import { Chip, EmptyState, NavHeader } from '../ui/Layout';
import { Icon } from '../ui/Icon';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { color, font, space } from '../ui/tokens';

type Filter = 'all' | ActivityType;

export default function ActivityHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const sessions = useReadinessStore((state) => state.trackedSessions);
  const units = useUserStore((state) => state.profile?.settings.units ?? 'imperial');
  const [filter, setFilter] = useState<Filter>('all');
  const activities = useMemo(() => sortActivities(sessions.filter((session) => filter === 'all' || session.type === filter)), [sessions, filter]);
  const totals = useMemo(() => activityTotals(activities), [activities]);
  const distance = activityDistance(totals.distanceMiles, units);
  const open = useCallback((sessionId: string) => navigation.navigate('ActivityDetail', { sessionId }), [navigation]);

  return (
    <View style={styles.screen}>
      <NavHeader title="Field history" />
      <FlatList data={activities} keyExtractor={(item) => item.id} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: insets.bottom + space.xxl }}
        ListHeaderComponent={<>
          <View style={styles.intro}>
            <Text variant="overline" style={styles.eyebrow}>MILES THAT STAY WITH YOU</Text>
            <Text variant="display" style={{ marginTop: 6 }}>Your time outside.</Text>
            <Text variant="callout" tone="secondary" style={{ marginTop: 10 }}>Runs, rucks and hikes. Saved here, ready to look back on or share.</Text>
          </View>
          <View style={styles.totals}>
            <View style={{ flex: 1.4 }}><Text variant="caption" tone="secondary">TOTAL DISTANCE</Text><Text style={styles.totalNumber} tabular>{distance.value}<Text variant="headline" tone="secondary"> {distance.unit}</Text></Text></View>
            <View style={{ flex: 1 }}><Text variant="caption" tone="secondary">ACTIVITIES</Text><Text style={styles.totalNumber} tabular>{totals.count}</Text></View>
            <View style={{ flex: 1 }}><Text variant="caption" tone="secondary">TIME</Text><Text style={[styles.totalNumber, { fontSize: 21 }]} tabular>{activityDuration(totals.durationSeconds)}</Text></View>
          </View>
          <View style={styles.filters}>
            {(['all', 'run', 'ruck', 'hike'] as const).map((value) => <Chip key={value} label={value === 'all' ? 'All' : activityLabel(value)} active={filter === value} onPress={() => setFilter(value)} />)}
          </View>
        </>}
        ListEmptyComponent={<EmptyState icon="location" title={filter === 'all' ? 'Your next adventure starts here' : `No ${activityLabel(filter).toLowerCase()}s yet`}
          body="Track an activity to save its route, distance and time. Your field notes build with every finish.">
          <Button title={filter === 'all' ? 'Track an activity' : `Start a ${activityLabel(filter).toLowerCase()}`} icon="plus" onPress={() => navigation.navigate('RunTracker', { type: filter === 'all' ? 'run' : filter })} />
        </EmptyState>}
        renderItem={({ item }) => <HistoryCard session={item} units={units} onOpen={open} />}
        ItemSeparatorComponent={Separator} />
    </View>
  );
}

const Separator = () => <View style={{ height: 14 }} />;

const HistoryCard = React.memo(function HistoryCard({ session, units, onOpen }: { session: TrackedSession; units: ActivityUnits; onOpen: (sessionId: string) => void }) {
  const tint = activityAccent(session.type);
  const distance = activityDistance(session.distanceMiles, units);
  const pace = activityPace(session, units);
  // Loaded per visible card; the summary above never waits for it.
  const { route, status } = useActivityRoute(session);
  return (
    <Tap onPress={() => onOpen(session.id)} accessibilityLabel={`${activityLabel(session.type)}, ${distance.value} ${distance.unit}, ${activityDateLabel(session)}, open activity`} style={styles.card} feedback="scale" scaleTo={0.985}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: `${tint}16` }]}>
          <Icon name={session.type === 'ruck' ? 'ruck' : session.type === 'hike' ? 'elevation' : 'run'} size={15} color={tint} />
          <Text variant="caption" style={{ color: tint }}>{activityLabel(session.type).toUpperCase()}</Text>
        </View>
        <Text variant="footnote" tone="secondary">{activityDateLabel(session)}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={{ flex: 1 }}>
          <Text tabular style={styles.cardDistance}>{distance.value}<Text variant="headline" tone="secondary"> {distance.unit}</Text></Text>
          <Text variant="callout" numberOfLines={2} style={{ color: color.textSecondary, marginTop: 5 }}>{session.title?.trim() || `${activityLabel(session.type)} · ${session.terrain || 'outdoors'}`}</Text>
        </View>
        {route.length ? <View style={styles.thumbnail}><ActivityRouteArt route={route} tint={tint} height={96} /></View> : status === 'loading' ? <View style={styles.thumbnail} /> : <View style={styles.noRoute}><Icon name="location" size={24} color={color.textQuaternary} /></View>}
      </View>
      <View style={styles.cardFooter}>
        <Text variant="footnote" tone="secondary" tabular>{activityDuration(session.durationSeconds)}</Text>
        <Text variant="footnote" tone="secondary" tabular>{pace.value} {pace.unit}</Text>
        <Text variant="footnote" tone="secondary" tabular>↑ {activityAscent(session.elevationFeet, units)}</Text>
        <View style={{ flex: 1 }} /><Icon name="chevronRight" size={16} color={color.textTertiary} />
      </View>
    </Tap>
  );
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  intro: { paddingHorizontal: 4, paddingTop: 16, paddingBottom: 24 },
  eyebrow: { color: color.accent, fontSize: 11, letterSpacing: 1.6 },
  totals: { flexDirection: 'row', padding: 18, gap: 14, backgroundColor: color.bgRaised, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: color.line },
  totalNumber: { fontFamily: font.bold, fontSize: 27, letterSpacing: -0.6, marginTop: 8 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingVertical: 22 },
  card: { backgroundColor: color.bgRaised, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: color.line, padding: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  cardDistance: { fontFamily: font.heavy, fontSize: 37, letterSpacing: -1.2 },
  thumbnail: { width: 96, height: 96, borderRadius: 16, overflow: 'hidden' },
  noRoute: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line, paddingTop: 14 },
});
