import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * The size a screen can actually lay out in. The app shell keeps the left and right
 * safe areas clear (iPhone Duo closed pose puts the status bar in a vertical strip
 * on the trailing edge; landscape phones keep the sensor housing clear), so screens
 * size carousels, charts and pages from this rather than the raw window.
 */
export function useContentSize(): { width: number; height: number } {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return { width: Math.max(0, width - insets.left - insets.right), height };
}
