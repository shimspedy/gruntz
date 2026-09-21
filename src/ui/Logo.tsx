import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { ClipPath, Defs, G, Polygon } from 'react-native-svg';
import { Text } from './Text';
import { font } from './tokens';

const S = 0.866;
// Isometric hex "G": outer hexagon ring, open on the upper-right, with an inward crossbar.
const G_OUTLINE: [number, number][] = [
  [0, -1], [-S, -0.5], [-S, 0.5], [0, 1], [S, 0.5], [S, 0], [0.16, 0], [0.16, 0.25],
  [S / 2, 0.25], [0, 0.5], [-S / 2, 0.25], [-S / 2, -0.25], [0, -0.5],
];
const FACES = {
  top: [[0, -1], [S, -0.5], [0, 0], [-S, -0.5]] as [number, number][],
  left: [[-S, -0.5], [0, 0], [0, 1], [-S, 0.5]] as [number, number][],
  right: [[0, 0], [S, -0.5], [S, 0.5], [0, 1]] as [number, number][],
};

export const LOGO_SHADES = { top: '#FFFFFF', left: '#C9CACD', right: '#7C7E83' };

const toPoints = (pts: [number, number][]) => pts.map(([x, y]) => `${x},${y}`).join(' ');

export function LogoMark({ size = 40, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  // viewBox leaves no padding: the hexagon spans -0.866..0.866 horizontally, -1..1 vertically.
  return (
    <Svg width={size * 0.866} height={size} viewBox="-0.866 -1 1.732 2" style={style}>
      <Defs>
        <ClipPath id="gclip">
          <Polygon points={toPoints(G_OUTLINE)} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#gclip)">
        <Polygon points={toPoints(FACES.top)} fill={LOGO_SHADES.top} stroke={LOGO_SHADES.top} strokeWidth={0.004} />
        <Polygon points={toPoints(FACES.left)} fill={LOGO_SHADES.left} stroke={LOGO_SHADES.left} strokeWidth={0.004} />
        <Polygon points={toPoints(FACES.right)} fill={LOGO_SHADES.right} stroke={LOGO_SHADES.right} strokeWidth={0.004} />
      </G>
    </Svg>
  );
}

/** The G mark doubles as the first letter, the same way the lockup reads at every size. */
export function Wordmark({ height = 34, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  const fontSize = height * 1.02;
  return (
    <View style={[styles.row, style]} accessibilityRole="header" accessibilityLabel="Gruntz">
      <LogoMark size={height} />
      <Text
        style={{
          fontFamily: font.bold,
          fontSize,
          lineHeight: fontSize * 1.1,
          letterSpacing: -fontSize * 0.02,
          marginLeft: height * 0.04,
          marginTop: height * 0.08,
        }}
      >
        runtz
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
