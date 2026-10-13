import { useEffect, useSyncExternalStore } from 'react';
import { color } from './tokens';

/**
 * The app shell keeps content clear of the side safe areas (iPhone Duo folded shut draws
 * the status bar in a vertical strip there) and paints those areas itself, because
 * navigator screens are clipped to their bounds and cannot reach under the strip. A
 * full-bleed screen asks the shell to paint its colour there while it is on screen.
 */
let sideColor: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

/** What the shell paints beside the content right now. */
export function useShellSideColor(): string {
  return useSyncExternalStore(subscribe, () => sideColor ?? color.bg, () => color.bg);
}

/** Paint `tone` under the side safe areas for as long as the calling screen is mounted. */
export function useSideBleed(tone: string) {
  useEffect(() => {
    sideColor = tone;
    emit();
    return () => {
      if (sideColor === tone) { sideColor = null; emit(); }
    };
  }, [tone]);
}
