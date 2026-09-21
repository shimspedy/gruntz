import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ChallengePill, useChallengePillVisible } from '../components/ChallengeSheet';
import { useRoute } from '@react-navigation/native';
import { SessionMiniBar } from '../components/session/SessionMiniBar';
import { useSessionStore } from '../store/useSessionStore';
import { useUiStore } from '../store/useUiStore';
import { Icon, type IconName } from '../ui/Icon';
import { HexIcon } from '../ui/HexIcon';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { color, layout, motion, radius, space } from '../ui/tokens';
import { useCreateActions } from './createActions';

const TAB_META: Record<string, { label: string; icon?: IconName; iconActive?: IconName }> = {
  Train: { label: 'Train', icon: 'dumbbell', iconActive: 'dumbbellFill' },
  Ranks: { label: 'Ranks' },
  Test: { label: 'Test', icon: 'test', iconActive: 'testFill' },
  Profile: { label: 'Profile', icon: 'person', iconActive: 'personFill' },
};

/** The daily-challenge pill lives on the home tab only, so it never covers other tabs' content. */
const PILL_TAB = 'Train';

/** Bottom space a tab screen must leave for the floating chrome. */
export function useTabChromeInset() {
  const insets = useSafeAreaInsets();
  const sessionMin = useSessionStore((s) => s.active && s.minimized);
  const route = useRoute();
  const pill = useChallengePillVisible() && route.name === PILL_TAB;
  return insets.bottom + layout.tabBarHeight + (pill ? layout.pillBlock : 0) + (sessionMin ? layout.miniBar : 0) + space.lg;
}

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const menuOpen = useUiStore((s) => s.createMenuOpen);
  const setMenu = useUiStore((s) => s.setCreateMenu);
  const sessionMin = useSessionStore((s) => s.active && s.minimized);
  const barH = layout.tabBarHeight + insets.bottom;
  const pillVisible = useChallengePillVisible() && state.routes[state.index]?.name === PILL_TAB;

  const routes = state.routes;
  const renderTab = (index: number) => {
    const route = routes[index];
    const focused = state.index === index;
    const meta = TAB_META[route.name];
    const tint = focused ? color.text : color.textTertiary;
    return (
      <Tap
        key={route.key}
        feedback="opacity"
        style={styles.tab}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={meta.label}
        onPress={() => {
          if (menuOpen) setMenu(false);
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!event.defaultPrevented) {
            haptic.selection();
            // Re-tapping the active tab pops it to its root (handled by the navigator), or scrolls to top.
            navigation.navigate(route.name, route.params);
          }
        }}
      >
        {route.name === 'Ranks' ? (
          <HexIcon size={25} color={tint} filled={focused} />
        ) : (
          <Icon name={(focused ? meta.iconActive : meta.icon)!} size={24} color={tint} />
        )}
        <Text variant="caption" style={[styles.tabLabel, { color: tint }]}>
          {meta.label}
        </Text>
      </Tap>
    );
  };

  return (
    <>
      <CreateMenu bottom={barH} />
      <View pointerEvents="box-none" style={styles.chrome}>
        {!menuOpen && pillVisible ? (
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)} pointerEvents="box-none" style={styles.pillWrap}>
            <ChallengePill />
          </Animated.View>
        ) : null}
        {sessionMin ? <SessionMiniBar /> : null}
        <View style={[styles.barWrap, { paddingBottom: insets.bottom }]}>
          <View style={styles.bar}>
            {renderTab(0)}
            {renderTab(1)}
            <Fab open={menuOpen} onPress={() => setMenu(!menuOpen)} />
            {renderTab(2)}
            {renderTab(3)}
          </View>
        </View>
      </View>
    </>
  );
}

function Fab({ open, onPress }: { open: boolean; onPress: () => void }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withSpring(open ? 1 : 0, motion.settle));
  }, [open, t]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.get(), [0, 1], ['#FFFFFF', '#8E8E93']),
    transform: [{ rotate: `${t.get() * 45}deg` }],
  }));
  return (
    <View style={styles.tab}>
      <Tap
        onPress={() => {
          haptic.medium();
          onPress();
        }}
        scaleTo={0.9}
        accessibilityLabel={open ? 'Close menu' : 'Create'}
        accessibilityState={{ expanded: open }}
      >
        <Animated.View style={[styles.fab, style]}>
          <Icon name="plus" size={26} color="#000000" weight="semibold" />
        </Animated.View>
      </Tap>
    </View>
  );
}

function CreateMenu({ bottom }: { bottom: number }) {
  const open = useUiStore((s) => s.createMenuOpen);
  const setMenu = useUiStore((s) => s.setCreateMenu);
  const { height } = useWindowDimensions();
  const actions = useCreateActions();
  const t = useSharedValue(0);
  const [mounted, setMounted] = React.useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      t.set(withSpring(1, motion.sheet));
    } else {
      t.set(withTiming(0, { duration: 180, easing: motion.easeOut }));
      const id = setTimeout(() => setMounted(false), 190);
      return () => clearTimeout(id);
    }
  }, [open, t]);

  const scrim = useAnimatedStyle(() => ({ opacity: interpolate(t.get(), [0, 1], [0, 1]) }));
  const card = useAnimatedStyle(() => ({
    opacity: interpolate(t.get(), [0, 0.6], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(t.get(), [0, 1], [28, 0]) }, { scale: interpolate(t.get(), [0, 1], [0.94, 1]) }],
  }));

  if (!mounted) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { bottom }]} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrim]}>
        <Tap feedback="none" style={StyleSheet.absoluteFill} onPress={() => setMenu(false)} accessibilityLabel="Close menu" />
      </Animated.View>
      <Animated.View style={[styles.menu, { maxHeight: height * 0.7, transformOrigin: 'bottom center' }, card]}>
        {actions.map((a, i) => (
          <MenuRow key={a.title} index={i} open={open} {...a} />
        ))}
      </Animated.View>
    </View>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  highlight,
  index,
  open,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  highlight?: boolean;
  index: number;
  open: boolean;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(open ? withDelay(40 + index * motion.stagger, withTiming(1, { duration: 320, easing: motion.easeOut })) : withTiming(0, { duration: 120 }));
  }, [open, index, t]);
  const style = useAnimatedStyle(() => ({
    opacity: t.get(),
    transform: [{ translateY: interpolate(t.get(), [0, 1], [10, 0]) }],
  }));
  return (
    <Animated.View style={style}>
      <Tap feedback="highlight" baseColor={color.surface} pressedColor={color.surfacePressed} onPress={onPress} style={styles.menuRow} accessibilityLabel={title}>
        <View style={[styles.menuIcon, highlight && styles.menuIconHighlight]}>
          <Icon name={icon} size={24} color={highlight ? color.accent : color.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="headline" style={{ fontSize: 18 }}>
            {title}
          </Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        </View>
      </Tap>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chrome: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  pillWrap: { paddingHorizontal: space.md, paddingBottom: 12 },
  barWrap: { backgroundColor: color.bg },
  bar: {
    height: layout.tabBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.bg,
  },
  tab: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { fontSize: 11 },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  scrim: { backgroundColor: 'rgba(0,0,0,0.6)' },
  menu: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    bottom: 12,
    backgroundColor: color.surface,
    borderRadius: radius.xl + 4,
    borderCurve: 'continuous',
    paddingVertical: space.sm,
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: 12, gap: 18 },
  menuIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: color.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconHighlight: {
    backgroundColor: '#0E1624',
    borderWidth: 1.5,
    borderColor: color.accent,
    boxShadow: '0 0 18px rgba(45,140,255,0.45)',
  },
});
