import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Path, Skia, useCanvasRef } from '@shopify/react-native-skia';
import type { RoutePoint } from '../../types/activity';
import { projectedRoute } from '../../utils/activityRoute';
import { Text } from '../../ui/Text';
import { color } from '../../ui/tokens';
import { Icon } from '../../ui/Icon';

const THUMBNAIL_POINTS = 240;

export interface ActivityRouteArtRef { snapshot: () => Promise<string> }

/** Offline route artwork, rendered by Skia in the same Mercator projection as the map. */
export const ActivityRouteArt = forwardRef<ActivityRouteArtRef, { route: RoutePoint[]; tint: string; height: number; emptyLabel?: string }>(function ActivityRouteArt({ route, tint, height, emptyLabel = 'No GPS route recorded' }, ref) {
  const [width, setWidth] = useState(0);
  const canvas = useCanvasRef();
  const drawing = useMemo(() => {
    // Checked first: every row renders once at width 0 before it is measured.
    if (width <= 0) return null;
    const projected = projectedRoute(route);
    // A thumbnail can't show 6000 points; a list of them stalls scrolling building the paths.
    const total = projected.reduce((sum, segment) => sum + segment.length, 0);
    const stride = height < 140 ? Math.ceil(total / THUMBNAIL_POINTS) : 1;
    const segments = stride > 1
      ? projected.map((segment) => segment.filter((_, index) => index % stride === 0 || index === segment.length - 1))
      : projected;
    const points = segments.flat();
    if (points.length < 2) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const point of points) {
      minX = Math.min(minX, point.x); maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y); maxY = Math.max(maxY, point.y);
    }
    const padding = Math.min(32, Math.max(12, width * 0.08), height * 0.15);
    const scale = Math.min((width - padding * 2) / Math.max(maxX - minX, 1e-7), (height - padding * 2) / Math.max(maxY - minY, 1e-7));
    const xy = (p: { x: number; y: number }) => ({ x: (p.x - (minX + maxX) / 2) * scale + width / 2, y: (p.y - (minY + maxY) / 2) * scale + height / 2 });
    const path = Skia.Path.Make();
    for (const segment of segments) {
      segment.forEach((point, index) => {
        const p = xy(point);
        if (index === 0) path.moveTo(p.x, p.y);
        else path.lineTo(p.x, p.y);
      });
    }
    return { path, start: xy(points[0]), end: xy(points[points.length - 1]) };
  }, [route, width, height]);

  useImperativeHandle(ref, () => ({ snapshot: async () => {
    if (!canvas.current || !drawing) throw new Error('Route artwork is not ready.');
    const image = await canvas.current.makeImageSnapshotAsync();
    try { return `data:image/png;base64,${image.encodeToBase64()}`; }
    finally { image.dispose(); }
  } }), [canvas, drawing]);

  return (
    <View style={[styles.wrap, { height }]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)} accessibilityLabel={drawing ? 'Recorded route illustration' : emptyLabel}>
      {drawing ? (
        <>
          <Canvas ref={canvas} style={StyleSheet.absoluteFill}>
            <Path path={drawing.path} color={tint} style="stroke" strokeWidth={height < 140 ? 8 : 16} opacity={0.1} strokeCap="round" strokeJoin="round" />
            <Path path={drawing.path} color={tint} style="stroke" strokeWidth={height < 140 ? 2 : 4} strokeCap="round" strokeJoin="round" />
            <Circle cx={drawing.start.x} cy={drawing.start.y} r={height < 140 ? 3 : 6} color={color.text} />
            <Circle cx={drawing.start.x} cy={drawing.start.y} r={height < 140 ? 1.5 : 3} color={color.bg} />
            <Circle cx={drawing.end.x} cy={drawing.end.y} r={height < 140 ? 3 : 6} color={tint} />
          </Canvas>
          {height >= 140 ? <Text variant="caption" style={styles.sketchLabel}>ROUTE SKETCH</Text> : null}
        </>
      ) : (
        <View style={styles.empty}>
          <Icon name="location" size={26} color={color.textQuaternary} />
          <Text variant="callout" align="center" style={styles.emptyText}>{emptyLabel}</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { backgroundColor: color.bg, overflow: 'hidden' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyText: { color: color.textSecondary, maxWidth: 250 },
  sketchLabel: { position: 'absolute', bottom: 12, left: 14, color: color.textTertiary, letterSpacing: 1.6 },
});
