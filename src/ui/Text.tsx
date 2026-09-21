import React from 'react';
import { Text as RNText, type TextProps, type TextStyle, StyleSheet } from 'react-native';
import { color, font } from './tokens';

/**
 * Type ramp. One display size per screen; everything else steps down from it.
 */
const variants = {
  display: { fontFamily: font.heavy, fontSize: 34, lineHeight: 38, letterSpacing: -0.6 },
  hero: { fontFamily: font.heavy, fontSize: 30, lineHeight: 32, letterSpacing: -0.4 },
  title: { fontFamily: font.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  question: { fontFamily: font.semibold, fontSize: 23, lineHeight: 30, letterSpacing: -0.2 },
  section: { fontFamily: font.medium, fontSize: 21, lineHeight: 26, letterSpacing: -0.2 },
  headline: { fontFamily: font.semibold, fontSize: 17, lineHeight: 22, letterSpacing: 0 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 23, letterSpacing: 0.1 },
  bodyMedium: { fontFamily: font.medium, fontSize: 16, lineHeight: 22, letterSpacing: 0.1 },
  callout: { fontFamily: font.regular, fontSize: 15, lineHeight: 21, letterSpacing: 0.1 },
  subhead: { fontFamily: font.medium, fontSize: 14, lineHeight: 19, letterSpacing: 0.2 },
  footnote: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, letterSpacing: 0.2 },
  caption: { fontFamily: font.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.2 },
  overline: { fontFamily: font.medium, fontSize: 12, lineHeight: 16, letterSpacing: 1.1, textTransform: 'uppercase' },
  cta: { fontFamily: font.semibold, fontSize: 17, lineHeight: 22, letterSpacing: 0.1 },
  ctaCaps: { fontFamily: font.medium, fontSize: 15, lineHeight: 20, letterSpacing: 0.9, textTransform: 'uppercase' },
  number: { fontFamily: font.bold, fontSize: 17, lineHeight: 22, fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof variants;

type Tone = 'primary' | 'secondary' | 'tertiary' | 'quaternary' | 'accent' | 'danger' | 'inverse' | 'success';

const tones: Record<Tone, string> = {
  primary: color.text,
  secondary: color.textSecondary,
  tertiary: color.textTertiary,
  quaternary: color.textQuaternary,
  accent: color.accent,
  danger: color.danger,
  inverse: color.onCta,
  success: color.success,
};

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: Tone;
  align?: TextStyle['textAlign'];
  tabular?: boolean;
}

export function Text({ variant = 'body', tone = 'primary', align, tabular, style, ...rest }: AppTextProps) {
  // A size override without a line height would inherit the variant's (smaller) one and clip ascenders.
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const fixLine = flat?.fontSize && !flat.lineHeight ? { lineHeight: Math.round(flat.fontSize * 1.22) } : null;
  return (
    <RNText
      maxFontSizeMultiplier={1.3}
      {...rest}
      style={[
        variants[variant],
        { color: tones[tone] },
        align ? { textAlign: align } : null,
        tabular ? styles.tabular : null,
        style,
        fixLine,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
});

export const typeRamp = variants;
