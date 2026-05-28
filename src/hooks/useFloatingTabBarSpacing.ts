import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme';

export const FLOATING_TAB_BAR_HEIGHT = 72;
export const FLOATING_TAB_BAR_BOTTOM_OFFSET = spacing.md;
export const FLOATING_TAB_BAR_CONTENT_GAP = spacing.xl;

export function useFloatingTabBarSpacing(minPadding = spacing.xxl) {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const reservedHeight = insets.bottom + FLOATING_TAB_BAR_CONTENT_GAP;

  return {
    bottomContentPadding: Math.max(minPadding, reservedHeight),
    insets,
    tabBarHeight,
  };
}
