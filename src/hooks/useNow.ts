import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Re-renders every `interval` ms while `enabled`. Used by clocks (session, rest, run). */
export function useNow(enabled = true, interval = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    let id: ReturnType<typeof setInterval> | undefined = setInterval(() => setNow(Date.now()), interval);
    // A backgrounded timer only burns battery and drifts; resync when the app comes back.
    const sub = AppState.addEventListener('change', (next) => {
      clearInterval(id);
      id = undefined;
      if (next === 'active') {
        setNow(Date.now());
        id = setInterval(() => setNow(Date.now()), interval);
      }
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [enabled, interval]);
  return now;
}

export function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
