import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { Map, Camera, GeoJSONSource, Layer, type CameraRef } from '@maplibre/maplibre-react-native';
import type { RoutePoint } from '../../types/activity';
import { activityMapAttribution, activityMapStyle } from '../../config/activityMap';
import { routeBounds, routeGeoJSON } from '../../utils/activityRoute';
import { Text } from '../../ui/Text';
import { Tap } from '../../ui/Pressable';
import { ActivityRouteArt } from './ActivityRouteArt';

export function ActivityRouteMap({ route, tint, height = 320, fitRoute = true }: { route: RoutePoint[]; tint: string; height?: number; fitRoute?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const camera = useRef<CameraRef>(null);
  const fitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastFit = useRef(0);
  const bounds = useMemo(() => routeBounds(route), [route]);
  const latestBounds = useRef(bounds);
  latestBounds.current = bounds;
  const data = useMemo(() => routeGeoJSON(route), [route]);
  const hasBounds = !!bounds;
  useEffect(() => {
    if (loaded || failed || !hasBounds) return undefined;
    const timeout = setTimeout(() => setFailed(true), 12000);
    return () => clearTimeout(timeout);
  }, [loaded, failed, hasBounds, attempt]);
  useEffect(() => {
    if (!fitRoute || !loaded || failed || !bounds || fitTimer.current || AppState.currentState !== 'active') return;
    const fit = () => {
      fitTimer.current = undefined;
      if (!latestBounds.current || !camera.current || AppState.currentState !== 'active') return;
      lastFit.current = Date.now();
      try {
        // The library declares fitBounds void but forwards a native promise.
        void Promise.resolve(camera.current.fitBounds(latestBounds.current, { duration: 250, padding: { top: 22, right: 22, bottom: 22, left: 22 } })).catch(() => setFailed(true));
      } catch { setFailed(true); }
    };
    const wait = Math.max(0, 3000 - (Date.now() - lastFit.current));
    if (wait) fitTimer.current = setTimeout(fit, wait);
    else fit();
  }, [bounds, fitRoute, loaded, failed]);
  useEffect(() => () => clearTimeout(fitTimer.current), []);

  if (!bounds || failed) return (
    <View style={styles.wrap}>
      <ActivityRouteArt route={route} tint={tint} height={height} emptyLabel={route.length ? 'Not enough GPS points to draw a route' : 'No GPS route recorded'} />
      {failed ? (
        <View style={styles.offline}>
          <Text variant="caption" style={styles.muted}>Map unavailable · your route is saved</Text>
          <Tap onPress={() => { setFailed(false); setLoaded(false); setAttempt((value) => value + 1); }} accessibilityLabel="Retry loading map" hitSlop={8}>
            <Text variant="caption" tone="accent">Retry map</Text>
          </Tap>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.wrap}>
      <View style={{ height }}>
        <Map key={attempt} mapStyle={activityMapStyle} style={StyleSheet.absoluteFill} logo={false} attribution compass={false} touchRotate={false} touchPitch={false}
          onDidFinishRenderingMapFully={() => setLoaded(true)} onDidFailLoadingMap={() => setFailed(true)}>
          <Camera ref={camera} initialViewState={{ bounds, padding: { top: 22, right: 22, bottom: 22, left: 22 } }} />
          <GeoJSONSource id="activity-route" data={data}>
            <Layer id="activity-route-glow" type="line" paint={{ 'line-color': tint, 'line-width': 11, 'line-opacity': 0.18 }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
            <Layer id="activity-route-line" type="line" paint={{ 'line-color': tint, 'line-width': 4 }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
          </GeoJSONSource>
        </Map>
        {!loaded ? <View pointerEvents="none" style={styles.loading}><ActivityIndicator color={tint} /></View> : null}
      </View>
      <Text variant="caption" style={styles.credits}>{activityMapAttribution}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#111B21', borderRadius: 20, overflow: 'hidden' },
  loading: { position: 'absolute', top: 14, left: 14, padding: 8, backgroundColor: '#111B21', borderRadius: 20 },
  credits: { fontSize: 10, color: '#B7C2C3', paddingHorizontal: 12, paddingVertical: 8 },
  muted: { color: '#B7C2C3', flex: 1 },
  offline: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
});
