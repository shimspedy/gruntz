import React from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useColors, spacing, borderRadius } from '../theme';
import { FLOATING_TAB_BAR_BOTTOM_OFFSET, FLOATING_TAB_BAR_HEIGHT } from '../hooks/useFloatingTabBarSpacing';
import { hapticLight } from '../utils/haptics';

/**
 * Premium liquid glass tab bar with floating style.
 * Features: floating design, pill-shaped container, frosted blur,
 * subtle filled pill indicator for active tab, and smooth animations.
 */
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useColors();

  const content = (
    <View style={styles.row}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const label = typeof options.tabBarLabel === 'string'
          ? options.tabBarLabel
          : options.title ?? route.name;

        const onPress = () => {
          hapticLight();
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const icon = options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? colors.accent : colors.textSecondary,
          size: 22,
        });

        return (
          <View key={route.key} style={styles.tabContainer}>
            {/* Filled pill background for active tab */}
            {isFocused && (
              <View
                style={[
                  styles.activeIndicatorBg,
                  {
                    backgroundColor: `${colors.accent}20`,
                    borderColor: colors.accent,
                  },
                ]}
              />
            )}

            <Pressable
              onPress={onPress}
              style={styles.touchTarget}
              accessibilityRole="button"
              accessibilityLabel={typeof label === 'string' ? label : route.name}
              accessibilityState={{ selected: isFocused }}
              hitSlop={12}
            >
              {/* Icon */}
              <View style={styles.iconWrapper}>{icon}</View>

              {/* Dot indicator below icon */}
              {isFocused && <View style={[styles.dotIndicator, { backgroundColor: colors.accent }]} />}
            </Pressable>
          </View>
        );
      })}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.tabBarRoot, { backgroundColor: colors.background }]}>
        <View style={styles.iosContainer}>
          <BlurView intensity={50} tint="dark" style={styles.blurView}>
            <View
              style={[
                styles.overlay,
                {
                  backgroundColor: colors.glassBackground,
                  borderColor: colors.glassBorder,
                },
              ]}
            >
              {content}
            </View>
          </BlurView>
        </View>
      </View>
    );
  }

  // Android fallback
  return (
    <View style={[styles.tabBarRoot, { backgroundColor: colors.background }]}>
      <View style={[styles.androidContainer, { backgroundColor: `${colors.background}F0` }]}>
        {content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarRoot: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: FLOATING_TAB_BAR_BOTTOM_OFFSET,
  },
  // iOS floating style
  iosContainer: {
    height: FLOATING_TAB_BAR_HEIGHT,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  blurView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.xxl,
    paddingHorizontal: spacing.sm,
  },
  // Android fallback
  androidContainer: {
    height: FLOATING_TAB_BAR_HEIGHT,
    borderRadius: borderRadius.xxl,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  // Tab layout
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicatorBg: {
    position: 'absolute',
    top: spacing.xs,
    bottom: spacing.xs,
    left: '10%',
    right: '10%',
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  touchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    zIndex: 10,
  },
  iconWrapper: {
    marginBottom: spacing.xs,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: spacing.xs,
  },
});
