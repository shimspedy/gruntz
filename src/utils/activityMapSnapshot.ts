import { StaticMapImageManager, type StyleSpecification } from '@maplibre/maplibre-react-native';
import { PixelRatio, Platform } from 'react-native';
import type { RoutePoint } from '../types/activity';
import { activityMapStyle } from '../config/activityMap';
import { routeBounds, routeGeoJSON } from './activityRoute';

let stylePromise: Promise<StyleSpecification> | undefined;
function getMapStyle() {
  if (!stylePromise) {
    stylePromise = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(activityMapStyle, { signal: controller.signal });
        if (!response.ok) throw new Error('Map style unavailable.');
        const style = await response.json() as StyleSpecification;
        if (style.version !== 8 || !Array.isArray(style.layers) || !style.sources) throw new Error('Invalid map style.');
        // A style downloaded into an object loses its base URL. Resolve resource URLs.
        const resolve = (url: string) => /^https?:\/\//.test(url) ? url : new URL(url, activityMapStyle).href.replace(/%7B/gi, '{').replace(/%7D/gi, '}');
        if (typeof style.sprite === 'string') style.sprite = resolve(style.sprite);
        if (style.glyphs) style.glyphs = resolve(style.glyphs);
        for (const source of Object.values(style.sources)) {
          if ('url' in source && source.url) source.url = resolve(source.url);
          if ('tiles' in source && source.tiles) source.tiles = source.tiles.map(resolve);
        }
        return style;
      } finally { clearTimeout(timeout); }
    })().catch((error) => { stylePromise = undefined; throw error; });
  }
  return stylePromise;
}

/** Receives the already-redacted route. No original endpoints enter snapshot style/bounds. */
export async function activityMapSnapshot(route: RoutePoint[], tint: string, width = 1080, height = 950) {
  const bounds = routeBounds(route);
  if (!bounds) return null;
  const base = await getMapStyle();
  const density = Math.max(1, PixelRatio.get());
  // iOS snapshot size is in points, despite the wrapper documenting pixels.
  // Android accepts pixels and applies display density to its style lengths.
  const sizeScale = Platform.OS === 'ios' ? density : 1;
  const style: StyleSpecification = {
    ...base,
    sources: { ...base.sources, 'gruntz-share-route': { type: 'geojson', data: routeGeoJSON(route) } },
    layers: [...base.layers,
      { id: 'gruntz-share-route-glow', type: 'line', source: 'gruntz-share-route', paint: { 'line-color': tint, 'line-width': 25 / density, 'line-opacity': 0.16 }, layout: { 'line-cap': 'round', 'line-join': 'round' } },
      { id: 'gruntz-share-route-line', type: 'line', source: 'gruntz-share-route', paint: { 'line-color': tint, 'line-width': 9 / density }, layout: { 'line-cap': 'round', 'line-join': 'round' } },
    ],
  };
  const snapshot = await StaticMapImageManager.createImage({ mapStyle: style, bounds, width: Math.round(width / sizeScale), height: Math.round(height / sizeScale), output: 'base64', logo: false });
  return snapshot.startsWith('data:') ? snapshot : `data:image/png;base64,${snapshot}`;
}
