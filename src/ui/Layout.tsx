import React from 'react';
import { StyleSheet, Switch, View, type StyleProp, type ViewStyle } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tap } from './Pressable';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { haptic } from './haptics';
import { color, layout, radius, space } from './tokens';

/** Push-screen header: arrow back on the left, centred title, optional trailing slot. */
export function NavHeader({
  title,
  right,
  onBack,
  icon = 'back',
  transparent,
  inSheet,
}: {
  title?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  icon?: 'back' | 'close' | 'chevronDown';
  transparent?: boolean;
  /** Page-sheet modals start below the status bar already. */
  inSheet?: boolean;
}) {
  // Optional: the header is also used by surfaces that live outside the navigator (the workout layer).
  const navigation = React.useContext(NavigationContext);
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: inSheet ? space.xs : insets.top, backgroundColor: transparent ? 'transparent' : color.bg }]}>
      <View style={styles.headerRow}>
        <Tap
          feedback="opacity"
          hitSlop={12}
          style={styles.headerButton}
          accessibilityLabel={icon === 'back' ? 'Back' : 'Close'}
          onPress={() => {
            haptic.selection();
            if (onBack) onBack();
            else if (navigation?.canGoBack()) navigation.goBack();
          }}
        >
          <Icon name={icon} size={icon === 'back' ? 24 : 22} weight="medium" />
        </Tap>
        {title ? (
          <Text variant="headline" style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <View style={[styles.headerButton, styles.headerRight]}>{right}</View>
      </View>
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  size = 24,
  tint = color.text,
  style,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  size?: number;
  tint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Tap feedback="opacity" hitSlop={10} onPress={onPress} accessibilityLabel={label} style={[styles.iconButton, style]}>
      <Icon name={icon} size={size} color={tint} />
    </Tap>
  );
}

export function SectionTitle({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.sectionRow, style]}>
      <Text variant="section" accessibilityRole="header">
        {title}
      </Text>
      {action ? (
        <Tap feedback="opacity" hitSlop={10} onPress={onAction} style={styles.sectionAction} accessibilityLabel={action}>
          <Text variant="callout" tone="secondary">
            {action}
          </Text>
          <Icon name="arrowRight" size={15} color={color.textSecondary} />
        </Tap>
      ) : null}
    </View>
  );
}

/** Settings-style group: small caps label above a rounded surface of rows. */
export function Group({ label, children, style }: { label?: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={style}>
      {label ? (
        <Text variant="overline" tone="secondary" style={styles.groupLabel}>
          {label}
        </Text>
      ) : null}
      <View style={styles.group}>
        {rows.map((child, i) => (
          <View key={i}>
            {child}
            {i < rows.length - 1 ? <View style={styles.rowDivider} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export function Row({
  icon,
  title,
  subtitle,
  value,
  onPress,
  tone = 'primary',
  toggle,
  onToggle,
  chevron = true,
  external,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  tone?: 'primary' | 'danger';
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
  chevron?: boolean;
  external?: boolean;
}) {
  const tint = tone === 'danger' ? color.danger : color.text;
  const content = (
    <View style={styles.row}>
      {icon ? <Icon name={icon} size={22} color={tint} style={styles.rowIcon} /> : null}
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium" style={{ color: tint }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="callout" tone="tertiary" style={{ marginRight: 6 }}>
          {value}
        </Text>
      ) : null}
      {typeof toggle === 'boolean' ? (
        <Switch
          value={toggle}
          onValueChange={(v) => {
            haptic.selection();
            onToggle?.(v);
          }}
          trackColor={{ false: color.surfaceHigh, true: color.accent }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={color.surfaceHigh}
        />
      ) : onPress && chevron ? (
        <Icon name={external ? 'external' : 'chevronRight'} size={15} color={tone === 'danger' ? color.danger : color.textTertiary} weight="semibold" />
      ) : null}
    </View>
  );
  if (!onPress || typeof toggle === 'boolean') return <View style={styles.rowBase}>{content}</View>;
  return (
    <Tap feedback="highlight" baseColor={color.surface} pressedColor={color.surfacePressed} onPress={onPress} style={styles.rowBase} accessibilityLabel={title}>
      {content}
    </Tap>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Tap
      feedback="scale"
      scaleTo={0.95}
      onPress={() => {
        haptic.selection();
        onPress?.();
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!active }}
      style={[styles.chip, active ? styles.chipActive : null]}
    >
      <Text variant="subhead" style={{ fontSize: 15, color: active ? color.onCta : color.text }}>
        {label}
      </Text>
    </Tap>
  );
}

export function Hairline({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.hairline, style]} />;
}

/** Label-over-value pair used by summaries ("Duration / 42 min"). */
export function Stat({ label, value, accent, style }: { label: string; value: string; accent?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Text variant="callout" tone="secondary">
        {label}
      </Text>
      <Text variant="headline" tabular numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ marginTop: 6, fontSize: 19, color: accent ? color.accent : color.text }}>
        {value}
      </Text>
    </View>
  );
}

export function EmptyState({ icon, title, body, children }: { icon: IconName; title: string; body: string; children?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={26} color={color.textSecondary} />
      </View>
      <Text variant="headline" align="center">
        {title}
      </Text>
      <Text variant="callout" tone="secondary" align="center" style={{ marginTop: 6, maxWidth: 280 }}>
        {body}
      </Text>
      {children ? <View style={{ marginTop: space.lg, alignSelf: 'stretch' }}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { zIndex: 10 },
  headerRow: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
  },
  headerButton: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  headerRight: { alignItems: 'flex-end', width: 'auto', minWidth: 44 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 19 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  groupLabel: { marginLeft: 6, marginBottom: 10 },
  group: { backgroundColor: color.surface, borderRadius: radius.lg, borderCurve: 'continuous', overflow: 'hidden' },
  rowBase: { backgroundColor: color.surface },
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md + 2, paddingVertical: 12 },
  rowIcon: { marginRight: 14 },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: color.line, marginLeft: space.md + 2 },
  chip: {
    height: 36,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: '#F5F5F7' },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: color.line },
  empty: { alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.xl },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
});
