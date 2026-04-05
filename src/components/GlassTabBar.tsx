import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useColors } from '../theme';

/**
 * Liquid Glass–styled tab bar.
 * iOS: frosted blur with translucent accent border.
 * Android: semi-transparent dark surface.
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
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const icon = options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? colors.accent : colors.textMuted,
          size: 24,
        });

        return (
          <View key={route.key} style={styles.tab}>
            <View
              style={[styles.tabButton, isFocused && { backgroundColor: `${colors.accent}15` }]}
              // Using onTouchEnd for simplicity; tab press handled via parent
            >
              <View onTouchEnd={onPress} style={styles.touchTarget}>
                {icon}
                <View style={[styles.indicator, isFocused && { backgroundColor: colors.accent }]} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.container, { borderTopColor: `${colors.accent}18` }]}>
        <BlurView intensity={40} tint="dark" style={styles.blur}>
          <View style={[styles.overlay, { backgroundColor: `${colors.background}88` }]}>
            {content}
          </View>
        </BlurView>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.androidContainer, { backgroundColor: `${colors.background}EE`, borderTopColor: colors.cardBorder }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  androidContainer: {
    paddingBottom: 24,
  },
  blur: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingBottom: 28,
  },
  row: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabButton: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  touchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
});
