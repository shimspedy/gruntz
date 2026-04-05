import { useWindowDimensions } from 'react-native';

export type LayoutSize = 'compact' | 'medium' | 'expanded';

interface LayoutInfo {
  width: number;
  height: number;
  size: LayoutSize;
  isLandscape: boolean;
  /** Number of grid columns for card layouts */
  columns: number;
  /** Content max width for readability on large screens */
  contentMaxWidth: number;
  /** Safe horizontal padding that scales with screen */
  horizontalPadding: number;
}

/**
 * Adaptive layout hook for Android 16+ adaptive layout requirements.
 * Categorizes screen into compact/medium/expanded breakpoints
 * and provides responsive layout values.
 *
 * Breakpoints (Material 3 spec):
 * - compact: < 600dp (phones portrait)
 * - medium: 600-839dp (foldables, tablets portrait, phones landscape)
 * - expanded: 840dp+ (tablets landscape, desktop)
 */
export function useAdaptiveLayout(): LayoutInfo {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  let size: LayoutSize;
  if (width < 600) {
    size = 'compact';
  } else if (width < 840) {
    size = 'medium';
  } else {
    size = 'expanded';
  }

  let columns: number;
  switch (size) {
    case 'compact':
      columns = isLandscape ? 2 : 1;
      break;
    case 'medium':
      columns = 2;
      break;
    case 'expanded':
      columns = 3;
      break;
  }

  const contentMaxWidth = size === 'expanded' ? 960 : size === 'medium' ? 720 : width;
  const horizontalPadding = size === 'expanded' ? 32 : size === 'medium' ? 24 : 16;

  return {
    width,
    height,
    size,
    isLandscape,
    columns,
    contentMaxWidth,
    horizontalPadding,
  };
}
