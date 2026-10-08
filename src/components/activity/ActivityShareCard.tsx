import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { TrackedSession } from '../../store/useReadinessStore';
import type { RoutePoint } from '../../types/activity';
import { activityMapAttribution } from '../../config/activityMap';
import { activityAscent, activityDateLabel, activityDistance, activityDuration, activityLabel, activityPace, type ActivityUnits } from '../../utils/activityDisplay';
import { activityMapSnapshot } from '../../utils/activityMapSnapshot';
import { routeSegments } from '../../utils/activityRoute';
import { Text } from '../../ui/Text';
import { Wordmark } from '../../ui/Logo';
import { font } from '../../ui/tokens';
import { ActivityRouteArt, type ActivityRouteArtRef } from './ActivityRouteArt';

export type ActivityCardTheme = 'field' | 'signal';
export interface ActivityShareCardRef { prepareCapture: () => Promise<void> }

export const ActivityShareCard = forwardRef<ActivityShareCardRef, {
  session: TrackedSession; route: RoutePoint[]; routeRecorded: boolean; units: ActivityUnits; tint: string; width: number;
  theme: ActivityCardTheme; endpointsHidden: boolean; routeIncluded: boolean;
}>(function ActivityShareCard({ session, route, routeRecorded, units, tint, width, theme, endpointsHidden, routeIncluded }, ref) {
  const artRef = useRef<ActivityRouteArtRef>(null);
  const [mapUri, setMapUri] = useState<string | null>(null);
  const [artUri, setArtUri] = useState<string | null>(null);
  const loadedUri = useRef<string | null>(null);
  const loadWaiters = useRef<Array<{ resolve: () => void; reject: (error: Error) => void }>>([]);
  const locked = useRef(false);
  const hasRoute = useMemo(() => routeSegments(route).length > 0, [route]);
  const mapHeight = Math.round(width * 0.88);
  const imageUri = artUri ?? mapUri;
  const distance = activityDistance(session.distanceMiles, units);
  const pace = activityPace(session, units);

  useEffect(() => {
    let cancelled = false;
    locked.current = false;
    setMapUri(null); setArtUri(null); loadedUri.current = null;
    if (!hasRoute || !routeIncluded) return undefined;
    // A native snapshot can wait for tiles while offline. The preview and sharing
    // stay usable through Skia; late map completion never changes an export.
    const deadline = setTimeout(() => { cancelled = true; }, 12000);
    void activityMapSnapshot(route, tint).then((uri) => {
      if (!cancelled && !locked.current && uri) setMapUri(uri);
    }).catch(() => undefined).finally(() => clearTimeout(deadline));
    return () => { cancelled = true; clearTimeout(deadline); };
  }, [route, tint, hasRoute, routeIncluded]);

  useEffect(() => () => {
    loadWaiters.current.splice(0).forEach(({ reject }) => reject(new Error('Share preview closed.')));
  }, []);

  const waitForImage = (uri: string) => {
    if (loadedUri.current === uri) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const waiter = { resolve: () => { clearTimeout(timeout); resolve(); }, reject: (error: Error) => { clearTimeout(timeout); reject(error); } };
      const timeout = setTimeout(() => {
        loadWaiters.current = loadWaiters.current.filter((item) => item !== waiter);
        reject(new Error('The preview image could not load. Please try again.'));
      }, 6000);
      loadWaiters.current.push(waiter);
    });
  };

  useImperativeHandle(ref, () => ({ prepareCapture: async () => {
    locked.current = true;
    if (!hasRoute || !routeIncluded) return;
    if (imageUri) return waitForImage(imageUri);
    const uri = await artRef.current?.snapshot();
    if (!uri) throw new Error('Route artwork is still loading. Please try again.');
    setArtUri(uri);
    await waitForImage(uri);
  } }));

  return (
    <View style={[styles.card, { width, backgroundColor: theme === 'signal' ? '#142A45' : '#0A1115' }]}>
      <View style={styles.header}>
        <Text variant="overline" style={{ color: tint, letterSpacing: 2.2 }}>FIELD NOTES</Text>
        <Text variant="caption" style={styles.muted}>{activityLabel(session.type).toUpperCase()}</Text>
      </View>
      <View style={styles.hero}>
        <Text variant="footnote" style={styles.muted}>{activityDateLabel(session)}</Text>
        <View style={styles.distanceRow}>
          <Text tabular numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55} style={[styles.distance, { fontSize: width * 0.19 }]}>{distance.value}</Text>
          <Text variant="headline" style={styles.unit}>{distance.unit.toUpperCase()}</Text>
        </View>
        <Text variant="headline" numberOfLines={2} style={styles.title}>{session.title?.trim() || `${activityLabel(session.type)} · mission complete`}</Text>
      </View>
      <View style={styles.routePanel}>
        {hasRoute && routeIncluded ? (
          imageUri ? <Image source={{ uri: imageUri }} style={{ width, height: mapHeight }} resizeMode="cover"
            onLoad={() => { loadedUri.current = imageUri; loadWaiters.current.splice(0).forEach(({ resolve }) => resolve()); }}
            onError={() => { loadWaiters.current.splice(0).forEach(({ reject }) => reject(new Error('The preview image could not load.'))); setMapUri(null); setArtUri(null); loadedUri.current = null; }} />
            : <ActivityRouteArt ref={artRef} route={route} tint={tint} height={mapHeight} />
        ) : <ActivityRouteArt route={[]} tint={tint} height={mapHeight} emptyLabel={routeIncluded && routeRecorded ? 'Route hidden by endpoint privacy' : routeIncluded ? 'The miles still count.\nNo GPS route recorded.' : 'The miles. The effort.\nThe mission.'} />}
        <View style={styles.routeBadge}>
          <View style={[styles.dot, { backgroundColor: tint }]} />
          <Text variant="caption" style={{ color: '#D9E5E6' }}>{routeIncluded && hasRoute ? endpointsHidden ? 'START / END HIDDEN' : 'FULL ROUTE' : 'ACTIVITY SUMMARY'}</Text>
        </View>
      </View>
      {mapUri && !artUri ? <Text variant="caption" style={styles.credits}>{activityMapAttribution}</Text> : null}
      <View style={styles.stats}>
        <CardStat label="TIME" value={activityDuration(session.durationSeconds)} />
        <CardStat label={`PACE ${pace.unit}`} value={pace.value} />
        <CardStat label="ASCENT" value={activityAscent(session.elevationFeet, units)} />
      </View>
      <View style={styles.footer}>
        <Wordmark height={22} />
        <Text variant="caption" style={[styles.muted, { letterSpacing: 1.1 }]}>OUTSIDE. ALL IN.</Text>
      </View>
    </View>
  );
});

function CardStat({ label, value }: { label: string; value: string }) {
  return <View style={{ flex: 1 }}>
    <Text variant="caption" style={{ color: '#A9B9BE', letterSpacing: 1 }}>{label}</Text>
    <Text tabular numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={{ fontFamily: font.bold, fontSize: 19, color: '#F7FAF6', marginTop: 7 }}>{value}</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#293B41' },
  header: { paddingHorizontal: 24, paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hero: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
  distanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 3 },
  distance: { fontFamily: font.black, color: '#F6F9F1', letterSpacing: -3, flexShrink: 1 },
  unit: { color: '#BFC9C7', marginBottom: 10 },
  title: { color: '#F4F6F4', marginTop: 4 },
  muted: { color: '#B1C0C5' },
  routePanel: { position: 'relative' },
  routeBadge: { position: 'absolute', top: 14, left: 16, backgroundColor: '#0D191EEB', borderColor: '#345055', borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 10, flexDirection: 'row', gap: 7, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3 },
  credits: { fontSize: 9, lineHeight: 13, paddingHorizontal: 16, paddingTop: 8, color: '#BAC7C8' },
  stats: { padding: 24, flexDirection: 'row', gap: 10 },
  footer: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#344349', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
