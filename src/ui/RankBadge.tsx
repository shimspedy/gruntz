import React from 'react';
import Svg, { Defs, G, LinearGradient, Path, Polygon, RadialGradient, Stop, Circle } from 'react-native-svg';
import type { Rank } from '../types';

export const RANK_ORDER: Rank[] = ['Recruit', 'Cadet', 'Operator', 'Veteran', 'Elite', 'Shadow', 'Apex'];

/** Each rank is a gem tier. Tier colour is content (like a medal), not UI accent. */
export const RANK_TIERS: Record<Rank, { name: string; light: string; mid: string; dark: string; glow: string }> = {
  Recruit: { name: 'Iron', light: '#C3C7CE', mid: '#8A8F98', dark: '#4A4E55', glow: 'rgba(160,166,176,0.35)' },
  Cadet: { name: 'Bronze', light: '#F0B488', mid: '#C98A58', dark: '#6E3F20', glow: 'rgba(201,138,88,0.4)' },
  Operator: { name: 'Gold', light: '#FFE58A', mid: '#F2C94C', dark: '#A8740A', glow: 'rgba(242,201,76,0.45)' },
  Veteran: { name: 'Platinum', light: '#FF8A8A', mid: '#EF4444', dark: '#8E1522', glow: 'rgba(239,68,68,0.45)' },
  Elite: { name: 'Emerald', light: '#86F5B4', mid: '#2FCB74', dark: '#0B6A3B', glow: 'rgba(47,203,116,0.45)' },
  Shadow: { name: 'Onyx', light: '#6B6B75', mid: '#2E2E34', dark: '#09090B', glow: 'rgba(255,255,255,0.25)' },
  Apex: { name: 'Apex', light: '#8EC5FF', mid: '#2D8CFF', dark: '#1439A8', glow: 'rgba(45,140,255,0.55)' },
};

const R = 1;
const s = 0.866;
const hex = (r: number) => `0,${-r} ${s * r},${-r / 2} ${s * r},${r / 2} 0,${r} ${-s * r},${r / 2} ${-s * r},${-r / 2}`;
const star = (r: number) => {
  const k = r * 0.22;
  return `M0,${-r} C${k * 0.3},${-k} ${k},${-k * 0.3} ${r},0 C${k},${k * 0.3} ${k * 0.3},${k} 0,${r} C${-k * 0.3},${k} ${-k},${k * 0.3} ${-r},0 C${-k},${-k * 0.3} ${-k * 0.3},${-k} 0,${-r} Z`;
};

interface Props {
  rank: Rank;
  size?: number;
  locked?: boolean;
  /** Outline-only treatment used for the progress pips. */
  variant?: 'gem' | 'pip';
  active?: boolean;
}

export function RankBadge({ rank, size = 48, locked = false, variant = 'gem', active = false }: Props) {
  const tier = RANK_TIERS[rank];
  const id = `${rank}-${variant}`;

  if (locked || variant === 'pip') {
    const stroke = active ? '#FFFFFF' : locked ? '#48484A' : tier.mid;
    return (
      <Svg width={size} height={size} viewBox="-1.1 -1.1 2.2 2.2">
        <Polygon points={hex(0.92)} fill={active ? '#1C1C1E' : 'transparent'} stroke={stroke} strokeWidth={active ? 0.12 : 0.09} strokeLinejoin="round" />
        <Path d={star(0.36)} fill={stroke} />
      </Svg>
    );
  }

  // Faceted gem: six triangles from the centre, lit from the top-left.
  const v = [
    [0, -R], [s, -R / 2], [s, R / 2], [0, R], [-s, R / 2], [-s, -R / 2],
  ];
  const facetFill = [tier.light, tier.mid, tier.dark, tier.dark, tier.mid, tier.light];
  return (
    <Svg width={size} height={size} viewBox="-1.15 -1.15 2.3 2.3">
      <Defs>
        <RadialGradient id={`glow-${id}`} cx="0" cy="0" r="1.15" gradientUnits="userSpaceOnUse">
          <Stop offset="0.55" stopColor={tier.glow} stopOpacity={1} />
          <Stop offset="1" stopColor={tier.glow} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={`core-${id}`} x1="-0.6" y1="-0.6" x2="0.6" y2="0.6" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={tier.light} />
          <Stop offset="1" stopColor={tier.mid} />
        </LinearGradient>
      </Defs>
      <Circle cx={0} cy={0} r={1.15} fill={`url(#glow-${id})`} />
      <G>
        {v.map((p, i) => {
          const q = v[(i + 1) % 6];
          return <Polygon key={i} points={`0,0 ${p[0]},${p[1]} ${q[0]},${q[1]}`} fill={facetFill[i]} />;
        })}
        <Polygon points={hex(0.62)} fill={`url(#core-${id})`} />
        <Polygon points={hex(0.62)} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.04} />
        <Polygon points={hex(R)} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={0.05} strokeLinejoin="round" />
        <Path d={star(0.36)} fill="#FFFFFF" />
      </G>
    </Svg>
  );
}
