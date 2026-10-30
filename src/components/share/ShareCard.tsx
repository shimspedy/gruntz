import React from 'react';
import { StyleSheet, Text as RNText, View, type TextStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { CardRow, MissionCardModel, ShareCardModel, TestCardModel } from '../../features/shareCards';
import { Wordmark } from '../../ui/Logo';
import { RANK_TIERS, RankBadge } from '../../ui/RankBadge';
import { color, font } from '../../ui/tokens';

/** Instagram's feed ratio; it also crops cleanly into a story. */
export const SHARE_CARD_RATIO = 1.25;

const INK = '#050607';
const RULE = '#1D2026';
const MUTED = '#8C929B';
const SOFT = '#C8CDD4';

/**
 * A share card. Everything is sized from `width` so the preview and the exported
 * 1080px image are the same design, and system text size never reflows it.
 */
export function ShareCard({ model, width, date }: { model: ShareCardModel; width: number; date: string }) {
  const u = width / 360;
  const height = Math.round(width * SHARE_CARD_RATIO);
  const tint = model.kind === 'test' || model.kind === 'workout' ? color.accent : glowFor(model.rank);
  const dot = model.kind === 'test' || model.kind === 'workout' ? color.accent : RANK_TIERS[model.rank].light;

  return (
    <View style={[styles.card, { width, height, padding: 28 * u }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="glow" cx="100%" cy="0%" rx="85%" ry="70%" fx="100%" fy="0%">
            <Stop offset="0" stopColor={tint} stopOpacity={0.26} />
            <Stop offset="1" stopColor={tint} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#glow)" />
      </Svg>

      <View style={styles.header}>
        <View style={[styles.eyebrow, { gap: 8 * u }]}>
          <View style={{ width: 6 * u, height: 6 * u, borderRadius: 3 * u, backgroundColor: dot }} />
          <T u={u} size={11} weight="semibold" color="#E8ECF2" spacing={1.6} numberOfLines={1} style={{ flexShrink: 1 }}>
            {model.eyebrow.toUpperCase()}
          </T>
        </View>
        <T u={u} size={11} weight="medium" color={MUTED} spacing={1.2}>{date.toUpperCase()}</T>
      </View>

      <View style={styles.body}>
        {model.kind === 'test' ? <TestBody model={model} u={u} /> : <MissionBody model={model} u={u} />}
      </View>

      <View style={[styles.footer, { paddingTop: 26 * u }]}>
        <Wordmark height={18 * u} />
        <T u={u} size={12} weight="medium" color={MUTED} spacing={0.4}>gruntzfit.com</T>
      </View>
    </View>
  );
}

function TestBody({ model, u }: { model: TestCardModel; u: number }) {
  const dense = model.rows.length > 4;
  return (
    <>
      <View style={{ marginTop: 26 * u }}>
        <View style={styles.baseline}>
          <T u={u} size={dense ? 92 : 112} weight="black" color="#FFFFFF" spacing={-4} tabular>{`${model.readiness}`}</T>
          <T u={u} size={dense ? 32 : 38} weight="bold" color={MUTED} style={{ marginLeft: 4 * u }}>%</T>
        </View>
        <T u={u} size={15} weight="semibold" color="#FFFFFF" style={{ marginTop: 2 * u }}>Test-ready</T>
        <T u={u} size={12} weight="regular" color={MUTED} style={{ marginTop: 3 * u }}>{model.note}</T>
        <View style={[styles.track, { height: 3 * u, borderRadius: 2 * u, marginTop: 16 * u }]}>
          <View style={{ width: `${model.readiness}%`, height: '100%', borderRadius: 2 * u, backgroundColor: color.accent }} />
        </View>
      </View>
      <View style={{ marginTop: 'auto' }}>
        {model.rows.map((row, i) => (
          <Row key={row.label} row={row} u={u} height={dense ? 30 : 36} first={i === 0} />
        ))}
      </View>
    </>
  );
}

function MissionBody({ model, u }: { model: MissionCardModel; u: number }) {
  const big = model.kind === 'rank';
  return (
    <>
      <View style={{ marginTop: 22 * u }}>
        <RankBadge rank={model.rank} size={(big ? 128 : 76) * u} />
        <T
          u={u}
          size={model.kind === 'workout' ? 34 : 54}
          weight="heavy"
          color="#FFFFFF"
          spacing={model.kind === 'workout' ? -0.6 : -1.6}
          numberOfLines={2}
          fit
          style={{ marginTop: (big ? 18 : 22) * u }}
        >
          {model.hero}
        </T>
        <T u={u} size={15} weight="medium" color={SOFT} style={{ marginTop: 6 * u }}>{model.sub}</T>
      </View>
      {model.rows.length ? (
        <View style={[styles.stats, { marginTop: 'auto', paddingTop: 18 * u, gap: 12 * u }]}>
          {model.rows.map((row) => (
            <View key={row.label} style={{ flex: 1 }}>
              <T u={u} size={10} weight="semibold" color={MUTED} spacing={1.4}>{row.label.toUpperCase()}</T>
              <T u={u} size={26} weight="bold" color="#FFFFFF" spacing={-0.6} tabular numberOfLines={1} style={{ marginTop: 6 * u }}>{row.value}</T>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

function Row({ row, u, height, first }: { row: CardRow; u: number; height: number; first: boolean }) {
  return (
    <View style={[styles.row, { height: height * u }, first && styles.rowFirst]}>
      <T u={u} size={14} weight="medium" color={SOFT} numberOfLines={1} style={{ flex: 1 }}>{row.label}</T>
      <T u={u} size={16} weight="bold" color="#FFFFFF" tabular>{row.value}</T>
    </View>
  );
}

const WEIGHTS = { regular: font.regular, medium: font.medium, semibold: font.semibold, bold: font.bold, heavy: font.heavy, black: font.black };

/** Card text: scaled from the card width, never from the system text size. */
function T({ u, size, weight, color: tone, spacing = 0, tabular, style, children, numberOfLines, fit }: {
  u: number; size: number; weight: keyof typeof WEIGHTS; color: string; spacing?: number; tabular?: boolean;
  style?: TextStyle; children: React.ReactNode; numberOfLines?: number; fit?: boolean;
}) {
  return (
    <RNText
      allowFontScaling={false}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={fit}
      minimumFontScale={fit ? 0.7 : undefined}
      style={[{
        fontFamily: WEIGHTS[weight],
        fontSize: size * u,
        lineHeight: Math.round(size * u * (size >= 40 ? 1.02 : 1.3)),
        letterSpacing: spacing * u,
        color: tone,
        fontVariant: tabular ? ['tabular-nums'] : undefined,
      }, style]}
    >
      {children}
    </RNText>
  );
}

/** The rank's own colour for the glow; Onyx is near-black, so it glows white instead. */
function glowFor(rank: MissionCardModel['rank']): string {
  return rank === 'Shadow' ? '#FFFFFF' : RANK_TIERS[rank].mid;
}

const styles = StyleSheet.create({
  // Square, edge to edge: an exported PNG with rounded transparent corners shows white
  // corners in apps that composite onto white. The preview rounds it from outside.
  card: { backgroundColor: INK, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  body: { flex: 1 },
  baseline: { flexDirection: 'row', alignItems: 'baseline' },
  track: { backgroundColor: '#1A1D22', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: RULE },
  rowFirst: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: RULE },
  stats: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: RULE },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
