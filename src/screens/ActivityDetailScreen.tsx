import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, PixelRatio, Platform, ScrollView, StyleSheet, Switch, useWindowDimensions, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import { captureRef, releaseCapture } from 'react-native-view-shot';
import type { RootStackParamList } from '../types/navigation';
import { useReadinessStore, type TrackedSession } from '../store/useReadinessStore';
import { useUserStore } from '../store/useUserStore';
import { activityAccent, activityAscent, activityDateLabel, activityDistance, activityDuration, activityLabel, activityPace, type ActivityUnits } from '../utils/activityDisplay';
import { privateRoute } from '../utils/activityRoute';
import { activityCaptureSize } from '../utils/activityCapture';
import { ActivityRouteMap } from '../components/activity/ActivityRouteMap';
import { useActivityRoute } from '../hooks/useActivityRoute';
import { ActivityShareCard, type ActivityCardTheme, type ActivityShareCardRef } from '../components/activity/ActivityShareCard';
import { Button } from '../ui/Button';
import { Chip, EmptyState, IconButton, NavHeader, Stat } from '../ui/Layout';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';
import { color, font, space } from '../ui/tokens';

export default function ActivityDetailScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'ActivityDetail'>) {
  const insets = useSafeAreaInsets();
  const session = useReadinessStore((state) => state.trackedSessions.find((item) => item.id === route.params?.sessionId));
  const units = useUserStore((state) => state.profile?.settings.units ?? 'imperial');
  const [shareOpen, setShareOpen] = useState(false);
  const { route: savedRoute, status: routeStatus } = useActivityRoute(session);
  if (!session) return <View style={styles.screen}><NavHeader title="Activity" /><EmptyState icon="location" title="Activity unavailable" body="This activity may have been removed or replaced by a backup."><Button title="Open field history" onPress={() => navigation.replace('ActivityHistory')} /></EmptyState></View>;
  const distance = activityDistance(session.distanceMiles, units);
  const pace = activityPace(session, units);
  const tint = activityAccent(session.type);

  return (
    <View style={styles.screen}>
      <NavHeader title={activityLabel(session.type)} right={<IconButton icon="share" onPress={() => setShareOpen(true)} label="Preview share card" />} />
      <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: insets.bottom + space.xxl }} showsVerticalScrollIndicator={false}>
        <Text variant="overline" style={{ color: tint }}>{activityDateLabel(session, true)}</Text>
        <Text variant="title" style={{ marginTop: 10 }}>{session.title?.trim() || `${activityLabel(session.type)} · mission complete`}</Text>
        <View style={styles.heroDistance}><Text tabular style={styles.distance}>{distance.value}</Text><Text variant="section" tone="secondary" style={{ paddingBottom: 9 }}>{distance.unit}</Text></View>
        {savedRoute.length ? <ActivityRouteMap route={savedRoute} tint={tint} />
          : routeStatus === 'loading' ? <View style={styles.routeLoading} accessibilityLabel="Loading route"><ActivityIndicator color={tint} /></View>
            : <View style={styles.legacy}><Icon name="location" size={24} color={color.textSecondary} /><Text variant="callout" tone="secondary" style={{ flex: 1 }}>{routeStatus === 'missing' ? 'This activity’s route couldn’t be loaded. Its stats are saved.' : 'This activity has saved stats but no GPS route. New tracked activities include their route.'}</Text></View>}
        <View style={styles.stats}>
          <Stat label="Active time" value={activityDuration(session.durationSeconds)} style={styles.stat} />
          <Stat label={`Average pace ${pace.unit}`} value={pace.value} style={styles.stat} />
          <Stat label="Ascent" value={activityAscent(session.elevationFeet, units)} style={styles.stat} />
          {typeof session.steps === 'number' ? <Stat label="Steps" value={Math.max(0, session.steps).toLocaleString()} style={styles.stat} /> : null}
          {typeof session.caloriesEstimate === 'number' ? <Stat label="Est. calories" value={`${Math.max(0, Math.round(session.caloriesEstimate)).toLocaleString()} kcal`} style={styles.stat} /> : null}
          {session.packWeightPounds ? <Stat label="Pack weight" value={`${Math.round(session.packWeightPounds * (units === 'metric' ? 0.45359237 : 1))} ${units === 'metric' ? 'kg' : 'lb'}`} style={styles.stat} /> : null}
        </View>
        {session.stepsLimited ? <Text variant="footnote" tone="secondary" style={{ marginTop: 4, marginBottom: 16 }}>Step count may be incomplete while the app was in the background.</Text> : null}
        {session.terrain ? <Text variant="callout" tone="secondary" style={{ marginBottom: 12 }}>Terrain · {session.terrain}</Text> : null}
        {session.notes?.trim() ? <View style={styles.notes}><Text variant="overline" tone="secondary">FIELD NOTES</Text><Text variant="body" style={{ marginTop: 10 }}>{session.notes}</Text></View> : null}
        <Button title="Make a share card" icon="share" onPress={() => setShareOpen(true)} style={{ marginTop: 22 }} />
      </ScrollView>
      <Modal visible={shareOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShareOpen(false)}>
        {shareOpen ? <SharePreview session={session} units={units} onClose={() => setShareOpen(false)} /> : null}
      </Modal>
    </View>
  );
}

