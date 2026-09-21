import React from 'react';
import Svg, { Path, Polygon } from 'react-native-svg';

const s = 0.866;
const hex = (r: number) => `0,${-r} ${s * r},${-r / 2} ${s * r},${r / 2} 0,${r} ${-s * r},${r / 2} ${-s * r},${-r / 2}`;
const star = (r: number) => {
  const k = r * 0.22;
  return `M0,${-r} C${k * 0.3},${-k} ${k},${-k * 0.3} ${r},0 C${k},${k * 0.3} ${k * 0.3},${k} 0,${r} C${-k * 0.3},${k} ${-k},${k * 0.3} ${-r},0 C${-k},${-k * 0.3} ${-k * 0.3},${-k} 0,${-r} Z`;
};

/** Hexagon + spark: the Ranks glyph. Outline when idle, solid when selected. */
export function HexIcon({ size = 26, color, filled }: { size?: number; color: string; filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="-1.12 -1.12 2.24 2.24">
      <Polygon
        points={hex(0.95)}
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={0.13}
        strokeLinejoin="round"
      />
      <Path d={star(0.42)} fill={filled ? '#000000' : color} />
    </Svg>
  );
}
