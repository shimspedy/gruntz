import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRetentionDiagnostics, type RetentionDiagnostics } from '../services/retentionAnalytics';
import { Button } from '../ui/Button';
import { Hairline, NavHeader } from '../ui/Layout';
import { Text } from '../ui/Text';
import { color, radius, space } from '../ui/tokens';

/** Debug builds only; product events stay on this simulator/device. */
export default function RetentionDiagnosticsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<RetentionDiagnostics | null>(null);
  const refresh = useCallback(() => { void getRetentionDiagnostics().then(setData); }, []);
  useFocusEffect(refresh);
  const secondWithinWeek = data?.firstWorkoutAt && data.secondWorkoutAt
    ? Date.parse(data.secondWorkoutAt) - Date.parse(data.firstWorkoutAt) <= 7 * 86400000 : null;
  const counts = new Map<string, number>();
  data?.events.forEach((event) => counts.set(event.name, (counts.get(event.name) ?? 0) + 1));
  return (
    <View style={styles.screen}>
      <NavHeader title="Retention diagnostics" />
      <ScrollView contentContainerStyle={{ padding: space.gutter, paddingBottom: insets.bottom + space.xl }}>
        <Text variant="callout" tone="secondary">Local events for this installation. This debug view does not send events to an analytics service.</Text>
        <View style={styles.card}>
          <Text variant="headline">Training activation</Text>
          <Text variant="body" style={styles.line}>First workout: {data?.firstWorkoutAt ? 'Completed' : 'Not yet'}</Text>
          <Text variant="body" style={styles.line}>Second workout within 7 days: {secondWithinWeek === null ? 'Not yet' : secondWithinWeek ? 'Yes' : 'No'}</Text>
          <Text variant="body" style={styles.line}>Training weeks: {data?.trainingWeeks.map((week) => week + 1).join(', ') || 'None yet'}</Text>
          {data?.readable === false ? <Text variant="footnote" tone="secondary" style={styles.line}>Saved event history could not be read. Its original copy has been kept.</Text> : null}
        </View>
        <Button title="Refresh events" variant="secondary" onPress={refresh} />
        <View style={styles.card}>
          <Text variant="headline">Recorded actions</Text>
          {[...counts.entries()].map(([name, count]) => <Text key={name} variant="callout" style={styles.line}>{name} · {count}</Text>)}
        </View>
        <Text variant="overline" tone="secondary">Latest events</Text>
        {data?.events.slice(-30).reverse().map((event, index) => (
          <View key={`${event.at}:${index}`} style={{ paddingVertical: space.md }}>
            <Text variant="bodyMedium">{event.name}</Text>
            <Text variant="footnote" tone="secondary" style={{ marginTop: 4 }}>{new Date(event.at).toLocaleTimeString()} · {Object.entries(event.properties).map(([key, value]) => `${key}: ${value}`).join(' · ')}</Text>
            <Hairline style={{ marginTop: space.md }} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: color.bg }, card: { backgroundColor: color.surface, padding: space.lg, borderRadius: radius.lg, borderCurve: 'continuous', marginVertical: space.lg }, line: { marginTop: space.sm } });