function SharePreview({ session, units, onClose }: { session: TrackedSession; units: ActivityUnits; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [theme, setTheme] = useState<ActivityCardTheme>('field');
  const [hideEndpoints, setHideEndpoints] = useState(true);
  const [includeRoute, setIncludeRoute] = useState(true);
  const [sharing, setSharing] = useState(false);
  const cardView = useRef<View>(null);
  const card = useRef<ActivityShareCardRef>(null);
  const layout = useRef({ width: 0, height: 0 });
  const busy = useRef(false);
  // Already in memory from the detail screen; the endpoint privacy below is applied to the loaded route.
  const { route: savedRoute, status: routeStatus } = useActivityRoute(session);
  const visibleRoute = useMemo(() => !includeRoute ? [] : hideEndpoints ? privateRoute(savedRoute) : savedRoute, [includeRoute, hideEndpoints, savedRoute]);
  const tint = theme === 'signal' ? '#63BBFF' : activityAccent(session.type);

  const share = async () => {
    if (busy.current) return;
    busy.current = true;
    setSharing(true);
    let file: string | undefined;
    try {
      if (!await Sharing.isAvailableAsync()) throw new Error('Sharing is unavailable on this device.');
      if (!cardView.current || !card.current || layout.current.width <= 0) throw new Error('The card is still loading. Please try again.');
      await card.current.prepareCapture();
      // Image onLoad has fired; allow its rendered frame to settle before capture.
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      file = await captureRef(cardView, { format: 'png', result: 'tmpfile', ...activityCaptureSize(layout.current.width, layout.current.height, Platform.OS, PixelRatio.get()) });
      await Sharing.shareAsync(file, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share your Gruntz activity' });
    } catch (error) {
      Alert.alert('Couldn’t share the card', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      if (file) releaseCapture(file);
      busy.current = false;
      setSharing(false);
    }
  };

  return <View style={styles.screen}>
    <NavHeader title="Share your miles" icon="close" onBack={() => { if (!busy.current) onClose(); }} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 24, alignItems: 'center' }}>
      <Text variant="callout" tone="secondary" align="center" style={{ maxWidth: 360, marginBottom: 20 }}>A field note worth keeping. Preview exactly what you’ll share.</Text>
      <View ref={cardView} collapsable={false} onLayout={(event) => { layout.current = event.nativeEvent.layout; }}>
        <ActivityShareCard key={`${session.id}-${hideEndpoints}-${includeRoute}-${theme}-${routeStatus}`} ref={card} session={session} route={visibleRoute} routeRecorded={savedRoute.length > 0} units={units} tint={tint} width={Math.min(width - 32, 420)} theme={theme} endpointsHidden={hideEndpoints} routeIncluded={includeRoute} />
      </View>
      <View style={styles.themeRow}><Chip label="Field" active={theme === 'field'} onPress={() => { if (!busy.current) setTheme('field'); }} /><Chip label="Signal" active={theme === 'signal'} onPress={() => { if (!busy.current) setTheme('signal'); }} /></View>
      {savedRoute.length ? <View style={styles.privacy}>
        <View style={styles.toggleRow}><Text variant="headline" style={{ flex: 1 }}>Include route</Text><Switch accessibilityLabel="Include route on share card" value={includeRoute} disabled={sharing} onValueChange={setIncludeRoute} trackColor={{ true: color.accent }} /></View>
        {includeRoute ? <>
          <View style={styles.toggleRow}><Text variant="headline" style={{ flex: 1 }}>Hide start & end</Text><Switch accessibilityLabel="Hide locations within 200 meters of start and end" value={hideEndpoints} disabled={sharing} onValueChange={(value) => {
            if (value) setHideEndpoints(true);
            else Alert.alert('Show your full route?', 'Your start and finish may reveal your home or another private location. The card will show the full route.', [{ text: 'Keep hidden', style: 'cancel' }, { text: 'Show full route', onPress: () => setHideEndpoints(false) }]);
          }} trackColor={{ true: color.accent }} /></View>
          <Text variant="footnote" tone="secondary">{hideEndpoints ? 'Locations within 200 m of your start and finish are removed from this card. A route can still reveal places you visit.' : 'Your full route is visible, including the start and finish. Check the preview before sharing.'}</Text>
        </> : <Text variant="footnote" tone="secondary">Your card will share the activity stats without a route.</Text>}
      </View> : null}
    </ScrollView>
    <View style={[styles.shareFooter, { paddingBottom: insets.bottom + 12 }]}><Button title="Share image" icon="share" loading={sharing || routeStatus === 'loading'} onPress={() => { void share(); }} /><Text variant="caption" tone="secondary" align="center" style={{ marginTop: 10 }}>Opens your device’s share sheet. Nothing is posted automatically.</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  heroDistance: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginVertical: 20 },
  distance: { fontFamily: font.black, fontSize: 68, lineHeight: 76, letterSpacing: -2.5 },
  routeLoading: { height: 320, borderRadius: 20, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  legacy: { backgroundColor: color.surface, borderRadius: 20, padding: 20, flexDirection: 'row', gap: 14, alignItems: 'center' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingVertical: 22 },
  stat: { flexBasis: '46%', flexGrow: 1, padding: 16, backgroundColor: color.bgRaised, borderRadius: 16 },
  notes: { backgroundColor: color.surface, borderRadius: 20, padding: 20 },
  themeRow: { flexDirection: 'row', gap: 12, marginVertical: 22 },
  privacy: { alignSelf: 'stretch', backgroundColor: color.surface, borderRadius: 20, padding: 18, gap: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  shareFooter: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: color.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
});
